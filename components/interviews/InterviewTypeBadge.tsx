"use client";

// مكون شارة نوع المقابلة — يعرض النوع بلون مناسب

// أنماط الألوان لكل نوع مقابلة
const TYPE_STYLES: Record<string, { background: string; color: string; label: string }> = {
  PHONE:      { background: "#DBEAFE", color: "#1D4ED8", label: "هاتفية" },
  VIDEO:      { background: "#EDE9FE", color: "#7C3AED", label: "مرئية" },
  IN_PERSON:  { background: "#D1FAE5", color: "#065F46", label: "حضورية" },
  TECHNICAL:  { background: "#FEF3C7", color: "#D97706", label: "تقنية" },
  HR:         { background: "#FCE7F3", color: "#9D174D", label: "HR" },
};

interface InterviewTypeBadgeProps {
  type: string;
  size?: "sm" | "md";
}

export function InterviewTypeBadge({ type, size = "md" }: InterviewTypeBadgeProps) {
  const styles = TYPE_STYLES[type] ?? { background: "#F3F4F6", color: "#6B7280", label: type };

  const padding = size === "sm" ? "2px 8px" : "4px 12px";
  const fontSize = size === "sm" ? "11px" : "13px";

  return (
    <span
      style={{
        background: styles.background,
        color: styles.color,
        padding,
        fontSize,
        fontWeight: 600,
        borderRadius: "20px",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
      aria-label={`نوع المقابلة: ${styles.label}`}
    >
      {styles.label}
    </span>
  );
}
