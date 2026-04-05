"use client";

// مكون شارة حالة الوظيفة
import { translateJobStatus } from "@/lib/utils";

type JobStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED";

interface JobStatusBadgeProps {
  status: JobStatus;
  size?: "sm" | "md";
}

// خريطة الألوان لكل حالة
const STATUS_STYLES: Record<JobStatus, { bg: string; color: string }> = {
  DRAFT: { bg: "#F3F4F6", color: "#6B7280" },
  PENDING_APPROVAL: { bg: "#FEF3C7", color: "#D97706" },
  PUBLISHED: { bg: "#D1FAE5", color: "#059669" },
  CLOSED: { bg: "#DBEAFE", color: "#2563EB" },
  ARCHIVED: { bg: "#F3F4F6", color: "#9CA3AF" },
  REJECTED: { bg: "#FEE2E2", color: "#DC2626" },
};

export function JobStatusBadge({ status, size = "md" }: JobStatusBadgeProps) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const paddingStyle = size === "sm"
    ? { padding: "2px 8px", fontSize: "11px" }
    : { padding: "4px 12px", fontSize: "12px" };

  return (
    <span
      style={{
        backgroundColor: styles.bg,
        color: styles.color,
        borderRadius: "20px",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        whiteSpace: "nowrap",
        ...paddingStyle,
      }}
      aria-label={`حالة الوظيفة: ${translateJobStatus(status)}`}
    >
      {translateJobStatus(status)}
    </span>
  );
}
