// API عام لتقديم طلبات التوظيف — لا يحتاج مصادقة
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateInitialScore } from "@/lib/scoring";
import type { ScoringWeights } from "@/lib/scoring";
import { z } from "zod";

// مخطط التحقق من بيانات الطلب العام
const PublicApplicationSchema = z.object({
  jobId:           z.string().cuid("معرف الوظيفة غير صحيح"),
  fullName:        z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(200),
  email:           z.string().email("البريد الإلكتروني غير صحيح"),
  phone:           z.string().min(8, "رقم الهاتف يجب أن يكون 8 أرقام على الأقل").max(20),
  cvUrl:           z.string().url("رابط السيرة الذاتية غير صحيح").optional().nullable(),
  educationLevel:  z.enum(["HIGH_SCHOOL","DIPLOMA","BACHELOR","MASTER","PHD"]).optional(),
  experienceYears: z.number().min(0).max(50).optional(),
  currentLocation: z.string().max(200).optional().nullable(),
  skills:          z.array(z.string()).default([]),
  notes:           z.string().max(1000).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = PublicApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "البيانات المدخلة غير صحيحة", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // التحقق من وجود الوظيفة ومنشورة
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: {
        id: true, status: true, title: true,
        experienceMin: true, experienceMax: true,
        educationRequired: true, location: true,
        scoringWeights: true,
        skills: { select: { skillName: true, isRequired: true } },
      },
    });

    if (!job || job.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "هذه الوظيفة غير متاحة للتقديم حالياً" },
        { status: 404 }
      );
    }

    // قاعدة منع التكرار: نفس البريد + نفس الوظيفة
    const duplicate = await prisma.application.findFirst({
      where: { email: data.email, jobId: data.jobId },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "لقد قدّمت على هذه الوظيفة مسبقاً", code: "DUPLICATE" },
        { status: 409 }
      );
    }

    // حساب التقييم الأولي
    const weights = job.scoringWeights as unknown as ScoringWeights;
    const requiredSkills  = job.skills.filter((s) => s.isRequired).map((s) => s.skillName);
    const preferredSkills = job.skills.filter((s) => !s.isRequired).map((s) => s.skillName);

    const scoringResult = calculateInitialScore({
      applicantExperienceYears: data.experienceYears ?? 0,
      applicantEducation:       data.educationLevel ?? "BACHELOR",
      applicantSkills:          data.skills,
      applicantLocation:        data.currentLocation ?? undefined,
      cvUrl:                    data.cvUrl ?? undefined,
      jobExperienceMin:         job.experienceMin,
      jobExperienceMax:         job.experienceMax ?? undefined,
      jobEducationRequired:     job.educationRequired,
      jobRequiredSkills:        requiredSkills,
      jobPreferredSkills:       preferredSkills,
      jobLocation:              job.location ?? undefined,
      weights,
    });

    // إنشاء الطلب
    const application = await prisma.application.create({
      data: {
        jobId:                data.jobId,
        fullName:             data.fullName,
        email:                data.email,
        phone:                data.phone,
        cvUrl:                data.cvUrl ?? null,
        educationLevel:       data.educationLevel ?? "BACHELOR",
        experienceYears:      data.experienceYears ?? 0,
        currentLocation:      data.currentLocation ?? null,
        skills:               data.skills,
        source:               "WEBSITE",
        notes:                data.notes ?? null,
        status:               "NEW",
        initialScore:         scoringResult.totalScore,
        initialScoreBreakdown: scoringResult.breakdown,
      },
      select: { id: true, fullName: true, initialScore: true },
    });

    return NextResponse.json(
      { success: true, applicationId: application.id, score: application.initialScore },
      { status: 201 }
    );
  } catch (error) {
    console.error("خطأ في تقديم الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم طلبك، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
