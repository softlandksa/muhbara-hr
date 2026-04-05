// صفحة الإعدادات — Placeholder
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "الإعدادات",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          الإعدادات
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          إعدادات النظام — Phase 5
        </p>
      </div>

      <div className="system-card p-12 text-center">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          سيتم بناء هذه الصفحة في Phase 5
        </p>
      </div>
    </div>
  );
}
