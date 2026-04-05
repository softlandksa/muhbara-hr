// API route للمستخدمين — جلب القائمة (للاختيار في نموذج المقابلة)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: جلب قائمة المستخدمين مع فلتر الدور
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

    // استخراج فلتر الدور من معاملات الاستعلام
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    // بناء شروط التصفية — فقط المستخدمون النشطون
    const where: Record<string, unknown> = { isActive: true };
    if (role) {
      where.role = role;
    }

    // جلب المستخدمين
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("خطأ في جلب المستخدمين:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المستخدمين" },
      { status: 500 }
    );
  }
}
