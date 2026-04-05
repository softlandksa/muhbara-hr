"use client";

// نافذة تغيير حالة الوظيفة
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { translateJobStatus } from "@/lib/utils";
import { JobStatusBadge } from "./JobStatusBadge";

type JobStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED";

interface StatusChangeDialogProps {
  jobId: string;
  currentStatus: JobStatus;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

// التحولات المسموح بها لكل حالة (عرض فقط، التحقق الفعلي يتم في الـ API)
const NEXT_STATUSES: Record<JobStatus, JobStatus[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["PUBLISHED", "REJECTED"],
  PUBLISHED: ["CLOSED"],
  CLOSED: ["ARCHIVED"],
  ARCHIVED: [],
  REJECTED: ["DRAFT"],
};

// تسميات أزرار الإجراء
const ACTION_LABELS: Record<JobStatus, string> = {
  PENDING_APPROVAL: "إرسال للاعتماد",
  PUBLISHED: "نشر الوظيفة",
  REJECTED: "رفض الوظيفة",
  CLOSED: "إغلاق الوظيفة",
  ARCHIVED: "أرشفة الوظيفة",
  DRAFT: "إعادة للمسودة",
};

// ألوان أزرار الإجراءات
const ACTION_BUTTON_STYLES: Record<JobStatus, { bg: string; color: string }> = {
  PENDING_APPROVAL: { bg: "#4361EE", color: "#fff" },
  PUBLISHED: { bg: "#2D9B6F", color: "#fff" },
  REJECTED: { bg: "#C0392B", color: "#fff" },
  CLOSED: { bg: "#2563EB", color: "#fff" },
  ARCHIVED: { bg: "#6B7280", color: "#fff" },
  DRAFT: { bg: "#6B7280", color: "#fff" },
};

export function StatusChangeDialog({
  jobId,
  currentStatus,
  onSuccess,
  trigger,
}: StatusChangeDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextStatuses = NEXT_STATUSES[currentStatus] ?? [];

  // إعادة تعيين الحالة عند فتح/إغلاق النافذة
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedStatus(null);
      setNote("");
    } else if (nextStatuses.length === 1) {
      // اختيار تلقائي إذا كان هناك خيار واحد فقط
      setSelectedStatus(nextStatuses[0]);
    }
  };

  const isNoteRequired = selectedStatus === "REJECTED";
  const canSubmit = selectedStatus !== null && (!isNoteRequired || note.trim().length > 0);

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus: selectedStatus,
          note: note.trim() || null,
        }),
      });

      const result = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "حدث خطأ غير متوقع");
      }

      toast.success("تم تغيير حالة الوظيفة بنجاح");
      setOpen(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-md"
        style={{ direction: "rtl" }}
        aria-label="نافذة تغيير حالة الوظيفة"
      >
        <DialogHeader>
          <DialogTitle style={{ textAlign: "right", color: "var(--text-primary)" }}>
            تغيير حالة الوظيفة
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          {/* عرض لا توجد تحولات */}
          {nextStatuses.length === 0 && (
            <div className="text-center py-6" style={{ color: "var(--text-secondary)" }}>
              <p>لا توجد تحولات متاحة لهذه الحالة</p>
            </div>
          )}

          {nextStatuses.length > 0 && (
            <>
              {/* عرض التحول الحالي */}
              <div
                className="flex items-center justify-center gap-3 p-4 rounded-xl"
                style={{ backgroundColor: "#F7F6F3" }}
              >
                <JobStatusBadge status={currentStatus} />
                <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
                {selectedStatus ? (
                  <JobStatusBadge status={selectedStatus} />
                ) : (
                  <span
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ backgroundColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    اختر الحالة
                  </span>
                )}
              </div>

              {/* اختيار الحالة الجديدة (إذا كان هناك أكثر من خيار) */}
              {nextStatuses.length > 1 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    اختر الحالة الجديدة:
                  </p>
                  <div className="flex gap-2">
                    {nextStatuses.map((status) => {
                      const btnStyle = ACTION_BUTTON_STYLES[status];
                      const isSelected = selectedStatus === status;
                      return (
                        <button
                          key={status}
                          onClick={() => setSelectedStatus(status)}
                          className="flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-opacity"
                          style={{
                            backgroundColor: isSelected ? btnStyle.bg : "transparent",
                            color: isSelected ? btnStyle.color : "var(--text-secondary)",
                            border: `2px solid ${btnStyle.bg}`,
                            borderRadius: "10px",
                          }}
                          aria-label={`تحويل الوظيفة إلى حالة ${translateJobStatus(status)}`}
                          aria-pressed={isSelected}
                        >
                          {ACTION_LABELS[status]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* حقل الملاحظة */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                  htmlFor="status-note"
                >
                  الملاحظة
                  {isNoteRequired && (
                    <span style={{ color: "var(--danger)" }}> * (مطلوبة عند الرفض)</span>
                  )}
                </label>
                <textarea
                  id="status-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isNoteRequired ? "اكتب سبب الرفض..." : "ملاحظة اختيارية..."}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${isNoteRequired && !note.trim() ? "var(--danger)" : "var(--border)"}`,
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    resize: "vertical",
                    outline: "none",
                  }}
                  aria-label={isNoteRequired ? "سبب الرفض (مطلوب)" : "ملاحظة اختيارية"}
                  aria-required={isNoteRequired}
                />
                {isNoteRequired && !note.trim() && (
                  <p className="text-xs" style={{ color: "var(--danger)" }}>
                    سبب الرفض مطلوب
                  </p>
                )}
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-secondary)",
                    backgroundColor: "transparent",
                  }}
                  aria-label="إلغاء تغيير الحالة"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !canSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
                  style={{
                    backgroundColor: (!canSubmit || isSubmitting)
                      ? "var(--border)"
                      : (selectedStatus ? ACTION_BUTTON_STYLES[selectedStatus].bg : "var(--accent-blue)"),
                    color: (!canSubmit || isSubmitting) ? "var(--text-secondary)" : "#fff",
                    borderRadius: "10px",
                  }}
                  aria-label="تأكيد تغيير حالة الوظيفة"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {selectedStatus ? ACTION_LABELS[selectedStatus] : "تغيير الحالة"}
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
