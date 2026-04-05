// صفحة جدولة مقابلة جديدة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { InterviewForm } from "@/components/interviews/InterviewForm";

export const metadata: Metadata = { title: "جدولة مقابلة جديدة" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { applicationId?: string };
}

export default async function NewInterviewPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // جلب بيانات المتقدم مسبقاً إن وُجد في query params
  let prefilledApplication: {
    id: string; fullName: string; jobId: string;
    job: { id: string; title: string; department: { name: string } };
  } | null = null;

  if (searchParams.applicationId) {
    prefilledApplication = await prisma.application.findUnique({
      where: { id: searchParams.applicationId },
      select: {
        id: true, fullName: true, jobId: true,
        job: {
          select: {
            id: true, title: true,
            department: { select: { name: true } },
          },
        },
      },
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* مسار التنقل */}
      <nav className="flex items-center gap-1 text-sm" aria-label="مسار التنقل">
        <Link href="/dashboard" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          لوحة التحكم
        </Link>
        <ChevronLeft className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <Link href="/interviews" className="hover:underline" style={{ color: "var(--text-secondary)" }}>
          المقابلات
        </Link>
        <ChevronLeft className="w-4 h-4 flex-shrink-0"
          style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} />
        <span style={{ color: "var(--text-primary)" }}>جدولة مقابلة</span>
      </nav>

      {/* العنوان */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          جدولة مقابلة جديدة
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          حدد موعد المقابلة والمحاور المسؤول
        </p>
      </div>

      {/* بطاقة سياق المتقدم إن وُجد */}
      {prefilledApplication && (
        <div
          className="p-4 rounded-[12px] flex items-center gap-3"
          style={{ backgroundColor: "#EFF2FF", border: "1px solid #C7D2FE" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "#4361EE" }}
          >
            {prefilledApplication.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1E3A8A" }}>
              {prefilledApplication.fullName}
            </p>
            <p className="text-xs" style={{ color: "#3B5FC0" }}>
              {prefilledApplication.job.title} — {prefilledApplication.job.department.name}
            </p>
          </div>
        </div>
      )}

      {/* النموذج */}
      <InterviewForm
        mode="create"
        applicationId={prefilledApplication?.id}
        jobId={prefilledApplication?.jobId}
        onSuccess={() => {}}
      />
    </div>
  );
}
