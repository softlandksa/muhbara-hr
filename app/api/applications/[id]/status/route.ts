// API route لتغيير حالة الطلب
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChangeApplicationStatusSchema } from "@/lib/validations/application";

// الانتقالات المسموح بها بين الحالات
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["QUALIFIED", "REJECTED", "WITHDRAWN"],
  QUALIFIED: ["INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"],
  INTERVIEW_SCHEDULED: ["OFFER_SENT", "QUALIFIED", "REJECTED", "WITHDRAWN"],
  OFFER_SENT: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

// PATCH: تغيير حالة الطلب
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

    // تحليل وتحقق من البيانات
    const body: unknown = await request.json();
    const validationResult = ChangeApplicationStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "البيانات المدخلة غير صحيحة",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus, note } = validationResult.data;

    // جلب الطلب الحالي
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, fullName: true },
    });

    if (!application) {
      return NextResponse.json(
        { error: "الطلب غير موجود" },
        { status: 404 }
      );
    }

    // التحقق من صحة الانتقال
    const allowedNext = ALLOWED_TRANSITIONS[application.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `لا يمكن تغيير الحالة من "${application.status}" إلى "${newStatus}"`,
        },
        { status: 400 }
      );
    }

    // تحديث الحالة وإنشاء سجل في transaction
    const [updatedApplication] = await prisma.$transaction([
      prisma.application.update({
        where: { id: params.id },
        data: { status: newStatus },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.applicationStatusLog.create({
        data: {
          applicationId: params.id,
          oldStatus: application.status,
          newStatus,
          changedById: session.user.id,
          note: note ?? null,
        },
      }),
    ]);

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error("خطأ في تغيير حالة الطلب:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تغيير حالة الطلب" },
      { status: 500 }
    );
  }
}
