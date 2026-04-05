// بوابة التوظيف العامة — قائمة الوظائف المنشورة
import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Briefcase, Clock, Banknote, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency, translateJobType } from "@/lib/utils";

export const metadata: Metadata = { title: "الوظائف المتاحة" };
export const dynamic = "force-dynamic";

// ترجمة نوع الوظيفة مع أيقونة
const TYPE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  FULL_TIME:  { label: "دوام كامل",  color: "#059669", bg: "#D1FAE5" },
  PART_TIME:  { label: "دوام جزئي",  color: "#D97706", bg: "#FEF3C7" },
  REMOTE:     { label: "عن بُعد",    color: "#7C3AED", bg: "#EDE9FE" },
  HYBRID:     { label: "هجين",       color: "#2563EB", bg: "#DBEAFE" },
  TEMPORARY:  { label: "مؤقت",       color: "#DC2626", bg: "#FEE2E2" },
};

export default async function CareersPage() {
  const jobs = await prisma.job.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: {
      department: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  return (
    <div className="space-y-8">
      {/* رأس الصفحة */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          انضم إلى فريقنا
        </h1>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          {jobs.length > 0
            ? `${jobs.length} وظيفة متاحة الآن — اختر ما يناسبك`
            : "لا توجد وظائف متاحة حالياً، تابعنا قريباً"}
        </p>
      </div>

      {/* قائمة الوظائف */}
      {jobs.length === 0 ? (
        <div className="system-card p-16 text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            لا توجد وظائف شاغرة في الوقت الحالي
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            يرجى المراجعة لاحقاً
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => {
            const typeBadge = TYPE_BADGES[job.type] ?? { label: job.type, color: "#6B7280", bg: "#F3F4F6" };
            const isDeadlineSoon =
              job.deadline && new Date(job.deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={job.id}
                className="system-card p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* أيقونة القسم */}
                  <div
                    className="w-12 h-12 rounded-[12px] flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#4361EE" }}
                    aria-hidden="true"
                  >
                    {job.department.name.charAt(0)}
                  </div>

                  {/* معلومات الوظيفة */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        {job.title}
                      </h2>
                      {/* شارة نوع الوظيفة */}
                      <span
                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                        style={{ backgroundColor: typeBadge.bg, color: typeBadge.color }}
                      >
                        {typeBadge.label}
                      </span>
                      {/* تنبيه قرب الموعد النهائي */}
                      {isDeadlineSoon && (
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                        >
                          ينتهي قريباً
                        </span>
                      )}
                    </div>

                    {/* القسم والموقع */}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                        {job.department.name}
                      </span>
                      {(job.location || job.isRemote) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          {job.isRemote ? "عن بُعد" : job.location}
                        </span>
                      )}
                      {job.deadline && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          آخر موعد: {formatDate(job.deadline)}
                        </span>
                      )}
                      {job.showSalary && job.salaryMin && (
                        <span className="flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 flex-shrink-0" />
                          {formatCurrency(job.salaryMin, job.currency)}
                          {job.salaryMax ? ` — ${formatCurrency(job.salaryMax, job.currency)}` : "+"}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        {job._count.applications} متقدم
                      </span>
                    </div>

                    {/* مقطع الوصف */}
                    <p
                      className="mt-3 text-sm line-clamp-2 leading-relaxed"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {job.description}
                    </p>
                  </div>

                  {/* زر التقديم */}
                  <div className="flex-shrink-0">
                    <Link
                      href={`/careers/${job.id}`}
                      className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white transition-all whitespace-nowrap"
                      style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
                      aria-label={`تقدم على وظيفة ${job.title}`}
                    >
                      تقدّم الآن
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
