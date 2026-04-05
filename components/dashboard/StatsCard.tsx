// بطاقة إحصائية — مكوّن قابل للإعادة الاستخدام في لوحة التحكم
import React from "react";

interface TrendData {
  value: number;   // النسبة المئوية أو القيمة
  label: string;   // وصف الاتجاه مثل "مقارنة بالشهر الماضي"
}

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;   // لون الأيقونة والقيمة
  bg: string;      // لون خلفية الأيقونة
  trend?: TrendData;
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  trend,
}: StatsCardProps) {
  // تحديد إشارة الاتجاه
  const isPositive = trend && trend.value >= 0;

  return (
    <div className="system-card p-5 flex flex-col gap-3">
      {/* الصف العلوي: الأيقونة والقيمة */}
      <div className="flex items-start justify-between">
        {/* الأيقونة */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          <Icon size={22} style={{ color }} />
        </div>

        {/* شارة الاتجاه */}
        {trend && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: isPositive
                ? "rgba(45, 155, 111, 0.1)"
                : "rgba(192, 57, 43, 0.1)",
              color: isPositive ? "#2D9B6F" : "#C0392B",
            }}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* القيمة الرئيسية */}
      <div>
        <p
          className="text-3xl font-bold leading-none"
          style={{ color }}
        >
          {value}
        </p>
        <p
          className="text-sm font-medium mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </p>
      </div>

      {/* وصف الاتجاه */}
      {trend && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {trend.label}
        </p>
      )}
    </div>
  );
}
