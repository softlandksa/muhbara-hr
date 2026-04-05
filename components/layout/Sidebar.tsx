"use client";

// Sidebar Component — الشريط الجانبي
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react";

// عناصر التنقل
const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "لوحة التحكم",
    ariaLabel: "الانتقال إلى لوحة التحكم",
  },
  {
    href: "/jobs",
    icon: Briefcase,
    label: "الوظائف",
    ariaLabel: "الانتقال إلى إدارة الوظائف",
  },
  {
    href: "/applicants",
    icon: Users,
    label: "المتقدمون",
    ariaLabel: "الانتقال إلى إدارة المتقدمين",
  },
  {
    href: "/interviews",
    icon: Calendar,
    label: "المقابلات",
    ariaLabel: "الانتقال إلى إدارة المقابلات",
  },
  {
    href: "/reports",
    icon: BarChart3,
    label: "التقارير",
    ariaLabel: "الانتقال إلى التقارير",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "الإعدادات",
    ariaLabel: "الانتقال إلى الإعدادات",
  },
];

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
}

// ترجمة الدور
function translateRole(role: string): string {
  const map: Record<string, string> = {
    ADMIN: "مدير النظام",
    HR: "موارد بشرية",
    INTERVIEWER: "محاور",
  };
  return map[role] ?? role;
}

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* طبقة الخلفية المعتمة على الجوال */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* الشريط الجانبي */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        style={{
          width: "260px",
          backgroundColor: "#1A1A2E",
        }}
        aria-label="القائمة الجانبية"
      >
        {/* رأس الشريط الجانبي */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#4361EE" }}
            >
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight">
                {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "شركة محبرة"}
              </p>
              <p className="text-white/50 text-xs">نظام التوظيف</p>
            </div>
          </div>

          {/* زر الإغلاق على الجوال */}
          <button
            onClick={onClose}
            className="lg:hidden text-white/70 hover:text-white transition-colors"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* عناصر التنقل */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="القائمة الرئيسية">
          {navItems.map((item) => {
            const Icon = item.icon;
            // التحقق من النشاط (مطابقة مسار أو مسار فرعي)
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-label={item.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all"
                style={{
                  backgroundColor: isActive ? "#4361EE" : "transparent",
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* معلومات المستخدم وتسجيل الخروج */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "#4361EE" }}
              aria-label={`صورة ${user.name}`}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.name}
              </p>
              <p className="text-white/50 text-xs">{translateRole(user.role)}</p>
            </div>
          </div>

          {/* زر تسجيل الخروج */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all text-white/65 hover:text-white hover:bg-white/10"
            aria-label="تسجيل الخروج من النظام"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
