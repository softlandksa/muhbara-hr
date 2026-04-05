// API route للوظيفة الفردية — جلب وتعديل وحذف
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UpdateJobSchema } from "@/lib/validations/job";

type RouteParams = { params: Promise<{ id: string }> };

// GET: جلب وظيفة واحدة مع كل التفاصيل
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        skills: true,
        postedBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        auditLogs: {
          orderBy: { changedAt: "desc" },
        },
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "الوظيفة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error("خطأ في جلب الوظيفة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الوظيفة" },
      { status: 500 }
    );
  }
}

// PUT: تعديل وظيفة (فقط المسودات)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // التحقق من وجود الوظيفة وحالتها
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "الوظيفة غير موجودة" },
        { status: 404 }
      );
    }

    if (existingJob.status !== "DRAFT") {
      return NextResponse.json(
        { error: "لا يمكن تعديل الوظيفة إلا في حالة المسودة" },
        { status: 400 }
      );
    }

    // التحقق من البيانات
    const body = await request.json() as Record<string, unknown>;
    const validationResult = UpdateJobSchema.safeParse({ ...body, id });

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
    const deadline = data.deadline ? new Date(data.deadline) : null;

    // تحديث الوظيفة مع إعادة إنشاء المهارات
    const updatedJob = await prisma.$transaction(async (tx) => {
      // حذف المهارات القديمة إذا تم إرسال مهارات جديدة
      if (data.skills !== undefined) {
        await tx.jobSkill.deleteMany({ where: { jobId: id } });
      }

      // تحديث الوظيفة
      const job = await tx.job.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.departmentId && { departmentId: data.departmentId }),
          ...(data.location !== undefined && { location: data.location ?? null }),
          ...(data.isRemote !== undefined && { isRemote: data.isRemote }),
          ...(data.type && { type: data.type }),
          ...(data.ecommerceCategory !== undefined && { ecommerceCategory: data.ecommerceCategory ?? null }),
          ...(data.description && { description: data.description }),
          ...(data.requirements && { requirements: data.requirements }),
          ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin ?? null }),
          ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax ?? null }),
          ...(data.currency && { currency: data.currency }),
          ...(data.showSalary !== undefined && { showSalary: data.showSalary }),
          ...(data.experienceMin !== undefined && { experienceMin: data.experienceMin }),
          ...(data.experienceMax !== undefined && { experienceMax: data.experienceMax ?? null }),
          ...(data.educationRequired && { educationRequired: data.educationRequired }),
          ...(data.headcount !== undefined && { headcount: data.headcount }),
          ...(deadline !== undefined && { deadline }),
          ...(data.scoringWeights && { scoringWeights: JSON.parse(JSON.stringify(data.scoringWeights)) }),
          // إضافة المهارات الجديدة
          ...(data.skills !== undefined && data.skills.length > 0 && {
            skills: {
              create: data.skills.map((skill: { skillName: string; isRequired: boolean }) => ({
                skillName: skill.skillName,
                isRequired: skill.isRequired,
              })),
            },
          }),
        },
        include: {
          department: { select: { id: true, name: true, code: true } },
          skills: true,
        },
      });

      // تسجيل عملية التعديل
      await tx.jobAuditLog.create({
        data: {
          jobId: id,
          action: "تعديل الوظيفة",
          changedById: session.user!.id,
          note: "تم تعديل بيانات الوظيفة",
        },
      });

      return job;
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error("خطأ في تعديل الوظيفة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل الوظيفة" },
      { status: 500 }
    );
  }
}

// DELETE: حذف وظيفة (فقط المسودات)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // التحقق من وجود الوظيفة وحالتها
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, title: true },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "الوظيفة غير موجودة" },
        { status: 404 }
      );
    }

    if (existingJob.status !== "DRAFT") {
      return NextResponse.json(
        { error: "لا يمكن حذف الوظيفة إلا في حالة المسودة" },
        { status: 400 }
      );
    }

    // حذف الوظيفة مع جميع سجلاتها
    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الوظيفة بنجاح" });
  } catch (error) {
    console.error("خطأ في حذف الوظيفة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الوظيفة" },
      { status: 500 }
    );
  }
}
