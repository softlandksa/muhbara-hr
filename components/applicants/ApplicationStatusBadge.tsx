"use client";

// مكون شارة حالة الطلب — يعرض الحالة بلون مناسب
import { translateApplicationStatus } from "@/lib/utils";

// ألوان الحالات (inline styles لتجنب تعارض Tailwind purge)
const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  NEW: { background: "#DBEAFE", color: "#1D4ED8" },
  UNDER_REVIEW: { background: "#FEF3C7", color: "#D97706" },
  QUALIFIED: { background: "#D1FAE5", color: "#059669" },
  INTERVIEW_SCHEDULED: { background: "#EDE9FE", color: "#7C3AED" },
  OFFER_SENT: { background: "#FEF9C3", color: "#CA8A04" },
  ACCEPTED: { background: "#D1FAE5", color: "#065F46" },
  REJECTED: { background: "#FEE2E2", color: "#DC2626" },
  WITHDRAWN: { background: "#F3F4F6", color: "#6B7280" },
};

interface ApplicationStatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export function ApplicationStatusBadge({
  status,
  size = "md",
}: ApplicationStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? { background: "#F3F4F6", color: "#6B7280" };
  const label = translateApplicationStatus(status);

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
    >
      {label}
    </span>
  );
}
