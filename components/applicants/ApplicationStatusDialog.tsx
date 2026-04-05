"use client";

// مكون تغيير حالة الطلب — نافذة حوار مع الانتقالات المسموحة
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ArrowLeft } from "lucide-react";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";

// الانتقالات المسموحة لكل حالة
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  NEW: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  UNDER_REVIEW: ["QUALIFIED", "REJECTED", "WITHDRAWN"],
  QUALIFIED: ["INTERVIEW_SCHEDULED", "REJECTED", "WITHDRAWN"],
  INTERVIEW_SCHEDULED: ["OFFER_SENT", "REJECTED", "WITHDRAWN"],
  OFFER_SENT: ["ACCEPTED", "REJECTED", "WITHDRAWN"],
  ACCEPTED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

// تسميات الحالات بالعربية
const STATUS_LABELS: Record<string, string> = {
  NEW: "جديد",
  UNDER_REVIEW: "قيد المراجعة",
  QUALIFIED: "مؤهل",
  INTERVIEW_SCHEDULED: "مقابلة مجدولة",
  OFFER_SENT: "عرض مُرسل",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  WITHDRAWN: "انسحب",
};

interface ApplicationStatusDialogProps {
  applicationId: string;
  currentStatus: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function ApplicationStatusDialog({
  applicationId,
  currentStatus,
  onSuccess,
  trigger,
}: ApplicationStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const allowedTransitions = ALLOWED_TRANSITIONS[currentStatus] ?? [];

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("يرجى اختيار الحالة الجديدة");
      return;
    }
    if (selectedStatus === "REJECTED" && !note.trim()) {
      toast.error("سبب الرفض مطلوب");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, note: note.trim() || null }),
      });

      const result = await response.json() as { error?: string };
      if (!response.ok) {
        toast.error(result.error ?? "حدث خطأ");
        return;
      }

      toast.success("تم تغيير حالة الطلب بنجاح");
      setOpen(false);
      setSelectedStatus("");
      setNote("");
      onSuccess();
      router.refresh();
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  if (allowedTransitions.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedStatus(""); setNote(""); } }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            تغيير حالة الطلب
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* الحالة الحالية */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>الحالة الحالية:</span>
            <ApplicationStatusBadge status={currentStatus} />
          </div>

          {/* اختيار الحالة الجديدة */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              الحالة الجديدة
            </label>
            <div className="grid grid-cols-1 gap-2">
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className="flex items-center justify-between px-4 py-3 rounded-[10px] text-sm font-medium transition-all text-right"
                  style={{
                    border: `2px solid ${selectedStatus === status ? "#4361EE" : "var(--border)"}`,
                    backgroundColor: selectedStatus === status ? "#EFF2FF" : "var(--bg-card)",
                  }}
                  aria-label={`اختيار حالة ${STATUS_LABELS[status]}`}
                >
                  <div className="flex items-center gap-3">
                    {selectedStatus === status && (
                      <ArrowLeft className="w-4 h-4 flex-shrink-0" style={{ color: "#4361EE" }} />
                    )}
                    <ApplicationStatusBadge status={status} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظة — إلزامية عند الرفض */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--text-primary)" }}
              htmlFor="status-note"
            >
              {selectedStatus === "REJECTED" ? "سبب الرفض *" : "ملاحظة (اختياري)"}
            </label>
            <textarea
              id="status-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={selectedStatus === "REJECTED" ? "يرجى توضيح سبب رفض الطلب..." : "أضف ملاحظة..."}
              className="w-full px-3 py-2 text-sm resize-none outline-none transition-colors"
              style={{
                border: `1px solid var(--border)`,
                borderRadius: "10px",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
              aria-label="ملاحظة الحالة"
            />
          </div>

          {/* أزرار الإجراء */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !selectedStatus}
              className="flex-1 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
              aria-label="تأكيد تغيير الحالة"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              تأكيد
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 text-sm font-medium transition-all"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
              }}
              aria-label="إلغاء"
            >
              إلغاء
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
