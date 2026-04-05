"use client";

// جدول المقابلات — TanStack Table v8
import { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  flexRender, type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Calendar } from "lucide-react";
import { InterviewTypeBadge } from "./InterviewTypeBadge";
import { InterviewStatusBadge } from "./InterviewStatusBadge";
import { formatDateTime } from "@/lib/utils";

// نوع عنصر المقابلة في القائمة
export interface InterviewListItem {
  id: string;
  type: string;
  status: string;
  scheduledAt: string | Date;
  duration: number;
  score: number | null;
  application: {
    id: string;
    fullName: string;
    email: string;
  };
  job: {
    id: string;
    title: string;
    department: { name: string };
  };
  interviewer: { name: string };
}

interface Props {
  interviews: InterviewListItem[];
  isLoading?: boolean;
}

export function InterviewsTable({ interviews, isLoading }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);

  // تصفية البيانات
  const filtered = useMemo(() => {
    let data = interviews;
    if (statusFilter !== "ALL") data = data.filter((i) => i.status === statusFilter);
    if (typeFilter !== "ALL") data = data.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (i) =>
          i.application.fullName.toLowerCase().includes(q) ||
          i.application.email.toLowerCase().includes(q) ||
          i.job.title.toLowerCase().includes(q) ||
          i.interviewer.name.toLowerCase().includes(q)
      );
    }
    return data;
  }, [interviews, statusFilter, typeFilter, search]);

  const columns = useMemo<ColumnDef<InterviewListItem>[]>(() => [
    {
      id: "applicant",
      header: "المتقدم",
      accessorFn: (r) => r.application.fullName,
      cell: ({ row: { original: r } }) => (
        <div>
          <Link href={`/applicants/${r.application.id}`}
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--accent-blue)" }}>
            {r.application.fullName}
          </Link>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {r.application.email}
          </p>
        </div>
      ),
    },
    {
      id: "job",
      header: "الوظيفة",
      accessorFn: (r) => r.job.title,
      cell: ({ row: { original: r } }) => (
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {r.job.title}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {r.job.department.name}
          </p>
        </div>
      ),
    },
    {
      id: "type",
      header: "النوع",
      cell: ({ row }) => <InterviewTypeBadge type={row.original.type} />,
      enableSorting: false,
    },
    {
      id: "status",
      header: "الحالة",
      cell: ({ row }) => <InterviewStatusBadge status={row.original.status} />,
      enableSorting: false,
    },
    {
      id: "interviewer",
      header: "المحاور",
      accessorFn: (r) => r.interviewer.name,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--text-primary)" }}>
          {row.original.interviewer.name}
        </span>
      ),
    },
    {
      id: "scheduledAt",
      header: "الموعد",
      accessorFn: (r) => r.scheduledAt,
      cell: ({ row }) => (
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {formatDateTime(row.original.scheduledAt)}
        </span>
      ),
      sortingFn: "datetime",
    },
    {
      id: "score",
      header: "النقطة",
      accessorFn: (r) => r.score ?? -1,
      cell: ({ row }) =>
        row.original.score != null ? (
          <span className="text-sm font-bold" style={{
            color: row.original.score >= 66 ? "#2D9B6F"
              : row.original.score >= 41 ? "#4361EE" : "#C0392B"
          }}>
            {Math.round(row.original.score)} / 100
          </span>
        ) : (
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>—</span>
        ),
    },
    {
      id: "actions",
      header: "الإجراءات",
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          href={`/interviews/${row.original.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          aria-label={`عرض تفاصيل المقابلة`}
        >
          <Eye className="w-3.5 h-3.5" />
          عرض
        </Link>
      ),
    },
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="system-card overflow-hidden">
      {/* شريط الفلاتر */}
      <div className="p-4 flex flex-wrap gap-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4"
            style={{ color: "var(--text-secondary)" }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الوظيفة أو المحاور..."
            className="w-full pr-9 pl-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--border)", borderRadius: "10px",
              backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
            aria-label="بحث في المقابلات"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--border)", borderRadius: "10px",
            backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
          aria-label="تصفية بالحالة">
          <option value="ALL">جميع الحالات</option>
          <option value="SCHEDULED">مجدولة</option>
          <option value="COMPLETED">مكتملة</option>
          <option value="RESCHEDULED">أُعيد جدولتها</option>
          <option value="CANCELLED">ملغاة</option>
          <option value="NO_SHOW">لم يحضر</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--border)", borderRadius: "10px",
            backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}
          aria-label="تصفية بالنوع">
          <option value="ALL">جميع الأنواع</option>
          <option value="PHONE">هاتفية</option>
          <option value="VIDEO">مرئية</option>
          <option value="IN_PERSON">حضورية</option>
          <option value="TECHNICAL">تقنية</option>
          <option value="HR">HR</option>
        </select>
        <span className="text-sm mr-auto self-center" style={{ color: "var(--text-secondary)" }}>
          {filtered.length} نتيجة
        </span>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAFAFA" }}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-right text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}>
                    {!header.isPlaceholder && (
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === "asc" ? <ChevronUp className="w-3.5 h-3.5" />
                            : header.column.getIsSorted() === "desc" ? <ChevronDown className="w-3.5 h-3.5" />
                              : <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* Skeleton */}
            {isLoading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                {columns.map((col) => (
                  <td key={String(col.id)} className="px-4 py-3">
                    <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#E8E6E0", width: "80%" }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* الصفوف */}
            {!isLoading && table.getRowModel().rows.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}
                className="hover:bg-gray-50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}

            {/* حالة فارغة */}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: "#D1D5DB" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    لا توجد مقابلات مطابقة
                  </p>
                  {(search || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                    <button
                      onClick={() => { setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}
                      className="mt-2 text-sm font-medium"
                      style={{ color: "var(--accent-blue)" }}>
                      مسح الفلاتر
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
