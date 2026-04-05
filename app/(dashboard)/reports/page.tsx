// صفحة التقارير والتحليلات — Phase 5
// Server Component — تجلب البيانات مباشرة من قاعدة البيانات
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ApplicationsStatusChart from "@/components/dashboard/ApplicationsStatusChart";
import DepartmentBarChart from "@/components/dashboard/DepartmentBarChart";
import ApplicationsTrendChart from "@/components/dashboard/ApplicationsTrendChart";
import ExportButton from "@/components/reports/ExportButton";
import ImportSection from "@/components/reports/ImportSection";
import { translateApplicationStatus, getApplicationStatusColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التقارير والتحليلات",
};

// تسميات الأشهر العربية
const arabicMonths = [
  "يناير", "فبراير", "مارس", "أبريل",
  "مايو", "يونيو", "يوليو", "أغسطس",
  "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

// ترجمة حالة الطلب
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

// مكوّن شريط التحويل المرئي
function FunnelBar({ percentage }: { percentage: number }) {
  return (
    <div
      className="h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: "var(--bg-main)", width: "100%" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${Math.min(percentage, 100)}%`,
          backgroundColor: percentage >= 50 ? "#2D9B6F" : percentage >= 20 ? "#E07B39" : "#4361EE",
        }}
      />
    </div>
  );
}

