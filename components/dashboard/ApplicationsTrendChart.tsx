"use client";

// مخطط خطي لاتجاه طلبات التوظيف خلال آخر 6 أشهر
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendDataItem {
  month: string;
  count: number;
}

interface ApplicationsTrendChartProps {
  data: TrendDataItem[];
}

// Tooltip مخصص بالعربية
interface TooltipPayloadEntry {
  value: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
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
        {label}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        عدد الطلبات:{" "}
        <span className="font-bold" style={{ color: "#4361EE" }}>
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

export default function ApplicationsTrendChart({
  data,
}: ApplicationsTrendChartProps) {
  return (
    <div className="system-card p-5 h-full">
      <h3
        className="text-base font-semibold mb-4"
        style={{ color: "var(--text-primary)" }}
      >
        اتجاه الطلبات — آخر 6 أشهر
      </h3>

      {data.length === 0 ? (
        <div
          className="flex items-center justify-center h-48 rounded-xl"
          style={{ backgroundColor: "var(--bg-main)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            لا توجد بيانات
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8E6E0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#4361EE"
              strokeWidth={2.5}
              dot={{
                fill: "#4361EE",
                strokeWidth: 2,
                r: 4,
                stroke: "#FFFFFF",
              }}
              activeDot={{ r: 6, fill: "#4361EE", stroke: "#FFFFFF", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
