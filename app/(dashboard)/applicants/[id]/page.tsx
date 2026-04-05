// صفحة تفاصيل المتقدم — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Clock, ExternalLink, FileText, Linkedin, Calendar
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationStatusBadge } from "@/components/applicants/ApplicationStatusBadge";
import { ApplicationStatusDialog } from "@/components/applicants/ApplicationStatusDialog";
import { ScoreCircle } from "@/components/applicants/ScoreCircle";
import { ScoreBreakdown } from "@/components/applicants/ScoreBreakdown";
import {
  formatDate, formatDateTime, translateEducation, translateJobType,
} from "@/lib/utils";
import type { ScoringWeights } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// ترجمة مصدر الطلب
function translateSource(source: string): string {
  const map: Record<string, string> = {
    WEBSITE: "الموقع الإلكتروني", LINKEDIN: "LinkedIn", REFERRAL: "توصية",
    EMAIL: "بريد إلكتروني", EXCEL_IMPORT: "استيراد Excel", OTHER: "أخرى",
  };
  return map[source] ?? source;
}

// ترجمة نوع المقابلة
function translateInterviewType(type: string): string {
  const map: Record<string, string> = {
    PHONE: "هاتفية", VIDEO: "مرئية", IN_PERSON: "حضورية", TECHNICAL: "تقنية", HR: "HR",
  };
  return map[type] ?? type;
}

// ترجمة حالة المقابلة
function translateInterviewStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: "مجدولة", COMPLETED: "مكتملة", CANCELLED: "ملغاة",
    NO_SHOW: "لم يحضر", RESCHEDULED: "أُعيد جدولتها",
  };
  return map[status] ?? status;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const app = await prisma.application.findUnique({
    where: { id: params.id },
    select: { fullName: true },
  });
  return { title: app ? `${app.fullName} — تفاصيل الطلب` : "تفاصيل الطلب" };
}

