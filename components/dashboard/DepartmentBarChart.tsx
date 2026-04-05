"use client";

// مخطط أعمدة أفقي لتوزيع الطلبات حسب القسم
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DepartmentDataItem {
  department: string;
  count: number;
}

interface DepartmentBarChartProps {
  data: DepartmentDataItem[];
  title?: string;
  color?: string;
}

// Tooltip مخصص بالعربية
interface TooltipPayloadEntry {
  value: number;
  payload: DepartmentDataItem;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className="rounded-xl px-3 py-2 text-sm shadow-lg"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border)",
        direction: "rtl",
      }}
    >
      <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        {payload[0].payload.department}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        العدد:{" "}
        <span className="font-bold" style={{ color: "#4361EE" }}>
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

// ألوان متدرجة للأعمدة
const BAR_COLORS = [
  "#4361EE",
  "#7B61FF",
  "#2D9B6F",
  "#E07B39",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#F97316",
];

export default function DepartmentBarChart({
  data,
  title = "الطلبات حسب القسم",
  color = "#4361EE",
}: DepartmentBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="system-card p-5">
        <h3 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {title}
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

  // ترتيب البيانات تنازلياً
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // حساب ارتفاع الرسم البياني بناءً على عدد الأقسام
  const chartHeight = Math.max(200, sortedData.length * 40 + 40);

  return (
    <div className="system-card p-5">
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#E8E6E0"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="department"
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(67, 97, 238, 0.05)" }} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {sortedData.map((entry, index) => (
              <Cell
                key={entry.department}
                fill={BAR_COLORS[index % BAR_COLORS.length] ?? color}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
