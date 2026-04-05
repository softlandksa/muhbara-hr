// مكتبة Excel — استيراد وتصدير البيانات باستخدام ExcelJS
import ExcelJS from "exceljs";

// ===== الأنواع المُصدَّرة =====

export interface ExportableApplication {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentName: string;
  status: string;
  initialScore: number | null;
  finalScore: number | null;
  source: string;
  appliedAt: string; // ISO string
}

export interface ReportData {
  totalJobs: number;
  publishedJobs: number;
  totalApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  acceptanceRate: number;
  statusDistribution: { status: string; label: string; count: number }[];
  departmentDistribution: { department: string; count: number }[];
}

export interface ParsedApplication {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  educationLevel: string;
  experienceYears: number;
  currentLocation: string;
  skills: string[];
  notes: string;
}

// ===== ترجمة حالة الطلب للعربية =====
function translateStatus(status: string): string {
  const map: Record<string, string> = {
    NEW: "جديد",
    UNDER_REVIEW: "قيد المراجعة",
    QUALIFIED: "مؤهل",
    INTERVIEW_SCHEDULED: "مقابلة مجدولة",
    OFFER_SENT: "عرض مُرسل",
    ACCEPTED: "مقبول",
    REJECTED: "مرفوض",
    WITHDRAWN: "انسحب",
  };
  return map[status] ?? status;
}

// ===== ترجمة مصدر الطلب للعربية =====
function translateSource(source: string): string {
  const map: Record<string, string> = {
    WEBSITE: "الموقع الإلكتروني",
    LINKEDIN: "لينكد إن",
    REFERRAL: "ترشيح داخلي",
    EMAIL: "البريد الإلكتروني",
    EXCEL_IMPORT: "استيراد Excel",
    OTHER: "أخرى",
  };
  return map[source] ?? source;
}

// ===== تصدير قائمة المتقدمين إلى Excel =====
export async function exportApplicationsToExcel(
  applications: ExportableApplication[]
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نظام إدارة التوظيف";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("المتقدمون", {
    views: [{ rightToLeft: true }],
  });

  // تعريف الأعمدة
  sheet.columns = [
    { header: "الاسم الكامل", key: "fullName", width: 25 },
    { header: "البريد الإلكتروني", key: "email", width: 30 },
    { header: "الهاتف", key: "phone", width: 18 },
    { header: "الوظيفة", key: "jobTitle", width: 30 },
    { header: "القسم", key: "departmentName", width: 20 },
    { header: "الحالة", key: "status", width: 18 },
    { header: "النقطة الأولية", key: "initialScore", width: 16 },
    { header: "النقطة النهائية", key: "finalScore", width: 16 },
    { header: "المصدر", key: "source", width: 20 },
    { header: "تاريخ التقديم", key: "appliedAt", width: 20 },
  ];

  // تنسيق صف الرأس
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A1A2E" }, // كحلي غامق
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      readingOrder: "rtl",
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF4361EE" } },
    };
  });
  headerRow.height = 30;

  // إضافة صفوف البيانات مع ألوان متناوبة
  applications.forEach((app, index) => {
    const row = sheet.addRow({
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      jobTitle: app.jobTitle,
      departmentName: app.departmentName,
      status: translateStatus(app.status),
      initialScore: app.initialScore ?? "—",
      finalScore: app.finalScore ?? "—",
      source: translateSource(app.source),
      appliedAt: new Date(app.appliedAt).toLocaleDateString("ar-SA"),
    });

    // ألوان متناوبة للصفوف
    const bgColor = index % 2 === 0 ? "FFFFFFFF" : "FFF7F6F3";
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: bgColor },
      };
      cell.alignment = {
        horizontal: "right",
        vertical: "middle",
        readingOrder: "rtl",
      };
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE8E6E0" } },
      };
    });
    row.height = 22;
  });

  // تجميد صف الرأس
  sheet.views = [{ state: "frozen", ySplit: 1, rightToLeft: true }];

  // إضافة فلتر تلقائي
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 10 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

