"use client";

// جدول الوظائف باستخدام TanStack Table v8
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Briefcase,
  Users,
} from "lucide-react";
import { JobStatusBadge } from "./JobStatusBadge";
import { StatusChangeDialog } from "./StatusChangeDialog";
import { DeleteJobDialog } from "./DeleteJobDialog";
import { translateJobType, formatDate } from "@/lib/utils";

// نوع بيانات الوظيفة في القائمة
export interface JobListItem {
  id: string;
  title: string;
  type: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "CLOSED" | "ARCHIVED" | "REJECTED";
  location: string | null;
  isRemote: boolean;
  deadline: Date | string | null;
  headcount: number;
  createdAt: Date | string;
  department: { id: string; name: string; code: string };
  skillCount: number;
  applicationCount: number;
}

interface JobsTableProps {
  jobs: JobListItem[];
  onRefresh: () => void;
}

// حالات الفلترة بالعربية
const STATUS_OPTIONS = [
  { value: "", label: "كل الحالات" },
  { value: "DRAFT", label: "مسودة" },
  { value: "PENDING_APPROVAL", label: "في انتظار الاعتماد" },
  { value: "PUBLISHED", label: "منشورة" },
  { value: "CLOSED", label: "مغلقة" },
  { value: "ARCHIVED", label: "مؤرشفة" },
  { value: "REJECTED", label: "مرفوضة" },
];

// مكون Skeleton للتحميل
function TableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-16 rounded-xl animate-pulse"
          style={{ backgroundColor: "#F3F4F6" }}
        />
      ))}
    </div>
  );
}

// الأنماط المشتركة للخلايا
const cellStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid var(--border)",
  color: "var(--text-primary)",
  fontSize: "14px",
  textAlign: "right" as const,
  verticalAlign: "middle" as const,
};

const headerCellStyle = {
  padding: "12px 16px",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 600,
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
  borderBottom: "2px solid var(--border)",
  backgroundColor: "#F7F6F3",
};

