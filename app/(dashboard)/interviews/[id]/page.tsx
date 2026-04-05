// صفحة تفاصيل المقابلة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft, Calendar, Clock, MapPin, User, FileText,
  ExternalLink, Edit2,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InterviewTypeBadge } from "@/components/interviews/InterviewTypeBadge";
import { InterviewStatusBadge } from "@/components/interviews/InterviewStatusBadge";
import { InterviewStatusDialog } from "@/components/interviews/InterviewStatusDialog";
import { InterviewScoreForm } from "@/components/interviews/InterviewScoreForm";
import { ApplicationStatusBadge } from "@/components/applicants/ApplicationStatusBadge";
import { ScoreCircle } from "@/components/applicants/ScoreCircle";
import { formatDate, formatDateTime, translateEducation } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ترجمة نوع المقابلة
function translateType(type: string): string {
  const m: Record<string, string> = {
    PHONE: "هاتفية", VIDEO: "مرئية", IN_PERSON: "حضورية", TECHNICAL: "تقنية", HR: "HR",
  };
  return m[type] ?? type;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const iv = await prisma.interview.findUnique({
    where: { id: params.id },
    select: { application: { select: { fullName: true } }, type: true },
  });
  return { title: iv ? `مقابلة ${translateType(iv.type)} — ${iv.application.fullName}` : "تفاصيل المقابلة" };
}

// نوع تفاصيل تقييم المقابلة
interface ScoreBreakdownData {
  technicalCompetence: number;
  softSkills: number;
  culturalFit: number;
}

