"use client";

// Header Component — رأس الصفحة
import { usePathname } from "next/navigation";
import { Menu, Bell, ChevronLeft } from "lucide-react";

// خريطة عناوين الصفحات
const pageTitles: Record<string, string[]> = {
  "/dashboard": ["لوحة التحكم"],
  "/jobs": ["الوظائف"],
  "/jobs/new": ["الوظائف", "إضافة وظيفة"],
  "/applicants": ["المتقدمون"],
  "/interviews": ["المقابلات"],
  "/reports": ["التقارير"],
  "/settings": ["الإعدادات"],
};

function getBreadcrumbs(pathname: string): string[] {
  // البحث عن المسار المطابق
  if (pageTitles[pathname]) return pageTitles[pathname];

  // التحقق من المسارات الديناميكية
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "jobs" && parts[1]) {
    return ["الوظائف", "تفاصيل الوظيفة"];
  }
  if (parts[0] === "applicants" && parts[1]) {
    return ["المتقدمون", "ملف المتقدم"];
  }
  if (parts[0] === "interviews" && parts[1]) {
    return ["المقابلات", "تفاصيل المقابلة"];
  }

  return ["لوحة التحكم"];
}

interface HeaderProps {
  user: {
    name: string;
    role: string;
    avatar?: string | null;
  };
  onMenuToggle: () => void;
}

function translateRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "مدير النظام",
    HR: "موارد بشرية",
    INTERVIEWER: "محاور",
  };
  return map[role] ?? role;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6"
      style={{
        height: "64px",
        backgroundColor: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
      aria-label="رأس الصفحة"
    >
      {/* Breadcrumb — على اليمين في RTL */}
      <div className="flex items-center gap-2">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronLeft
                className="w-4 h-4"
                style={{ color: "var(--text-secondary)" }}
                aria-hidden="true"
              />
            )}
            <span
              className="text-sm font-medium"
              style={{
                color:
                  index === breadcrumbs.length - 1
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
              }}
            >
              {crumb}
            </span>
          </div>
        ))}
      </div>

      {/* أيقونات على اليسار في RTL */}
      <div className="flex items-center gap-3">
        {/* أيقونة الإشعارات */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors hover:bg-gray-100"
          style={{ color: "var(--text-secondary)" }}
          aria-label="الإشعارات"
        >
          <Bell className="w-5 h-5" />
          {/* نقطة الإشعار */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: "var(--danger)" }}
            aria-hidden="true"
          />
        </button>

        {/* Avatar المستخدم */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block text-end">
            <p
              className="text-sm font-medium leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {user.name}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {translateRole(user.role)}
            </p>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: "#4361EE" }}
            aria-label={`الصورة الرمزية لـ ${user.name}`}
          >
            {user.name.charAt(0)}
          </div>
        </div>

        {/* زر القائمة على الجوال */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[10px] transition-colors hover:bg-gray-100"
          style={{ color: "var(--text-secondary)" }}
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
