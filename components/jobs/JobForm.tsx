"use client";

// نموذج إنشاء وتعديل الوظيفة
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, X, Loader2, FileText } from "lucide-react";
import { TemplateSelector, type JobTemplateData } from "./TemplateSelector";
import { CreateJobSchema } from "@/lib/validations/job";
import { translateJobType, translateEducation } from "@/lib/utils";

// أنواع البيانات
type JobFormValues = z.infer<typeof CreateJobSchema>;

export interface JobFormData extends JobFormValues {
  id?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface JobFormProps {
  mode: "create" | "edit";
  initialData?: JobFormData;
  departments: Department[];
  onSuccess: () => void;
}

// قيم التقييم الافتراضية
const DEFAULT_SCORING_WEIGHTS = {
  experience: 25,
  education: 20,
  requiredSkills: 30,
  preferredSkills: 10,
  completeness: 10,
  location: 5,
};

// خيارات نوع الوظيفة
const JOB_TYPES = ["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "TEMPORARY"] as const;

// خيارات المستوى التعليمي
const EDUCATION_LEVELS = ["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "PHD"] as const;

// أسماء أوزان التقييم بالعربية
const WEIGHT_LABELS: Record<string, string> = {
  experience: "الخبرة",
  education: "التعليم",
  requiredSkills: "المهارات الإلزامية",
  preferredSkills: "المهارات المفضلة",
  completeness: "اكتمال الطلب",
  location: "الموقع",
};

// مكون حقل النموذج
function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)" }}> *</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

// مكون قسم النموذج
function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="system-card p-6"
      style={{ border: "1px solid var(--border)" }}
    >
      <h3
        className="text-base font-semibold mb-5"
        style={{
          color: "var(--text-primary)",
          borderBottom: "2px solid var(--accent-blue)",
          paddingBottom: "8px",
        }}
      >
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );
}

// الأنماط المشتركة للحقول
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  backgroundColor: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
};

