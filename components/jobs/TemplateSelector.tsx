"use client";

// مكون اختيار قالب الوظيفة
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, FileText } from "lucide-react";

// نوع بيانات قالب الوظيفة
export interface JobTemplateData {
  id: string;
  name: string;
  departmentCode: string;
  description: string;
  requirements: string;
  defaultScoringWeights: Record<string, number> | null;
}

interface TemplateSelectorProps {
  onSelect: (template: JobTemplateData) => void;
  trigger: React.ReactNode;
}

export function TemplateSelector({ onSelect, trigger }: TemplateSelectorProps) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<JobTemplateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب القوالب عند فتح النافذة
  useEffect(() => {
    if (open && templates.length === 0) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/job-templates");
      if (!response.ok) throw new Error("فشل في جلب القوالب");
      const data = await response.json() as { templates: JobTemplateData[] };
      setTemplates(data.templates);
    } catch {
      setError("حدث خطأ أثناء جلب قوالب الوظائف");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (template: JobTemplateData) => {
    onSelect(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-3xl max-h-[80vh] overflow-y-auto"
        style={{ direction: "rtl" }}
        aria-label="نافذة اختيار قالب الوظيفة"
      >
        <DialogHeader>
          <DialogTitle style={{ textAlign: "right", color: "var(--text-primary)" }}>
            اختر قالب الوظيفة
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* حالة التحميل */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin ml-2" size={20} />
              <span style={{ color: "var(--text-secondary)" }}>جاري تحميل القوالب...</span>
            </div>
          )}

          {/* حالة الخطأ */}
          {error && (
            <div
              className="text-center py-8"
              style={{ color: "var(--danger)" }}
            >
              <p>{error}</p>
              <button
                onClick={fetchTemplates}
                className="mt-3 px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--accent-blue)",
                  color: "#fff",
                  borderRadius: "10px",
                }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}

          {/* حالة فارغة */}
          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-12">
              <FileText size={40} className="mx-auto mb-3" style={{ color: "var(--text-secondary)" }} />
              <p style={{ color: "var(--text-secondary)" }}>لا توجد قوالب متاحة</p>
            </div>
          )}

          {/* شبكة القوالب */}
          {!loading && !error && templates.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="system-card p-4 flex flex-col gap-3"
                  style={{
                    border: "1px solid var(--border)",
                    cursor: "default",
                  }}
                >
                  {/* رأس الكارد */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {template.name}
                      </h3>
                    </div>
                    {/* شارة القسم */}
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: "#EEF2FF",
                        color: "var(--accent-blue)",
                      }}
                    >
                      {template.departmentCode}
                    </span>
                  </div>

                  {/* وصف مختصر */}
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {template.description.substring(0, 120)}
                    {template.description.length > 120 ? "..." : ""}
                  </p>

                  {/* زر الاستخدام */}
                  <button
                    onClick={() => handleSelect(template)}
                    className="w-full py-2 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      backgroundColor: "var(--accent-blue)",
                      color: "#fff",
                      borderRadius: "10px",
                    }}
                    aria-label={`استخدام قالب ${template.name}`}
                  >
                    استخدام القالب
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
