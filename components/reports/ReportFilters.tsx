"use client";

// مكوّن فلترة التقارير بنطاق تاريخ
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, RotateCcw } from "lucide-react";

interface ReportFiltersProps {
  onFilter: (from: Date | null, to: Date | null) => void;
}

export default function ReportFilters({ onFilter }: ReportFiltersProps) {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [error, setError] = useState<string>("");

  // تطبيق الفلتر
  const handleApply = () => {
    setError("");

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    // التحقق من صحة النطاق
    if (from && to && from > to) {
      setError("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    onFilter(from, to);
  };

  // إعادة تعيين الفلتر
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setError("");
    onFilter(null, null);
  };

  return (
    <div
      className="system-card p-4"
      dir="rtl"
    >
      <div className="flex flex-wrap items-end gap-4">
        {/* تاريخ البداية */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <Label
            htmlFor="from-date"
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            من تاريخ
          </Label>
          <Input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-sm"
            style={{
              borderColor: "var(--border)",
              borderRadius: "10px",
              direction: "ltr",
            }}
          />
        </div>

        {/* تاريخ النهاية */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <Label
            htmlFor="to-date"
            className="text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            إلى تاريخ
          </Label>
          <Input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-sm"
            style={{
              borderColor: "var(--border)",
              borderRadius: "10px",
              direction: "ltr",
            }}
          />
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex gap-2">
          <Button
            onClick={handleApply}
            className="gap-2 text-sm font-medium text-white"
            style={{
              backgroundColor: "var(--accent-blue)",
              borderRadius: "10px",
            }}
          >
            <Filter size={15} />
            تطبيق
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            className="gap-2 text-sm font-medium"
            style={{
              borderColor: "var(--border)",
              borderRadius: "10px",
              color: "var(--text-secondary)",
            }}
          >
            <RotateCcw size={15} />
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* رسالة الخطأ */}
      {error && (
        <p className="mt-2 text-sm" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
