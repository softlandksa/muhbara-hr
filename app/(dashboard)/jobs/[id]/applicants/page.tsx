// صفحة متقدمو الوظيفة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Users, TrendingUp, Star, UserCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationsTable } from "@/components/applicants/ApplicationsTable";
import type { ApplicationListItem } from "@/components/applicants/ApplicationsTable";
import { translateJobStatus } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: job ? `متقدمو وظيفة: ${job.title}` : "متقدمو الوظيفة" };
}

export default async function JobApplicantsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // جلب الوظيفة مع طلباتها
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: {
      id: true, title: true, status: true, type: true,
      department: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job) notFound();

  // جلب الطلبات مرتبة بالنقطة
  const applications = await prisma.application.findMany({
    where: { jobId: params.id },
    orderBy: [{ initialScore: "desc" }, { appliedAt: "desc" }],
    select: {
      id: true, fullName: true, email: true, phone: true,
      status: true, source: true, initialScore: true,
      educationLevel: true, experienceYears: true, appliedAt: true,
      job: {
        select: {
          id: true, title: true,
          department: { select: { id: true, name: true, code: true } },
        },
      },
      _count: { select: { interviews: true } },
    },
  });

  // إحصائيات
  const totalCount = applications.length;
  const highScoreCount = applications.filter((a) => (a.initialScore ?? 0) >= 66).length;
  const qualifiedCount = applications.filter((a) => a.status === "QUALIFIED").length;
  const acceptedCount = applications.filter((a) => a.status === "ACCEPTED").length;

  // توزيع الحالات
  const statusDistribution = applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});

  const formattedApplications: ApplicationListItem[] = applications.map((app) => ({
    ...app,
    appliedAt: app.appliedAt.toISOString(),
    interviewCount: app._count.interviews,
    _count: undefined,
  }));

  return (
    <div className="space-y-6">
      {/* مسار التنقل */}
      <nav className="flex items-center gap-1 text-sm" aria-label="مسار التنقل">
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-secondary)" }}>لوحة التحكم</Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href="/jobs" className="hover:underline" style={{ color: "var(--text-secondary)" }}>الوظائف</Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href={`/jobs/${job.id}`} className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          {job.title}
        </Link>
        <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <span style={{ color: "var(--text-primary)" }}>المتقدمون</span>
      </nav>

      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            {job.title}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {job.department.name} · {totalCount} متقدم
          </p>
        </div>
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all"
          style={{ border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)" }}
          aria-label="العودة إلى تفاصيل الوظيفة"
        >
          تفاصيل الوظيفة
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المتقدمين", value: totalCount, icon: Users, color: "#4361EE", bg: "#EFF2FF" },
          { label: "نقطة عالية (66+)", value: highScoreCount, icon: TrendingUp, color: "#2D9B6F", bg: "#ECFDF5" },
          { label: "مؤهلون", value: qualifiedCount, icon: Star, color: "#7B61FF", bg: "#F3F0FF" },
          { label: "مقبولون", value: acceptedCount, icon: UserCheck, color: "#E07B39", bg: "#FFF7ED" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="system-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* توزيع الحالات */}
      {totalCount > 0 && (
        <div className="system-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            توزيع الحالات
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusDistribution).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{ backgroundColor: "#F3F4F6", color: "var(--text-secondary)" }}
              >
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{status}</span>
                <span
                  className="font-bold px-1.5 py-0.5 rounded-full text-white text-xs"
                  style={{ backgroundColor: "#4361EE" }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* جدول المتقدمين */}
      {totalCount > 0 ? (
        <ApplicationsTable applications={formattedApplications} />
      ) : (
        <div className="system-card p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
          <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
            لا يوجد متقدمون لهذه الوظيفة بعد
          </p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            يمكنك إضافة متقدمين يدوياً من صفحة المتقدمين
          </p>
          <Link
            href="/applicants/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
          >
            إضافة متقدم
          </Link>
        </div>
      )}
    </div>
  );
}
