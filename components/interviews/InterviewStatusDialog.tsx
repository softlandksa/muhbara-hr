"use client";

// مكون تغيير حالة المقابلة
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { InterviewStatusBadge } from "./InterviewStatusBadge";

// الانتقالات المسموحة لكل حالة
const ALLOWED: Record<string, string[]> = {
  SCHEDULED:   ["COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"],
  RESCHEDULED: ["SCHEDULED", "CANCELLED"],
  COMPLETED:   [],
  CANCELLED:   [],
  NO_SHOW:     [],
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "مجدولة", COMPLETED: "مكتملة", CANCELLED: "ملغاة",
  NO_SHOW: "لم يحضر", RESCHEDULED: "أُعيد جدولتها",
};

interface Props {
  interviewId: string;
  currentStatus: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function InterviewStatusDialog({ interviewId, currentStatus, onSuccess, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const allowed = ALLOWED[currentStatus] ?? [];
  if (allowed.length === 0) return null;

  const handleClose = () => { setOpen(false); setSelected(""); setNote(""); };

  const handleSubmit = async () => {
    if (!selected) { toast.error("يرجى اختيار الحالة الجديدة"); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selected, note: note.trim() || null }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { toast.error(data.error ?? "حدث خطأ"); return; }
      toast.success("تم تغيير حالة المقابلة");
      handleClose();
      onSuccess();
      router.refresh();
    } catch {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>تغيير حالة المقابلة</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* الحالة الحالية */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>الحالة الحالية:</span>
            <InterviewStatusBadge status={currentStatus} />
          </div>

          {/* اختيار الحالة الجديدة */}
          <div>
            <p className="text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              الحالة الجديدة
            </p>
            <div className="grid gap-2">
              {allowed.map((s) => (
                <button
                  key={s} type="button" onClick={() => setSelected(s)}
                  className="flex items-center gap-3 px-4 py-3 rounded-[10px] text-right transition-all"
                  style={{
                    border: `2px solid ${selected === s ? "#4361EE" : "var(--border)"}`,
                    backgroundColor: selected === s ? "#EFF2FF" : "var(--bg-card)",
                  }}
                  aria-label={`اختيار حالة ${STATUS_LABELS[s]}`}
                >
                  <InterviewStatusBadge status={s} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* ملاحظة */}
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="int-note"
              style={{ color: "var(--text-primary)" }}>
              ملاحظة (اختياري)
            </label>
            <textarea
              id="int-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="أضف ملاحظة..."
              className="w-full px-3 py-2 text-sm resize-none outline-none"
              style={{ border: "1px solid var(--border)", borderRadius: "10px",
                backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
              aria-label="ملاحظة تغيير الحالة"
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-3">
            <button
              type="button" onClick={handleSubmit}
              disabled={isLoading || !selected}
              className="flex-1 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: "var(--accent-blue)", borderRadius: "10px" }}
              aria-label="تأكيد"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              تأكيد
            </button>
            <button
              type="button" onClick={handleClose}
              className="px-5 py-2.5 text-sm font-medium transition-all"
              style={{ border: "1px solid var(--border)", borderRadius: "10px",
                color: "var(--text-secondary)" }}
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
