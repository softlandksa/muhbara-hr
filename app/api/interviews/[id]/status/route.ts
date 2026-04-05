// API route لتغيير حالة المقابلة
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChangeInterviewStatusSchema } from "@/lib/validations/interview";

// الانتقالات المسموح بها بين الحالات
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  RESCHEDULED: ["SCHEDULED", "CANCELLED"],
  COMPLETED: [],  // لا انتقالات من COMPLETED
  CANCELLED: [],  // لا انتقالات من CANCELLED
  NO_SHOW: [],    // لا انتقالات من NO_SHOW
};

// PATCH: تغيير حالة المقابلة
export async function PATCH(
  request: NextRequest,
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

    // جلب المقابلة الحالية
    const existing = await prisma.interview.findUnique({
      where: { id: params.id },
      select: { id: true, status: true, score: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "المقابلة المطلوبة غير موجودة" },
        { status: 404 }
      );
    }

    // تحليل وتحقق من البيانات
    const body: unknown = await request.json();
    const validationResult = ChangeInterviewStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "البيانات المدخلة غير صحيحة",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { status: newStatus } = validationResult.data;

    // التحقق من صحة الانتقال
    const allowedNext = ALLOWED_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `لا يمكن الانتقال من حالة "${existing.status}" إلى "${newStatus}"`,
        },
        { status: 400 }
      );
    }

    // بناء بيانات التحديث
    const updateData: Record<string, unknown> = { status: newStatus };

    // إضافة completedAt عند إكمال المقابلة
    if (newStatus === "COMPLETED") {
      updateData.completedAt = new Date();
    }

    // تحديث المقابلة
    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: updateData,
      include: {
        application: {
          select: {
            id: true,
            fullName: true,
            status: true,
            initialScore: true,
          },
        },
        interviewer: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("خطأ في تغيير حالة المقابلة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تغيير حالة المقابلة" },
      { status: 500 }
    );
  }
}
