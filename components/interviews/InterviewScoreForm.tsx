"use client";

// نموذج تقييم المقابلة — يتضمن 3 أبعاد للتقييم مع حساب فوري للنقطة النهائية
import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface InterviewScoreFormProps {
  interviewId: string;
  initialScore: number | null;
  onSuccess: () => void;
  existingScore?: {
    technicalCompetence: number;
    softSkills: number;
    culturalFit: number;
  } | null;
}

// حساب النقطة النهائية: أولية × 40% + مقابلة × 60%
function previewFinalScore(initial: number, interview: number): number {
  return Math.round(initial * 0.4 + interview * 0.6);
}

// تحديد لون النقطة بناءً على القيمة
function getScoreColor(score: number): string {
  if (score <= 40) return "var(--danger)";
  if (score <= 65) return "var(--warning)";
  if (score <= 80) return "var(--accent-blue)";
  return "var(--success)";
}

export function InterviewScoreForm({
  interviewId,
  initialScore,
  onSuccess,
  existingScore,
}: InterviewScoreFormProps) {
  // قيم الأبعاد الثلاثة للتقييم
  const [technicalCompetence, setTechnicalCompetence] = useState<number>(
    existingScore?.technicalCompetence ?? 0
  );
  const [softSkills, setSoftSkills] = useState<number>(
    existingScore?.softSkills ?? 0
  );
  const [culturalFit, setCulturalFit] = useState<number>(
    existingScore?.culturalFit ?? 0
  );
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حساب المجموع الكلي للمقابلة
  const interviewTotal = technicalCompetence + softSkills + culturalFit;
  // معاينة النقطة النهائية
  const finalPreview = initialScore != null ? previewFinalScore(initialScore, interviewTotal) : null;

  // معالجة إدخال الشريط المنزلق مع ضمان الحد الأقصى
  function handleSlider(
    value: number,
    max: number,
    setter: (v: number) => void
  ) {
    setter(Math.min(max, Math.max(0, value)));
  }

  // معالجة تقديم التقييم
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/interviews/${interviewId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicalCompetence,
          softSkills,
          culturalFit,
          note: note.trim() || null,
        }),
      });

      const data = await res.json() as { error?: string; finalScore?: number };

      if (!res.ok) {
        throw new Error(data.error ?? "حدث خطأ غير متوقع");
      }

      toast.success("تم تقديم التقييم بنجاح");
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">

      {/* الكفاءة الوظيفية — حتى 40 نقطة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            الكفاءة الوظيفية
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor((technicalCompetence / 40) * 100) }}
            >
              {technicalCompetence}
            </span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>/ 40</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          مدى امتلاك المرشح للمعرفة والمهارات التقنية المطلوبة للوظيفة
        </p>
        <input
          type="range"
          min={0}
          max={40}
          step={1}
          value={technicalCompetence}
          onChange={(e) => handleSlider(parseInt(e.target.value, 10), 40, setTechnicalCompetence)}
          aria-label="نقطة الكفاءة الوظيفية"
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to left, #E8E6E0 ${100 - (technicalCompetence / 40) * 100}%, ${getScoreColor((technicalCompetence / 40) * 100)} ${100 - (technicalCompetence / 40) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>0</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>

      {/* فاصل */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* المهارات الشخصية — حتى 30 نقطة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            المهارات الشخصية
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor((softSkills / 30) * 100) }}
            >
              {softSkills}
            </span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>/ 30</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          التواصل، العمل الجماعي، حل المشكلات، الذكاء العاطفي
        </p>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={softSkills}
          onChange={(e) => handleSlider(parseInt(e.target.value, 10), 30, setSoftSkills)}
          aria-label="نقطة المهارات الشخصية"
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to left, #E8E6E0 ${100 - (softSkills / 30) * 100}%, ${getScoreColor((softSkills / 30) * 100)} ${100 - (softSkills / 30) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>0</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
        </div>
      </div>

      {/* فاصل */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* التوافق الوظيفي — حتى 30 نقطة */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            التوافق الوظيفي
          </Label>
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor((culturalFit / 30) * 100) }}
            >
              {culturalFit}
            </span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>/ 30</span>
          </div>
        </div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          مدى توافق قيم المرشح وطموحاته مع بيئة العمل وثقافة الشركة
        </p>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={culturalFit}
          onChange={(e) => handleSlider(parseInt(e.target.value, 10), 30, setCulturalFit)}
          aria-label="نقطة التوافق الوظيفي"
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to left, #E8E6E0 ${100 - (culturalFit / 30) * 100}%, ${getScoreColor((culturalFit / 30) * 100)} ${100 - (culturalFit / 30) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
          <span>0</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
        </div>
      </div>

      {/* ملخص النقاط */}
      <div
        className="rounded-[12px] p-4 space-y-3"
        style={{ backgroundColor: "#F7F6F3", border: "1px solid var(--border)" }}
      >
        <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          ملخص التقييم
        </h4>

        {/* تفاصيل الأبعاد */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>الكفاءة الوظيفية</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {technicalCompetence} / 40
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>المهارات الشخصية</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {softSkills} / 30
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-secondary)" }}>التوافق الوظيفي</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {culturalFit} / 30
            </span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed var(--border)" }} />

        {/* إجمالي نقطة المقابلة */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            نقطة المقابلة الإجمالية
          </span>
          <span
            className="text-xl font-bold"
            style={{ color: getScoreColor(interviewTotal) }}
          >
            {interviewTotal} / 100
          </span>
        </div>

        {/* معاينة النقطة النهائية */}
        {finalPreview !== null && (
          <div
            className="rounded-[10px] p-3 flex justify-between items-center"
            style={{ backgroundColor: "#EFF2FF" }}
          >
            <div>
              <p className="text-xs font-medium" style={{ color: "#4361EE" }}>
                النقطة النهائية المتوقعة
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                ({initialScore} × 40%) + ({interviewTotal} × 60%)
              </p>
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: getScoreColor(finalPreview) }}
            >
              {finalPreview}
            </span>
          </div>
        )}
      </div>

      {/* ملاحظة التقييم */}
      <div className="space-y-1.5">
        <Label htmlFor="scoreNote" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          ملاحظات المقابلة (اختياري)
        </Label>
        <textarea
          id="scoreNote"
          rows={3}
          placeholder="ملاحظات إضافية حول أداء المرشح..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          aria-label="ملاحظات تقييم المقابلة"
          className="w-full p-3 text-sm resize-none outline-none"
          style={{
            borderRadius: "10px",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            backgroundColor: "var(--bg-card)",
          }}
          maxLength={1000}
        />
        <p className="text-xs text-left" style={{ color: "var(--text-secondary)" }}>
          {note.length} / 1000
        </p>
      </div>

      {/* زر التقديم */}
      <Button
        type="submit"
        disabled={isSubmitting || interviewTotal === 0}
        aria-label="تقديم تقييم المقابلة"
        style={{
          backgroundColor: "var(--accent-blue)",
          borderRadius: "10px",
          color: "#fff",
          width: "100%",
        }}
        className="font-semibold py-2.5"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin ml-2" />
            جارٍ الحفظ...
          </>
        ) : (
          "تقديم التقييم وإنهاء المقابلة"
        )}
      </Button>
    </form>
  );
}
