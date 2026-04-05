"use client";

// مكون Wrapper لأزرار الإجراءات في صفحة تفاصيل الوظيفة
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { DeleteJobDialog } from "./DeleteJobDialog";

type JobStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED";

interface JobsRefreshWrapperProps {
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
}

export function JobsRefreshWrapper({ jobId, jobTitle, jobStatus }: JobsRefreshWrapperProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    router.push("/jobs");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* زر التعديل — فقط للمسودات */}
      {jobStatus === "DRAFT" && (
        <Link
          href={`/jobs/${jobId}/edit`}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg"
          style={{
            backgroundColor: "#FEF3C7",
            color: "#D97706",
            textDecoration: "none",
            borderRadius: "10px",
          }}
          aria-label="تعديل بيانات الوظيفة"
        >
          <Pencil size={15} />
          تعديل
        </Link>
      )}

      {/* زر تغيير الحالة */}
      <StatusChangeDialog
        jobId={jobId}
        currentStatus={jobStatus}
        onSuccess={handleRefresh}
        trigger={
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg"
            style={{
              backgroundColor: "#EEF2FF",
              color: "var(--accent-blue)",
              borderRadius: "10px",
            }}
            aria-label="تغيير حالة الوظيفة"
          >
            تغيير الحالة
          </button>
        }
      />

      {/* زر الحذف — فقط للمسودات */}
      {jobStatus === "DRAFT" && (
        <DeleteJobDialog
          jobId={jobId}
          jobTitle={jobTitle}
          onSuccess={handleDeleteSuccess}
          trigger={
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg"
              style={{
                backgroundColor: "#FEE2E2",
                color: "var(--danger)",
                borderRadius: "10px",
              }}
              aria-label="حذف الوظيفة"
            >
              حذف
            </button>
          }
        />
      )}
    </div>
  );
}
