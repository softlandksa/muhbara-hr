// صفحة إضافة متقدم جديد — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ApplicationForm } from "@/components/applicants/ApplicationForm";

export const metadata: Metadata = { title: "إضافة متقدم جديد" };

export default async function NewApplicantPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-3xl">
      {/* مسار التنقل */}
      <nav className="flex items-center gap-1 text-sm" aria-label="مسار التنقل">
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          لوحة التحكم
        </Link>
        <ChevronLeft className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href="/applicants" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          المتقدمون
        </Link>
        <ChevronLeft className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <span style={{ color: "var(--text-primary)" }}>إضافة متقدم</span>
      </nav>

      {/* العنوان */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          إضافة متقدم جديد
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          سيُحسب التقييم الأولي تلقائياً بعد الحفظ
        </p>
      </div>

      {/* النموذج */}
      <ApplicationForm mode="create" onSuccess={() => {}} />
    </div>
  );
}