export function JobsTable({ jobs, onRefresh }: JobsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");

  // استخراج قائمة الأقسام الفريدة للفلتر
  const uniqueDepartments = useMemo(() => {
    const seen = new Set<string>();
    return jobs.reduce<{ id: string; name: string }[]>((acc, job) => {
      if (!seen.has(job.department.id)) {
        seen.add(job.department.id);
        acc.push({ id: job.department.id, name: job.department.name });
      }
      return acc;
    }, []);
  }, [jobs]);

  // تصفية البيانات
  const filteredData = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !globalFilter ||
        job.title.toLowerCase().includes(globalFilter.toLowerCase()) ||
        job.department.name.includes(globalFilter);

      const matchesStatus = !statusFilter || job.status === statusFilter;
      const matchesDept = !departmentFilter || job.department.id === departmentFilter;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [jobs, globalFilter, statusFilter, departmentFilter]);

  // تعريف الأعمدة
  const columns = useMemo<ColumnDef<JobListItem>[]>(
    () => [
      {
        id: "title",
        header: "الوظيفة",
        accessorKey: "title",
        cell: ({ row }) => (
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              {row.original.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {row.original.department.name}
              {row.original.location && ` · ${row.original.location}`}
              {row.original.isRemote && " · عن بُعد"}
            </p>
          </div>
        ),
      },
      {
        id: "type",
        header: "النوع",
        accessorKey: "type",
        cell: ({ getValue }) => (
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {translateJobType(getValue() as string)}
          </span>
        ),
      },
      {
        id: "status",
        header: "الحالة",
        accessorKey: "status",
        cell: ({ getValue }) => (
          <JobStatusBadge status={getValue() as JobListItem["status"]} size="sm" />
        ),
      },
      {
        id: "applicationCount",
        header: "المتقدمون",
        accessorKey: "applicationCount",
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-1.5">
            <Users size={14} style={{ color: "var(--text-secondary)" }} />
            <span className="text-sm font-medium">{getValue() as number}</span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              / {row.original.headcount}
            </span>
          </div>
        ),
      },
      {
        id: "deadline",
        header: "الموعد النهائي",
        accessorKey: "deadline",
        cell: ({ getValue }) => {
          const val = getValue() as Date | string | null;
          if (!val) {
            return <span style={{ color: "var(--text-secondary)" }}>—</span>;
          }
          const date = new Date(val);
          const isExpired = date < new Date();
          return (
            <span
              className="text-sm"
              style={{ color: isExpired ? "var(--danger)" : "var(--text-primary)" }}
            >
              {formatDate(date)}
            </span>
          );
        },
      },
      {
        id: "createdAt",
        header: "تاريخ الإنشاء",
        accessorKey: "createdAt",
        cell: ({ getValue }) => (
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {formatDate(new Date(getValue() as string))}
          </span>
        ),
      },
      {
        id: "actions",
        header: "الإجراءات",
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="flex items-center gap-1">
              {/* زر العرض */}
              <button
                onClick={() => router.push(`/jobs/${job.id}`)}
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{
                  backgroundColor: "#EEF2FF",
                  color: "var(--accent-blue)",
                }}
                aria-label={`عرض تفاصيل وظيفة ${job.title}`}
                title="عرض التفاصيل"
              >
                <Eye size={15} />
              </button>

              {/* زر التعديل (فقط للمسودات) */}
              {job.status === "DRAFT" && (
                <button
                  onClick={() => router.push(`/jobs/${job.id}/edit`)}
                  className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                  style={{
                    backgroundColor: "#FEF3C7",
                    color: "#D97706",
                  }}
                  aria-label={`تعديل وظيفة ${job.title}`}
                  title="تعديل"
                >
                  <Pencil size={15} />
                </button>
              )}

              {/* زر تغيير الحالة */}
              <StatusChangeDialog
                jobId={job.id}
                currentStatus={job.status}
                onSuccess={onRefresh}
                trigger={
                  <button
                    className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                    style={{
                      backgroundColor: "#D1FAE5",
                      color: "#059669",
                    }}
                    aria-label={`تغيير حالة وظيفة ${job.title}`}
                    title="تغيير الحالة"
                  >
                    <RefreshCw size={15} />
                  </button>
                }
              />
            </div>
          );
        },
      },
    ],
    [router, onRefresh]
  );

  // إعداد الجدول
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* شريط الفلاتر */}
      <div
        className="system-card p-4"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="flex flex-wrap gap-3 items-center">
          {/* البحث */}
          <div className="relative flex-1 min-w-52">
            <Search
              size={16}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                right: "12px",
                color: "var(--text-secondary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="بحث عن وظيفة..."
              style={{
                width: "100%",
                padding: "9px 38px 9px 12px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
              aria-label="البحث في الوظائف"
            />
          </div>

          {/* فلتر الحالة */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
              minWidth: "160px",
            }}
            aria-label="فلترة حسب الحالة"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* فلتر القسم */}
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{
              padding: "9px 12px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
              fontSize: "14px",
              outline: "none",
              minWidth: "160px",
            }}
            aria-label="فلترة حسب القسم"
          >
            <option value="">كل الأقسام</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* عدد النتائج */}
          <span className="text-sm mr-auto" style={{ color: "var(--text-secondary)" }}>
            {filteredData.length} وظيفة
          </span>
        </div>
      </div>

      {/* الجدول */}
      <div
        className="system-card overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* حالة فارغة */}
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#EEF2FF" }}
            >
              <Briefcase size={28} style={{ color: "var(--accent-blue)" }} />
            </div>
            <div className="text-center">
              <p className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                لا توجد وظائف
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {globalFilter || statusFilter || departmentFilter
                  ? "لا توجد نتائج تطابق معايير البحث"
                  : "ابدأ بإنشاء أول وظيفة"}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              {/* رأس الجدول */}
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{
                          ...headerCellStyle,
                          cursor: header.column.getCanSort() ? "pointer" : "default",
                        }}
                        onClick={header.column.getToggleSortingHandler()}
                        aria-sort={
                          header.column.getIsSorted() === "asc"
                            ? "ascending"
                            : header.column.getIsSorted() === "desc"
                              ? "descending"
                              : "none"
                        }
                      >
                        <div className="flex items-center gap-1 justify-end">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            <span className="opacity-40">
                              {header.column.getIsSorted() === "asc" ? (
                                <ChevronUp size={14} />
                              ) : header.column.getIsSorted() === "desc" ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              {/* جسم الجدول */}
              <tbody>
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "var(--bg-card)" : "#FAFAFA",
                      transition: "background-color 0.15s",
                    }}
                    className="hover:bg-opacity-80"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={cellStyle}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// مكون Skeleton للاستخدام الخارجي
export { TableSkeleton as JobsTableSkeleton };
