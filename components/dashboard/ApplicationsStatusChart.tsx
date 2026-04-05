"use client";

// مخطط دائري لتوزيع حالات طلبات التوظيف
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ألوان كل حالة
const STATUS_COLORS: Record<string, string> = {
  NEW: "#3B82F6",
  UNDER_REVIEW: "#F59E0B",
  QUALIFIED: "#10B981",
  INTERVIEW_SCHEDULED: "#8B5CF6",
  OFFER_SENT: "#F97316",
  ACCEPTED: "#059669",
  REJECTED: "#EF4444",
  WITHDRAWN: "#9CA3AF",
};

interface StatusDataItem {
  status: string;
  count: number;
  label: string;
}

interface ApplicationsStatusChartProps {
  data: StatusDataItem[];
}

// Tooltip مخصص بالعربية
interface TooltipPayloadEntry {
  name: string;
  value: number;
  payload: StatusDataItem;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border)",
        direction: "rtl",
      }}
    >
      <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
        {item.name}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        العدد: <span className="font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</span>
      </p>
    </div>
  );
}

export default function ApplicationsStatusChart({
  data,
}: ApplicationsStatusChartProps) {
  // حالة بيانات فارغة
  if (!data || data.length === 0) {
    return (
      <div className="system-card p-5">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          توزيع حالات الطلبات
        </h3>
        <div
          className="flex items-center justify-center h-48 rounded-xl"
          style={{ backgroundColor: "var(--bg-main)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            لا توجد بيانات
          </p>
        </div>
      </div>
    );
  }

  // فلترة العناصر التي عدادها صفر
  const filteredData = data.filter((d) => d.count > 0);

  return (
    <div className="system-card p-5">
      <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        توزيع حالات الطلبات
      </h3>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="label"
          >
            {filteredData.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLORS[entry.status] ?? "#9CA3AF"}
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