export default async function InterviewDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    include: {
      application: {
        select: {
          id: true, fullName: true, email: true, phone: true,
          status: true, initialScore: true, finalScore: true,
          educationLevel: true, experienceYears: true,
        },
      },
      job: {
        select: {
          id: true, title: true,
          department: { select: { name: true } },
        },
      },
      interviewer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!interview) notFound();

  const scoreBreakdown = interview.scoreBreakdown as ScoreBreakdownData | null;

  // هل يمكن تعديل المقابلة
  const canEdit = interview.status === "SCHEDULED" || interview.status === "RESCHEDULED";
  // هل المقابلة مكتملة وبدون تقييم
  const needsScore = interview.status === "COMPLETED" && interview.score == null;

  return (
    <div className="space-y-6">
      {/* مسار التنقل */}
      <nav className="flex items-center gap-1 text-sm" aria-label="مسار التنقل">
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          لوحة التحكم
        </Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href="/interviews" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          المقابلات
        </Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <span style={{ color: "var(--text-primary)" }}>{interview.application.fullName}</span>
      </nav>

      {/* رأس الصفحة */}
      <div className="system-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                مقابلة {translateType(interview.type)} — {interview.application.fullName}
              </h1>
              <InterviewTypeBadge type={interview.type} />
              <InterviewStatusBadge status={interview.status} />
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {interview.job.title} · {interview.job.department.name}
            </p>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canEdit && (
              <Link
                href={`/interviews/${interview.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
                style={{ border: "1px solid var(--border)", borderRadius: "10px",
                  color: "var(--text-secondary)" }}
                aria-label="تعديل المقابلة"
              >
                <Edit2 className="w-4 h-4" />
                تعديل
              </Link>
            )}
            <InterviewStatusDialog
              interviewId={interview.id}
              currentStatus={interview.status}
              onSuccess={() => {}}
              trigger={
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
                  aria-label="تغيير حالة المقابلة"
                >
                  تغيير الحالة
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* العمود الأيسر — التفاصيل والتقييم */}
        <div className="lg:col-span-2 space-y-6">

          {/* تفاصيل المقابلة */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
              تفاصيل المقابلة
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>الموعد</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatDateTime(interview.scheduledAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>المدة</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {interview.duration} دقيقة
                  </p>
                </div>
              </div>
              {interview.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>الموقع</p>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {interview.location}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>المحاور</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {interview.interviewer.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {interview.interviewer.email}
                  </p>
                </div>
              </div>
              {interview.completedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#2D9B6F" }} />
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>تاريخ الإتمام</p>
                    <p className="text-sm font-medium" style={{ color: "#2D9B6F" }}>
                      {formatDateTime(interview.completedAt)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ملاحظات التحضير */}
            {interview.preparationNote && (
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    ملاحظات التحضير
                  </p>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: "var(--text-secondary)" }}>
                  {interview.preparationNote}
                </p>
              </div>
            )}
          </div>

          {/* قسم التقييم */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
              تقييم المقابلة
            </h2>

            {/* المقابلة مكتملة ولها تقييم */}
            {interview.status === "COMPLETED" && interview.score != null && scoreBreakdown && (
              <div className="space-y-5">
                {/* النقطة الإجمالية */}
                <div className="flex items-center gap-4">
                  <ScoreCircle score={interview.score} size={80} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      نقطة المقابلة
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                      من 100 نقطة كحد أقصى
                    </p>
                  </div>
                </div>

                {/* تفاصيل الأبعاد */}
                <div className="space-y-3">
                  {[
                    { label: "الكفاءة الوظيفية", score: scoreBreakdown.technicalCompetence, max: 40 },
                    { label: "المهارات الشخصية", score: scoreBreakdown.softSkills, max: 30 },
                    { label: "التوافق الوظيفي", score: scoreBreakdown.culturalFit, max: 30 },
                  ].map((dim) => {
                    const pct = dim.max > 0 ? (dim.score / dim.max) * 100 : 0;
                    const color = pct >= 80 ? "#2D9B6F" : pct >= 60 ? "#4361EE" : pct >= 40 ? "#E07B39" : "#C0392B";
                    return (
                      <div key={dim.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                            {dim.label}
                          </span>
                          <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                            {dim.score} / {dim.max}
                          </span>
                        </div>
                        <div style={{ background: "#E8E6E0", borderRadius: "6px", height: "8px", overflow: "hidden" }}>
                          <div style={{
                            width: `${Math.min(100, pct)}%`, background: color,
                            height: "100%", borderRadius: "6px", transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* النقطة النهائية */}
                {interview.application.finalScore != null && (
                  <div className="rounded-[12px] p-4 flex justify-between items-center"
                    style={{ backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#065F46" }}>
                        النقطة النهائية للمتقدم
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                        ({Math.round(interview.application.initialScore ?? 0)} × 40%) + ({Math.round(interview.score)} × 60%)
                      </p>
                    </div>
                    <span className="text-3xl font-bold" style={{ color: "#2D9B6F" }}>
                      {Math.round(interview.application.finalScore)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* المقابلة مكتملة وتحتاج تقييم */}
            {needsScore && (
              <InterviewScoreForm
                interviewId={interview.id}
                initialScore={interview.application.initialScore}
                onSuccess={() => {}}
              />
            )}

            {/* المقابلة لم تكتمل بعد */}
            {interview.status !== "COMPLETED" && (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  سيُتاح التقييم بعد إتمام المقابلة
                </p>
              </div>
            )}
          </div>
        </div>

        {/* العمود الأيمن — الشريط الجانبي */}
        <div className="space-y-4">

          {/* بطاقة المتقدم */}
          <div className="system-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              المتقدم
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#4361EE" }}>
                {interview.application.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {interview.application.fullName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {interview.application.email}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>الحالة</span>
                <ApplicationStatusBadge status={interview.application.status} size="sm" />
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>التعليم</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {translateEducation(interview.application.educationLevel)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>الخبرة</span>
                <span style={{ color: "var(--text-primary)" }}>
                  {interview.application.experienceYears} سنوات
                </span>
              </div>
            </div>

            {interview.application.initialScore != null && (
              <div className="flex items-center gap-3 mb-4">
                <ScoreCircle score={interview.application.initialScore} size={52} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>التقييم الأولي</p>
                </div>
              </div>
            )}

            <Link
              href={`/applicants/${interview.application.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border)", borderRadius: "10px",
                color: "var(--accent-blue)" }}
              aria-label="عرض ملف المتقدم"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              ملف المتقدم
            </Link>
          </div>

          {/* بطاقة الوظيفة */}
          <div className="system-card p-5">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              الوظيفة
            </h3>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
              {interview.job.title}
            </p>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              {interview.job.department.name}
            </p>
            <Link
              href={`/jobs/${interview.job.id}`}
              className="flex items-center justify-center gap-1.5 w-full py-2 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border)", borderRadius: "10px",
                color: "var(--accent-blue)" }}
              aria-label="عرض تفاصيل الوظيفة"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              تفاصيل الوظيفة
            </Link>
          </div>

          {/* بطاقة النقطة النهائية */}
          {interview.application.finalScore != null && (
            <div className="system-card p-5" style={{ borderTop: "4px solid #2D9B6F" }}>
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                النقطة النهائية
              </p>
              <div className="flex items-center gap-3">
                <ScoreCircle score={interview.application.finalScore} size={64} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    تقييم شامل
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    أولي 40% + مقابلة 60%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
