"use client";

// نموذج جدولة/تعديل المقابلة
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// مخطط النموذج (نسخة مبسطة للواجهة)
const formSchema = z.object({
  applicationId: z.string().min(1),
  jobId: z.string().min(1),
  type: z.enum(["PHONE", "VIDEO", "IN_PERSON", "TECHNICAL", "HR"]),
  scheduledAt: z.string().min(1, "تاريخ ووقت المقابلة مطلوب"),
  duration: z.coerce.number().min(15).max(240),
  location: z.string().max(500).optional().or(z.literal("")),
  interviewerId: z.string().min(1, "يجب اختيار محاور"),
  preparationNote: z.string().max(2000).optional().or(z.literal("")),
});

type InterviewFormData = z.infer<typeof formSchema>;

// أنواع المقابلة مع تسمياتها
const INTERVIEW_TYPES = [
  { value: "PHONE",     label: "هاتفية" },
  { value: "VIDEO",     label: "مرئية (فيديو)" },
  { value: "IN_PERSON", label: "حضورية" },
  { value: "TECHNICAL", label: "تقنية" },
  { value: "HR",        label: "HR" },
];

// خيارات المدة (بالدقائق)
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240];

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface InterviewFormProps {
  applicationId?: string;
  jobId?: string;
  mode: "create" | "edit";
  interviewId?: string;
  initialData?: Partial<InterviewFormData>;
  onSuccess: () => void;
}

