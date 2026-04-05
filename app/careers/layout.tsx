// Layout البوابة العامة — بدون مصادقة
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "الوظائف المتاحة",
    template: "%s | الوظائف المتاحة",
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-main)" }}>
      {/* شريط التنقل العلوي */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: "#1A1A2E", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: "#4361EE" }}
            >
              ت
            </div>
            <span className="text-white font-semibold text-sm">
              {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "نظام التوظيف"}
            </span>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            بوابة التوظيف
          </span>
        </div>
      </header>

      {/* المحتوى */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* التذييل */}
      <footer className="mt-16 border-t py-6" style={{ borderColor: "var(--border)" }}>
        <p className="text-center text-xs" style={{ color: "var(--text-secondary)" }}>
          {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "الشركة"} — جميع الحقوق محفوظة
        </p>
      </footer>
    </div>
  );
}
