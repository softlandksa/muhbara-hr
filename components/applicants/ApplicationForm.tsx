"use client";

// نموذج إضافة/تعديل المتقدم
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, X, Plus } from "lucide-react";
import { CreateApplicationSchema } from "@/lib/validations/application";
import { translateEducation } from "@/lib/utils";

type FormValues = z.infer<typeof CreateApplicationSchema>;

interface JobOption {
  id: string;
  title: string;
  department: { name: string };
}

interface ApplicationFormProps {
  mode: "create" | "edit";
  applicationId?: string;
  initialData?: Partial<FormValues>;
  onSuccess: () => void;
}

// ترجمة مصدر الطلب
const SOURCE_OPTIONS = [
  { value: "WEBSITE", label: "الموقع الإلكتروني" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REFERRAL", label: "توصية داخلية" },
  { value: "EMAIL", label: "بريد إلكتروني" },
  { value: "EXCEL_IMPORT", label: "استيراد Excel" },
  { value: "OTHER", label: "أخرى" },
];

const EDUCATION_OPTIONS = [
  { value: "HIGH_SCHOOL", label: "الثانوية العامة" },
  { value: "DIPLOMA", label: "دبلوم" },
  { value: "BACHELOR", label: "بكالوريوس" },
  { value: "MASTER", label: "ماجستير" },
  { value: "PHD", label: "دكتوراه" },
];

export function ApplicationForm({ mode, applicationId, initialData, onSuccess }: ApplicationFormProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateApplicationSchema),
    defaultValues: {
      fullName: initialData?.fullName ?? "",
      email: initialData?.email ?? "",
      phone: initialData?.phone ?? "",
      jobId: initialData?.jobId ?? "",
      cvUrl: initialData?.cvUrl ?? undefined,
      linkedinUrl: initialData?.linkedinUrl ?? undefined,
      educationLevel: initialData?.educationLevel ?? "BACHELOR",
      experienceYears: initialData?.experienceYears ?? 0,
      currentLocation: initialData?.currentLocation ?? undefined,
      skills: initialData?.skills ?? [],
      source: initialData?.source ?? "WEBSITE",
      notes: initialData?.notes ?? undefined,
    },
  });

  // جلب الوظائف المنشورة
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("/api/jobs?status=PUBLISHED&limit=100");
        const data = await res.json() as { jobs?: JobOption[] };
        setJobs(data.jobs ?? []);
      } catch {
        // تجاهل الخطأ
      }
    }
    fetchJobs();
  }, []);

  // تحديث قائمة المهارات في الـ form
  useEffect(() => {
    setValue("skills", skills);
  }, [skills, setValue]);

  // إضافة مهارة
  const addSkill = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  // حذف مهارة
  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  // معالجة ضغط Enter أو فاصلة في حقل المهارات
  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const url = mode === "create" ? "/api/applications" : `/api/applications/${applicationId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json() as { error?: string };
      if (!response.ok) {
        toast.error(result.error ?? "حدث خطأ");
        return;
      }

      toast.success(mode === "create" ? "تم إضافة الطلب بنجاح" : "تم تحديث الطلب بنجاح");
      onSuccess();
      router.push("/applicants");
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  // مساعد لعرض رسائل الخطأ
  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{message}</p> : null;

  const inputStyle = (hasError: boolean) => ({
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    borderRadius: "10px",
    backgroundColor: "var(--bg-card)",
    color: "var(--text-primary)",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>

      {/* ===== القسم 1: البيانات الشخصية ===== */}
      <div className="system-card p-6 space-y-5">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          البيانات الشخصية
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* الاسم الكامل */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="fullName" style={{ color: "var(--text-primary)" }}>
              الاسم الكامل *
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="أحمد محمد العلي"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.fullName)}
              aria-label="الاسم الكامل"
              {...register("fullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email" style={{ color: "var(--text-primary)" }}>
              البريد الإلكتروني *
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.email)}
              aria-label="البريد الإلكتروني"
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="phone" style={{ color: "var(--text-primary)" }}>
              رقم الهاتف *
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.phone)}
              aria-label="رقم الهاتف"
              {...register("phone")}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          {/* الموقع الحالي */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="currentLocation" style={{ color: "var(--text-primary)" }}>
              الموقع الحالي
            </label>
            <input
              id="currentLocation"
              type="text"
              placeholder="الرياض، المملكة العربية السعودية"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(false)}
              aria-label="الموقع الحالي"
              {...register("currentLocation")}
            />
          </div>
        </div>
      </div>

      {/* ===== القسم 2: الوظيفة المتقدم لها ===== */}
      <div className="system-card p-6 space-y-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          الوظيفة المتقدم لها
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="jobId" style={{ color: "var(--text-primary)" }}>
            الوظيفة *
          </label>
          <select
            id="jobId"
            className="w-full px-4 py-2.5 text-sm outline-none"
            style={inputStyle(!!errors.jobId)}
            aria-label="اختر الوظيفة"
            {...register("jobId")}
          >
            <option value="">— اختر الوظيفة —</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} — {job.department.name}
              </option>
            ))}
          </select>
          <FieldError message={errors.jobId?.message} />
          {jobs.length === 0 && (
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              لا توجد وظائف منشورة حالياً
            </p>
          )}
        </div>
      </div>

      {/* ===== القسم 3: المؤهلات والمهارات ===== */}
      <div className="system-card p-6 space-y-5">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          المؤهلات والمهارات
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* المستوى التعليمي */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="educationLevel" style={{ color: "var(--text-primary)" }}>
              المستوى التعليمي *
            </label>
            <select
              id="educationLevel"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.educationLevel)}
              aria-label="المستوى التعليمي"
              {...register("educationLevel")}
            >
              {EDUCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* سنوات الخبرة */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="experienceYears" style={{ color: "var(--text-primary)" }}>
              سنوات الخبرة *
            </label>
            <input
              id="experienceYears"
              type="number"
              min={0}
              max={50}
              placeholder="0"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.experienceYears)}
              aria-label="سنوات الخبرة"
              {...register("experienceYears", { valueAsNumber: true })}
            />
            <FieldError message={errors.experienceYears?.message} />
          </div>
        </div>

        {/* المهارات */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-primary)" }}>
            المهارات * <span className="font-normal text-xs" style={{ color: "var(--text-secondary)" }}>(اكتب المهارة ثم اضغط Enter)</span>
          </label>

          {/* علامات المهارات */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full"
                  style={{ backgroundColor: "#EFF2FF", color: "#4361EE" }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:opacity-70 transition-opacity"
                    aria-label={`حذف مهارة ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* حقل الإدخال */}
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="مثال: Excel، خدمة العملاء، Python..."
              className="flex-1 px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.skills)}
              aria-label="أدخل مهارة"
            />
            <button
              type="button"
              onClick={() => addSkill(skillInput)}
              disabled={!skillInput.trim()}
              className="px-4 py-2.5 text-sm font-medium text-white flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
              aria-label="إضافة مهارة"
            >
              <Plus className="w-4 h-4" />
              إضافة
            </button>
          </div>
          <FieldError message={errors.skills?.message ?? (Array.isArray(errors.skills) ? undefined : errors.skills?.root?.message)} />
        </div>
      </div>

      {/* ===== القسم 4: الروابط والمصدر ===== */}
      <div className="system-card p-6 space-y-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          الروابط والمصدر
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* رابط السيرة الذاتية */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="cvUrl" style={{ color: "var(--text-primary)" }}>
              رابط السيرة الذاتية
            </label>
            <input
              id="cvUrl"
              type="url"
              placeholder="https://drive.google.com/..."
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.cvUrl)}
              aria-label="رابط السيرة الذاتية"
              {...register("cvUrl")}
            />
            <FieldError message={errors.cvUrl?.message} />
          </div>

          {/* رابط LinkedIn */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="linkedinUrl" style={{ color: "var(--text-primary)" }}>
              رابط LinkedIn
            </label>
            <input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/..."
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.linkedinUrl)}
              aria-label="رابط LinkedIn"
              {...register("linkedinUrl")}
            />
            <FieldError message={errors.linkedinUrl?.message} />
          </div>

          {/* مصدر الطلب */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="source" style={{ color: "var(--text-primary)" }}>
              مصدر الطلب *
            </label>
            <select
              id="source"
              className="w-full px-4 py-2.5 text-sm outline-none"
              style={inputStyle(!!errors.source)}
              aria-label="مصدر الطلب"
              {...register("source")}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ===== القسم 5: ملاحظات ===== */}
      <div className="system-card p-6 space-y-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          ملاحظات
        </h2>
        <textarea
          rows={4}
          placeholder="أي ملاحظات إضافية عن المتقدم..."
          className="w-full px-4 py-2.5 text-sm resize-none outline-none"
          style={inputStyle(false)}
          aria-label="ملاحظات"
          {...register("notes")}
        />
      </div>

      {/* ===== أزرار الإرسال ===== */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-70"
          style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
          aria-label={mode === "create" ? "إضافة المتقدم" : "حفظ التعديلات"}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "create" ? "إضافة المتقدم" : "حفظ التعديلات"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-medium transition-all"
          style={{ border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text-secondary)" }}
          aria-label="إلغاء"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
