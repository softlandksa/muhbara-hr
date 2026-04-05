// API: استيراد المتقدمين من ملف Excel
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseApplicationsFromExcel } from "@/lib/excel";
import { calculateInitialScore } from "@/lib/scoring";

export async function POST(request: NextRequest) {
  // التحقق من تسجيل الدخول والصلاحية
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  // التحقق أن المستخدم ADMIN أو HR
  const userRole = session.user.role as string;
  if (userRole !== "ADMIN" && userRole !== "HR") {
    return NextResponse.json(
      { error: "ليس لديك صلاحية لاستيراد البيانات" },
      { status: 403 }
    );
  }

  try {
    // قراءة الملف من multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "لم يتم إرسال أي ملف" },
        { status: 400 }
      );
    }

    // التحقق من نوع الملف
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "يجب أن يكون الملف بصيغة Excel (.xlsx أو .xls)" },
        { status: 400 }
      );
    }

    // تحويل الملف إلى Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // تحليل ملف Excel
    const parsedRows = await parseApplicationsFromExcel(buffer);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { error: "لم يتم العثور على بيانات صالحة في الملف" },
        { status: 400 }
      );
    }

    // جلب الوظائف المنشورة للمطابقة
    const publishedJobs = await prisma.job.findMany({
      where: { status: "PUBLISHED" },
      include: {
        skills: true,
        department: true,
      },
    });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // معالجة كل صف
    for (const row of parsedRows) {
      try {
        // التحقق من وجود الطلب مسبقاً (نفس البريد الإلكتروني والوظيفة)
        let matchedJob = null;

        if (row.jobTitle) {
          // مطابقة اسم الوظيفة (غير حساسة لحالة الأحرف)
          matchedJob = publishedJobs.find((job) =>
            job.title.toLowerCase().includes(row.jobTitle.toLowerCase()) ||
            row.jobTitle.toLowerCase().includes(job.title.toLowerCase())
          );
        }

        if (!matchedJob) {
          // إذا لم تُحدد الوظيفة أو لم تُوجد، تخطي الصف
          skipped++;
          if (row.jobTitle) {
            errors.push(
              `السطر: ${row.fullName} — لم يتم العثور على وظيفة منشورة باسم: "${row.jobTitle}"`
            );
          } else {
            errors.push(
              `السطر: ${row.fullName} — لم يتم تحديد اسم الوظيفة`
            );
          }
          continue;
        }

        // التحقق من عدم تكرار الطلب
        const existing = await prisma.application.findFirst({
          where: {
            email: row.email,
            jobId: matchedJob.id,
          },
        });

        if (existing) {
          skipped++;
          errors.push(
            `السطر: ${row.fullName} — طلب مكرر للبريد "${row.email}" في وظيفة "${matchedJob.title}"`
          );
          continue;
        }

        // استخراج أوزان التقييم من الوظيفة
        const weights = matchedJob.scoringWeights as {
          experience: number;
          education: number;
          requiredSkills: number;
          preferredSkills: number;
          completeness: number;
          location: number;
        };

        const requiredSkills = matchedJob.skills
          .filter((s) => s.isRequired)
          .map((s) => s.skillName);

        const preferredSkills = matchedJob.skills
          .filter((s) => !s.isRequired)
          .map((s) => s.skillName);

        // حساب النقطة الأولية
        const scoringResult = calculateInitialScore({
          applicantExperienceYears: row.experienceYears,
          applicantEducation: row.educationLevel,
          applicantSkills: row.skills,
          applicantLocation: row.currentLocation || undefined,
          jobExperienceMin: matchedJob.experienceMin,
          jobExperienceMax: matchedJob.experienceMax ?? undefined,
          jobEducationRequired: matchedJob.educationRequired,
          jobRequiredSkills: requiredSkills,
          jobPreferredSkills: preferredSkills,
          jobLocation: matchedJob.location ?? undefined,
          weights,
        });

        // إنشاء الطلب في قاعدة البيانات
        await prisma.application.create({
          data: {
            jobId: matchedJob.id,
            fullName: row.fullName,
            email: row.email,
            phone: row.phone,
            educationLevel: row.educationLevel as
              | "HIGH_SCHOOL"
              | "DIPLOMA"
              | "BACHELOR"
              | "MASTER"
              | "PHD",
            experienceYears: row.experienceYears,
            currentLocation: row.currentLocation || null,
            skills: row.skills,
            notes: row.notes || null,
            source: "EXCEL_IMPORT",
            status: "NEW",
            initialScore: scoringResult.totalScore,
            initialScoreBreakdown: scoringResult.breakdown,
          },
        });

        imported++;
      } catch (rowError) {
        skipped++;
        errors.push(
          `السطر: ${row.fullName} — خطأ غير متوقع: ${rowError instanceof Error ? rowError.message : "خطأ مجهول"}`
        );
      }
    }

    return NextResponse.json(
      {
        imported,
        skipped,
        errors: errors.slice(0, 20), // إرجاع أول 20 خطأ فقط لتجنب الاستجابة الضخمة
        total: parsedRows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("خطأ في استيراد الملف:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الملف" },
      { status: 500 }
    );
  }
}
