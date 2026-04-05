// API route لتقديم تقييم المقابلة
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScoreInterviewSchema } from "@/lib/validations/interview";
import { calculateFinalScore } from "@/lib/scoring";

// POST: تقديم تقييم المقابلة وحساب النقطة النهائية
export async function POST(
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

    // جلب المقابلة مع بيانات الطلب
    const existing = await prisma.interview.findUnique({
      where: { id: params.id },
      include: {
        application: {
          select: {
            id: true,
            initialScore: true,
            fullName: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "المقابلة المطلوبة غير موجودة" },
        { status: 404 }
      );
    }

    // تحليل وتحقق من البيانات
    const body: unknown = await request.json();
    const validationResult = ScoreInterviewSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "بيانات التقييم غير صحيحة",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { technicalCompetence, softSkills, culturalFit, note } = validationResult.data;

    // حساب نقطة المقابلة الإجمالية
    // الكفاءة الوظيفية (40) + المهارات الشخصية (30) + التوافق الوظيفي (30) = 100
    const interviewScore = technicalCompetence + softSkills + culturalFit;

    // بيانات تفاصيل التقييم
    const scoreBreakdown = {
      technicalCompetence,
      softSkills,
      culturalFit,
      note: note ?? null,
    };

    // حساب النقطة النهائية باستخدام المعادلة: أولية × 40% + مقابلة × 60%
    const initialScore = existing.application.initialScore ?? 0;
    const finalScore = calculateFinalScore(initialScore, interviewScore);

    // تحديث المقابلة والطلب في معاملة واحدة
    const interview = await prisma.$transaction(async (tx) => {
      // تحديث المقابلة بالنقطة والتفاصيل
      const updatedInterview = await tx.interview.update({
        where: { id: params.id },
        data: {
          score: interviewScore,
          scoreBreakdown: scoreBreakdown,
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          application: {
            select: {
              id: true,
              fullName: true,
              email: true,
              status: true,
              initialScore: true,
              finalScore: true,
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

      // تحديث النقطة النهائية في الطلب
      await tx.application.update({
        where: { id: existing.applicationId },
        data: { finalScore },
      });

      return updatedInterview;
    });

    return NextResponse.json({
      interview,
      interviewScore,
      finalScore,
    });
  } catch (error) {
    console.error("خطأ في تقديم تقييم المقابلة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم تقييم المقابلة" },
      { status: 500 }
    );
  }
}
