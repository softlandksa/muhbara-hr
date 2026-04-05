"use client";

// مكون Wrapper لنموذج الوظيفة — يتولى إدارة التنقل بعد النجاح
import { useRouter } from "next/navigation";
import { JobForm, type JobFormData } from "./JobForm";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface JobFormWrapperProps {
  mode: "create" | "edit";
  initialData?: JobFormData;
  departments: Department[];
}

export function JobFormWrapper({ mode, initialData, departments }: JobFormWrapperProps) {
  const router = useRouter();

  const handleSuccess = () => {
    // بعد الإنشاء، الانتقال لقائمة الوظائف
    // بعد التعديل، الانتقال لصفحة تفاصيل الوظيفة
    if (mode === "create") {
      router.push("/jobs");
    } else if (initialData?.id) {
      router.push(`/jobs/${initialData.id}`);
      router.refresh();
    }
  };

  return (
    <JobForm
      mode={mode}
      initialData={initialData}
      departments={departments}
      onSuccess={handleSuccess}
    />
  );
}
