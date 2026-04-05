// API route للأقسام — إرجاع قائمة الأقسام
export const dynamic = 'force-dynamic';
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

    // جلب جميع الأقسام مرتبة حسب الاسم
    const departments = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("خطأ في جلب الأقسام:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الأقسام" },
      { status: 500 }
    );
  }
}
