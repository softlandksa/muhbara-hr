// API route للمقابلات — جلب القائمة وإنشاء مقابلة جديدة
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateInterviewSchema } from "@/lib/validations/interview";

// GET: جلب قائمة المقابلات مع فلاتر وتصفح الصفحات
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
    const applicationId = searchParams.get("applicationId");
    const jobId = searchParams.get("jobId");
    const interviewerId = searchParams.get("interviewerId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;

    // بناء شروط التصفية
    const where: Record<string, unknown> = {};

    if (applicationId) where.applicationId = applicationId;
    if (jobId) where.jobId = jobId;
    if (interviewerId) where.interviewerId = interviewerId;
    if (status) where.status = status;
    if (type) where.type = type;

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo);
      where.scheduledAt = dateFilter;
    }

    // جلب المقابلات مع العدد الكلي
    const [interviews, total] = await Promise.all([
      prisma.interview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true,
          type: true,
          status: true,
          scheduledAt: true,
          duration: true,
          location: true,
          score: true,
          completedAt: true,
          createdAt: true,
          application: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              initialScore: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  department: { select: { id: true, name: true } },
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              department: { select: { id: true, name: true } },
            },
          },
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.interview.count({ where }),
    ]);

    return NextResponse.json({
      interviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("خطأ في جلب المقابلات:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المقابلات" },
      { status: 500 }
    );
  }
}

// POST: إنشاء مقابلة جديدة
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
    const validationResult = CreateInterviewSchema.safeParse(body);

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

    // التحقق من وجود الطلب وحالته
    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      select: { id: true, status: true, fullName: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "الطلب المحدد غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من أن الطلب في حالة QUALIFIED أو INTERVIEW_SCHEDULED
    if (
      application.status !== "QUALIFIED" &&
      application.status !== "INTERVIEW_SCHEDULED"
    ) {
      return NextResponse.json(
        {
          error: "لا يمكن جدولة مقابلة لهذا الطلب — يجب أن يكون الطلب مؤهلاً أو لديه مقابلة مجدولة",
        },
        { status: 400 }
      );
    }

    // التحقق من وجود المحاور
    const interviewer = await prisma.user.findUnique({
      where: { id: data.interviewerId },
      select: { id: true, isActive: true },
    });

    if (!interviewer || !interviewer.isActive) {
      return NextResponse.json(
        { error: "المحاور المحدد غير موجود أو غير نشط" },
        { status: 404 }
      );
    }

    // إنشاء المقابلة وتحديث حالة الطلب في معاملة واحدة
    const interview = await prisma.$transaction(async (tx) => {
      // إنشاء المقابلة
      const newInterview = await tx.interview.create({
        data: {
          applicationId: data.applicationId,
          jobId: data.jobId,
          type: data.type,
          scheduledAt: new Date(data.scheduledAt),
          duration: data.duration ?? 60,
          location: data.location ?? null,
          interviewerId: data.interviewerId,
          preparationNote: data.preparationNote ?? null,
          status: "SCHEDULED",
        },
        include: {
          application: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              initialScore: true,
              job: {
                select: {
                  id: true,
                  title: true,
                  department: { select: { id: true, name: true } },
                },
              },
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              department: { select: { id: true, name: true } },
            },
          },
          interviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // تحديث حالة الطلب إلى INTERVIEW_SCHEDULED إذا كانت QUALIFIED
      if (application.status === "QUALIFIED") {
        await tx.application.update({
          where: { id: data.applicationId },
          data: { status: "INTERVIEW_SCHEDULED" },
        });

        // إنشاء سجل تغيير الحالة
        await tx.applicationStatusLog.create({
          data: {
            applicationId: data.applicationId,
            oldStatus: "QUALIFIED",
            newStatus: "INTERVIEW_SCHEDULED",
            changedById: session.user!.id,
            note: `تمت جدولة مقابلة ${newInterview.id}`,
          },
        });
      }

      return newInterview;
    });

    return NextResponse.json({ interview }, { status: 201 });
  } catch (error) {
    console.error("خطأ في إنشاء المقابلة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المقابلة" },
      { status: 500 }
    );
  }
}