// ===== تصدير التقرير الكامل إلى Excel =====
export async function exportReportToExcel(reportData: ReportData): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "نظام إدارة التوظيف";
  workbook.created = new Date();

  // ===== الشيت الأول: الملخص =====
  const summarySheet = workbook.addWorksheet("ملخص", {
    views: [{ rightToLeft: true }],
  });

  summarySheet.columns = [
    { header: "المؤشر", key: "metric", width: 35 },
    { header: "القيمة", key: "value", width: 20 },
  ];

  // تنسيق رأس ورقة الملخص
  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1A1A2E" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  summaryHeader.height = 28;

  const summaryData = [
    { metric: "إجمالي الوظائف", value: reportData.totalJobs },
    { metric: "الوظائف المنشورة", value: reportData.publishedJobs },
    { metric: "إجمالي طلبات التوظيف", value: reportData.totalApplications },
    { metric: "الطلبات المقبولة", value: reportData.acceptedApplications },
    { metric: "الطلبات المرفوضة", value: reportData.rejectedApplications },
    {
      metric: "معدل القبول",
      value: `${reportData.acceptanceRate.toFixed(1)}%`,
    },
  ];

  summaryData.forEach((item, i) => {
    const row = summarySheet.addRow(item);
    const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF7F6F3";
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE8E6E0" } } };
    });
    row.height = 22;
  });

  // ===== الشيت الثاني: توزيع الحالات =====
  const statusSheet = workbook.addWorksheet("توزيع الحالات", {
    views: [{ rightToLeft: true }],
  });

  statusSheet.columns = [
    { header: "الحالة", key: "label", width: 25 },
    { header: "العدد", key: "count", width: 15 },
    { header: "النسبة المئوية", key: "percentage", width: 20 },
  ];

  const statusHeader = statusSheet.getRow(1);
  statusHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4361EE" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  statusHeader.height = 28;

  const totalApps = reportData.totalApplications || 1;
  reportData.statusDistribution.forEach((item, i) => {
    const row = statusSheet.addRow({
      label: item.label,
      count: item.count,
      percentage: `${((item.count / totalApps) * 100).toFixed(1)}%`,
    });
    const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF7F6F3";
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE8E6E0" } } };
    });
    row.height = 22;
  });

  // ===== الشيت الثالث: الأقسام =====
  const deptSheet = workbook.addWorksheet("الأقسام", {
    views: [{ rightToLeft: true }],
  });

  deptSheet.columns = [
    { header: "القسم", key: "department", width: 30 },
    { header: "عدد المتقدمين", key: "count", width: 20 },
    { header: "النسبة المئوية", key: "percentage", width: 20 },
  ];

  const deptHeader = deptSheet.getRow(1);
  deptHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2D9B6F" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
  deptHeader.height = 28;

  reportData.departmentDistribution.forEach((item, i) => {
    const row = deptSheet.addRow({
      department: item.department,
      count: item.count,
      percentage: `${((item.count / totalApps) * 100).toFixed(1)}%`,
    });
    const bgColor = i % 2 === 0 ? "FFFFFFFF" : "FFF7F6F3";
    row.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE8E6E0" } } };
    });
    row.height = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

// ===== استيراد المتقدمين من ملف Excel =====
export async function parseApplicationsFromExcel(
  buffer: Buffer | Uint8Array
): Promise<ParsedApplication[]> {
  const workbook = new ExcelJS.Workbook();
  // استخدام stream لتجنب مشاكل توافق Buffer/ArrayBuffer في Node 22
  const nodeBuffer = Buffer.from(
    buffer.buffer as ArrayBuffer,
    buffer.byteOffset,
    buffer.byteLength
  );
  await workbook.xlsx.load(nodeBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  // استخدام الورقة الأولى
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const results: ParsedApplication[] = [];

  // تخطي صف الرأس (الصف الأول)
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // تخطي الرأس

    // قراءة القيم — الأعمدة المتوقعة:
    // A: الاسم*, B: البريد*, C: الهاتف*, D: الوظيفة,
    // E: التعليم, F: الخبرة, G: الموقع, H: المهارات, I: ملاحظات
    const getCellValue = (col: number): string => {
      const cell = row.getCell(col);
      const val = cell.value;
      if (val === null || val === undefined) return "";
      if (typeof val === "object" && "text" in val) return String((val as { text: string }).text);
      return String(val).trim();
    };

    const fullName = getCellValue(1);
    const email = getCellValue(2);
    const phone = getCellValue(3);

    // تخطي الصفوف التي تفتقر إلى البيانات الإلزامية
    if (!fullName || !email || !phone) return;

    const jobTitle = getCellValue(4);
    const educationRaw = getCellValue(5);
    const experienceRaw = getCellValue(6);
    const currentLocation = getCellValue(7);
    const skillsRaw = getCellValue(8);
    const notes = getCellValue(9);

    // تحويل مستوى التعليم إلى enum
    const educationMap: Record<string, string> = {
      "الثانوية": "HIGH_SCHOOL",
      "الثانوية العامة": "HIGH_SCHOOL",
      "ثانوية": "HIGH_SCHOOL",
      "دبلوم": "DIPLOMA",
      "بكالوريوس": "BACHELOR",
      "ليسانس": "BACHELOR",
      "ماجستير": "MASTER",
      "دكتوراه": "PHD",
    };
    const educationLevel = educationMap[educationRaw] ?? "BACHELOR";

    // تحويل سنوات الخبرة
    const experienceYears = parseInt(experienceRaw) || 0;

    // تحليل المهارات (مفصولة بفواصل)
    const skills = skillsRaw
      ? skillsRaw
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    results.push({
      fullName,
      email,
      phone,
      jobTitle,
      educationLevel,
      experienceYears,
      currentLocation,
      skills,
      notes,
    });
  });

  return results;
}
