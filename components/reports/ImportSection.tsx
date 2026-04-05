"use client";

// مكوّن عميل للاستيراد — يعرض زر الاستيراد ونتيجة العملية
import { useState } from "react";
import ImportButton from "./ImportButton";
import { CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function ImportSection() {
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleImportComplete = (result: ImportResult) => {
    setLastResult(result);
    setShowErrors(false);
  };

  return (
    <div className="space-y-3">
      <ImportButton onImportComplete={handleImportComplete} />

      {/* نتيجة الاستيراد الأخيرة */}
      {lastResult && (
        <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--bg-main)" }}>
          {/* ملخص النتيجة */}
          <div className="flex items-center gap-2">
            {lastResult.imported > 0 ? (
              <CheckCircle size={16} style={{ color: "#2D9B6F" }} />
            ) : (
              <AlertCircle size={16} style={{ color: "var(--warning)" }} />
            )}
            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              تم استيراد {lastResult.imported} طلب
              {lastResult.skipped > 0 && (
                <span style={{ color: "var(--text-secondary)" }}>
                  {" "}— تم تخطي {lastResult.skipped}
                </span>
              )}
            </span>
          </div>

          {/* قائمة الأخطاء القابلة للطي */}
          {lastResult.errors.length > 0 && (
            <div>
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--danger)" }}
              >
                {showErrors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {lastResult.errors.length} تنبيه
              </button>

              {showErrors && (
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {lastResult.errors.map((err, i) => (
                    <li
                      key={i}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: "rgba(192, 57, 43, 0.05)",
                        color: "var(--danger)",
                      }}
                    >
                      {err}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
