// صفحة تفاصيل الوظيفة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Users, MapPin, Calendar, GraduationCap, DollarSign, Hash, Wifi, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";
import { JobsRefreshWrapper } from "@/components/jobs/JobsRefreshWrapper";
import {
  translateJobType,
  translateEducation,
  formatDate,
  formatDateTime,
  formatCurrency,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "تفاصيل الوظيفة",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function JobDetailPage({ params }: PageProps) {
  // التحقق من المصادقة
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  // جلب الوظيفة مع كل التفاصيل
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, code: true } },
      skills: { orderBy: [{ isRequired: "desc" }, { skillName: "asc" }] },
      postedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true } },
      auditLogs: {
        orderBy: { changedAt: "desc" },
      },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  // جلب أسماء المستخدمين لسجلات التدقيق
  const auditorIds = Array.from(new Set(job.auditLogs.map((log) => log.changedById)));
  const auditors = await prisma.user.findMany({
    where: { id: { in: auditorIds } },
    select: { id: true, name: true },
  });
  const auditorMap = new Map(auditors.map((u) => [u.id, u.name]));

  // استخراج أوزان التقييم
  const scoringWeights = job.scoringWeights as Record<string, number> | null;

  const weightLabels: Record<string, string> = {
    experience: "الخبرة",
    education: "التعليم",
    requiredSkills: "المهارات الإلزامية",
    preferredSkills: "المهارات المفضلة",
    completeness: "اكتمال الطلب",
    location: "الموقع",
  };

  return (
    <div className="flex flex-col gap-6" style={{ direction: "rtl" }}>
      {/* شريط التنقل */}
      <nav aria-label="مسار التنقل">
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          <li>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }} className="hover:opacity-70">
              لوحة التحكم
            </Link>
          </li>
          <li><ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} /></li>
          <li>
            <Link href="/jobs" style={{ color: "var(--text-secondary)", textDecoration: "none" }} className="hover:opacity-70">
              الوظائف
            </Link>
          </li>
          <li><ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} /></li>
          <li style={{ color: "var(--text-primary)", fontWeight: 500 }}>{job.title}</li>
        </ol>
      </nav>

      {/* رأس الصفحة مع الإجراءات */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {job.title}
            </h1>
            <JobStatusBadge status={job.status as "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED"} />
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap" style={{ color: "var(--text-secondary)" }}>
            <span>{job.department.name}</span>
            <span>·</span>
            <span>{translateJobType(job.type)}</span>
            {job.location && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {job.location}
                </span>
              </>
            )}
            {job.isRemote && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Wifi size={13} />
                  عن بُعد
                </span>
              </>
            )}
          </div>
        </div>

        {/* أزرار الإجراءات — نستخدم Client Wrapper */}
        <JobsRefreshWrapper
          jobId={job.id}
          jobTitle={job.title}
          jobStatus={job.status as "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED"}
        />
      </div>

      {/* المحتوى الرئيسي — عمودان */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* العمود الرئيسي */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* وصف الوظيفة */}
          <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              وصف الوظيفة
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {job.description}
            </p>
          </div>

          {/* متطلبات الوظيفة */}
          <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              المتطلبات
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
              {job.requirements}
            </p>
          </div>

          {/* المهارات */}
          {job.skills.length > 0 && (
            <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                المهارات المطلوبة
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1.5 rounded-full text-sm"
                    style={{
                      backgroundColor: skill.isRequired ? "#EEF2FF" : "#F3F4F6",
                      color: skill.isRequired ? "var(--accent-blue)" : "var(--text-secondary)",
                      border: `1px solid ${skill.isRequired ? "var(--accent-blue)" : "var(--border)"}`,
                    }}
                  >
                    {skill.skillName}
                    {skill.isRequired && (
                      <span className="mr-1 text-xs opacity-70">*</span>
                    )}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-secondary)" }}>
                * المهارات الإلزامية
              </p>
            </div>
          )}
        </div>

        {/* الشريط الجانبي */}
        <div className="flex flex-col gap-4">
          {/* معلومات عامة */}
          <div className="system-card p-5" style={{ border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              معلومات الوظيفة
            </h3>
            <div className="flex flex-col gap-3">
              {/* الراتب */}
              {(job.salaryMin ?? job.salaryMax) && job.showSalary && (
                <div className="flex items-start gap-2.5">
                  <DollarSign size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>الراتب</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {job.salaryMin && formatCurrency(job.salaryMin, job.currency)}
                      {job.salaryMin && job.salaryMax && " — "}
                      {job.salaryMax && formatCurrency(job.salaryMax, job.currency)}
                    </p>
                  </div>
                </div>
              )}

              {/* الخبرة */}
              <div className="flex items-start gap-2.5">
                <Clock size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>الخبرة المطلوبة</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {job.experienceMin === 0 && !job.experienceMax
                      ? "بدون اشتراط خبرة"
                      : `${job.experienceMin}${job.experienceMax ? ` — ${job.experienceMax}` : "+"} سنوات`}
                  </p>
                </div>
              </div>

              {/* التعليم */}
              <div className="flex items-start gap-2.5">
                <GraduationCap size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>المستوى التعليمي</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {translateEducation(job.educationRequired)}
                  </p>
                </div>
              </div>

              {/* عدد الشواغر */}
              <div className="flex items-start gap-2.5">
                <Hash size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>عدد الشواغر</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {job.headcount} شاغر
                  </p>
                </div>
              </div>

              {/* المتقدمون */}
              <div className="flex items-start gap-2.5">
                <Users size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>المتقدمون</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {job._count.applications} متقدم
                  </p>
                </div>
              </div>

              {/* الموعد النهائي */}
              {job.deadline && (
                <div className="flex items-start gap-2.5">
                  <Calendar size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>الموعد النهائي</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatDate(new Date(job.deadline))}
                    </p>
                  </div>
                </div>
              )}

              {/* تاريخ النشر */}
              {job.publishedAt && (
                <div className="flex items-start gap-2.5">
                  <Calendar size={16} style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs mb-0.5" style={{ color: "var(--text-secondary)" }}>تاريخ النشر</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {formatDate(new Date(job.publishedAt))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* أوزان التقييم */}
          {scoringWeights && (
            <div className="system-card p-5" style={{ border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                أوزان التقييم
              </h3>
              <div className="flex flex-col gap-2.5">
                {Object.entries(weightLabels).map(([key, label]) => {
                  const weight = scoringWeights[key] ?? 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {label}
                        </span>
                        <span className="text-xs font-bold" style={{ color: "var(--accent-blue)" }}>
                          {weight}%
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: "#E8E6E0" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${weight}%`,
                            backgroundColor: "var(--accent-blue)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* المعلومات الإدارية */}
          <div className="system-card p-5" style={{ border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              المعلومات الإدارية
            </h3>
            <div className="flex flex-col gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
              <p>أُنشئت: {formatDateTime(new Date(job.createdAt))}</p>
              {job.postedBy && (
                <p>بواسطة: {job.postedBy.name ?? job.postedBy.email}</p>
              )}
              {job.approvedBy && (
                <p>اعتمدها: {job.approvedBy.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* سجل التدقيق */}
      {job.auditLogs.length > 0 && (
        <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
            سجل النشاط
          </h2>
          <div className="relative">
            {/* الخط العمودي */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                right: "16px",
                width: "2px",
                backgroundColor: "var(--border)",
              }}
            />
            <div className="flex flex-col gap-4">
              {job.auditLogs.map((log, index) => (
                <div key={log.id} className="flex gap-4 items-start pr-10 relative">
                  {/* نقطة الجدول الزمني */}
                  <div
                    className="absolute w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{
                      right: "10px",
                      top: "4px",
                      backgroundColor: index === 0 ? "var(--accent-blue)" : "var(--border)",
                      border: "2px solid var(--bg-card)",
                      boxShadow: "0 0 0 2px var(--border)",
                    }}
                  />
                  {/* محتوى الحدث */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {log.action}
                      </p>
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {formatDateTime(new Date(log.changedAt))}
                      </span>
                    </div>
                    {auditorMap.get(log.changedById) && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {auditorMap.get(log.changedById)}
                      </p>
                    )}
                    {log.note && (
                      <p
                        className="text-xs mt-1 px-2 py-1 rounded"
                        style={{
                          backgroundColor: "#F7F6F3",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
