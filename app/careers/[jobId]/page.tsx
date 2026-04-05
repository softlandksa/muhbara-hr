// صفحة تفاصيل الوظيفة + نموذج التقديم — عامة بدون مصادقة
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin, Briefcase, Clock, Banknote, GraduationCap,
  Users, ChevronLeft, CheckCircle, Star,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { formatDate, formatCurrency, translateEducation, translateJobType } from "@/lib/utils";
import { ApplyForm } from "@/components/careers/ApplyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { jobId: string } }): Promise<Metadata> {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId, status: "PUBLISHED" },
    select: { title: true },
  });
  return { title: job ? `وظيفة: ${job.title}` : "وظيفة غير موجودة" };
}

export default async function JobDetailPage({ params }: { params: { jobId: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.jobId, status: "PUBLISHED" },
    include: {
      department: { select: { name: true } },
      skills:     { select: { skillName: true, isRequired: true } },
      _count:     { select: { applications: true } },
    },
  });

  if (!job) notFound();

  const requiredSkills  = job.skills.filter((s) => s.isRequired);
  const preferredSkills = job.skills.filter((s) => !s.isRequired);

  // بيانات الوظيفة للنموذج (بدون Date objects)
  const jobFormConfig = {
    id:                job.id,
    title:             job.title,
    isRemote:          job.isRemote,
    experienceMin:     job.experienceMin,
    educationRequired: job.educationRequired,
    skills:            job.skills,
  };

  return (
    <div className="space-y-6">
      {/* رابط العودة */}
      <Link
        href="/careers"
        className="inline-flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: "var(--text-secondary)" }}
        aria-label="العودة إلى قائمة الوظائف"
      >
        <ChevronLeft className="w-4 h-4" style={{ transform: "rotate(180deg)" }} />
        جميع الوظائف
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ===== العمود الأيسر — التفاصيل (2/3) ===== */}
        <div className="lg:col-span-2 space-y-5">

          {/* رأس الوظيفة */}
          <div className="system-card p-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-[14px] flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#4361EE" }}
                aria-hidden="true"
              >
                {job.department.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                  {job.title}
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {job.department.name}
                </p>

                {/* المعلومات السريعة */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    {translateJobType(job.type)}
                  </span>
                  {(job.location || job.isRemote) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {job.isRemote ? "عن بُعد" : job.location}
                    </span>
                  )}
                  {job.deadline && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      آخر موعد: {formatDate(job.deadline)}
                    </span>
                  )}
                  {job.showSalary && job.salaryMin && (
                    <span className="flex items-center gap-1.5">
                      <Banknote className="w-4 h-4" />
                      {formatCurrency(job.salaryMin, job.currency)}
                      {job.salaryMax ? ` — ${formatCurrency(job.salaryMax, job.currency)}` : "+"}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {job._count.applications} تقدموا حتى الآن
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* وصف الوظيفة */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              وصف الوظيفة
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
              {job.description}
            </p>
          </div>

          {/* المتطلبات */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              المتطلبات والمؤهلات
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-secondary)" }}>
              {job.requirements}
            </p>
          </div>

          {/* المهارات المطلوبة */}
          {job.skills.length > 0 && (
            <div className="system-card p-6">
              <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                المهارات المطلوبة
              </h2>
              {requiredSkills.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--danger)" }}>
                    إلزامية
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((s) => (
                      <span
                        key={s.skillName}
                        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-full"
                        style={{ backgroundColor: "#FEE2E2", color: "#B91C1C" }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {preferredSkills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                    مفضّلة
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preferredSkills.map((s) => (
                      <span
                        key={s.skillName}
                        className="flex items-center gap-1.5 px-3 py-1 text-sm rounded-full"
                        style={{ backgroundColor: "#EDE9FE", color: "#7C3AED" }}
                      >
                        <Star className="w-3.5 h-3.5" />
                        {s.skillName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== العمود الأيمن — النموذج (1/3) ===== */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="system-card overflow-hidden">
              {/* رأس النموذج */}
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)", backgroundColor: "#FAFAFA" }}>
                <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  تقدّم على هذه الوظيفة
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  أكمل النموذج أدناه
                </p>
              </div>

              {/* النموذج */}
              <div className="p-6">
                {/* تحذير انتهاء الموعد */}
                {job.deadline && new Date(job.deadline) < new Date() ? (
                  <div
                    className="text-center py-8 px-4 rounded-[12px]"
                    style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
                  >
                    <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--danger)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                      انتهى موعد التقديم
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                      انتهى في {formatDate(job.deadline)}
                    </p>
                  </div>
                ) : (
                  <ApplyForm job={jobFormConfig} />
                )}
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="mt-4 system-card p-4 space-y-3">
              <h3 className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                تفاصيل الوظيفة
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>التعليم المطلوب</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {translateEducation(job.educationRequired)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>الخبرة</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {job.experienceMin === 0
                      ? "لا يشترط"
                      : `${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : "+"} سنوات`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>عدد الشواغر</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {job.headcount}
                  </span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>آخر موعد</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {formatDate(job.deadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
