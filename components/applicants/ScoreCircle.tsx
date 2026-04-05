"use client";

// مكون دائرة النقطة — يعرض النقطة كمؤشر دائري بالـ SVG

// تحديد لون النقطة بناءً على القيمة
function getScoreColor(score: number): string {
  if (score <= 40) return "#C0392B";   // أحمر — منخفض
  if (score <= 65) return "#E07B39";   // برتقالي — متوسط
  if (score <= 80) return "#4361EE";   // أزرق — جيد
  return "#2D9B6F";                     // أخضر — ممتاز
}

interface ScoreCircleProps {
  score: number;
  size?: number;
}

export function ScoreCircle({ score, size = 80 }: ScoreCircleProps) {
  const color = getScoreColor(score);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  // نسبة الامتلاء بناءً على النقطة
  const dashOffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  // أحجام النصوص بناءً على حجم الدائرة
  const scoreFontSize = size <= 50 ? size * 0.28 : size * 0.24;
  const labelFontSize = size <= 50 ? size * 0.16 : size * 0.13;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`النقطة: ${score} من 100`}
    >
      {/* الدائرة الخلفية */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#E8E6E0"
        strokeWidth={size <= 50 ? 4 : 6}
      />
      {/* الدائرة الأمامية — النقطة */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={size <= 50 ? 4 : 6}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        // نبدأ من الأعلى (12 o'clock)
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      {/* النقطة الرقمية */}
      <text
        x={center}
        y={center - (size <= 50 ? 1 : 3)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={scoreFontSize}
        fontWeight={700}
        fontFamily="Noto Kufi Arabic, Tajawal, sans-serif"
      >
        {Math.round(score)}
      </text>
      {/* نص "نقطة" */}
      {size > 50 && (
        <text
          x={center}
          y={center + scoreFontSize * 0.9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#6B7280"
          fontSize={labelFontSize}
          fontFamily="Noto Kufi Arabic, Tajawal, sans-serif"
        >
          نقطة
        </text>
      )}
    </svg>
  );
}