export function JobForm({ mode, initialData, departments, onSuccess }: JobFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightSum, setWeightSum] = useState(100);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(CreateJobSchema),
    defaultValues: initialData ?? {
      title: "",
      departmentId: "",
      location: "",
      isRemote: false,
      type: "FULL_TIME",
      description: "",
      requirements: "",
      experienceMin: 0,
      experienceMax: undefined,
      educationRequired: "BACHELOR",
      headcount: 1,
      currency: "SAR",
      showSalary: false,
      skills: [],
      scoringWeights: DEFAULT_SCORING_WEIGHTS,
    },
  });

  // مراقبة حقول الأوزان لحساب المجموع
  const watchedWeights = watch("scoringWeights");
  const isRemote = watch("isRemote");

  useEffect(() => {
    if (watchedWeights) {
      const sum = Object.values(watchedWeights).reduce((a, b) => a + (Number(b) || 0), 0);
      setWeightSum(sum);
    }
  }, [watchedWeights]);

  // إدارة مصفوفة المهارات
  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control,
    name: "skills",
  });

  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillRequired, setNewSkillRequired] = useState(true);

  const handleAddSkill = () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    appendSkill({ skillName: trimmed, isRequired: newSkillRequired });
    setNewSkillName("");
    setNewSkillRequired(true);
  };

  // تطبيق القالب المختار
  const handleTemplateSelect = (template: JobTemplateData) => {
    setValue("description", template.description);
    setValue("requirements", template.requirements);
    if (template.defaultScoringWeights) {
      const weights = template.defaultScoringWeights as {
        experience?: number;
        education?: number;
        requiredSkills?: number;
        preferredSkills?: number;
        completeness?: number;
        location?: number;
      };
      setValue("scoringWeights", {
        experience: weights.experience ?? 25,
        education: weights.education ?? 20,
        requiredSkills: weights.requiredSkills ?? 30,
        preferredSkills: weights.preferredSkills ?? 10,
        completeness: weights.completeness ?? 10,
        location: weights.location ?? 5,
      });
    }
    toast.success("تم تطبيق القالب بنجاح");
  };

  // إرسال النموذج
  const onSubmit = async (data: JobFormValues) => {
    setIsSubmitting(true);
    try {
      const url = mode === "create" ? "/api/jobs" : `/api/jobs/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "حدث خطأ غير متوقع");
      }

      toast.success(mode === "create" ? "تم إنشاء الوظيفة بنجاح" : "تم تعديل الوظيفة بنجاح");
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {/* زر اختيار القالب */}
      <div className="flex justify-end">
        <TemplateSelector
          onSelect={handleTemplateSelect}
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg"
              style={{
                border: "2px solid var(--accent-blue)",
                color: "var(--accent-blue)",
                backgroundColor: "transparent",
                borderRadius: "10px",
              }}
              aria-label="اختر قالباً جاهزاً لملء بيانات الوظيفة"
            >
              <FileText size={16} />
              اختر من القالب
            </button>
          }
        />
      </div>

      {/* القسم الأول: المعلومات الأساسية */}
      <FormSection title="المعلومات الأساسية">
        {/* عنوان الوظيفة */}
        <div className="md:col-span-2">
          <FormField label="عنوان الوظيفة" required error={errors.title?.message}>
            <input
              {...register("title")}
              type="text"
              placeholder="مثال: ممثل خدمة عملاء"
              style={inputStyle}
              aria-label="عنوان الوظيفة"
              aria-required="true"
            />
          </FormField>
        </div>

        {/* القسم */}
        <FormField label="القسم" required error={errors.departmentId?.message}>
          <select
            {...register("departmentId")}
            style={inputStyle}
            aria-label="اختر القسم"
            aria-required="true"
          >
            <option value="">اختر القسم</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </FormField>

        {/* نوع الوظيفة */}
        <FormField label="نوع الوظيفة" required error={errors.type?.message}>
          <select
            {...register("type")}
            style={inputStyle}
            aria-label="اختر نوع الوظيفة"
            aria-required="true"
          >
            {JOB_TYPES.map((type) => (
              <option key={type} value={type}>
                {translateJobType(type)}
              </option>
            ))}
          </select>
        </FormField>

        {/* العمل عن بُعد */}
        <div className="flex items-center gap-3 pt-5">
          <Controller
            name="isRemote"
            control={control}
            render={({ field }) => (
              <label
                className="flex items-center gap-2 cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-blue)" }}
                  aria-label="العمل عن بُعد"
                />
                <span className="text-sm font-medium">العمل عن بُعد</span>
              </label>
            )}
          />
        </div>

        {/* الموقع (يظهر فقط إذا لم يكن عن بُعد) */}
        {!isRemote && (
          <FormField label="الموقع" error={errors.location?.message}>
            <input
              {...register("location")}
              type="text"
              placeholder="مثال: الرياض، حي العليا"
              style={inputStyle}
              aria-label="موقع العمل"
            />
          </FormField>
        )}
      </FormSection>

      {/* القسم الثاني: الوصف والمتطلبات */}
      <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
        <h3
          className="text-base font-semibold mb-5"
          style={{
            color: "var(--text-primary)",
            borderBottom: "2px solid var(--accent-blue)",
            paddingBottom: "8px",
          }}
        >
          الوصف والمتطلبات
        </h3>
        <div className="flex flex-col gap-5">
          <FormField label="وصف الوظيفة" required error={errors.description?.message}>
            <textarea
              {...register("description")}
              placeholder="اكتب وصفاً تفصيلياً للوظيفة والمهام والمسؤوليات..."
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              aria-label="وصف الوظيفة"
              aria-required="true"
            />
          </FormField>

          <FormField label="متطلبات الوظيفة" required error={errors.requirements?.message}>
            <textarea
              {...register("requirements")}
              placeholder="اذكر المتطلبات والشروط اللازمة للتقديم..."
              rows={6}
              style={{ ...inputStyle, resize: "vertical" }}
              aria-label="متطلبات الوظيفة"
              aria-required="true"
            />
          </FormField>
        </div>
      </div>

      {/* القسم الثالث: المؤهلات والمهارات */}
      <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
        <h3
          className="text-base font-semibold mb-5"
          style={{
            color: "var(--text-primary)",
            borderBottom: "2px solid var(--accent-blue)",
            paddingBottom: "8px",
          }}
        >
          المؤهلات والمهارات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* الحد الأدنى للخبرة */}
          <FormField label="الحد الأدنى للخبرة (سنوات)" required error={errors.experienceMin?.message}>
            <input
              {...register("experienceMin", { valueAsNumber: true })}
              type="number"
              min={0}
              placeholder="0"
              style={inputStyle}
              aria-label="الحد الأدنى للخبرة بالسنوات"
              aria-required="true"
            />
          </FormField>

          {/* الحد الأقصى للخبرة */}
          <FormField label="الحد الأقصى للخبرة (سنوات)" error={errors.experienceMax?.message}>
            <input
              {...register("experienceMax", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
              type="number"
              min={0}
              placeholder="اختياري"
              style={inputStyle}
              aria-label="الحد الأقصى للخبرة بالسنوات (اختياري)"
            />
          </FormField>

          {/* المستوى التعليمي */}
          <FormField label="المستوى التعليمي المطلوب" required error={errors.educationRequired?.message}>
            <select
              {...register("educationRequired")}
              style={inputStyle}
              aria-label="اختر المستوى التعليمي المطلوب"
              aria-required="true"
            >
              {EDUCATION_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {translateEducation(level)}
                </option>
              ))}
            </select>
          </FormField>

          {/* إضافة المهارات */}
          <div className="md:col-span-2">
            <FormField label="المهارات المطلوبة">
              {/* حقل إضافة مهارة جديدة */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="اسم المهارة (مثال: التواصل الفعّال)"
                  style={{ ...inputStyle, flex: 1 }}
                  aria-label="اسم المهارة الجديدة"
                />
                <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                  <input
                    type="checkbox"
                    checked={newSkillRequired}
                    onChange={(e) => setNewSkillRequired(e.target.checked)}
                    style={{ accentColor: "var(--accent-blue)" }}
                    aria-label="مهارة إلزامية"
                  />
                  إلزامية
                </label>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={!newSkillName.trim()}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium"
                  style={{
                    backgroundColor: newSkillName.trim() ? "var(--accent-blue)" : "var(--border)",
                    color: newSkillName.trim() ? "#fff" : "var(--text-secondary)",
                    borderRadius: "10px",
                    whiteSpace: "nowrap",
                  }}
                  aria-label="إضافة المهارة"
                >
                  <Plus size={16} />
                  إضافة
                </button>
              </div>

              {/* قائمة المهارات المضافة */}
              {skillFields.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                      style={{
                        backgroundColor: watch(`skills.${index}.isRequired`) ? "#EEF2FF" : "#F3F4F6",
                        border: `1px solid ${watch(`skills.${index}.isRequired`) ? "var(--accent-blue)" : "var(--border)"}`,
                        color: watch(`skills.${index}.isRequired`) ? "var(--accent-blue)" : "var(--text-secondary)",
                      }}
                    >
                      <span>{field.skillName}</span>
                      {watch(`skills.${index}.isRequired`) && (
                        <span className="text-xs opacity-70">*</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="mr-1 hover:opacity-70"
                        aria-label={`حذف مهارة ${field.skillName}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {skillFields.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  لم تتم إضافة أي مهارات بعد
                </p>
              )}
            </FormField>
          </div>
        </div>
      </div>

      {/* القسم الرابع: الراتب والتوظيف */}
      <FormSection title="الراتب والتوظيف">
        {/* الحد الأدنى للراتب */}
        <FormField label="الحد الأدنى للراتب" error={errors.salaryMin?.message}>
          <input
            {...register("salaryMin", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
            type="number"
            min={0}
            placeholder="اختياري"
            style={inputStyle}
            aria-label="الحد الأدنى للراتب الشهري"
          />
        </FormField>

        {/* الحد الأقصى للراتب */}
        <FormField label="الحد الأقصى للراتب" error={errors.salaryMax?.message}>
          <input
            {...register("salaryMax", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
            type="number"
            min={0}
            placeholder="اختياري"
            style={inputStyle}
            aria-label="الحد الأقصى للراتب الشهري"
          />
        </FormField>

        {/* العملة */}
        <FormField label="العملة" required error={errors.currency?.message}>
          <select
            {...register("currency")}
            style={inputStyle}
            aria-label="اختر العملة"
            aria-required="true"
          >
            <option value="SAR">ريال سعودي (SAR)</option>
            <option value="USD">دولار أمريكي (USD)</option>
            <option value="AED">درهم إماراتي (AED)</option>
          </select>
        </FormField>

        {/* عدد الشواغر */}
        <FormField label="عدد الشواغر" required error={errors.headcount?.message}>
          <input
            {...register("headcount", { valueAsNumber: true })}
            type="number"
            min={1}
            placeholder="1"
            style={inputStyle}
            aria-label="عدد الشواغر المتاحة"
            aria-required="true"
          />
        </FormField>

        {/* الموعد النهائي */}
        <FormField label="الموعد النهائي للتقديم" error={errors.deadline?.message}>
          <input
            {...register("deadline")}
            type="date"
            style={inputStyle}
            aria-label="الموعد النهائي للتقديم"
          />
        </FormField>

        {/* إظهار الراتب */}
        <div className="flex items-center gap-3 pt-5">
          <Controller
            name="showSalary"
            control={control}
            render={({ field }) => (
              <label
                className="flex items-center gap-2 cursor-pointer"
                style={{ color: "var(--text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent-blue)" }}
                  aria-label="إظهار الراتب للمتقدمين"
                />
                <span className="text-sm font-medium">إظهار الراتب للمتقدمين</span>
              </label>
            )}
          />
        </div>
      </FormSection>

      {/* القسم الخامس: أوزان التقييم */}
      <div className="system-card p-6" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <h3
            className="text-base font-semibold"
            style={{
              color: "var(--text-primary)",
              borderBottom: "2px solid var(--accent-blue)",
              paddingBottom: "8px",
            }}
          >
            أوزان التقييم
          </h3>
          {/* مؤشر المجموع */}
          <span
            className="text-sm font-bold px-3 py-1 rounded-full"
            style={{
              backgroundColor: weightSum === 100 ? "#D1FAE5" : "#FEE2E2",
              color: weightSum === 100 ? "#059669" : "var(--danger)",
            }}
          >
            المجموع: {weightSum}/100
          </span>
        </div>

        {weightSum !== 100 && (
          <p className="text-sm mb-4" style={{ color: "var(--danger)" }}>
            يجب أن يكون مجموع الأوزان 100 بالضبط
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(WEIGHT_LABELS).map(([key, label]) => (
            <FormField
              key={key}
              label={label}
              error={(errors.scoringWeights as Record<string, { message?: string }> | undefined)?.[key]?.message}
            >
              <input
                {...register(`scoringWeights.${key as keyof typeof DEFAULT_SCORING_WEIGHTS}`, { valueAsNumber: true })}
                type="number"
                min={0}
                max={100}
                style={inputStyle}
                aria-label={`وزن ${label} في التقييم`}
              />
            </FormField>
          ))}
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-sm font-medium"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            color: "var(--text-secondary)",
            backgroundColor: "transparent",
          }}
          aria-label="إلغاء وإغلاق النموذج"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting || weightSum !== 100}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium"
          style={{
            backgroundColor: (isSubmitting || weightSum !== 100) ? "var(--border)" : "var(--accent-blue)",
            color: (isSubmitting || weightSum !== 100) ? "var(--text-secondary)" : "#fff",
            borderRadius: "10px",
          }}
          aria-label={mode === "create" ? "حفظ الوظيفة الجديدة" : "حفظ التعديلات"}
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "إنشاء الوظيفة" : "حفظ التعديلات"}
        </button>
      </div>
    </form>
  );
}
