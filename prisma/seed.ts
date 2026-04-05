// ملف البذر — بيانات أولية للنظام
import { PrismaClient, UserRole, EducationLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء زرع البيانات الأولية...");

  // ===== المستخدمون =====
  const hashedPassword = await bcrypt.hash("Admin@2024", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      name: "مدير النظام",
      email: "admin@company.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      name: "أخصائي الموارد البشرية",
      email: "hr@company.com",
      password: hashedPassword,
      role: UserRole.HR,
      isActive: true,
    },
  });

  const interviewer = await prisma.user.upsert({
    where: { email: "interviewer@company.com" },
    update: {},
    create: {
      name: "المحاور الفني",
      email: "interviewer@company.com",
      password: hashedPassword,
      role: UserRole.INTERVIEWER,
      isActive: true,
    },
  });

  console.log("✅ تم إنشاء المستخدمين");

  // ===== الأقسام العشرة =====
  const departments = [
    { name: "خدمة العملاء", code: "CS" },
    { name: "المبيعات والتحويل", code: "SALES" },
    { name: "الشحن والتوصيل", code: "SHIP" },
    { name: "المستودعات والمخزون", code: "WH" },
    { name: "التسويق الرقمي", code: "MKTG" },
    { name: "تقنية المعلومات", code: "TECH" },
    { name: "ضمان الجودة", code: "QA" },
    { name: "الموارد البشرية", code: "HR" },
    { name: "المالية والمحاسبة", code: "FIN" },
    { name: "المشتريات والموردين", code: "PROC" },
  ];

  const createdDepts: Record<string, string> = {};

  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
    createdDepts[dept.code] = created.id;
  }

  console.log("✅ تم إنشاء الأقسام العشرة");

  // ===== قوالب الوظائف العشرة =====
  const jobTemplates = [
    {
      name: "ممثل خدمة عملاء أونلاين",
      departmentCode: "CS",
      description:
        "نبحث عن ممثل خدمة عملاء محترف للتعامل مع استفسارات العملاء عبر القنوات الرقمية المختلفة. ستكون مسؤولاً عن ضمان تجربة عملاء استثنائية وحل المشكلات بكفاءة عالية.",
      requirements:
        "- خبرة لا تقل عن سنة في خدمة العملاء\n- إتقان اللغة العربية كتابةً ومحادثةً\n- مهارات تواصل ممتازة\n- القدرة على العمل تحت الضغط\n- إلمام بأدوات CRM\n- مرونة في أوقات العمل",
      defaultScoringWeights: {
        experience: 15,
        education: 15,
        requiredSkills: 35,
        preferredSkills: 15,
        completeness: 10,
        location: 10,
      },
    },
    {
      name: "أخصائي دعم عملاء",
      departmentCode: "CS",
      description:
        "نبحث عن أخصائي دعم عملاء لمعالجة الشكاوى المعقدة وتقديم حلول متكاملة. الدور يتطلب مهارات تحليلية وقدرة على إدارة الحالات الصعبة.",
      requirements:
        "- خبرة 2-3 سنوات في دعم العملاء\n- مهارات حل النزاعات\n- خبرة في منصات التجارة الإلكترونية\n- إجادة اللغة الإنجليزية\n- مهارات التفاوض",
      defaultScoringWeights: {
        experience: 20,
        education: 15,
        requiredSkills: 30,
        preferredSkills: 15,
        completeness: 10,
        location: 10,
      },
    },
    {
      name: "مدير فريق خدمة العملاء",
      departmentCode: "CS",
      description:
        "مدير فريق خدمة العملاء مسؤول عن قيادة فريق من الممثلين وتحقيق أهداف الجودة والرضا.",
      requirements:
        "- خبرة قيادية 3+ سنوات\n- سجل حافل في تطوير الفرق\n- إلمام بمؤشرات KPI لخدمة العملاء\n- مهارات القيادة والتحفيز",
      defaultScoringWeights: {
        experience: 35,
        education: 15,
        requiredSkills: 25,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "أخصائي مبيعات أونلاين",
      departmentCode: "SALES",
      description:
        "أخصائي مبيعات أونلاين لتحويل الزوار إلى عملاء وزيادة الإيرادات عبر القنوات الرقمية.",
      requirements:
        "- خبرة في المبيعات الرقمية\n- فهم عميق لسلوك المستهلك الرقمي\n- مهارات الإقناع والتفاوض\n- إلمام بأدوات CRM وتحليل البيانات",
      defaultScoringWeights: {
        experience: 15,
        education: 10,
        requiredSkills: 40,
        preferredSkills: 15,
        completeness: 10,
        location: 10,
      },
    },
    {
      name: "مدير فريق مبيعات",
      departmentCode: "SALES",
      description:
        "قيادة فريق المبيعات لتحقيق الأهداف الشهرية والتوسع في قاعدة العملاء.",
      requirements:
        "- خبرة 4+ سنوات في مبيعات التجارة الإلكترونية\n- سجل مثبت في تحقيق الأهداف\n- مهارات بناء الفرق\n- تحليل بيانات المبيعات",
      defaultScoringWeights: {
        experience: 35,
        education: 10,
        requiredSkills: 30,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "منسق شحن وتوصيل",
      departmentCode: "SHIP",
      description:
        "تنسيق عمليات الشحن والتوصيل لضمان وصول الطلبات في الوقت المحدد وبجودة عالية.",
      requirements:
        "- خبرة في لوجستيات الشحن\n- إلمام بمنصات الشحن الإلكترونية\n- مهارات تنظيمية عالية\n- التعامل مع شركات الشحن",
      defaultScoringWeights: {
        experience: 25,
        education: 15,
        requiredSkills: 35,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "مدير فريق شحن",
      departmentCode: "SHIP",
      description:
        "إدارة فريق الشحن والتوصيل وتحسين عمليات اللوجستيات لتقليل التكاليف وزيادة الكفاءة.",
      requirements:
        "- خبرة إدارية 3+ سنوات في اللوجستيات\n- تحسين العمليات\n- إدارة علاقات الموردين\n- تحليل بيانات الأداء",
      defaultScoringWeights: {
        experience: 35,
        education: 15,
        requiredSkills: 25,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "أخصائي مخزون ومستودعات",
      departmentCode: "WH",
      description:
        "إدارة المخزون وتنظيم المستودعات لضمان توفر المنتجات وسلامة البضائع.",
      requirements:
        "- خبرة في إدارة المخزون\n- إلمام بأنظمة WMS\n- مهارات التنظيم الدقيق\n- العمل بنظام الوردية",
      defaultScoringWeights: {
        experience: 25,
        education: 20,
        requiredSkills: 30,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "أخصائي Paid Ads والتسويق الرقمي",
      departmentCode: "MKTG",
      description:
        "إدارة حملات الإعلان المدفوع عبر Google Ads وMeta Ads وتحقيق أقصى عائد على الاستثمار.",
      requirements:
        "- خبرة 2+ سنوات في Paid Ads\n- شهادات Google وMeta معتمدة\n- إتقان تحليل البيانات\n- فهم معمق لـ ROAS وCPA",
      defaultScoringWeights: {
        experience: 20,
        education: 15,
        requiredSkills: 40,
        preferredSkills: 10,
        completeness: 10,
        location: 5,
      },
    },
    {
      name: "مطور متجر إلكتروني",
      departmentCode: "TECH",
      description:
        "تطوير وصيانة المتجر الإلكتروني وتحسين تجربة المستخدم وأداء الموقع.",
      requirements:
        "- خبرة 3+ سنوات في تطوير الويب\n- إتقان React/Next.js أو Vue\n- خبرة في Shopify أو WooCommerce\n- فهم SEO التقني\n- خبرة API Integration",
      defaultScoringWeights: {
        experience: 30,
        education: 15,
        requiredSkills: 35,
        preferredSkills: 10,
        completeness: 5,
        location: 5,
      },
    },
  ];

  for (const template of jobTemplates) {
    await prisma.jobTemplate.upsert({
      where: { id: template.name },
      update: template,
      create: { id: template.name, ...template },
    });
  }

  console.log("✅ تم إنشاء قوالب الوظائف العشرة");
  console.log("");
  console.log("📊 ملخص البيانات المُنشأة:");
  console.log(`   👤 مستخدمون: 3`);
  console.log(`   🏢 أقسام: ${departments.length}`);
  console.log(`   📋 قوالب وظائف: ${jobTemplates.length}`);
  console.log("");
  console.log("🔑 بيانات تسجيل الدخول:");
  console.log(
    "   admin@company.com     | Admin@2024 | مدير النظام"
  );
  console.log(
    "   hr@company.com        | Admin@2024 | HR"
  );
  console.log(
    "   interviewer@company.com | Admin@2024 | محاور"
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ خطأ في البذر:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
