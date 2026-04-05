// صفحة إدارة الوظائف — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Briefcase, CheckCircle, Clock, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { JobsTableWrapper } from "@/components/jobs/JobsTableWrapper";
import type { JobListItem } from "@/components/jobs/JobsTable";

export const metadata: Metadata = {
  title: "إدارة الوظائف",
};

// مكون بطاقة الإحصائية
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <div
      className="system-card p-5 flex items-center gap-4"
      style={{ border: "1px solid var(--border)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: bgColor }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {value}
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {title}
        </p>
      </div>
    </div>
  );
}

export default async function JobsPage() {
  // التحقق من المصادقة
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // جلب الوظائف من قاعدة البيانات مع كل البيانات المطلوبة
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      location: true,
      isRemote: true,
      deadline: true,
      headcount: true,
      createdAt: true,
      publishedAt: true,
      department: {
        select: { id: true, name: true, code: true },
      },
      _count: {
        select: {
          skills: true,
          applications: true,
        },
      },
    },
  });

  // تحويل البيانات للتنسيق المطلوب
  const formattedJobs: JobListItem[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    type: job.type,
    status: job.status as JobListItem["status"],
    location: job.location,
    isRemote: job.isRemote,
    deadline: job.deadline,
    headcount: job.headcount,
    createdAt: job.createdAt,
    department: job.department,
    skillCount: job._count.skills,
    applicationCount: job._count.applications,
  }));

  // حساب الإحصائيات
  const stats = {
    total: jobs.length,
    published: jobs.filter((j) => j.status === "PUBLISHED").length,
    pending: jobs.filter((j) => j.status === "PENDING_APPROVAL").length,
    closed: jobs.filter((j) => j.status === "CLOSED").length,
  };

  return (
    <div className="flex flex-col gap-6" style={{ direction: "rtl" }}>
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            إدارة الوظائف
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            إنشاء وإدارة الوظائف الشاغرة في الشركة
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white"
          style={{
            backgroundColor: "var(--accent-blue)",
            borderRadius: "10px",
            textDecoration: "none",
          }}
          aria-label="إضافة وظيفة جديدة"
        >
          <Plus size={18} />
          إضافة وظيفة
        </Link>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الوظائف"
          value={stats.total}
          icon={Briefcase}
          color="var(--accent-blue)"
          bgColor="#EEF2FF"
        />
        <StatCard
          title="منشورة"
          value={stats.published}
          icon={CheckCircle}
          color="var(--success)"
          bgColor="#D1FAE5"
        />
        <StatCard
          title="في انتظار الاعتماد"
          value={stats.pending}
          icon={Clock}
          color="var(--warning)"
          bgColor="#FEF3C7"
        />
        <StatCard
          title="مغلقة"
          value={stats.closed}
          icon={XCircle}
          color="#2563EB"
          bgColor="#DBEAFE"
        />
      </div>

      {/* جدول الوظائف */}
      <JobsTableWrapper jobs={formattedJobs} />
    </div>
  );
}
