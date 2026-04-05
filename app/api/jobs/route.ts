// API route للوظائف — جلب القائمة وإنشاء وظيفة جديدة
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateJobSchema } from "@/lib/validations/job";

// GET: جلب قائمة الوظائف مع فلاتر وتصفح الصفحات
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
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // بناء شروط التصفية
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // جلب الوظائف مع العدد الكلي
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          location: true,
          isRemote: true,
          deadline: true,
          headcount: true,
          createdAt: true,
          publishedAt: true,
          department: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              skills: true,
              applications: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    // تحويل البيانات لتسهيل الاستخدام في الواجهة
    const formattedJobs = jobs.map((job) => ({
      ...job,
      skillCount: job._count.skills,
      applicationCount: job._count.applications,
      _count: undefined,
    }));

    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب الوظائف:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الوظائف" },
      { status: 500 }
    );
  }
}

// POST: إنشاء وظيفة جديدة
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
    const validationResult = CreateJobSchema.safeParse(body);

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

    // التحقق من وجود القسم
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        { error: "القسم المحدد غير موجود" },
        { status: 400 }
      );
    }

    // معالجة الموعد النهائي
    const deadline = data.deadline ? new Date(data.deadline) : null;

    // إنشاء الوظيفة مع المهارات وسجل التدقيق
    const job = await prisma.job.create({
      data: {
        title: data.title,
        departmentId: data.departmentId,
        location: data.location ?? null,
        isRemote: data.isRemote,
        type: data.type,
        ecommerceCategory: data.ecommerceCategory ?? null,
        templateCode: data.templateCode ?? null,
        description: data.description,
        requirements: data.requirements,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        currency: data.currency,
        showSalary: data.showSalary,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax ?? null,
        educationRequired: data.educationRequired,
        headcount: data.headcount,
        deadline,
        scoringWeights: data.scoringWeights
          ? JSON.parse(JSON.stringify(data.scoringWeights))
          : undefined,
        status: "DRAFT",
        postedById: session.user.id,
        // إنشاء المهارات المرتبطة
        skills: data.skills && data.skills.length > 0
          ? {
              create: data.skills.map((skill) => ({
                skillName: skill.skillName,
                isRequired: skill.isRequired,
              })),
            }
          : undefined,
        // إنشاء سجل التدقيق الأول
        auditLogs: {
          create: {
            action: "إنشاء الوظيفة",
            newStatus: "DRAFT",
            changedById: session.user.id,
            note: "تم إنشاء الوظيفة كمسودة",
          },
        },
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        skills: true,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error("خطأ في إنشاء الوظيفة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء الوظيفة" },
      { status: 500 }
    );
  }
}
