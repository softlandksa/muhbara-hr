// صفحة إضافة وظيفة جديدة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { JobFormWrapper } from "@/components/jobs/JobFormWrapper";

export const metadata: Metadata = {
  title: "إضافة وظيفة جديدة",
};

export default async function NewJobPage() {
  // التحقق من المصادقة
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // جلب قائمة الأقسام
  const departments = await prisma.department.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6" style={{ direction: "rtl" }}>
      {/* شريط التنقل (Breadcrumb) */}
      <nav aria-label="مسار التنقل">
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          <li>
            <Link
              href="/dashboard"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
              className="hover:opacity-70 transition-opacity"
            >
              لوحة التحكم
            </Link>
          </li>
          <li>
            <ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
          </li>
          <li>
            <Link
              href="/jobs"
              style={{ color: "var(--text-secondary)", textDecoration: "none" }}
              className="hover:opacity-70 transition-opacity"
            >
              الوظائف
            </Link>
          </li>
          <li>
            <ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
          </li>
          <li style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            إضافة وظيفة
          </li>
        </ol>
      </nav>

      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          إضافة وظيفة جديدة
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          أنشئ وظيفة جديدة وستُحفظ كمسودة حتى يتم اعتمادها
        </p>
      </div>

      {/* نموذج الوظيفة */}
      <JobFormWrapper mode="create" departments={departments} />
    </div>
  );
}
