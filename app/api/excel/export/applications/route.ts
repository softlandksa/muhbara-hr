// API: تصدير طلبات التوظيف إلى ملف Excel
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportApplicationsToExcel, type ExportableApplication } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  // التحقق من تسجيل الدخول
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    // جلب جميع الطلبات مع بيانات الوظيفة والقسم
    const applications = await prisma.application.findMany({
      include: {
        job: {
          include: {
            department: true,
          },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    // تحويل البيانات إلى الشكل القابل للتصدير
    const exportData: ExportableApplication[] = applications.map((app) => ({
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      jobTitle: app.job.title,
      departmentName: app.job.department.name,
      status: app.status,
      initialScore: app.initialScore,
      finalScore: app.finalScore,
      source: app.source,
      appliedAt: app.appliedAt.toISOString(),
    }));

    // توليد ملف Excel
    const buffer = await exportApplicationsToExcel(exportData);

    // اسم الملف مع تاريخ اليوم
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `applications-${dateStr}.xlsx`;

    // استخدام ArrayBuffer لضمان التوافق مع NextResponse
    const arrayBuffer = buffer.buffer as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("خطأ في تصدير الطلبات:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تصدير البيانات" },
      { status: 500 }
    );
  }
}
