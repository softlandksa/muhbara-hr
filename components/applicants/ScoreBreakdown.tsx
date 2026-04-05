"use client";

// مكون تفاصيل التقييم — يعرض أشرطة أفقية لكل بُعد من أبعاد التقييم

interface BreakdownData {
  experience: number;
  education: number;
  requiredSkills: number;
  preferredSkills: number;
  completeness: number;
  location: number;
}

interface ScoreBreakdownProps {
  breakdown: BreakdownData;
  weights: BreakdownData;
}

// تسميات الأبعاد بالعربية
const DIMENSION_LABELS: Record<keyof BreakdownData, string> = {
  experience: "الخبرة",
  education: "التعليم",
  requiredSkills: "المهارات الإلزامية",
  preferredSkills: "المهارات المفضلة",
  completeness: "اكتمال الملف",
  location: "الموقع",
};

// لون شريط التقدم
function getBarColor(score: number, maxScore: number): string {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) return "#2D9B6F";   // أخضر
  if (ratio >= 0.6) return "#4361EE";   // أزرق
  if (ratio >= 0.4) return "#E07B39";   // برتقالي
  return "#C0392B";                      // أحمر
}

export function ScoreBreakdown({ breakdown, weights }: ScoreBreakdownProps) {
  const dimensions = Object.keys(DIMENSION_LABELS) as (keyof BreakdownData)[];

  return (
    <div className="space-y-3">
      {dimensions.map((key) => {
        const score = breakdown[key] ?? 0;
        const maxScore = weights[key] ?? 0;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        const barColor = getBarColor(score, maxScore);

        return (
          <div key={key}>
            {/* الرأس: التسمية والنقطة */}
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-sm"
                style={{ color: "var(--text-primary)", fontWeight: 500 }}
              >
                {DIMENSION_LABELS[key]}
              </span>
              <span
                className="text-sm font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {Math.round(score)} / {maxScore}
              </span>
            </div>
            {/* شريط التقدم */}
            <div
              style={{
                background: "#E8E6E0",
                borderRadius: "6px",
                height: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, percentage)}%`,
                  background: barColor,
                  height: "100%",
                  borderRadius: "6px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
