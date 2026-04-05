"use client";

// جدول المتقدمين — TanStack Table v8
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Users } from "lucide-react";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ScoreCircle } from "./ScoreCircle";
import { formatDate, translateEducation } from "@/lib/utils";

// نوع عنصر الطلب في القائمة
export interface ApplicationListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  initialScore: number | null;
  educationLevel: string;
  experienceYears: number;
  appliedAt: string | Date;
  interviewCount?: number;
  job: {
    id: string;
    title: string;
    department: { id: string; name: string; code: string };
  };
}

// ترجمة مصدر الطلب
function translateSource(source: string): string {
  const map: Record<string, string> = {
    WEBSITE: "الموقع",
    LINKEDIN: "LinkedIn",
    REFERRAL: "توصية",
    EMAIL: "بريد إلكتروني",
    EXCEL_IMPORT: "استيراد Excel",
    OTHER: "أخرى",
  };
  return map[source] ?? source;
}

interface ApplicationsTableProps {
  applications: ApplicationListItem[];
  isLoading?: boolean;
}

export function ApplicationsTable({ applications, isLoading }: ApplicationsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scoreFilter, setScoreFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);

  // تصفية البيانات
  const filteredData = useMemo(() => {
    let data = applications;

    if (statusFilter !== "ALL") {
      data = data.filter((a) => a.status === statusFilter);
    }

    if (scoreFilter !== "ALL") {
      data = data.filter((a) => {
        const score = a.initialScore ?? 0;
        if (scoreFilter === "HIGH") return score >= 66;
        if (scoreFilter === "MID") return score >= 41 && score <= 65;
        if (scoreFilter === "LOW") return score <= 40;
        return true;
      });
    }

    if (globalFilter.trim()) {
      const q = globalFilter.toLowerCase();
      data = data.filter(
        (a) =>
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.includes(q) ||
          a.job.title.toLowerCase().includes(q)
      );
    }

    return data;
  }, [applications, statusFilter, scoreFilter, globalFilter]);

  // أعمدة الجدول
  const columns = useMemo<ColumnDef<ApplicationListItem>[]>(
    () => [
      {
        id: "applicant",
        header: "المتقدم",
        accessorFn: (row) => row.fullName,
        cell: ({ row }) => {
          const initials = row.original.fullName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("");
          return (
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: "#4361EE" }}
                aria-label={`صورة ${row.original.fullName}`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {row.original.fullName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                  {row.original.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "job",
        header: "الوظيفة",
        accessorFn: (row) => row.job.title,
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {row.original.job.title}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {row.original.job.department.name}
            </p>
          </div>
        ),
      },
      {
        id: "status",
        header: "الحالة",
        accessorFn: (row) => row.status,
        cell: ({ row }) => <ApplicationStatusBadge status={row.original.status} />,
      },
      {
        id: "score",
        header: "النقطة",
        accessorFn: (row) => row.initialScore ?? 0,
        cell: ({ row }) =>
          row.original.initialScore != null ? (
            <ScoreCircle score={row.original.initialScore} size={44} />
          ) : (
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>—</span>
          ),
        sortingFn: "basic",
      },
      {
        id: "source",
        header: "المصدر",
        accessorFn: (row) => row.source,
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {translateSource(row.original.source)}
          </span>
        ),
      },
      {
        id: "appliedAt",
        header: "تاريخ التقديم",
        accessorFn: (row) => row.appliedAt,
        cell: ({ row }) => (
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {formatDate(row.original.appliedAt)}
          </span>
        ),
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: "الإجراءات",
        cell: ({ row }) => (
          <Link
            href={`/applicants/${row.original.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-[8px]"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            aria-label={`عرض تفاصيل ${row.original.fullName}`}
          >
            <Eye className="w-3.5 h-3.5" />
            عرض
          </Link>
        ),
        enableSorting: false,
      },
    ],
    []
  );

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
    <div className="system-card overflow-hidden">
      {/* شريط الفلاتر */}
      <div
        className="p-4 flex flex-wrap items-center gap-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {/* البحث */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد أو الهاتف..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-sm outline-none transition-colors"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "10px",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-primary)",
            }}
            aria-label="بحث في المتقدمين"
          />
        </div>

        {/* فلتر الحالة */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm outline-none transition-colors"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
          aria-label="تصفية بالحالة"
        >
          <option value="ALL">جميع الحالات</option>
          <option value="NEW">جديد</option>
          <option value="UNDER_REVIEW">قيد المراجعة</option>
          <option value="QUALIFIED">مؤهل</option>
          <option value="INTERVIEW_SCHEDULED">مقابلة مجدولة</option>
          <option value="OFFER_SENT">عرض مُرسل</option>
          <option value="ACCEPTED">مقبول</option>
          <option value="REJECTED">مرفوض</option>
          <option value="WITHDRAWN">انسحب</option>
        </select>

        {/* فلتر النقطة */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="px-3 py-2 text-sm outline-none transition-colors"
          style={{
            border: "1px solid var(--border)",
            borderRadius: "10px",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
          aria-label="تصفية بالنقطة"
        >
          <option value="ALL">جميع النقاط</option>
          <option value="HIGH">عالية (66+)</option>
          <option value="MID">متوسطة (41-65)</option>
          <option value="LOW">منخفضة (0-40)</option>
        </select>

        {/* عدد النتائج */}
        <span className="text-sm mr-auto" style={{ color: "var(--text-secondary)" }}>
          {filteredData.length} نتيجة
        </span>
      </div>

      {/* الجدول */}
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{ borderBottom: "1px solid var(--border)", backgroundColor: "#FAFAFA" }}
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-right text-xs font-semibold"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span style={{ color: "var(--text-secondary)" }}>
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* حالة التحميل */}
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {columns.map((col) => (
                    <td key={String(col.id)} className="px-4 py-3">
                      <div
                        className="h-4 rounded animate-pulse"
                        style={{ backgroundColor: "#E8E6E0", width: "80%" }}
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {/* الصفوف */}
            {!isLoading &&
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  className="hover:bg-gray-50 transition-colors"
                >
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
                  <div className="flex flex-col items-center gap-3">
                    <Users className="w-12 h-12" style={{ color: "#D1D5DB" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      لا توجد طلبات مطابقة
                    </p>
                    {(globalFilter || statusFilter !== "ALL" || scoreFilter !== "ALL") && (
                      <button
                        onClick={() => { setGlobalFilter(""); setStatusFilter("ALL"); setScoreFilter("ALL"); }}
                        className="text-sm font-medium"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        مسح الفلاتر
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
