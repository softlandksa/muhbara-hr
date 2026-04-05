"use client";

// مكون Wrapper للجدول — يتولى إدارة التحديث عبر useRouter
import { useRouter } from "next/navigation";
import { JobsTable, type JobListItem } from "./JobsTable";

interface JobsTableWrapperProps {
  jobs: JobListItem[];
}

export function JobsTableWrapper({ jobs }: JobsTableWrapperProps) {
  const router = useRouter();

  return (
    <JobsTable
      jobs={jobs}
      onRefresh={() => router.refresh()}
    />
  );
}
