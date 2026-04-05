// API route للمقابلة الفردية — جلب وتعديل
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UpdateInterviewSchema } from "@/lib/validations/interview";

// GET: جلب تفاصيل مقابلة واحدة
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

    const interview = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            initialScore: true,
            finalScore: true,
            initialScoreBreakdown: true,
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
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!interview) {
      return NextResponse.json(
        { error: "المقابلة المطلوبة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("خطأ في جلب المقابلة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المقابلة" },
      { status: 500 }
    );
  }
}

// PATCH: تعديل بيانات المقابلة (موعد، مدة، موقع، محاور، ملاحظات التحضير)
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

    // جلب المقابلة الحالية للتحقق من الحالة
    const existing = await prisma.interview.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "المقابلة المطلوبة غير موجودة" },
        { status: 404 }
      );
    }

    // فقط المقابلات المجدولة أو المُعاد جدولتها يمكن تعديلها
    if (existing.status !== "SCHEDULED" && existing.status !== "RESCHEDULED") {
      return NextResponse.json(
        { error: "لا يمكن تعديل هذه المقابلة — الحالة الحالية لا تسمح بالتعديل" },
        { status: 400 }
      );
    }

    // تحليل وتحقق من البيانات
    const body: unknown = await request.json();
    const validationResult = UpdateInterviewSchema.safeParse(body);

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

    // إذا تم تغيير المحاور، تحقق من وجوده
    if (data.interviewerId) {
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
    }

    // بناء بيانات التحديث
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.scheduledAt !== undefined) updateData.scheduledAt = new Date(data.scheduledAt);
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.interviewerId !== undefined) updateData.interviewerId = data.interviewerId;
    if (data.preparationNote !== undefined) updateData.preparationNote = data.preparationNote;

    // تحديث المقابلة
    const interview = await prisma.interview.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json({ interview });
  } catch (error) {
    console.error("خطأ في تعديل المقابلة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تعديل المقابلة" },
      { status: 500 }
    );
  }
}
