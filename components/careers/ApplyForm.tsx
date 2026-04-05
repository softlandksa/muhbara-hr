"use client";

// نموذج التقديم الديناميكي — يتولد من بيانات الوظيفة
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle, Upload, X, AlertCircle } from "lucide-react";
import { uploadFile } from "@/lib/supabase";

// بيانات الوظيفة اللازمة لبناء النموذج
export interface JobFormConfig {
  id: string;
  title: string;
  isRemote: boolean;
  experienceMin: number;
  educationRequired: string;
  skills: { skillName: string; isRequired: boolean }[];
}

// بناء مخطط Zod ديناميكياً بناءً على الوظيفة
function buildSchema(job: JobFormConfig) {
  return z.object({
    fullName:        z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
    email:           z.string().email("البريد الإلكتروني غير صحيح"),
    phone:           z.string().min(8, "رقم الهاتف يجب 8 أرقام على الأقل"),
    educationLevel:  z.enum(["HIGH_SCHOOL","DIPLOMA","BACHELOR","MASTER","PHD"]).optional(),
    experienceYears: z.number({ invalid_type_error: "أدخل رقماً صحيحاً" }).min(0).max(50).optional(),
    currentLocation: job.isRemote ? z.string().optional() : z.string().min(2, "الموقع مطلوب"),
    selectedSkills:  z.array(z.string()).default([]),
    notes:           z.string().max(1000).optional(),
  });
}

const EDUCATION_OPTIONS = [
  { value: "HIGH_SCHOOL", label: "الثانوية العامة" },
  { value: "DIPLOMA",     label: "دبلوم" },
  { value: "BACHELOR",    label: "بكالوريوس" },
  { value: "MASTER",      label: "ماجستير" },
  { value: "PHD",         label: "دكتوراه" },
];

interface ApplyFormProps {
  job: JobFormConfig;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; score: number }
  | { status: "duplicate" }
  | { status: "error"; message: string };

// مساعد عرض رسالة الخطأ
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>{message}</p>;
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    border: `1px solid ${hasError ? "var(--danger)" : "var(--border)"}`,
    borderRadius: "10px",
    backgroundColor: "#fff",
    color: "var(--text-primary)",
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    outline: "none",
  };
}

