// صفحة لوحة التحكم الرئيسية — Phase 5
// Server Component — تجلب البيانات مباشرة من قاعدة البيانات
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Users,
  CalendarCheck,
  TrendingUp,
  Clock,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ApplicationsTrendChart from "@/components/dashboard/ApplicationsTrendChart";
import ApplicationsStatusChart from "@/components/dashboard/ApplicationsStatusChart";
import DepartmentBarChart from "@/components/dashboard/DepartmentBarChart";
import { translateApplicationStatus, getApplicationStatusColor, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "لوحة التحكم",
};

// تسميات الأشهر العربية
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ترجمة نوع المقابلة
function translateInterviewType(type: string): string {
  const map: Record<string, string> = {
    PHONE: "هاتفية",
    VIDEO: "فيديو",
    IN_PERSON: "حضورية",
    TECHNICAL: "تقنية",
    HR: "موارد بشرية",
  };
  return map[type] ?? type;
}

export default async function DashboardPage() {
  // التحقق من تسجيل الدخول
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // تاريخ بداية الـ 6 أشهر الماضية
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // جلب جميع البيانات بالتوازي
  const [
    totalJobs,
    publishedJobs,
    totalApplications,
    acceptedApplications,
    scheduledInterviews,
    recentApplicationsRaw,
    upcomingInterviewsRaw,
    statusCountsRaw,
    deptCountsRaw,
    trendApplicationsRaw,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "ACCEPTED" } }),
    prisma.interview.count({ where: { status: "SCHEDULED" } }),

    // آخر 5 طلبات
    prisma.application.findMany({
      take: 5,
      orderBy: { appliedAt: "desc" },
      include: {
        job: { include: { department: true } },
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
        job: { include: { department: true } },
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

    // الطلبات للاتجاه
    prisma.application.findMany({
      where: { appliedAt: { gte: sixMonthsAgo } },
      select: { appliedAt: true },
    }),
  ]);

  // حساب معدل القبول
  const acceptanceRate =
    totalApplications > 0
      ? Math.round((acceptedApplications / totalApplications) * 100)
      : 0;

  // بناء بيانات الاتجاه
  const trendMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
    trendMap[key] = 0;
  }
  trendApplicationsRaw.forEach((app) => {
    const d = new Date(app.appliedAt);
    const key = `${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
    if (key in trendMap) trendMap[key]++;
  });
  const trendData = Object.entries(trendMap).map(([month, count]) => ({ month, count }));

  // توزيع الحالات مع الترجمة
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

  const statusData = statusCountsRaw.map((s) => ({
    status: s.status,
    count: s._count.status,
    label: statusLabels[s.status] ?? s.status,
  }));

  // توزيع الأقسام
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
  const deptData = Object.entries(deptMap)
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count);

  // تسلسل الطلبات الأخيرة (إزالة كائنات Date)
  const recentApplications = recentApplicationsRaw.map((app) => ({
    id: app.id,
    fullName: app.fullName,
    jobTitle: app.job.title,
    departmentName: app.job.department.name,
    status: app.status,
    initialScore: app.initialScore,
    appliedAt: app.appliedAt.toISOString(),
  }));

  // تسلسل المقابلات القادمة
  const upcomingInterviews = upcomingInterviewsRaw.map((iv) => ({
    id: iv.id,
    applicantName: iv.application.fullName,
    jobTitle: iv.job.title,
    scheduledAt: iv.scheduledAt.toISOString(),
    type: iv.type,
  }));

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          لوحة التحكم
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          مرحباً {session.user.name} — إليك ملخص النظام اليوم
        </p>
      </div>

      {/* الصف الأول: بطاقات الإحصائيات الأربع */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="إجمالي الوظائف"
          value={totalJobs}
          icon={Briefcase}
          color="#4361EE"
          bg="rgba(67, 97, 238, 0.1)"
        />
        <StatsCard
          label="إجمالي المتقدمين"
          value={totalApplications}
          icon={Users}
          color="#2D9B6F"
          bg="rgba(45, 155, 111, 0.1)"
        />
        <StatsCard
          label="مقابلات مجدولة"
          value={scheduledInterviews}
          icon={CalendarCheck}
          color="#7B61FF"
          bg="rgba(123, 97, 255, 0.1)"
        />
        <StatsCard
          label="معدل القبول"
          value={`${acceptanceRate}%`}
          icon={TrendingUp}
          color="#E07B39"
          bg="rgba(224, 123, 57, 0.1)"
        />
      </div>

      {/* الصف الثاني: مخطط الاتجاه + مخطط الحالات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* مخطط الاتجاه (2/3 العرض) */}
        <div className="lg:col-span-2">
          <ApplicationsTrendChart data={trendData} />
        </div>

        {/* مخطط توزيع الحالات (1/3 العرض) */}
        <div className="lg:col-span-1">
          <ApplicationsStatusChart data={statusData} />
        </div>
      </div>

      {/* الصف الثالث: آخر الطلبات + المقابلات القادمة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* آخر 5 طلبات */}
        <div className="system-card p-5">
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            آخر الطلبات
          </h3>

          {recentApplications.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ backgroundColor: "var(--bg-main)" }}
            >
              <Users size={32} style={{ color: "var(--text-secondary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                لا توجد طلبات بعد
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-main)" }}
                >
                  {/* معلومات المتقدم */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {app.fullName}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {app.jobTitle} — {app.departmentName}
                    </p>
                  </div>

                  {/* النقطة والحالة */}
                  <div className="flex items-center gap-2 mr-2 flex-shrink-0">
                    {app.initialScore !== null && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(67, 97, 238, 0.1)",
                          color: "#4361EE",
                        }}
                      >
                        {Math.round(app.initialScore)}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${getApplicationStatusColor(app.status)}`}
                    >
                      {translateApplicationStatus(app.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* المقابلات القادمة */}
        <div className="system-card p-5">
          <h3
            className="text-base font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            المقابلات القادمة
          </h3>

          {upcomingInterviews.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl"
              style={{ backgroundColor: "var(--bg-main)" }}
            >
              <CalendarCheck size={32} style={{ color: "var(--text-secondary)" }} />
              <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                لا توجد مقابلات مجدولة
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="flex items-center justify-between py-2 px-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-main)" }}
                >
                  {/* معلومات المقابلة */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {iv.applicantName}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {iv.jobTitle}
                    </p>
                  </div>

                  {/* التاريخ والنوع */}
                  <div className="flex flex-col items-end gap-1 mr-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock size={11} style={{ color: "var(--text-secondary)" }} />
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-secondary)" }}
                        dir="ltr"
                      >
                        {formatDateTime(iv.scheduledAt)}
                      </span>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(123, 97, 255, 0.1)",
                        color: "#7B61FF",
                      }}
                    >
                      {translateInterviewType(iv.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* الصف الرابع: مخطط الأقسام — عرض كامل */}
      <DepartmentBarChart
        data={deptData}
        title="توزيع الطلبات حسب الأقسام"
      />
    </div>
  );
}
