"use client";

// نافذة تأكيد حذف الوظيفة
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface DeleteJobDialogProps {
  jobId: string;
  jobTitle: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function DeleteJobDialog({
  jobId,
  jobTitle,
  onSuccess,
  trigger,
}: DeleteJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      const result = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "حدث خطأ غير متوقع");
      }

      toast.success("تم حذف الوظيفة بنجاح");
      setOpen(false);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-sm"
        style={{ direction: "rtl" }}
        aria-label="نافذة تأكيد حذف الوظيفة"
      >
        <DialogHeader>
          <DialogTitle style={{ textAlign: "right", color: "var(--text-primary)" }}>
            حذف الوظيفة
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-5">
          {/* أيقونة التحذير */}
          <div className="flex flex-col items-center gap-3 py-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <AlertTriangle size={28} style={{ color: "var(--danger)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                هل أنت متأكد من حذف هذه الوظيفة؟
              </p>
              <p
                className="text-sm font-semibold px-3 py-1 rounded-lg"
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "var(--text-primary)",
                  display: "inline-block",
                }}
              >
                {jobTitle}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                لا يمكن التراجع عن هذا الإجراء. سيتم حذف الوظيفة وجميع بياناتها نهائياً.
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
              className="flex-1 py-2.5 text-sm font-medium"
              style={{
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
              }}
              aria-label="إلغاء الحذف"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium"
              style={{
                backgroundColor: isDeleting ? "var(--border)" : "var(--danger)",
                color: isDeleting ? "var(--text-secondary)" : "#fff",
                borderRadius: "10px",
              }}
              aria-label="تأكيد حذف الوظيفة نهائياً"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              {isDeleting ? "جاري الحذف..." : "حذف نهائياً"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
