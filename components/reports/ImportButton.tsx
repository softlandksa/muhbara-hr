"use client";

// زر استيراد المتقدمين من ملف Excel
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

interface ImportButtonProps {
  onImportComplete: (result: ImportResult) => void;
}

export default function ImportButton({ onImportComplete }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // فتح نافذة اختيار الملف
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // معالجة الملف المختار
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      toast.error("يجب أن يكون الملف بصيغة Excel (.xlsx أو .xls)");
      return;
    }

    // التحقق من حجم الملف (الحد الأقصى 10 ميجابايت)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("حجم الملف يتجاوز الحد المسموح به (10 ميجابايت)");
      return;
    }

    setIsLoading(true);

    // إظهار toast تقدم العملية
    const loadingToast = toast.loading("جاري معالجة الملف...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/excel/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      toast.dismiss(loadingToast);

      if (!response.ok) {
        toast.error(result.error ?? "حدث خطأ أثناء الاستيراد");
        return;
      }

      // إظهار رسالة النجاح
      if (result.imported > 0) {
        toast.success(`تم استيراد ${result.imported} طلب بنجاح`);
      } else {
        toast.error("لم يتم استيراد أي طلب — تحقق من صحة البيانات");
      }

      // إظهار تحذيرات عن الصفوف المتخطاة
      if (result.skipped > 0) {
        toast(`تم تخطي ${result.skipped} صف`, {
          icon: "⚠️",
          style: {
            backgroundColor: "#FEF3C7",
            color: "#92400E",
          },
        });
      }

      // إخطار المكوّن الأب بالنتيجة
      onImportComplete({
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors ?? [],
      });
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("خطأ في الاستيراد:", error);
      toast.error("تعذر معالجة الملف، يرجى المحاولة مجدداً");
    } finally {
      setIsLoading(false);
      // إعادة تعيين الـ input لإتاحة رفع نفس الملف مجدداً
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <>
      {/* input مخفي لاختيار الملف */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
        aria-label="استيراد ملف Excel للمتقدمين"
      />

      <Button
        onClick={handleButtonClick}
        disabled={isLoading}
        className="gap-2 text-sm font-medium text-white"
        style={{
          backgroundColor: isLoading ? "var(--text-secondary)" : "#2D9B6F",
          borderRadius: "10px",
        }}
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Upload size={15} />
        )}
        {isLoading ? "جاري الاستيراد..." : "استيراد من Excel"}
      </Button>
    </>
  );
}
