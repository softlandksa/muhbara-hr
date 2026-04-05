// API route لتغيير حالة الوظيفة
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChangeJobStatusSchema } from "@/lib/validations/job";

type RouteParams = { params: Promise<{ id: string }> };

// تعريف التحولات المسموح بها للحالات
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["PUBLISHED", "REJECTED"],
  PUBLISHED: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
  REJECTED: ["DRAFT"], // يمكن إعادة المرفوض للمسودة للتعديل
};

// الأدوار المطلوبة لكل تحول
const TRANSITION_ROLES: Record<string, string[]> = {
  PENDING_APPROVAL: ["HR", "ADMIN"],
  PUBLISHED: ["ADMIN"],
  REJECTED: ["ADMIN"],
  CLOSED: ["ADMIN", "HR"],
  ARCHIVED: ["ADMIN"],
  DRAFT: ["ADMIN", "HR"],
};

// PATCH: تغيير حالة الوظيفة
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userRole = (session.user as { role?: string }).role ?? "HR";

    // التحقق من وجود الوظيفة
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, status: true, title: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "الوظيفة غير موجودة" },
        { status: 404 }
      );
    }

    // التحقق من البيانات المدخلة
    const body: unknown = await request.json();
    const validationResult = ChangeJobStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "البيانات المدخلة غير صحيحة",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { newStatus, note } = validationResult.data;

    // التحقق من صحة التحول
    const allowedNextStatuses = ALLOWED_TRANSITIONS[job.status] ?? [];
    if (!allowedNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `لا يمكن تحويل الوظيفة من "${job.status}" إلى "${newStatus}"`,
        },
        { status: 400 }
      );
    }

    // التحقق من الصلاحيات
    const requiredRoles = TRANSITION_ROLES[newStatus] ?? [];
    if (!requiredRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "ليس لديك صلاحية لتنفيذ هذه العملية" },
        { status: 403 }
      );
    }

    // تحديد التواريخ المرتبطة بالحالة الجديدة
    const extraData: Record<string, unknown> = {};
    if (newStatus === "PUBLISHED") {
      extraData.publishedAt = new Date();
    } else if (newStatus === "CLOSED") {
      extraData.closedAt = new Date();
    }

    // تحديث الحالة وإنشاء سجل التدقيق
    const updatedJob = await prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { id },
        data: {
          status: newStatus as "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED",
          ...extraData,
          // إضافة المعتمد إذا كان النشر
          ...(newStatus === "PUBLISHED" && { approvedById: session.user!.id }),
        },
      });

      // إنشاء سجل التدقيق
      await tx.jobAuditLog.create({
        data: {
          jobId: id,
          action: getActionLabel(job.status, newStatus),
          oldStatus: job.status,
          newStatus,
          changedById: session.user!.id,
          note: note ?? null,
        },
      });

      return updated;
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error("خطأ في تغيير حالة الوظيفة:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تغيير حالة الوظيفة" },
      { status: 500 }
    );
  }
}

// دالة مساعدة للحصول على وصف الإجراء
function getActionLabel(oldStatus: string, newStatus: string): string {
  const labels: Record<string, string> = {
    "DRAFT→PENDING_APPROVAL": "إرسال للاعتماد",
    "PENDING_APPROVAL→PUBLISHED": "نشر الوظيفة",
    "PENDING_APPROVAL→REJECTED": "رفض الوظيفة",
    "PUBLISHED→CLOSED": "إغلاق الوظيفة",
    "CLOSED→ARCHIVED": "أرشفة الوظيفة",
    "REJECTED→DRAFT": "إعادة للمسودة",
  };
  return labels[`${oldStatus}→${newStatus}`] ?? "تغيير الحالة";
}
