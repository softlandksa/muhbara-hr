// دوال مساعدة عامة
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// دمج classes من Tailwind بشكل صحيح
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// تنسيق العملة
export function formatCurrency(
  amount: number,
  currency: string = "SAR"
): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

// تنسيق التاريخ بالعربية
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// تنسيق التاريخ والوقت بالعربية
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// الوقت النسبي (منذ...)
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "الآن";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return formatDate(d);
}

// ترجمة مستوى التعليم
export function translateEducation(level: string): string {
  const map: Record<string, string> = {
    HIGH_SCHOOL: "الثانوية العامة",
    DIPLOMA: "دبلوم",
    BACHELOR: "بكالوريوس",
    MASTER: "ماجستير",
    PHD: "دكتوراه",
  };
  return map[level] ?? level;
}

// ترجمة حالة الوظيفة
export function translateJobStatus(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "مسودة",
    PENDING_APPROVAL: "قيد الموافقة",
    PUBLISHED: "منشورة",
    CLOSED: "مغلقة",
    ARCHIVED: "مؤرشفة",
    REJECTED: "مرفوضة",
  };
  return map[status] ?? status;
}

// ترجمة حالة الطلب
export function translateApplicationStatus(status: string): string {
  const map: Record<string, string> = {
    NEW: "جديد",
    UNDER_REVIEW: "قيد المراجعة",
    QUALIFIED: "مؤهل",
    INTERVIEW_SCHEDULED: "مقابلة مجدولة",
    OFFER_SENT: "عرض مُرسل",
    ACCEPTED: "مقبول",
    REJECTED: "مرفوض",
    WITHDRAWN: "انسحب",
  };
  return map[status] ?? status;
}

// ترجمة نوع الوظيفة
export function translateJobType(type: string): string {
  const map: Record<string, string> = {
    FULL_TIME: "دوام كامل",
    PART_TIME: "دوام جزئي",
    REMOTE: "عن بُعد",
    HYBRID: "هجين",
    TEMPORARY: "مؤقت",
  };
  return map[type] ?? type;
}

// لون حالة الطلب
export function getApplicationStatusColor(status: string): string {
  const map: Record<string, string> = {
    NEW: "bg-blue-100 text-blue-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    QUALIFIED: "bg-green-100 text-green-800",
    INTERVIEW_SCHEDULED: "bg-purple-100 text-purple-800",
    OFFER_SENT: "bg-orange-100 text-orange-800",
    ACCEPTED: "bg-emerald-100 text-emerald-800",
    REJECTED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-gray-100 text-gray-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

// لون حالة الوظيفة
export function getJobStatusColor(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    PUBLISHED: "bg-green-100 text-green-800",
    CLOSED: "bg-red-100 text-red-800",
    ARCHIVED: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}
