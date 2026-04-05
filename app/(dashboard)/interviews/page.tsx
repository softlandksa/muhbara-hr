// صفحة إدارة المقابلات — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InterviewsTable } from "@/components/interviews/InterviewsTable";
import type { InterviewListItem } from "@/components/interviews/InterviewsTable";

export const metadata: Metadata = { title: "إدارة المقابلات" };
export const dynamic = "force-dynamic";

export default async function InterviewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // حدود التاريخ لإحصائية اليوم والشهر
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // جلب الإحصائيات والمقابلات معاً
  const [total, todayCount, completedThisMonth, pendingScore, interviews] = await Promise.all([
    prisma.interview.count(),
    prisma.interview.count({
      where: { status: "SCHEDULED", scheduledAt: { gte: startOfToday, lt: endOfToday } },
    }),
    prisma.interview.count({
      where: { status: "COMPLETED", completedAt: { gte: startOfMonth } },
    }),
    prisma.interview.count({
      where: { status: "COMPLETED", score: null },
    }),
    prisma.interview.findMany({
      take: 100,
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true, type: true, status: true,
        scheduledAt: true, duration: true, score: true,
        application: {
          select: { id: true, fullName: true, email: true },
        },
        job: {
          select: {
            id: true, title: true,
            department: { select: { name: true } },
          },
        },
        interviewer: { select: { name: true } },
      },
    }),
  ]);

  // تحويل البيانات للـ client component
  const formattedInterviews: InterviewListItem[] = interviews.map((i) => ({
    ...i,
    scheduledAt: i.scheduledAt.toISOString(),
  }));

  const stats = [
    { label: "إجمالي المقابلات", value: total,             icon: Calendar,     color: "#4361EE", bg: "#EFF2FF" },
    { label: "مجدولة اليوم",     value: todayCount,        icon: Clock,        color: "#E07B39", bg: "#FFF7ED" },
    { label: "مكتملة هذا الشهر", value: completedThisMonth, icon: CheckCircle,  color: "#2D9B6F", bg: "#ECFDF5" },
    { label: "بانتظار التقييم",  value: pendingScore,      icon: AlertCircle,  color: "#C0392B", bg: "#FEF2F2" },
  ];

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            إدارة المقابلات
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {total} مقابلة إجمالاً
          </p>
        </div>
        <Link
          href="/interviews/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
          aria-label="جدولة مقابلة جديدة"
        >
          <Plus className="w-4 h-4" />
          جدولة مقابلة
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="system-card p-5">
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
                style={{ backgroundColor: stat.bg }}>
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
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

      {/* جدول المقابلات */}
      <InterviewsTable interviews={formattedInterviews} />
    </div>
  );
}