export function ApplyForm({ job }: ApplyFormProps) {
  const schema = buildSchema(job);
  type FormValues = z.infer<typeof schema>;

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { selectedSkills: [] },
  });

  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });
  const [cvFile, setCvFile]           = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl]             = useState<string | null>(null);

  const selectedSkills = watch("selectedSkills") ?? [];

  // توبُّل اختيار المهارة
  function toggleSkill(skillName: string) {
    const current = selectedSkills;
    const updated = current.includes(skillName)
      ? current.filter((s) => s !== skillName)
      : [...current, skillName];
    setValue("selectedSkills", updated);
  }

  // رفع السيرة الذاتية إلى Supabase Storage
  async function handleCvUpload(file: File) {
    setCvFile(file);
    setCvUploading(true);
    const path = `cvs/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const url = await uploadFile("cvs", path, file);
    setCvUrl(url);
    setCvUploading(false);
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitState({ status: "submitting" });
    try {
      const res = await fetch("/api/careers/apply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId:           job.id,
          fullName:        values.fullName,
          email:           values.email,
          phone:           values.phone,
          cvUrl:           cvUrl ?? null,
          educationLevel:  values.educationLevel,
          experienceYears: values.experienceYears,
          currentLocation: values.currentLocation,
          skills:          values.selectedSkills,
          notes:           values.notes,
        }),
      });

      const data = await res.json() as { error?: string; code?: string; score?: number };

      if (res.status === 409 && data.code === "DUPLICATE") {
        setSubmitState({ status: "duplicate" });
        return;
      }

      if (!res.ok) {
        setSubmitState({ status: "error", message: data.error ?? "حدث خطأ غير متوقع" });
        return;
      }

      setSubmitState({ status: "success", score: data.score ?? 0 });
    } catch {
      setSubmitState({ status: "error", message: "فشل الاتصال بالخادم، يرجى المحاولة مرة أخرى" });
    }
  };

  // ===== حالة النجاح =====
  if (submitState.status === "success") {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#D1FAE5" }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: "#2D9B6F" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          تم استلام طلبك بنجاح!
        </h2>
        <p className="text-base mb-6" style={{ color: "var(--text-secondary)" }}>
          شكراً لتقديمك على وظيفة <strong>{job.title}</strong>. سيقوم فريق الموارد البشرية بمراجعة طلبك والتواصل معك.
        </p>
        <div
          className="inline-block px-6 py-3 rounded-[12px] text-sm"
          style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", color: "#166534" }}
        >
          تم تقييم ملفك تلقائياً وسيؤخذ بعين الاعتبار عند المراجعة
        </div>
      </div>
    );
  }

  // ===== حالة التكرار =====
  if (submitState.status === "duplicate") {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <AlertCircle className="w-10 h-10" style={{ color: "#D97706" }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          لقد قدّمت على هذه الوظيفة مسبقاً
        </h2>
        <p className="text-base" style={{ color: "var(--text-secondary)" }}>
          سجّلنا طلبك سابقاً على وظيفة <strong>{job.title}</strong>، ولا يمكن التقديم مرتين على نفس الوظيفة.
          يمكنك التقديم على وظيفة مختلفة من قائمة الوظائف المتاحة.
        </p>
        <a
          href="/careers"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
        >
          عرض الوظائف الأخرى
        </a>
      </div>
    );
  }

  const isSubmitting = submitState.status === "submitting";
  const allSkills = job.skills;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate dir="rtl">

      {/* رسالة خطأ عامة */}
      {submitState.status === "error" && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-sm"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "var(--danger)" }}
          role="alert"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {submitState.message}
        </div>
      )}

      {/* ===== البيانات الشخصية ===== */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          البيانات الشخصية
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* الاسم الكامل */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5" htmlFor="fullName"
              style={{ color: "var(--text-primary)" }}>
              الاسم الكامل *
            </label>
            <input id="fullName" type="text" placeholder="أحمد محمد العلي"
              style={inputStyle(!!errors.fullName)} aria-label="الاسم الكامل"
              {...register("fullName")} />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* البريد الإلكتروني */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="email"
              style={{ color: "var(--text-primary)" }}>
              البريد الإلكتروني *
            </label>
            <input id="email" type="email" placeholder="example@email.com" dir="ltr"
              style={inputStyle(!!errors.email)} aria-label="البريد الإلكتروني"
              {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>

          {/* رقم الهاتف */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="phone"
              style={{ color: "var(--text-primary)" }}>
              رقم الهاتف *
            </label>
            <input id="phone" type="tel" placeholder="+966 5X XXX XXXX" dir="ltr"
              style={inputStyle(!!errors.phone)} aria-label="رقم الهاتف"
              {...register("phone")} />
            <FieldError message={errors.phone?.message} />
          </div>
        </div>
      </div>

      {/* ===== السيرة الذاتية ===== */}
      <div className="system-card p-6 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          السيرة الذاتية
        </h3>

        {!cvFile ? (
          <label
            className="flex flex-col items-center justify-center gap-3 py-8 cursor-pointer rounded-[12px] transition-colors"
            style={{ border: "2px dashed var(--border)", backgroundColor: "#FAFAFA" }}
            aria-label="رفع السيرة الذاتية"
          >
            <Upload className="w-8 h-8" style={{ color: "var(--text-secondary)" }} />
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                اضغط لرفع السيرة الذاتية
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                PDF أو Word — حجم أقصى 5MB (اختياري)
              </p>
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCvUpload(f); }}
              aria-label="اختر ملف السيرة الذاتية"
            />
          </label>
        ) : (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-[10px]"
            style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}
          >
            <div className="flex items-center gap-3">
              {cvUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#2D9B6F" }} />
              ) : (
                <CheckCircle className="w-4 h-4" style={{ color: "#2D9B6F" }} />
              )}
              <span className="text-sm font-medium" style={{ color: "#166534" }}>
                {cvUploading ? "جارٍ الرفع..." : cvFile.name}
              </span>
            </div>
            {!cvUploading && (
              <button
                type="button"
                onClick={() => { setCvFile(null); setCvUrl(null); }}
                aria-label="إزالة الملف"
                style={{ color: "#6B7280" }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== الحقول الديناميكية ===== */}
      {(job.educationRequired || job.experienceMin > 0 || !job.isRemote) && (
        <div className="system-card p-6 space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            المؤهلات
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* المستوى التعليمي — يظهر دائماً إذا كان educationRequired موجود */}
            {job.educationRequired && (
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="educationLevel"
                  style={{ color: "var(--text-primary)" }}>
                  المستوى التعليمي
                </label>
                <select id="educationLevel" style={inputStyle(!!errors.educationLevel)}
                  aria-label="المستوى التعليمي" {...register("educationLevel")}>
                  <option value="">— اختر —</option>
                  {EDUCATION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <FieldError message={errors.educationLevel?.message} />
              </div>
            )}

            {/* سنوات الخبرة — يظهر إذا كان experienceMin > 0 */}
            {job.experienceMin > 0 && (
              <div>
                <label className="block text-sm font-medium mb-1.5" htmlFor="experienceYears"
                  style={{ color: "var(--text-primary)" }}>
                  سنوات الخبرة
                  <span className="text-xs font-normal mr-1" style={{ color: "var(--text-secondary)" }}>
                    (الحد الأدنى {job.experienceMin} سنة)
                  </span>
                </label>
                <input id="experienceYears" type="number" min={0} max={50} placeholder="0"
                  style={inputStyle(!!errors.experienceYears)} aria-label="سنوات الخبرة"
                  {...register("experienceYears", { valueAsNumber: true })} />
                <FieldError message={errors.experienceYears?.message} />
              </div>
            )}

            {/* الموقع الحالي — يظهر إذا لم تكن الوظيفة عن بُعد */}
            {!job.isRemote && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5" htmlFor="currentLocation"
                  style={{ color: "var(--text-primary)" }}>
                  الموقع الحالي *
                </label>
                <input id="currentLocation" type="text" placeholder="مثال: الرياض، المملكة العربية السعودية"
                  style={inputStyle(!!errors.currentLocation)} aria-label="الموقع الحالي"
                  {...register("currentLocation")} />
                <FieldError message={errors.currentLocation?.message} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== المهارات الديناميكية ===== */}
      {allSkills.length > 0 && (
        <div className="system-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              المهارات المطلوبة
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
              اختر المهارات التي تمتلكها
            </p>
          </div>

          {/* المهارات الإلزامية */}
          {allSkills.filter((s) => s.isRequired).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--danger)" }}>
                إلزامية
              </p>
              <div className="flex flex-wrap gap-2">
                {allSkills.filter((s) => s.isRequired).map((skill) => {
                  const checked = selectedSkills.includes(skill.skillName);
                  return (
                    <button
                      key={skill.skillName}
                      type="button"
                      onClick={() => toggleSkill(skill.skillName)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        border: `2px solid ${checked ? "#4361EE" : "var(--border)"}`,
                        backgroundColor: checked ? "#EFF2FF" : "#fff",
                        color: checked ? "#4361EE" : "var(--text-primary)",
                      }}
                      aria-pressed={checked}
                      aria-label={`مهارة ${skill.skillName}`}
                    >
                      {checked && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                      {skill.skillName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* المهارات المفضلة */}
          {allSkills.filter((s) => !s.isRequired).length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-secondary)" }}>
                مفضّلة (تزيد فرصك)
              </p>
              <div className="flex flex-wrap gap-2">
                {allSkills.filter((s) => !s.isRequired).map((skill) => {
                  const checked = selectedSkills.includes(skill.skillName);
                  return (
                    <button
                      key={skill.skillName}
                      type="button"
                      onClick={() => toggleSkill(skill.skillName)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
                      style={{
                        border: `2px solid ${checked ? "#7B61FF" : "var(--border)"}`,
                        backgroundColor: checked ? "#F3F0FF" : "#fff",
                        color: checked ? "#7B61FF" : "var(--text-primary)",
                      }}
                      aria-pressed={checked}
                      aria-label={`مهارة ${skill.skillName}`}
                    >
                      {checked && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                      {skill.skillName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ملاحظات إضافية ===== */}
      <div className="system-card p-6 space-y-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          ملاحظات إضافية
          <span className="text-xs font-normal mr-1" style={{ color: "var(--text-secondary)" }}>
            (اختياري)
          </span>
        </h3>
        <textarea
          rows={4}
          placeholder="أي معلومات إضافية تريد مشاركتها مع فريق التوظيف..."
          className="w-full resize-none outline-none text-sm"
          style={inputStyle(false)}
          aria-label="ملاحظات إضافية"
          {...register("notes")}
        />
      </div>

      {/* ===== زر الإرسال ===== */}
      <button
        type="submit"
        disabled={isSubmitting || cvUploading}
        className="w-full py-3 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-70"
        style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
        aria-label="تقديم الطلب"
      >
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ تقديم الطلب...</>
        ) : (
          "تقديم الطلب"
        )}
      </button>

      <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
        بتقديم طلبك فأنت توافق على استخدام بياناتك لأغراض التوظيف فقط
      </p>
    </form>
  );
}