export default async function ReportsPage() {
  // التحقق من تسجيل الدخول
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();

  // تاريخ 12 شهراً مضت
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  // جلب جميع البيانات بالتوازي
  const [
    statusCountsRaw,
    deptCountsRaw,
    trendApplicationsRaw,
    topApplicantsRaw,
    totalApplications,
    allScores,
  ] = await Promise.all([
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

    // الطلبات للـ 12 شهراً الاتجاه
    prisma.application.findMany({
      where: { appliedAt: { gte: twelveMonthsAgo } },
      select: { appliedAt: true },
    }),

    // أفضل 10 متقدمين (بنقطة نهائية)
    prisma.application.findMany({
      where: { finalScore: { not: null } },
      orderBy: { finalScore: "desc" },
      take: 10,
      include: {
        job: { include: { department: true } },
      },
    }),

    // إجمالي الطلبات
    prisma.application.count(),

    // النقاط الأولية لتوزيع النقاط
    prisma.application.findMany({
      where: { initialScore: { not: null } },
      select: { initialScore: true },
    }),
  ]);

  // بناء توزيع الحالات
  const statusData = statusCountsRaw.map((s) => ({
    status: s.status,
    count: s._count.status,
    label: statusLabels[s.status] ?? s.status,
  }));

  // توزيع الأقسام — جلب أسماء الأقسام
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

  // بناء بيانات اتجاه 12 شهراً
  const trendMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
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

  // توزيع النقاط في نطاقات
  const scoreRanges = [
    { label: "0 - 40", min: 0, max: 40, count: 0 },
    { label: "41 - 65", min: 41, max: 65, count: 0 },
    { label: "66 - 80", min: 66, max: 80, count: 0 },
    { label: "81 - 100", min: 81, max: 100, count: 0 },
  ];

  allScores.forEach((app) => {
    const score = app.initialScore ?? 0;
    const range = scoreRanges.find((r) => score >= r.min && score <= r.max);
    if (range) range.count++;
  });

  const scoreDistributionData = scoreRanges.map((r) => ({
    department: r.label, // نعيد استخدام DepartmentBarChart
    count: r.count,
  }));

  // بيانات قمع التحويل
  const funnelStatuses = [
    "NEW",
    "UNDER_REVIEW",
    "QUALIFIED",
    "INTERVIEW_SCHEDULED",
    "OFFER_SENT",
    "ACCEPTED",
    "REJECTED",
    "WITHDRAWN",
  ];

  const funnelData = funnelStatuses.map((status) => {
    const found = statusCountsRaw.find((s) => s.status === status);
    const count = found?._count.status ?? 0;
    const percentage =
      totalApplications > 0
        ? Math.round((count / totalApplications) * 100)
        : 0;
    return { status, label: statusLabels[status] ?? status, count, percentage };
  });

  // تسلسل بيانات أفضل المتقدمين
  const topApplicants = topApplicantsRaw.map((app) => ({
    id: app.id,
    fullName: app.fullName,
    jobTitle: app.job.title,
    departmentName: app.job.department.name,
    initialScore: app.initialScore,
    finalScore: app.finalScore,
    status: app.status,
  }));

  return (
    <div className="space-y-6" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            التقارير والتحليلات
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            نظرة شاملة على أداء التوظيف وإحصائياته
          </p>
        </div>

        {/* أزرار التصدير */}
        <div className="flex gap-2 flex-wrap">
          <ExportButton type="applications" label="تصدير الطلبات" />
          <ExportButton type="report" label="تصدير التقرير الكامل" />
        </div>
      </div>

      {/* الصف الأول: الاستيراد وتعليمات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* بطاقة الاستيراد */}
        <div className="system-card p-5">
          <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            استيراد المتقدمين من Excel
          </h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            ارفع ملف Excel يحتوي على بيانات المتقدمين لاستيرادهم تلقائياً.
          </p>
          <ImportSection />
        </div>

        {/* بطاقة التعليمات */}
        <div className="system-card p-5">
          <h3 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            تعليمات ملف الاستيراد
          </h3>
          <div className="space-y-2">
            {[
              { col: "A", label: "الاسم الكامل", required: true },
              { col: "B", label: "البريد الإلكتروني", required: true },
              { col: "C", label: "رقم الهاتف", required: true },
              { col: "D", label: "عنوان الوظيفة (للمطابقة)", required: false },
              { col: "E", label: "مستوى التعليم (بكالوريوس...)", required: false },
              { col: "F", label: "سنوات الخبرة (رقم)", required: false },
              { col: "G", label: "الموقع الجغرافي", required: false },
              { col: "H", label: "المهارات (مفصولة بفواصل)", required: false },
              { col: "I", label: "ملاحظات إضافية", required: false },
            ].map((item) => (
              <div key={item.col} className="flex items-center gap-2 text-sm">
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{
                    backgroundColor: "rgba(67, 97, 238, 0.1)",
                    color: "#4361EE",
                  }}
                >
                  {item.col}
                </span>
                <span style={{ color: "var(--text-primary)" }}>{item.label}</span>
                {item.required && (
                  <span className="text-xs" style={{ color: "var(--danger)" }}>
                    *إلزامي
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* الصف الثاني: توزيع الحالات + توزيع الأقسام */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ApplicationsStatusChart data={statusData} />
        <DepartmentBarChart data={deptData} title="الطلبات حسب الأقسام" />
      </div>

      {/* الصف الثالث: مخطط الاتجاه السنوي */}
      <div className="system-card p-5">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          اتجاه الطلبات — آخر 12 شهراً
        </h3>
        <ApplicationsTrendChart data={trendData} />
      </div>

      {/* الصف الرابع: توزيع النقاط */}
      <DepartmentBarChart
        data={scoreDistributionData}
        title="توزيع النقاط الأولية للمتقدمين"
        color="#7B61FF"
      />

      {/* الصف الخامس: جدول قمع التحويل */}
      <div className="system-card p-5">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          قمع التحويل — توزيع مراحل الطلبات
        </h3>

        {totalApplications === 0 ? (
          <div
            className="flex items-center justify-center py-8 rounded-xl"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              لا توجد بيانات كافية لعرض القمع
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  {["الحالة", "العدد", "النسبة %", "التوزيع المرئي"].map((h) => (
                    <th
                      key={h}
                      className="pb-3 text-right font-semibold"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {funnelData.map((row, i) => (
                  <tr
                    key={row.status}
                    style={{
                      borderBottom: i < funnelData.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <td className="py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getApplicationStatusColor(row.status)}`}
                      >
                        {row.label}
                      </span>
                    </td>
                    <td
                      className="py-3 font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {row.count}
                    </td>
                    <td
                      className="py-3 font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {row.percentage}%
                    </td>
                    <td className="py-3 w-48">
                      <FunnelBar percentage={row.percentage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* الصف السادس: أفضل المتقدمين */}
      <div className="system-card p-5">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          أعلى المتقدمين نقاطاً
        </h3>

        {topApplicants.length === 0 ? (
          <div
            className="flex items-center justify-center py-8 rounded-xl"
            style={{ backgroundColor: "var(--bg-main)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              لا توجد تقييمات نهائية بعد
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)" }}>
                  {["#", "الاسم", "الوظيفة", "النقطة الأولية", "النقطة النهائية", "الحالة"].map(
                    (h) => (
                      <th
                        key={h}
                        className="pb-3 text-right font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {topApplicants.map((app, index) => (
                  <tr
                    key={app.id}
                    style={{
                      borderBottom:
                        index < topApplicants.length - 1
                          ? "1px solid var(--border)"
                          : "none",
                    }}
                  >
                    {/* الرتبة */}
                    <td className="py-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor:
                            index === 0
                              ? "#FEF3C7"
                              : index === 1
                              ? "#F3F4F6"
                              : index === 2
                              ? "#FEE2E2"
                              : "var(--bg-main)",
                          color:
                            index === 0
                              ? "#92400E"
                              : index === 1
                              ? "#374151"
                              : index === 2
                              ? "#991B1B"
                              : "var(--text-secondary)",
                        }}
                      >
                        {index + 1}
                      </span>
                    </td>

                    {/* الاسم */}
                    <td className="py-3">
                      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {app.fullName}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {app.departmentName}
                      </p>
                    </td>

                    {/* الوظيفة */}
                    <td className="py-3" style={{ color: "var(--text-secondary)" }}>
                      {app.jobTitle}
                    </td>

                    {/* النقطة الأولية */}
                    <td className="py-3">
                      <span
                        className="font-bold text-sm"
                        style={{ color: "#4361EE" }}
                      >
                        {app.initialScore !== null ? Math.round(app.initialScore) : "—"}
                      </span>
                    </td>

                    {/* النقطة النهائية */}
                    <td className="py-3">
                      <span
                        className="font-bold text-sm"
                        style={{ color: "#2D9B6F" }}
                      >
                        {app.finalScore !== null ? Math.round(app.finalScore!) : "—"}
                      </span>
                    </td>

                    {/* الحالة */}
                    <td className="py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getApplicationStatusColor(app.status)}`}
                      >
                        {translateApplicationStatus(app.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
