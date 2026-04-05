// API route للطلب الفردي — جلب وتعديل
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculateInitialScore } from "@/lib/scoring";
import type { ScoringWeights } from "@/lib/scoring";
import { z } from "zod";

// مخطط التعديل الجزئي للطلب
const PatchApplicationSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  cvUrl: z.string().url("رابط السيرة الذاتية غير صحيح").optional().nullable(),
  linkedinUrl: z.string().url("رابط LinkedIn غير صحيح").optional().nullable(),
  // حقول تؤثر على إعادة حساب النقطة
  skills: z.array(z.string().min(1)).optional(),
  educationLevel: z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "PHD"]).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  currentLocation: z.string().max(200).optional().nullable(),
});

// GET: جلب الطلب مع كامل البيانات المرتبطة
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الجلسة
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: {
          include: {
            department: { select: { id: true, name: true, code: true } },
            skills: { select: { id: true, skillName: true, isRequired: true } },
          },
        },
        statusLogs: {
          orderBy: { changedAt: "asc" },
          include: {
            changedBy: { select: { id: true, name: true } },
          },
        },
        interviews: {
          orderBy: { scheduledAt: "asc" },
          select: {
            id: true,
            type: true,
            status: true,
            scheduledAt: true,
            duration: true,
            score: true,
            interviewer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("خطأ في جلب الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الطلب" },
      { status: 500 }
    );
  }
}

// PATCH: تعديل بيانات الطلب
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // التحقق من الجلسة
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // تحليل البيانات
    const body: unknown = await request.json();
    const validationResult = PatchApplicationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "البيانات المدخلة غير صحيحة",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // التحقق من وجود الطلب
    const existingApp = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        job: {
          select: {
            experienceMin: true,
            experienceMax: true,
            educationRequired: true,
            location: true,
            scoringWeights: true,
            skills: { select: { skillName: true, isRequired: true } },
          },
        },
      },
    });

    if (!existingApp) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // تحضير البيانات للتحديث
    const updateData: Record<string, unknown> = {};

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.cvUrl !== undefined) updateData.cvUrl = data.cvUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.educationLevel !== undefined) updateData.educationLevel = data.educationLevel;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;

    // إعادة حساب النقطة إذا تغيرت المهارات أو التعليم أو الخبرة
    const shouldRecalculate =
      data.skills !== undefined ||
      data.educationLevel !== undefined ||
      data.experienceYears !== undefined ||
      data.cvUrl !== undefined ||
      data.linkedinUrl !== undefined;

    if (shouldRecalculate) {
      const weights = existingApp.job.scoringWeights as unknown as ScoringWeights;
      const requiredSkills = existingApp.job.skills
        .filter((s) => s.isRequired)
        .map((s) => s.skillName);
      const preferredSkills = existingApp.job.skills
        .filter((s) => !s.isRequired)
        .map((s) => s.skillName);

      const scoringResult = calculateInitialScore({
        applicantExperienceYears: data.experienceYears ?? existingApp.experienceYears,
        applicantEducation: data.educationLevel ?? existingApp.educationLevel,
        applicantSkills: data.skills ?? existingApp.skills,
        applicantLocation: (data.currentLocation ?? existingApp.currentLocation) ?? undefined,
        cvUrl: (data.cvUrl ?? existingApp.cvUrl) ?? undefined,
        linkedinUrl: (data.linkedinUrl ?? existingApp.linkedinUrl) ?? undefined,
        jobExperienceMin: existingApp.job.experienceMin,
        jobExperienceMax: existingApp.job.experienceMax ?? undefined,
        jobEducationRequired: existingApp.job.educationRequired,
        jobRequiredSkills: requiredSkills,
        jobPreferredSkills: preferredSkills,
        jobLocation: existingApp.job.location ?? undefined,
        weights,
      });

      updateData.initialScore = scoringResult.totalScore;
      updateData.initialScoreBreakdown = scoringResult.breakdown;
    }

    // تنفيذ التحديث
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    console.error("خطأ في تعديل الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل الطلب" },
      { status: 500 }
    );
  }
}
