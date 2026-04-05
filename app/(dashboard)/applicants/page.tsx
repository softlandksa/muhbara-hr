// صفحة إدارة المتقدمين — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users, Star, Clock, CheckCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ApplicationsTable } from "@/components/applicants/ApplicationsTable";
import type { ApplicationListItem } from "@/components/applicants/ApplicationsTable";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "إدارة المتقدمين" };
export const dynamic = "force-dynamic";

export default async function ApplicantsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // جلب الإحصائيات
  const [total, newCount, qualifiedCount, acceptedCount, applications] = await Promise.all([
    prisma.application.count(),
    prisma.application.count({ where: { status: "NEW" } }),
    prisma.application.count({ where: { status: "QUALIFIED" } }),
    prisma.application.count({ where: { status: "ACCEPTED" } }),
    prisma.application.findMany({
      take: 100,
      orderBy: { appliedAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        initialScore: true,
        educationLevel: true,
        experienceYears: true,
        appliedAt: true,
        job: {
          select: {
            id: true,
            title: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
        _count: { select: { interviews: true } },
      },
    }),
  ]);

  // معدل القبول
  const acceptanceRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

  // تحويل البيانات للـ client component
  const formattedApplications: ApplicationListItem[] = applications.map((app) => ({
    ...app,
    appliedAt: app.appliedAt.toISOString(),
    interviewCount: app._count.interviews,
    _count: undefined,
  }));

  const stats = [
    {
      label: "إجمالي الطلبات",
      value: total,
      icon: Users,
      color: "#4361EE",
      bg: "#EFF2FF",
    },
    {
      label: "طلبات جديدة",
      value: newCount,
      icon: Clock,
      color: "#E07B39",
      bg: "#FFF7ED",
    },
    {
      label: "مؤهلون",
      value: qualifiedCount,
      icon: Star,
      color: "#7B61FF",
      bg: "#F3F0FF",
    },
    {
      label: "معدل القبول",
      value: `${acceptanceRate}%`,
      icon: CheckCircle,
      color: "#2D9B6F",
      bg: "#ECFDF5",
    },
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            إدارة المتقدمين
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {total} طلب إجمالاً
          </p>
        </div>
        <Link
          href="/applicants/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
          aria-label="إضافة متقدم جديد"
        >
          <Plus className="w-4 h-4" />
          إضافة متقدم
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
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
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* جدول المتقدمين */}
      <ApplicationsTable applications={formattedApplications} />
    </div>
  );
}