export default async function ApplicantDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // جلب الطلب مع جميع العلاقات
  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      job: {
        select: {
          id: true, title: true, type: true, location: true,
          scoringWeights: true,
          department: { select: { id: true, name: true } },
        },
      },
      statusLogs: {
        orderBy: { changedAt: "asc" },
        select: {
          id: true, oldStatus: true, newStatus: true,
          note: true, changedAt: true, changedById: true,
        },
      },
      interviews: {
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true, type: true, status: true,
          scheduledAt: true, score: true,
          interviewer: { select: { name: true } },
        },
      },
    },
  });

  if (!application) notFound();

  // جلب أسماء المستخدمين لسجلات الحالة
  const userIds = Array.from(new Set(application.statusLogs.map((l) => l.changedById)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  // استخراج أوزان التقييم
  const weights = application.job.scoringWeights as unknown as ScoringWeights;
  const breakdown = application.initialScoreBreakdown as {
    experience: number; education: number; requiredSkills: number;
    preferredSkills: number; completeness: number; location: number;
  } | null;

  return (
    <div className="space-y-6">
      {/* مسار التنقل */}
      <nav className="flex items-center gap-1 text-sm" aria-label="مسار التنقل">
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-secondary)" }}>لوحة التحكم</Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href="/applicants" className="hover:underline" style={{ color: "var(--text-secondary)" }}>المتقدمون</Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <span style={{ color: "var(--text-primary)" }}>{application.fullName}</span>
      </nav>

      {/* رأس الصفحة */}
      <div className="system-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* الأفاتار */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "#4361EE" }}
            aria-label={`صورة ${application.fullName}`}
          >
            {application.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {application.fullName}
              </h1>
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4" /> {application.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> {application.phone}
              </span>
              {application.currentLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {application.currentLocation}
                </span>
              )}
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {application.cvUrl && (
              <a
                href={application.cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
                style={{ border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)" }}
                aria-label="فتح السيرة الذاتية"
              >
                <FileText className="w-4 h-4" />
                CV
              </a>
            )}
            {application.linkedinUrl && (
              <a
                href={application.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all"
                style={{ border: "1px solid var(--border)", borderRadius: "10px", color: "#0A66C2" }}
                aria-label="فتح صفحة LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
            <ApplicationStatusDialog
              applicationId={application.id}
              currentStatus={application.status}
              onSuccess={() => {}}
              trigger={
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
                  aria-label="تغيير حالة الطلب"
                >
                  تغيير الحالة
                </button>
              }
            />
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي — عمودان */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* العمود الأيسر (الرئيسي) */}
        <div className="lg:col-span-2 space-y-6">

          {/* التقييم الأولي */}
          {application.initialScore != null && breakdown && (
            <div className="system-card p-6">
              <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
                التقييم الأولي
              </h2>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                  <ScoreCircle score={application.initialScore} size={100} />
                  <p className="text-xs text-center" style={{ color: "var(--text-secondary)" }}>
                    النقطة الأولية
                  </p>
                </div>
                <div className="flex-1">
                  <ScoreBreakdown breakdown={breakdown} weights={weights} />
                </div>
              </div>
              {application.finalScore != null && (
                <div
                  className="mt-4 p-3 rounded-[10px] flex items-center justify-between"
                  style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}
                >
                  <span className="text-sm font-medium" style={{ color: "#166534" }}>
                    النقطة النهائية (بعد المقابلة)
                  </span>
                  <span className="text-lg font-bold" style={{ color: "#2D9B6F" }}>
                    {Math.round(application.finalScore)} / 100
                  </span>
                </div>
              )}
            </div>
          )}

          {/* المهارات */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              المهارات
            </h2>
            {application.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {application.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{ backgroundColor: "#F3F4F6", color: "var(--text-primary)" }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>لم يتم إضافة مهارات</p>
            )}
          </div>

          {/* الملاحظات */}
          {application.notes && (
            <div className="system-card p-6">
              <h2 className="text-base font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                ملاحظات
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {application.notes}
              </p>
            </div>
          )}

          {/* المقابلات */}
          <div className="system-card p-6">
            <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              المقابلات ({application.interviews.length})
            </h2>
            {application.interviews.length > 0 ? (
              <div className="space-y-3">
                {application.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="p-4 rounded-[12px]"
                    style={{ border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                          {translateInterviewType(interview.type)}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: "#F3F4F6", color: "var(--text-secondary)" }}
                        >
                          {translateInterviewStatus(interview.status)}
                        </span>
                      </div>
                      {interview.score != null && (
                        <span className="text-sm font-bold" style={{ color: "#4361EE" }}>
                          {Math.round(interview.score)} / 100
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateTime(interview.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {interview.interviewer.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                لا توجد مقابلات مجدولة بعد
              </p>
            )}
          </div>
        </div>

        {/* العمود الأيمن (الشريط الجانبي) */}
        <div className="space-y-4">
          {/* معلومات الوظيفة */}
          <div className="system-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              معلومات الوظيفة
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>الوظيفة</p>
                <Link
                  href={`/jobs/${application.job.id}`}
                  className="text-sm font-medium flex items-center gap-1 hover:underline"
                  style={{ color: "var(--accent-blue)" }}
                >
                  {application.job.title}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>القسم</p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {application.job.department.name}
                </p>
              </div>
              {application.job.location && (
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>الموقع</p>
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{application.job.location}</p>
                </div>
              )}
            </div>
          </div>

          {/* تفاصيل المتقدم */}
          <div className="system-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              بيانات المتقدم
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>التعليم</p>
                  <p style={{ color: "var(--text-primary)" }}>{translateEducation(application.educationLevel)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>الخبرة</p>
                  <p style={{ color: "var(--text-primary)" }}>{application.experienceYears} سنوات</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>المصدر</p>
                  <p style={{ color: "var(--text-primary)" }}>{translateSource(application.source)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)" }} />
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>تاريخ التقديم</p>
                  <p style={{ color: "var(--text-primary)" }}>{formatDate(application.appliedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* سجل الحالات */}
      {application.statusLogs.length > 0 && (
        <div className="system-card p-6">
          <h2 className="text-base font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
            سجل الحالات
          </h2>
          <ol className="relative" style={{ borderRight: "2px solid var(--border)", marginRight: "8px", paddingRight: "24px" }}>
            {application.statusLogs.map((log, idx) => (
              <li key={log.id} className={idx < application.statusLogs.length - 1 ? "pb-5" : ""}>
                <div
                  className="absolute w-3 h-3 rounded-full mt-1"
                  style={{
                    right: "-7px",
                    backgroundColor: idx === application.statusLogs.length - 1 ? "#4361EE" : "#D1D5DB",
                  }}
                />
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {log.oldStatus && (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F3F4F6", color: "var(--text-secondary)" }}>
                        {log.oldStatus}
                      </span>
                      <span style={{ color: "var(--text-secondary)" }}>←</span>
                    </>
                  )}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: "#EFF2FF", color: "#4361EE" }}>
                    {log.newStatus}
                  </span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {formatDateTime(log.changedAt)} — {userMap.get(log.changedById) ?? "نظام"}
                </p>
                {log.note && (
                  <p className="text-xs mt-1 italic" style={{ color: "var(--text-secondary)" }}>
                    &quot;{log.note}&quot;
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
