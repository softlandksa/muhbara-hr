// API: تصدير تقرير HR الشامل إلى ملف Excel
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportReportToExcel, type ReportData } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET() {
  // التحقق من تسجيل الدخول
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    // جلب مؤشرات الوظائف
    const [totalJobs, publishedJobs] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
    ]);

    // جلب مؤشرات الطلبات
    const [totalApplications, acceptedApplications, rejectedApplications] =
      await Promise.all([
        prisma.application.count(),
        prisma.application.count({ where: { status: "ACCEPTED" } }),
        prisma.application.count({ where: { status: "REJECTED" } }),
      ]);

    // توزيع الحالات
    const statusCounts = await prisma.application.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    // ترجمة حالات الطلب للعربية
    const statusLabels: Record<string, string> = {
      NEW: "جديد",
      UNDER_REVIEW: "قيد المراجعة",
      QUALIFIED: "مؤهل",
      INTERVIEW_SCHEDULED: "مقابلة مجدولة",
      OFFER_SENT: "عرض مُرسل",
      ACCEPTED: "مقبول",
      REJECTED: "مرفوض",
      WITHDRAWN: "انسحب",
    };

    const statusDistribution = statusCounts.map((s) => ({
      status: s.status,
      label: statusLabels[s.status] ?? s.status,
      count: s._count.status,
    }));

    // توزيع الأقسام
    const deptCounts = await prisma.application.groupBy({
      by: ["jobId"],
      _count: { jobId: true },
    });

    // جلب بيانات الوظائف مع الأقسام
    const jobIds = deptCounts.map((d) => d.jobId);
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, department: { select: { name: true } } },
    });

    // تجميع حسب القسم
    const deptMap: Record<string, number> = {};
    deptCounts.forEach((d) => {
      const job = jobs.find((j) => j.id === d.jobId);
      const deptName = job?.department?.name ?? "غير محدد";
      deptMap[deptName] = (deptMap[deptName] ?? 0) + d._count.jobId;
    });

    const departmentDistribution = Object.entries(deptMap).map(
      ([department, count]) => ({ department, count })
    );

    // حساب معدل القبول
    const acceptanceRate =
      totalApplications > 0
        ? (acceptedApplications / totalApplications) * 100
        : 0;

    const reportData: ReportData = {
      totalJobs,
      publishedJobs,
      totalApplications,
      acceptedApplications,
      rejectedApplications,
      acceptanceRate,
      statusDistribution,
      departmentDistribution,
    };

    // توليد ملف Excel
    const buffer = await exportReportToExcel(reportData);

    // اسم الملف مع تاريخ اليوم
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `hr-report-${dateStr}.xlsx`;

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
    console.error("خطأ في تصدير التقرير:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء التقرير" },
      { status: 500 }
    );
  }
}
