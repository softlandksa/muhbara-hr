// API: إحصائيات لوحة التحكم الشاملة
export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// تسميات حالات الطلب بالعربية
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

// تسميات الأشهر بالعربية
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export async function GET() {
  // التحقق من تسجيل الدخول
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // حساب تاريخ 6 أشهر مضت
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // تشغيل جميع الاستعلامات بالتوازي
    const [
      totalJobs,
      publishedJobs,
      pendingApprovalJobs,
      draftJobs,
      totalApplications,
      newApplications,
      qualifiedApplications,
      acceptedApplications,
      thisMonthApplications,
      totalInterviews,
      scheduledInterviews,
      pendingScoreInterviews,
      recentApplicationsRaw,
      upcomingInterviewsRaw,
      statusCountsRaw,
      deptCountsRaw,
      trendApplicationsRaw,
      topJobsRaw,
      completedThisMonthInterviews,
    ] = await Promise.all([
      // الوظائف
      prisma.job.count(),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.job.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.job.count({ where: { status: "DRAFT" } }),

      // الطلبات
      prisma.application.count(),
      prisma.application.count({ where: { status: "NEW" } }),
      prisma.application.count({ where: { status: "QUALIFIED" } }),
      prisma.application.count({ where: { status: "ACCEPTED" } }),
      prisma.application.count({
        where: { appliedAt: { gte: startOfMonth } },
      }),

      // المقابلات
      prisma.interview.count(),
      prisma.interview.count({ where: { status: "SCHEDULED" } }),
      prisma.interview.count({
        where: { status: "COMPLETED", score: null },
      }),

      // آخر 5 طلبات
      prisma.application.findMany({
        take: 5,
        orderBy: { appliedAt: "desc" },
        include: {
          job: {
            include: { department: true },
          },
        },
      }),

      // المقابلات القادمة (5 التالية)
      prisma.interview.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { gte: now },
        },
        take: 5,
        orderBy: { scheduledAt: "asc" },
        include: {
          application: true,
          job: {
            include: { department: true },
          },
        },
      }),

      // توزيع الحالات
      prisma.application.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // توزيع الأقسام
      prisma.application.groupBy({
        by: ["jobId"],
        _count: { jobId: true },
      }),

      // الطلبات في الـ 6 أشهر الماضية للاتجاه
      prisma.application.findMany({
        where: { appliedAt: { gte: sixMonthsAgo } },
        select: { appliedAt: true },
        orderBy: { appliedAt: "asc" },
      }),

      // أعلى 5 وظائف بعدد المتقدمين
      prisma.job.findMany({
        take: 5,
        orderBy: {
          applications: { _count: "desc" },
        },
        include: {
          department: true,
          _count: { select: { applications: true } },
        },
      }),

      // المقابلات المكتملة هذا الشهر
      prisma.interview.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: startOfMonth },
        },
      }),
    ]);

    // حساب معدل القبول
    const acceptanceRate =
      totalApplications > 0
        ? Math.round((acceptedApplications / totalApplications) * 100)
        : 0;

    // بناء بيانات الاتجاه — تجميع حسب الشهر
    const trendMap: Record<string, number> = {};

    // إنشاء 6 أشهر متتالية
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
      trendMap[key] = 0;
    }

    // ملء البيانات الفعلية
    trendApplicationsRaw.forEach((app) => {
      const d = new Date(app.appliedAt);
      const key = `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
      if (key in trendMap) {
        trendMap[key]++;
      }
    });

    const applicationsTrend = Object.entries(trendMap).map(([month, count]) => ({
      month,
      count,
    }));

    // بناء توزيع الحالات
    const applicationsByStatus = statusCountsRaw.map((s) => ({
      status: s.status,
      count: s._count.status,
      label: statusLabels[s.status] ?? s.status,
    }));

    // بناء توزيع الأقسام — جلب أسماء الأقسام
    const jobIds = deptCountsRaw.map((d) => d.jobId);
    const jobsForDept = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: { department: true },
    });

    const deptMap: Record<string, number> = {};
    deptCountsRaw.forEach((d) => {
      const job = jobsForDept.find((j) => j.id === d.jobId);
      const deptName = job?.department?.name ?? "غير محدد";
      deptMap[deptName] = (deptMap[deptName] ?? 0) + d._count.jobId;
    });

    const applicationsByDepartment = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    // تنسيق آخر 5 طلبات (تسلسل التواريخ)
    const recentApplications = recentApplicationsRaw.map((app) => ({
      id: app.id,
      fullName: app.fullName,
      jobTitle: app.job.title,
      departmentName: app.job.department.name,
      status: app.status,
      initialScore: app.initialScore,
      appliedAt: app.appliedAt.toISOString(),
    }));

    // تنسيق المقابلات القادمة
    const upcomingInterviews = upcomingInterviewsRaw.map((interview) => ({
      id: interview.id,
      applicantName: interview.application.fullName,
      jobTitle: interview.job.title,
      departmentName: interview.job.department.name,
      scheduledAt: interview.scheduledAt.toISOString(),
      type: interview.type,
      status: interview.status,
    }));

    // أعلى الوظائف
    const topJobs = topJobsRaw.map((job) => ({
      id: job.id,
      title: job.title,
      department: job.department.name,
      applicantCount: job._count.applications,
    }));

    return NextResponse.json({
      jobs: {
        total: totalJobs,
        published: publishedJobs,
        pendingApproval: pendingApprovalJobs,
        draft: draftJobs,
      },
      applications: {
        total: totalApplications,
        new: newApplications,
        qualified: qualifiedApplications,
        accepted: acceptedApplications,
        thisMonth: thisMonthApplications,
      },
      interviews: {
        total: totalInterviews,
        scheduled: scheduledInterviews,
        completedThisMonth: completedThisMonthInterviews,
        pendingScore: pendingScoreInterviews,
      },
      acceptanceRate,
      recentApplications,
      upcomingInterviews,
      applicationsByStatus,
      applicationsByDepartment,
      applicationsTrend,
      topJobs,
    });
  } catch (error) {
    console.error("خطأ في جلب إحصائيات لوحة التحكم:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب البيانات" },
      { status: 500 }
    );
  }
}
