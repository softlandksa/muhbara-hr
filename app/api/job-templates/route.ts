// API route لقوالب الوظائف — إرجاع قائمة القوالب
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // التحقق من الجلسة
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // جلب جميع قوالب الوظائف
    const templates = await prisma.jobTemplate.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("خطأ في جلب قوالب الوظائف:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قوالب الوظائف" },
      { status: 500 }
    );
  }
}
