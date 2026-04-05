// API route للطلبات — جلب القائمة وإنشاء طلب جديد
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateApplicationSchema } from "@/lib/validations/application";
import { calculateInitialScore } from "@/lib/scoring";
import type { ScoringWeights } from "@/lib/scoring";

// GET: جلب قائمة الطلبات مع فلاتر وتصفح الصفحات
export async function GET(request: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // استخراج معاملات الاستعلام
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const minScore = searchParams.get("minScore");
    const maxScore = searchParams.get("maxScore");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // بناء شروط التصفية
    const where: Record<string, unknown> = {};

    if (jobId) {
      where.jobId = jobId;
    }

    if (status) {
      where.status = status;
    }

    // البحث في الاسم والبريد والهاتف
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    // فلتر النقطة
    if (minScore || maxScore) {
      const scoreFilter: Record<string, number> = {};
      if (minScore) scoreFilter.gte = parseFloat(minScore);
      if (maxScore) scoreFilter.lte = parseFloat(maxScore);
      where.initialScore = scoreFilter;
    }

    // جلب الطلبات مع العدد الكلي
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { appliedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          status: true,
          source: true,
          initialScore: true,
          educationLevel: true,
          experienceYears: true,
          appliedAt: true,
          job: {
            select: {
              id: true,
              title: true,
              department: { select: { id: true, name: true, code: true } },
            },
          },
          _count: {
            select: { interviews: true },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    // تنسيق البيانات
    const formattedApplications = applications.map((app) => ({
      ...app,
      interviewCount: app._count.interviews,
      _count: undefined,
    }));

    return NextResponse.json({
      applications: formattedApplications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("خطأ في جلب الطلبات:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الطلبات" },
      { status: 500 }
    );
  }
}

// POST: إنشاء طلب جديد مع حساب التقييم الأولي
export async function POST(request: NextRequest) {
  try {
    // التحقق من الجلسة
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // تحليل وتحقق من البيانات
    const body: unknown = await request.json();
    const validationResult = CreateApplicationSchema.safeParse(body);

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

    // جلب بيانات الوظيفة للتقييم
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
      select: {
        id: true,
        status: true,
        experienceMin: true,
        experienceMax: true,
        educationRequired: true,
        location: true,
        scoringWeights: true,
        skills: {
          select: { skillName: true, isRequired: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "الوظيفة المحددة غير موجودة" },
        { status: 404 }
      );
    }

    if (job.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "لا يمكن التقدم لهذه الوظيفة — غير منشورة" },
        { status: 400 }
      );
    }

    // استخراج أوزان التقييم من الوظيفة
    const weights = job.scoringWeights as unknown as ScoringWeights;
    const requiredSkills = job.skills
      .filter((s) => s.isRequired)
      .map((s) => s.skillName);
    const preferredSkills = job.skills
      .filter((s) => !s.isRequired)
      .map((s) => s.skillName);

    // حساب التقييم الأولي
    const scoringResult = calculateInitialScore({
      applicantExperienceYears: data.experienceYears,
      applicantEducation: data.educationLevel,
      applicantSkills: data.skills,
      applicantLocation: data.currentLocation ?? undefined,
      cvUrl: data.cvUrl ?? undefined,
      linkedinUrl: data.linkedinUrl ?? undefined,
      jobExperienceMin: job.experienceMin,
      jobExperienceMax: job.experienceMax ?? undefined,
      jobEducationRequired: job.educationRequired,
      jobRequiredSkills: requiredSkills,
      jobPreferredSkills: preferredSkills,
      jobLocation: job.location ?? undefined,
      weights,
    });

    // إنشاء الطلب مع سجل الحالة
    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        cvUrl: data.cvUrl ?? null,
        linkedinUrl: data.linkedinUrl ?? null,
        educationLevel: data.educationLevel,
        experienceYears: data.experienceYears,
        currentLocation: data.currentLocation ?? null,
        skills: data.skills,
        source: data.source,
        notes: data.notes ?? null,
        status: "NEW",
        initialScore: scoringResult.totalScore,
        initialScoreBreakdown: scoringResult.breakdown,
        // إنشاء سجل الحالة الأول
        statusLogs: {
          create: {
            newStatus: "NEW",
            changedById: session.user.id,
            note: "تم إنشاء الطلب",
          },
        },
      },
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

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("خطأ في إنشاء الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الطلب" },
      { status: 500 }
    );
  }
}
