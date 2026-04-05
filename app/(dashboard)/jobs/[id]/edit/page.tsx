// صفحة تعديل الوظيفة — Server Component
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { JobFormWrapper } from "@/components/jobs/JobFormWrapper";
import type { JobFormData } from "@/components/jobs/JobForm";

export const metadata: Metadata = {
  title: "تعديل الوظيفة",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function EditJobPage({ params }: PageProps) {
  // التحقق من المصادقة
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  // جلب بيانات الوظيفة
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      skills: true,
      department: { select: { id: true, name: true, code: true } },
    },
  });

  if (!job) notFound();

  // فقط المسودات يمكن تعديلها — إعادة التوجيه إذا لم تكن مسودة
  if (job.status !== "DRAFT") {
    redirect(`/jobs/${id}`);
  }

  // جلب قائمة الأقسام
  const departments = await prisma.department.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  // تحويل بيانات الوظيفة للتنسيق المطلوب بواسطة النموذج
  const scoringWeights = job.scoringWeights as Record<string, number> | null;

  const initialData: JobFormData = {
    id: job.id,
    title: job.title,
    departmentId: job.departmentId,
    location: job.location,
    isRemote: job.isRemote,
    type: job.type as "FULL_TIME" | "PART_TIME" | "REMOTE" | "HYBRID" | "TEMPORARY",
    ecommerceCategory: job.ecommerceCategory,
    templateCode: job.templateCode,
    description: job.description,
    requirements: job.requirements,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency as "SAR" | "USD" | "AED",
    showSalary: job.showSalary,
    experienceMin: job.experienceMin,
    experienceMax: job.experienceMax,
    educationRequired: job.educationRequired as "HIGH_SCHOOL" | "DIPLOMA" | "BACHELOR" | "MASTER" | "PHD",
    headcount: job.headcount,
    deadline: job.deadline ? job.deadline.toISOString().split("T")[0] : null,
    scoringWeights: scoringWeights
      ? {
          experience: scoringWeights.experience ?? 25,
          education: scoringWeights.education ?? 20,
          requiredSkills: scoringWeights.requiredSkills ?? 30,
          preferredSkills: scoringWeights.preferredSkills ?? 10,
          completeness: scoringWeights.completeness ?? 10,
          location: scoringWeights.location ?? 5,
        }
      : {
          experience: 25,
          education: 20,
          requiredSkills: 30,
          preferredSkills: 10,
          completeness: 10,
          location: 5,
        },
    skills: job.skills.map((skill) => ({
      skillName: skill.skillName,
      isRequired: skill.isRequired,
    })),
  };

  return (
    <div className="flex flex-col gap-6" style={{ direction: "rtl" }}>
      {/* شريط التنقل */}
      <nav aria-label="مسار التنقل">
        <ol className="flex items-center gap-1 text-sm flex-wrap">
          <li>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }} className="hover:opacity-70">
              لوحة التحكم
            </Link>
          </li>
          <li><ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} /></li>
          <li>
            <Link href="/jobs" style={{ color: "var(--text-secondary)", textDecoration: "none" }} className="hover:opacity-70">
              الوظائف
            </Link>
          </li>
          <li><ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} /></li>
          <li>
            <Link href={`/jobs/${id}`} style={{ color: "var(--text-secondary)", textDecoration: "none" }} className="hover:opacity-70">
              {job.title}
            </Link>
          </li>
          <li><ChevronLeft size={14} style={{ color: "var(--text-secondary)", transform: "rotate(180deg)" }} /></li>
          <li style={{ color: "var(--text-primary)", fontWeight: 500 }}>تعديل</li>
        </ol>
      </nav>

      {/* رأس الصفحة */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          تعديل الوظيفة
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          تعديل بيانات وظيفة: <strong>{job.title}</strong>
        </p>
      </div>

      {/* نموذج الوظيفة */}
      <JobFormWrapper
        mode="edit"
        initialData={initialData}
        departments={departments}
      />
    </div>
  );
}
