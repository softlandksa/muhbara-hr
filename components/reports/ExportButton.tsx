"use client";

// زر تصدير البيانات إلى Excel مع حالة التحميل
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ExportButtonProps {
  type: "applications" | "report";
  label: string;
}

export default function ExportButton({ type, label }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);

    try {
      // تحديد المسار بناءً على نوع التصدير
      const url =
        type === "applications"
          ? "/api/excel/export/applications"
          : "/api/excel/export/report";

      const response = await fetch(url, { method: "GET" });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMsg = errorData?.error ?? "حدث خطأ أثناء التصدير";
        toast.error(errorMsg);
        return;
      }

      // استخراج اسم الملف من الـ header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = type === "applications" ? "applications.xlsx" : "hr-report.xlsx";

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="([^"]+)"/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // تحويل الاستجابة إلى Blob وتشغيل التنزيل
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success("تم تصدير الملف بنجاح");
    } catch (error) {
      console.error("خطأ في التصدير:", error);
      toast.error("تعذر تصدير الملف، يرجى المحاولة مجدداً");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      className="gap-2 text-sm font-medium"
      style={{
        borderColor: "var(--border)",
        borderRadius: "10px",
        color: isLoading ? "var(--text-secondary)" : "var(--accent-blue)",
      }}
    >
      {isLoading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Download size={15} />
      )}
      {isLoading ? "جاري التصدير..." : label}
    </Button>
  );
}