export function InterviewForm({
  applicationId,
  jobId,
  mode,
  interviewId,
  initialData,
  onSuccess,
}: InterviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewers, setInterviewers] = useState<User[]>([]);
  const [loadingInterviewers, setLoadingInterviewers] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InterviewFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicationId: applicationId ?? initialData?.applicationId ?? "",
      jobId: jobId ?? initialData?.jobId ?? "",
      type: initialData?.type ?? "VIDEO",
      scheduledAt: initialData?.scheduledAt ?? "",
      duration: initialData?.duration ?? 60,
      location: initialData?.location ?? "",
      interviewerId: initialData?.interviewerId ?? "",
      preparationNote: initialData?.preparationNote ?? "",
    },
  });

  const watchedType = watch("type");

  // جلب قائمة المحاورين عند تحميل المكون
  useEffect(() => {
    async function fetchInterviewers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json() as { users: User[] };
          setInterviewers(data.users);
        }
      } catch (err) {
        console.error("خطأ في جلب المحاورين:", err);
      } finally {
        setLoadingInterviewers(false);
      }
    }
    void fetchInterviewers();
  }, []);

  // معالجة تقديم النموذج
  async function onSubmit(formData: InterviewFormData) {
    setIsSubmitting(true);
    try {
      const url =
        mode === "create"
          ? "/api/interviews"
          : `/api/interviews/${interviewId!}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const payload = {
        ...formData,
        location: formData.location || null,
        preparationNote: formData.preparationNote || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(responseData.error ?? "حدث خطأ غير متوقع");
      }

      toast.success(
        mode === "create" ? "تمت جدولة المقابلة بنجاح" : "تم تحديث المقابلة بنجاح"
      );
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" dir="rtl">
      {/* حقول مخفية */}
      <input type="hidden" {...register("applicationId")} />
      <input type="hidden" {...register("jobId")} />

      {/* نوع المقابلة */}
      <div className="space-y-1.5">
        <Label htmlFor="type" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          نوع المقابلة <span style={{ color: "var(--danger)" }}>*</span>
        </Label>
        <Select
          defaultValue={initialData?.type ?? "VIDEO"}
          onValueChange={(val) => setValue("type", val as InterviewFormData["type"])}
        >
          <SelectTrigger
            id="type"
            aria-label="نوع المقابلة"
            style={{ borderRadius: "10px", border: "1px solid var(--border)" }}
          >
            <SelectValue placeholder="اختر نوع المقابلة" />
          </SelectTrigger>
          <SelectContent>
            {INTERVIEW_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.type.message}
          </p>
        )}
      </div>

      {/* تاريخ ووقت المقابلة */}
      <div className="space-y-1.5">
        <Label htmlFor="scheduledAt" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          تاريخ ووقت المقابلة <span style={{ color: "var(--danger)" }}>*</span>
        </Label>
        <Input
          id="scheduledAt"
          type="datetime-local"
          {...register("scheduledAt")}
          aria-label="تاريخ ووقت المقابلة"
          style={{ borderRadius: "10px", border: "1px solid var(--border)" }}
        />
        {errors.scheduledAt && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.scheduledAt.message}
          </p>
        )}
      </div>

      {/* مدة المقابلة */}
      <div className="space-y-1.5">
        <Label htmlFor="duration" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          المدة (دقيقة) <span style={{ color: "var(--danger)" }}>*</span>
        </Label>
        <Select
          defaultValue={String(initialData?.duration ?? 60)}
          onValueChange={(val) => setValue("duration", parseInt(val, 10))}
        >
          <SelectTrigger
            id="duration"
            aria-label="مدة المقابلة"
            style={{ borderRadius: "10px", border: "1px solid var(--border)" }}
          >
            <SelectValue placeholder="اختر المدة" />
          </SelectTrigger>
          <SelectContent>
            {DURATION_OPTIONS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} دقيقة
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.duration && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.duration.message}
          </p>
        )}
      </div>

      {/* الموقع — يظهر فقط عند اختيار حضورية */}
      {watchedType === "IN_PERSON" && (
        <div className="space-y-1.5">
          <Label htmlFor="location" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            موقع المقابلة
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="مثال: المقر الرئيسي، الرياض"
            {...register("location")}
            aria-label="موقع المقابلة"
            style={{ borderRadius: "10px", border: "1px solid var(--border)" }}
          />
          {errors.location && (
            <p className="text-xs" style={{ color: "var(--danger)" }}>
              {errors.location.message}
            </p>
          )}
        </div>
      )}

      {/* المحاور */}
      <div className="space-y-1.5">
        <Label htmlFor="interviewerId" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          المحاور <span style={{ color: "var(--danger)" }}>*</span>
        </Label>
        {loadingInterviewers ? (
          <div
            className="h-10 flex items-center px-3 text-sm rounded-[10px]"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            جارٍ تحميل المحاورين...
          </div>
        ) : (
          <Select
            defaultValue={initialData?.interviewerId ?? ""}
            onValueChange={(val) => setValue("interviewerId", val)}
          >
            <SelectTrigger
              id="interviewerId"
              aria-label="المحاور"
              style={{ borderRadius: "10px", border: "1px solid var(--border)" }}
            >
              <SelectValue placeholder="اختر المحاور" />
            </SelectTrigger>
            <SelectContent>
              {interviewers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.interviewerId && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.interviewerId.message}
          </p>
        )}
      </div>

      {/* ملاحظات التحضير */}
      <div className="space-y-1.5">
        <Label htmlFor="preparationNote" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          ملاحظات التحضير
        </Label>
        <textarea
          id="preparationNote"
          rows={4}
          placeholder="أسئلة مقترحة، نقاط للتقييم، ملاحظات خاصة..."
          {...register("preparationNote")}
          aria-label="ملاحظات التحضير للمقابلة"
          className="w-full p-3 text-sm resize-none outline-none transition-colors"
          style={{
            borderRadius: "10px",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-card)",
          }}
        />
        {errors.preparationNote && (
          <p className="text-xs" style={{ color: "var(--danger)" }}>
            {errors.preparationNote.message}
          </p>
        )}
      </div>

      {/* زر التقديم */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          aria-label={mode === "create" ? "جدولة المقابلة" : "حفظ التعديلات"}
          style={{
            backgroundColor: "var(--accent-blue)",
            borderRadius: "10px",
            color: "#fff",
          }}
          className="flex-1 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin ml-2" />
              جارٍ الحفظ...
            </>
          ) : mode === "create" ? (
            "جدولة المقابلة"
          ) : (
            "حفظ التعديلات"
          )}
        </Button>
      </div>
    </form>
  );
}
