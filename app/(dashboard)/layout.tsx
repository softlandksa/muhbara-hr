"use client";

// Layout محمي للـ Dashboard — يتحقق من الجلسة
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // شاشة التحميل أثناء التحقق من الجلسة
  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bg-main)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: "#4361EE", borderTopColor: "transparent" }}
            aria-label="جارٍ التحميل"
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            جارٍ تحميل النظام...
          </p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Sidebar */}
      <Sidebar
        user={session.user}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* المحتوى الرئيسي — margin-right على الـ desktop فقط */}
      <div className="flex flex-col min-h-screen transition-all duration-300 lg:mr-[260px]">
        {/* Header */}
        <Header
          user={session.user}
          onMenuToggle={() => setSidebarOpen(true)}
        />

        {/* محتوى الصفحة */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Noto Kufi Arabic, Tajawal, sans-serif",
            direction: "rtl",
          },
        }}
      />
    </div>
  );
}
