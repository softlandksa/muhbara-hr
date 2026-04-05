"use client";

// مكون شارة حالة المقابلة — يعرض الحالة بلون مناسب

// أنماط الألوان لكل حالة مقابلة
const STATUS_STYLES: Record<string, { background: string; color: string; label: string }> = {
  SCHEDULED:   { background: "#DBEAFE", color: "#1D4ED8",  label: "مجدولة" },
  COMPLETED:   { background: "#D1FAE5", color: "#059669",  label: "مكتملة" },
  CANCELLED:   { background: "#FEE2E2", color: "#DC2626",  label: "ملغاة" },
  NO_SHOW:     { background: "#FEF3C7", color: "#D97706",  label: "لم يحضر" },
  RESCHEDULED: { background: "#F3F4F6", color: "#6B7280",  label: "أُعيد جدولتها" },
};

interface InterviewStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function InterviewStatusBadge({ status, size = "md" }: InterviewStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? { background: "#F3F4F6", color: "#6B7280", label: status };

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
      aria-label={`حالة المقابلة: ${styles.label}`}
    >
      {styles.label}
    </span>
  );
}
