# الـ Prompts الخمسة لـ Claude Code
## نسخ كل prompt كاملاً وألصقه في Claude Code مباشرةً

---

## كيفية الاستخدام

1. ثبّت Claude Code: `npm install -g @anthropic-ai/claude-code`
2. أنشئ مجلد المشروع الفارغ: `mkdir recruitment-system && cd recruitment-system`
3. ضع ملف `CLAUDE.md` داخل المجلد.
4. شغّل Claude Code: `claude`
5. انسخ الـ Prompt الخاص بالـ Phase وألصقه.
6. اترك Claude Code يعمل — لا تقاطعه إلا إذا سألك سؤالاً.
7. بعد انتهاء كل Phase، اختبر الكود، ثم انتقل للـ Phase التالية.

---

---

# ═══════════════════════════════
# PHASE 1 PROMPT
# Setup + Auth + Layout + Design System
# ═══════════════════════════════

```
اقرأ ملف CLAUDE.md أولاً واحفظ كل التعليمات الموجودة فيه.

أنت الآن في Phase 1 من بناء نظام إدارة التوظيف العربي للتجارة الإلكترونية.

## المطلوب في هذه المرحلة — نفّذ بالترتيب:

### 1. إنشاء مشروع Next.js
```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --yes
```

### 2. تثبيت جميع المكتبات
```bash
npm install prisma @prisma/client @supabase/supabase-js
npm install next-auth@beta @auth/prisma-adapter
npm install react-hook-form @hookform/resolvers zod
npm install @tanstack/react-table recharts exceljs
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install date-fns zustand react-hot-toast lucide-react
npm install bcryptjs
npm install --save-dev @types/bcryptjs
npx shadcn-ui@latest init --yes
npx shadcn-ui@latest add button card input label select table badge dialog sheet tabs form toast separator avatar dropdown-menu
```

### 3. إنشاء Prisma Schema الكامل
أنشئ ملف `prisma/schema.prisma` يحتوي على الـ models التالية بالضبط:

**Models المطلوبة:**
- `User` (id, name, email, password, role: ADMIN/HR/INTERVIEWER, departmentId, avatar, isActive, createdAt, updatedAt)
- `Department` (id, name, code: CS/SALES/SHIP/WH/MKTG/TECH/QA/HR/FIN/PROC, managerId, parentId, jobs, createdAt)
- `Job` (id, title, departmentId, location, isRemote, type: FULL_TIME/PART_TIME/REMOTE/HYBRID/TEMPORARY, status: DRAFT/PENDING_APPROVAL/PUBLISHED/CLOSED/ARCHIVED/REJECTED, ecommerceCategory, templateCode, description, requirements, salaryMin, salaryMax, currency: default "SAR", showSalary, experienceMin, experienceMax, educationRequired: HIGH_SCHOOL/DIPLOMA/BACHELOR/MASTER/PHD, headcount, deadline, scoringWeights: Json, postedById, approvedById, publishedAt, closedAt, createdAt, updatedAt)
- `JobSkill` (id, jobId, skillName, isRequired)
- `JobTemplate` (id, name, departmentCode, description, requirements, defaultScoringWeights: Json, createdAt)
- `JobAuditLog` (id, jobId, action, oldStatus, newStatus, changedById, note, changedAt)
- `Application` (id, jobId, fullName, email, phone, cvUrl, linkedinUrl, educationLevel, experienceYears, currentLocation, skills: String[], source: WEBSITE/LINKEDIN/REFERRAL/EMAIL/EXCEL_IMPORT/OTHER, status: NEW/UNDER_REVIEW/QUALIFIED/INTERVIEW_SCHEDULED/OFFER_SENT/ACCEPTED/REJECTED/WITHDRAWN, initialScore, initialScoreBreakdown: Json, finalScore, notes, appliedAt, updatedAt)
- `ApplicationStatusLog` (id, applicationId, oldStatus, newStatus, changedBy, note, changedAt)
- `Interview` (id, applicationId, jobId, type: PHONE/VIDEO/IN_PERSON/TECHNICAL/HR, status: SCHEDULED/COMPLETED/CANCELLED/NO_SHOW/RESCHEDULED, scheduledAt, duration: default 60, location, interviewerId, preparationNote, score, scoreBreakdown: Json, completedAt, createdAt, updatedAt)

### 4. إنشاء ملف `lib/db.ts`
Prisma singleton pattern صحيح لـ Next.js يمنع تعدد الاتصالات في development.

### 5. إنشاء ملف `lib/auth.ts`
NextAuth v5 config مع:
- CredentialsProvider (email + password)
- PrismaAdapter
- Session strategy: "jwt"
- Callbacks لإضافة role وid للـ session
- Pages: { signIn: '/login' }

### 6. إنشاء ملف `lib/supabase.ts`
Supabase client للـ browser وآخر للـ server (service role).

### 7. إنشاء Route Groups
```
app/
  (auth)/
    login/
      page.tsx        ← صفحة تسجيل الدخول
  (dashboard)/
    layout.tsx        ← Layout محمي بـ auth يشمل Sidebar + Header
    dashboard/
      page.tsx        ← placeholder بسيط
    jobs/
      page.tsx        ← placeholder
    applicants/
      page.tsx        ← placeholder
    interviews/
      page.tsx        ← placeholder
    reports/
      page.tsx        ← placeholder
    settings/
      page.tsx        ← placeholder
```

### 8. إنشاء CSS Variables في `app/globals.css`
أضف كل الألوان من CLAUDE.md كـ CSS variables في `:root`.
استورد خطي Noto Kufi Arabic و Tajawal من Google Fonts.
اضبط `html { direction: rtl; font-family: 'Noto Kufi Arabic', sans-serif; }`.

### 9. إنشاء Sidebar Component
ملف: `components/layout/Sidebar.tsx`
- خلفية `#1A1A2E`، عرض `260px`
- شعار الشركة في الأعلى (اسم من env variable)
- عناصر التنقل مع أيقونة Lucide ونص عربي:
  - لوحة التحكم (LayoutDashboard)
  - الوظائف (Briefcase)
  - المتقدمون (Users)
  - المقابلات (Calendar)
  - التقارير (BarChart3)
  - الإعدادات (Settings)
- العنصر النشط: خلفية `#4361EE`، border-radius `10px`
- في الأسفل: اسم المستخدم + دوره + زر تسجيل الخروج
- يُخفى على الشاشات الصغيرة ويُفتح بـ toggle

### 10. إنشاء Header Component
ملف: `components/layout/Header.tsx`
- ارتفاع `64px`، خلفية بيضاء، border-bottom خفيف
- Breadcrumb على اليمين (RTL)
- أيقونة الإشعارات + avatar المستخدم على اليسار
- زر فتح/إغلاق Sidebar على الجوال

### 11. إنشاء صفحة Login
ملف: `app/(auth)/login/page.tsx`
- وسط الشاشة، كارد بيضاء `max-w-md`
- الشعار/اسم النظام في الأعلى
- حقل البريد الإلكتروني (label: "البريد الإلكتروني")
- حقل كلمة المرور (label: "كلمة المرور") مع زر إظهار/إخفاء
- زر "تسجيل الدخول" (primary, full width)
- رسالة خطأ حمراء تظهر عند فشل الدخول
- بدون تسجيل جديد (النظام داخلي)

### 12. حماية الـ Dashboard Layout
`app/(dashboard)/layout.tsx` يتحقق من الـ session، إذا لم تكن موجودة يعيد التوجيه لـ `/login`.

### 13. إنشاء `prisma/seed.ts`
يحتوي على:
- 3 مستخدمين: admin@company.com / hr@company.com / interviewer@company.com (كلمة المرور: Admin@2024 مشفرة بـ bcrypt)
- 10 أقسام بأكوادها
- 10 قوالب وظائف جاهزة (من CLAUDE.md)

### 14. إضافة السكريبت في `package.json`
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```

### 15. إنشاء ملف `.env.example`
بكل المتغيرات المطلوبة (بدون قيم حقيقية).

### 16. تشغيل التحقق النهائي
```bash
npx tsc --noEmit       # تحقق من TypeScript
npm run build          # تحقق من البناء
```

## معايير النجاح لهذه المرحلة:
- `npm run build` يكمل بدون أخطاء
- صفحة Login تظهر بالعربية واتجاه RTL صحيح
- Sidebar يظهر بعد تسجيل الدخول
- الـ CSS Variables تعمل
- الخط العربي يظهر بشكل صحيح
```

---

---

# ═══════════════════════════════
# PHASE 2 PROMPT
# إدارة الوظائف — CRUD كامل + القوالب
# ═══════════════════════════════

```
اقرأ ملف CLAUDE.md أولاً. Phase 1 مكتملة والمشروع يعمل.

أنت الآن في Phase 2: بناء وحدة إدارة الوظائف بالكامل.

## المطلوب — نفّذ بالترتيب:

### 1. API Routes للوظائف

أنشئ:
- `app/api/jobs/route.ts` — GET (قائمة مع فلاتر + pagination) و POST (إنشاء وظيفة جديدة)
- `app/api/jobs/[id]/route.ts` — GET (تفاصيل) و PUT (تعديل) و DELETE (حذف)
- `app/api/jobs/[id]/status/route.ts` — PATCH (تغيير الحالة مع تسجيل في audit log)
- `app/api/jobs/[id]/clone/route.ts` — POST (استنساخ وظيفة)
- `app/api/job-templates/route.ts` — GET (قائمة القوالب)

**قواعد API:**
- كل route محمية بـ auth (تحقق من session)
- Zod validation على كل input
- أخطاء واضحة بالعربية: `{ error: "المسمى الوظيفي مطلوب" }`
- تسجيل كل تغيير status في `JobAuditLog` تلقائياً

### 2. Zod Schemas
ملف: `lib/validations/job.ts`
```typescript
export const createJobSchema = z.object({
  title: z.string().min(3, "المسمى الوظيفي يجب أن يكون 3 أحرف على الأقل"),
  departmentId: z.string().min(1, "القسم مطلوب"),
  location: z.string().optional(),
  isRemote: z.boolean().default(false),
  type: z.enum(["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "TEMPORARY"]),
  description: z.string().min(10, "الوصف مطلوب"),
  requirements: z.string().min(10, "المتطلبات مطلوبة"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  currency: z.string().default("SAR"),
  showSalary: z.boolean().default(false),
  experienceMin: z.number().min(0).default(0),
  experienceMax: z.number().optional(),
  educationRequired: z.enum(["HIGH_SCHOOL","DIPLOMA","BACHELOR","MASTER","PHD"]).optional(),
  headcount: z.number().min(1).default(1),
  deadline: z.string().optional(),
  skills: z.array(z.object({
    skillName: z.string(),
    isRequired: z.boolean()
  })).default([]),
  scoringWeights: z.object({
    experience: z.number(),
    education: z.number(),
    requiredSkills: z.number(),
    preferredSkills: z.number(),
    completeness: z.number(),
    location: z.number(),
  }).refine(w => Object.values(w).reduce((a,b) => a+b, 0) === 100, {
    message: "مجموع الأوزان يجب أن يساوي 100"
  })
})
```

### 3. صفحة قائمة الوظائف
ملف: `app/(dashboard)/jobs/page.tsx`

**شريط الأدوات (Toolbar):**
- حقل بحث (البحث في: العنوان، القسم، الوصف) — debounced 300ms
- Dropdown فلتر القسم (يجلب الأقسام من الـ API)
- Dropdown فلتر الحالة (مسودة / في الانتظار / منشورة / مغلقة / مؤرشفة / مرفوضة)
- Dropdown فلتر نوع الوظيفة
- زر "تصفير الفلاتر" يظهر فقط عند وجود فلتر نشط (badge بعدد الفلاتر)
- زر "+ وظيفة جديدة" (primary، أيقونة Plus)
- زر "استيراد Excel" (secondary، أيقونة Upload)
- زر "تصدير Excel" (secondary، أيقونة Download)
- Toggle: عرض جدول / عرض كاردس (أيقونتي List و Grid)

**جدول الوظائف (TanStack Table):**
الأعمدة:
1. Checkbox للتحديد المتعدد
2. المسمى الوظيفي (bold) + اسم القسم (صغير تحته، لون secondary)
3. نوع الوظيفة (Badge رمادية)
4. الحالة (Badge ملوّنة حسب الحالة)
5. الطلبات (رقم + progress bar صغير بجانبه من max 50)
6. متوسط نقاط التقييم (رقم/100 + لون حسب القيمة)
7. الموعد النهائي (يتحول لأحمر إذا كان خلال 7 أيام)
8. تاريخ الإنشاء
9. الإجراءات (DropdownMenu: عرض، تعديل، تغيير الحالة، استنساخ، أرشفة — كل خيار مشروط بالحالة الحالية)

**ألوان الـ Badges:**
- منشورة: bg `#DCFCE7` نص `#166534`
- مسودة: bg `#F3F4F6` نص `#374151`
- في الانتظار: bg `#DBEAFE` نص `#1E40AF`
- مغلقة: bg `#FEF3C7` نص `#92400E`
- مؤرشفة: bg `#F3F4F6` نص `#6B7280`
- مرفوضة: bg `#FEE2E2` نص `#991B1B`

**Bulk Actions Bar:**
يظهر أسفل الـ toolbar عند تحديد عنصر أو أكثر:
"تم تحديد X وظيفة" + أزرار: نشر المحدد، أرشفة المحدد، حذف المحدد (الحذف بتأكيد Dialog).

**Pagination:**
أزرار الصفحات + Select لعدد الصفوف (10/25/50) + نص "عرض X من Y وظيفة".

**عرض الكاردس (Grid View):**
3 كاردس في الصف (responsive: 2 على md، 1 على sm).
كل كارد: المسمى، القسم، الحالة (badge)، عدد الطلبات، الـ deadline، زران (عرض / تعديل).

**Skeleton Loader:**
يظهر أثناء جلب البيانات — 5 صفوف skeleton للجدول أو 6 كاردس skeleton.

**Empty State:**
أيقونة Briefcase كبيرة (رمادية)، نص "لا توجد وظائف بعد"، زر "+ أضف وظيفة جديدة".

### 4. صفحة إنشاء/تعديل الوظيفة
ملف: `app/(dashboard)/jobs/new/page.tsx` و `app/(dashboard)/jobs/[id]/edit/page.tsx`

**نموذج متعدد الخطوات (Multi-step form) — 4 خطوات:**

**شريط التقدم في الأعلى:** 4 دوائر مرقمة (1، 2، 3، 4) مع خطوط توصيل — الخطوة الحالية ملوّنة بالأزرق.

**الخطوة 1 — المعلومات الأساسية:**
- المسمى الوظيفي * (Input)
- القسم * (Select — يجلب من API)
- تطبيق قالب جاهز (Select — اختياري، عند الاختيار يملأ باقي الحقول تلقائياً)
- الموقع (Input + Checkbox "عن بُعد" — عند التفعيل يُخفي حقل الموقع)
- نوع الوظيفة * (RadioGroup: دوام كامل / جزئي / عن بُعد / هجين / مؤقت)
- عدد الشواغر (NumberInput، الحد الأدنى 1)

**الخطوة 2 — التفاصيل:**
- وصف الوظيفة * (Tiptap Editor مع Bold, Italic, Bullet List, Numbered List)
- متطلبات الوظيفة * (Tiptap Editor)
- المهارات (TagInput مخصص):
  - حقل كتابة + زر إضافة أو Enter
  - كل مهارة تظهر كـ tag مع Checkbox "إلزامية" ✓ وزر حذف ✕
  - Tags إلزامية: خلفية زرقاء. Tags مفضلة: خلفية رمادية.
- سنوات الخبرة (حقلان: "من" و "إلى" — NumberInput)
- المؤهل العلمي (Select: ثانوية / دبلوم / بكالوريوس / ماجستير / دكتوراه)

**الخطوة 3 — الشروط المالية والإعدادات:**
- الراتب (حقلان: من / إلى + Select للعملة: ريال / درهم / دولار)
- Checkbox "إظهار الراتب للمتقدم"
- الموعد النهائي للتقديم (DatePicker بالتقويم العربي)
- Checkbox "تفعيل التقييم التلقائي"

**الخطوة 4 — معايير التقييم (تظهر فقط إذا فُعّل التقييم):**
6 Sliders (0-100) لكل معيار:
- الخبرة، المؤهل العلمي، المهارات الإلزامية، المهارات المفضلة، اكتمال الملف، الموقع
- Counter في الأعلى يعرض المجموع الحالي
- يتحول لأحمر إذا لم يساوِ 100
- زر "إعادة تعيين للقيم الافتراضية"

**أزرار التنقل:**
- السابق (secondary)
- التالي (primary)
- في الخطوة الأخيرة: "حفظ كمسودة" (secondary) و "حفظ وإرسال للموافقة" (primary)

### 5. صفحة تفاصيل الوظيفة
ملف: `app/(dashboard)/jobs/[id]/page.tsx`

**Header:**
اسم الوظيفة (كبير) + القسم + الحالة (badge) + متوسط نقاط التقييم + أزرار الإجراءات (تعديل، تغيير الحالة).

**Tabs (shadcn Tabs):**
- التفاصيل: الوصف والمتطلبات والمهارات والراتب — formatted بشكل جميل
- المتقدمون: جدول مبسط بأسماء المتقدمين ونقاطهم وحالاتهم + رابط لصفحة المتقدم
- المقابلات: قائمة المقابلات المرتبطة بهذه الوظيفة
- سجل التغييرات: Timeline بكل تغييرات الـ status (من، متى، ماذا، ملاحظة)

### 6. استيراد Excel
ملف: `app/api/jobs/import/route.ts` و component `ImportJobsModal`

القالب المتوقع (أعمدة بالعربية):
المسمى الوظيفي | القسم | الموقع | نوع الوظيفة | الراتب من | الراتب إلى | المؤهل | الخبرة من | الخبرة إلى | الموعد النهائي | المهارات

**المودال:**
1. زر "تنزيل قالب Excel" (ينشئ ملف ExcelJS جاهز)
2. Dropzone لرفع الملف
3. Preview جدول بالبيانات قبل الحفظ مع تلوين الصفوف الخاطئة بالأحمر
4. زر "استيراد" — يحفظ الصحيح ويتجاهل الخاطئ مع تقرير: "تم استيراد X، فشل Y"

### 7. تصدير Excel
`app/api/jobs/export/route.ts`
يولّد ملف ExcelJS بكل بيانات الوظائف مع ورقة ثانية بإحصائياتها.
يحترم الفلاتر المطبقة (query params).

## معايير النجاح:
- إنشاء وظيفة جديدة من النموذج يعمل بنجاح وتظهر في القائمة
- الفلاتر والبحث يعملان فورياً
- تغيير الحالة يُسجَّل في audit log
- الاستيراد والتصدير Excel يعملان
- لا أخطاء TypeScript
```

---

---

# ═══════════════════════════════
# PHASE 3 PROMPT
# إدارة المتقدمين + نظام التقييم الأولي
# ═══════════════════════════════

```
اقرأ ملف CLAUDE.md أولاً. Phases 1 و 2 مكتملتان.

أنت الآن في Phase 3: إدارة المتقدمين ونظام التقييم الأولي.

## المطلوب — نفّذ بالترتيب:

### 1. منطق التقييم الأولي
ملف: `lib/scoring.ts`

```typescript
export interface ScoringWeights {
  experience: number;
  education: number;
  requiredSkills: number;
  preferredSkills: number;
  completeness: number;
  location: number;
}

export interface ScoreBreakdown {
  experience: { score: number; max: number; reason: string };
  education: { score: number; max: number; reason: string };
  requiredSkills: { score: number; max: number; reason: string; matched: string[]; missing: string[] };
  preferredSkills: { score: number; max: number; reason: string; matched: string[] };
  completeness: { score: number; max: number; reason: string };
  location: { score: number; max: number; reason: string };
}

export type Recommendation = "EXCELLENT" | "GOOD" | "AVERAGE" | "WEAK";

export interface ScoringResult {
  totalScore: number;
  breakdown: ScoreBreakdown;
  recommendation: Recommendation;
  recommendationText: string; // بالعربية
  recommendationColor: string; // hex color
}

export function calculateInitialScore(
  applicant: {
    experienceYears: number;
    educationLevel: string | null;
    skills: string[];
    currentLocation: string | null;
    cvUrl: string | null;
    linkedinUrl: string | null;
    phone: string;
    email: string;
  },
  job: {
    experienceMin: number;
    experienceMax: number | null;
    educationRequired: string | null;
    location: string | null;
    isRemote: boolean;
    skills: { skillName: string; isRequired: boolean }[];
    scoringWeights: ScoringWeights;
  }
): ScoringResult {
  // احسب كل معيار:

  // الخبرة: إذا >= experienceMin → النقطة الكاملة
  //          إذا < experienceMin → (applicant.experienceYears / job.experienceMin) × weight
  //          إذا > experienceMax → النقطة الكاملة (لا عقاب للخبرة الزائدة)

  // المؤهل: PHD=100% MASTER=90% BACHELOR=75% DIPLOMA=40% HIGH_SCHOOL=15% من الوزن
  //          إذا أعلى من المطلوب → النقطة الكاملة

  // المهارات الإلزامية: (عدد المهارات الإلزامية الموجودة / إجمالي المهارات الإلزامية) × weight
  // المهارات المفضلة: نفس الحساب

  // اكتمال الملف: CV موجود=40% LinkedIn=20% الهاتف=20% البريد=20%

  // الموقع: مطابق تماماً=100% نفس المدينة=70% نفس البلد=40% مختلف=0%
  //          إذا الوظيفة عن بُعد → النقطة الكاملة دائماً

  // Recommendation:
  // 80-100 → EXCELLENT: "مرشح ممتاز — يُنصح بالمقابلة فوراً" (#2D9B6F)
  // 60-79  → GOOD: "مرشح جيد — يستحق المراجعة" (#4361EE)
  // 40-59  → AVERAGE: "مرشح متوسط — يحتاج تقييم إضافي" (#E07B39)
  // 0-39   → WEAK: "مرشح ضعيف — لا يستوفي الحد الأدنى" (#C0392B)
}
```

### 2. API Routes للمتقدمين
- `app/api/applicants/route.ts` — GET (قائمة مع فلاتر) و POST (تقديم طلب جديد + يحسب التقييم تلقائياً)
- `app/api/applicants/[id]/route.ts` — GET و PUT و DELETE
- `app/api/applicants/[id]/status/route.ts` — PATCH (تغيير الحالة مع log)
- `app/api/applicants/[id]/notes/route.ts` — POST (إضافة ملاحظة)
- `app/api/applicants/import/route.ts` — POST (استيراد من Excel)
- `app/api/applicants/export/route.ts` — GET (تصدير Excel بورقتين)
- `app/api/upload/cv/route.ts` — POST (رفع CV لـ Supabase Storage، يُعيد الرابط)

**مهم:** عند POST جديد في `/api/applicants`:
1. احفظ بيانات المتقدم
2. اجلب بيانات الوظيفة + مهاراتها + أوزان التقييم
3. استدع `calculateInitialScore()`
4. احفظ `initialScore` و `initialScoreBreakdown` في نفس الـ record

### 3. صفحة قائمة المتقدمين
ملف: `app/(dashboard)/applicants/page.tsx`

**الفلاتر:**
- بحث (الاسم، البريد، الهاتف)
- فلتر الوظيفة (Select يجلب الوظائف المنشورة)
- فلتر الحالة (8 خيارات)
- فلتر نطاق النقاط (Slider مزدوج: 0 إلى 100)
- فلتر تاريخ التقديم (DateRangePicker)
- فلتر المصدر

**جدول المتقدمين (TanStack Table):**
الأعمدة:
1. Checkbox
2. الاسم + البريد (صغير تحته)
3. الوظيفة المتقدم إليها
4. نقاط التقييم الأولي — رقم + لون دائرة (أخضر/أصفر/أحمر) + Tooltip يشرح التفاصيل
5. الحالة — Badge + Progress bar خطي بالألوان (يمثل موقعه في Pipeline)
6. تاريخ التقديم
7. المقابلة — إذا مجدولة تعرض التاريخ والوقت وإلا تعرض "—"
8. نقاط ما بعد المقابلة (إذا وجدت)
9. الإجراءات (عرض، تغيير الحالة، جدولة مقابلة، ملاحظة)

**Tooltip تفاصيل النقاط:**
عند hover على نقطة التقييم يظهر Popover يعرض تفاصيل كل معيار:
"الخبرة: 20/25 — المتقدم لديه 4 سنوات والمطلوب 3"
"المهارات الإلزامية: 25/30 — موجودة: React, TypeScript — ناقصة: AWS"
... إلخ

### 4. صفحة تفاصيل المتقدم
ملف: `app/(dashboard)/applicants/[id]/page.tsx`

**Layout مقسوم:**
- يمين (30%): بطاقة ثابتة (sticky)
- يسار (70%): تبويبات

**البطاقة اليمنى:**
- اسم المتقدم (22px bold)
- الوظيفة المتقدم إليها (رابط للوظيفة)
- Badge الحالة الحالية
- **مؤشر النقاط الدائري:** دائرة SVG تعرض النقطة كـ progress (اللون حسب النقطة)
  - النقطة الكبيرة في المنتصف (مثل: 73)
  - نص التوصية تحتها بالعربية
- إذا وجدت نقطة ما بعد المقابلة: النقطة النهائية أسفلها
- بيانات التواصل (أيقونة + نص، كل بند قابل للنسخ)
- المصدر وتاريخ التقديم
- **أزرار الإجراءات السريعة:**
  - تغيير الحالة (DropdownMenu)
  - جدولة مقابلة (يفتح Modal)
  - إضافة ملاحظة

**التبويبات:**
- **بيانات التقديم:** كل الحقول المدخلة في جدول أنيق
- **تقرير التقييم:** جدول مفصل بكل معيار (المعيار / النقطة / القصوى / السبب) + Donut chart للتوزيع
- **السيرة الذاتية:** iframe لعرض PDF (إذا كان رابط Supabase) أو زر تنزيل
- **المقابلات:** قائمة المقابلات مع النتائج والتقييمات
- **الملاحظات:** قائمة ملاحظات مع textarea لإضافة جديدة
- **سجل الإجراءات:** Timeline بكل تغيير حالة (دائرة ملوّنة + نص + تاريخ)

### 5. رفع السيرة الذاتية
في نموذج إضافة متقدم جديد:
- Dropzone لرفع PDF (drag & drop + click)
- Max size: 5MB
- عند الرفع: يُرسل لـ `/api/upload/cv` الذي يرفعه لـ Supabase Storage ويُعيد الرابط
- يُعرض اسم الملف + أيقونة PDF + زر حذف
- إذا كان الملف موجوداً مسبقاً يُعرض رابط "عرض" + "استبدال"

### 6. استيراد/تصدير Excel للمتقدمين
مشابه للوظائف — أعمدة القالب:
الاسم الكامل | البريد الإلكتروني | الهاتف | الوظيفة | المؤهل | سنوات الخبرة | المصدر | المهارات (مفصولة بفاصلة)

التصدير: ورقة 1 = بيانات المتقدمين، ورقة 2 = تفاصيل التقييم لكل متقدم.

## معايير النجاح:
- إضافة متقدم جديد يحسب النقاط تلقائياً ويحفظها
- الـ Tooltip يعرض تفاصيل النقاط بشكل صحيح
- رفع PDF يعمل ويُخزن في Supabase
- Timeline سجل الإجراءات يظهر بترتيب صحيح
- لا أخطاء TypeScript
```

---

---

# ═══════════════════════════════
# PHASE 4 PROMPT
# المقابلات + التقييم بعد المقابلة
# ═══════════════════════════════

```
اقرأ ملف CLAUDE.md أولاً. Phases 1 و 2 و 3 مكتملة.

أنت الآن في Phase 4: نظام إدارة المقابلات والتقييم بعد المقابلة.

## المطلوب — نفّذ بالترتيب:

### 1. API Routes للمقابلات
- `app/api/interviews/route.ts` — GET (قائمة مع فلاتر) و POST (جدولة مقابلة جديدة)
- `app/api/interviews/[id]/route.ts` — GET و PUT و PATCH (تغيير الحالة) و DELETE
- `app/api/interviews/[id]/evaluate/route.ts` — POST (حفظ التقييم بعد المقابلة + حساب النقطة النهائية)

### 2. صفحة المقابلات — عرض التقويم
ملف: `app/(dashboard)/interviews/page.tsx`

**Tabs للعرض:**
- التقويم الأسبوعي (الافتراضي)
- عرض قائمة

**عرض التقويم الأسبوعي:**
- شبكة 7 أيام × 12 ساعة (8 صباحاً إلى 8 مساءً)
- كل ساعة = خلية ارتفاعها 60px
- رأس الجدول: أيام الأسبوع بالعربية (الأحد، الاثنين، ...)
- الجانب الأيسر: الوقت (8:00 ص, 9:00 ص, ...)
- المقابلات تظهر كـ events ملوّنة بالحالة:
  - مجدولة: أزرق (#4361EE)
  - مكتملة: أخضر (#2D9B6F)
  - ملغاة: رمادي
  - لم يحضر: أحمر
- عند النقر على event: Popover بالتفاصيل + أزرار سريعة
- أزرار التنقل: السابق / اليوم / التالي
- عند النقر على خلية فارغة: يفتح Modal الجدولة

**عرض القائمة:**
جدول بالمقابلات مرتبة زمنياً مع الفلاتر (الحالة، المحاور، الوظيفة).

### 3. Modal جدولة مقابلة جديدة
Component: `components/interviews/ScheduleInterviewModal.tsx`

الحقول:
- اختيار المتقدم * (Searchable Combobox — بحث بالاسم أو الوظيفة)
- الوظيفة (تعبأ تلقائياً من المتقدم المختار)
- نوع المقابلة * (Select: هاتفية / فيديو / حضورية / تقنية / HR)
- التاريخ والوقت * (DateTimePicker)
- المدة * (Select: 30 / 45 / 60 / 90 دقيقة)
- المحاور * (Select من المستخدمين — يظهر اسم المحاور ودوره)
- رابط الاجتماع أو عنوان الحضور (Input — يتغير الـ label حسب نوع المقابلة)
- ملاحظات تحضيرية (Textarea)
- Checkbox "إرسال إشعار للمتقدم" (الافتراضي: مفعّل)

عند الحفظ:
1. ينشئ record في Interview
2. يغيّر حالة الطلب لـ INTERVIEW_SCHEDULED تلقائياً
3. إذا فُعّل الإشعار: يُسجل في الـ log أن إشعاراً أُرسل (الإرسال الفعلي في Phase 5)

### 4. نموذج التقييم بعد المقابلة
Component: `components/interviews/EvaluationForm.tsx`

يظهر عند النقر على "إضافة تقييم" على مقابلة مكتملة.

**الشكل: جانبان (2-column layout)**

**اليمين — معلومات المقابلة:**
- اسم المتقدم + الوظيفة
- التاريخ والوقت والمدة
- نقاط التقييم الأولي (للمرجعية)

**اليسار — نموذج التقييم:**

النموذج **ديناميكي** — يكتشف نوع الوظيفة ويعرض الأوزان المناسبة:

```typescript
function getEvaluationTemplate(job: { ecommerceCategory: string }) {
  switch(job.ecommerceCategory) {
    case 'CUSTOMER_SERVICE':
    case 'SALES':
      return {
        technical: { label: "الكفاءة الوظيفية", max: 35, items: [
          { key: "tools", label: "إتقان أدوات الدعم والـ CRM", max: 12 },
          { key: "speed", label: "سرعة الاستجابة وإدارة الوقت", max: 11 },
          { key: "scenarios", label: "التعامل مع السيناريوهات الصعبة", max: 12 }
        ]},
        soft: { label: "المهارات الشخصية", max: 40, items: [
          { key: "patience", label: "الصبر والهدوء تحت الضغط", max: 15 },
          { key: "communication", label: "مهارات التواصل الكتابي والشفهي", max: 15 },
          { key: "persuasion", label: "الإقناع والتأثير", max: 10 }
        ]},
        fit: { label: "التوافق الوظيفي", max: 25, items: [
          { key: "culture", label: "التوافق مع ثقافة خدمة العميل", max: 10 },
          { key: "motivation", label: "الدافعية والاستمرارية", max: 10 },
          { key: "expectations", label: "التوقعات الواقعية", max: 5 }
        ]}
      }
    case 'TECH':
      return { /* أوزان تقنية: technical=55, soft=20, fit=25 */ }
    case 'TEAM_LEADER':
    case 'MANAGEMENT':
      return { /* أوزان قيادة: technical=40, soft=30, fit=30 */ }
    default:
      return { /* أوزان افتراضية: 40/30/30 */ }
  }
}
```

**عرض كل قسم:**
- عنوان القسم + المجموع المتاح (مثل: "الكفاءة الوظيفية — 40 نقطة")
- كل معيار: label + Slider (0 إلى max الخاص به) + الرقم المختار يظهر على اليمين
- الـ Slider يتدرج في اللون: أحمر عند 0 ← أصفر عند المنتصف ← أخضر عند القصوى
- مجموع القسم يتحدث تلقائياً

**أسفل النموذج:**
- Textarea "نقاط القوة" (placeholder: اذكر 2-3 نقاط قوة رئيسية...)
- Textarea "نقاط الضعف" (placeholder: اذكر نقاط تحتاج تطوير...)
- Textarea "ملاحظات إضافية"
- **توصية المحاور (RadioGroup — إلزامي قبل الحفظ):**
  - ○ مقبول بشدة — أنصح بالتعيين فوراً (أخضر غامق)
  - ○ مقبول — أنصح بالتعيين (أخضر)
  - ○ محايد — يحتاج رأي إضافي (رمادي)
  - ○ مرفوض — لا أنصح بالتعيين (أحمر)
  - ○ مرفوض بشدة — غير مناسب تماماً (أحمر غامق)

**شريط ملخص النقاط (Sticky في الأسفل):**
يظهر دائماً:
"الأولي: 73 | المقابلة: [يتحدث مباشرة] | النهائية: [يُحسب: 73×40% + x×60%]"

**زر الحفظ:**
عند الحفظ:
1. يحفظ `scoreBreakdown` و `score` في Interview
2. يحسب `finalScore = (initialScore × 0.4) + (interviewScore × 0.6)`
3. يحفظ `finalScore` في Application
4. يغيّر حالة Interview لـ COMPLETED
5. Toast: "تم حفظ التقييم بنجاح"

### 5. تحديث صفحة تفاصيل المتقدم
في تبويب المقابلات، أضف:
- لكل مقابلة مكتملة: زر "عرض التقييم" يفتح Modal عرض التقييم كـ read-only
- لكل مقابلة بدون تقييم: زر "إضافة تقييم" يفتح EvaluationForm

### 6. إشعارات بسيطة (Toast فقط)
- عند جدولة مقابلة: "تمت جدولة المقابلة بنجاح"
- عند تغيير الحالة: "تم تغيير الحالة إلى [الحالة الجديدة]"
- عند حفظ التقييم: "تم حفظ التقييم — النقطة النهائية: [X]/100"

## معايير النجاح:
- التقويم يعرض المقابلات في الأوقات الصحيحة
- النقطة النهائية تُحسب بشكل صحيح (40%/60%)
- النموذج يتغير تلقائياً حسب نوع الوظيفة
- الـ Slider يتدرج في الألوان
- لا أخطاء TypeScript
```

---

---

# ═══════════════════════════════
# PHASE 5 PROMPT
# Dashboard + Reports + Polish النهائي
# ═══════════════════════════════

```
اقرأ ملف CLAUDE.md أولاً. Phases 1 إلى 4 مكتملة. هذه المرحلة الأخيرة.

أنت الآن في Phase 5: لوحة التحكم، التقارير، والإعدادات، ثم الصقل النهائي.

## المطلوب — نفّذ بالترتيب:

### 1. API للإحصائيات
ملف: `app/api/stats/route.ts`
يُعيد JSON يحتوي على:
```typescript
{
  // الكاردس الأربع الرئيسية
  activeJobs: number,
  activeJobsDelta: number,       // التغيير عن الشهر الماضي
  totalApplications: number,
  applicationsDelta: number,
  scheduledInterviews: number,   // هذا الأسبوع
  completedJobsThisMonth: number,

  // بيانات الشارتس
  applicationsByJob: { jobTitle: string, count: number }[],    // أعلى 8
  applicationsByStatus: { status: string, label: string, count: number }[],
  hiringTrend: { month: string, applications: number, hired: number }[], // 12 شهر
  applicationsBySource: { source: string, label: string, count: number }[],

  // القوائم
  recentApplications: { id, fullName, jobTitle, appliedAt, status, initialScore }[],  // آخر 5
  expiringJobs: { id, title, department, deadline, applicationsCount }[],             // خلال 7 أيام
  todayInterviews: { id, applicantName, jobTitle, scheduledAt, type, interviewer }[], // اليوم وغداً

  // مؤشرات التجارة الإلكترونية
  fastestHiringDept: { name: string, avgDays: number },
  csAcceptanceRate: number,
  shiftJobsPercentage: number,
  avgTLScore: number,
}
```
استخدم Prisma aggregations وgroup by — لا تحسب في JavaScript.

### 2. لوحة التحكم الرئيسية
ملف: `app/(dashboard)/dashboard/page.tsx`

**استخدم Suspense + async Server Component لجلب البيانات.**

**الصف الأول — 4 Stat Cards:**
كل كارد:
- أيقونة Lucide في مربع ملون (background مطابق للون بـ 15% opacity)
- الرقم الكبير (28px, font-weight: 700)
- العنوان (14px, secondary)
- التغيير: سهم أعلى/أسفل + نسبة مئوية (أخضر للارتفاع، أحمر للانخفاض)

**الصف الثاني — 4 شارتس (Recharts):**

Chart 1 — Bar Chart (الطلبات لكل وظيفة):
```typescript
<BarChart data={applicationsByJob} layout="vertical">
  <XAxis type="number" />
  <YAxis dataKey="jobTitle" type="category" width={150} tick={{ fontFamily: 'Noto Kufi Arabic', fontSize: 12 }} />
  <Bar dataKey="count" fill="#4361EE" radius={[0, 4, 4, 0]} />
  <Tooltip content={<CustomTooltipArabic />} />
</BarChart>
```

Chart 2 — Donut Chart (توزيع حسب الحالة):
```typescript
<PieChart>
  <Pie data={applicationsByStatus} dataKey="count" nameKey="label" innerRadius={60} outerRadius={90} />
  <Legend formatter={(value) => <span style={{ fontFamily: 'Noto Kufi Arabic' }}>{value}</span>} />
  <Tooltip formatter={(value, name) => [value, name]} />
</PieChart>
```
الألوان لكل حالة — استخدم نفس ألوان الـ Badges.

Chart 3 — Line Chart (الاتجاه خلال 12 شهر):
```typescript
<LineChart data={hiringTrend}>
  <XAxis dataKey="month" />
  <YAxis />
  <Line dataKey="applications" stroke="#4361EE" name="الطلبات" strokeWidth={2} dot={false} />
  <Line dataKey="hired" stroke="#2D9B6F" name="المُعيَّنون" strokeWidth={2} dot={false} />
  <Legend />
  <Tooltip />
</LineChart>
```

Chart 4 — Bar Chart أفقي (مصادر التقديم):
ألوان مختلفة لكل مصدر.

**الـ CustomTooltipArabic Component:**
```typescript
const CustomTooltipArabic = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, padding: '10px 14px', fontFamily: 'Noto Kufi Arabic', direction: 'rtl' }}>
      <p style={{ fontWeight: 500, marginBottom: 4 }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};
```

**الصف الثالث — 3 قوائم:**

القائمة 1 — آخر الطلبات:
كارد مع header "أحدث الطلبات" + "عرض الكل →"
5 عناصر — كل عنصر: Avatar بالأحرف الأولى + الاسم + الوظيفة + التاريخ + Badge الحالة + نقطة التقييم.

القائمة 2 — وظائف تنتهي قريباً:
أيقونة Clock حمراء، كل عنصر: اسم الوظيفة + القسم + الموعد النهائي (أيام متبقية) + عدد الطلبات.

القائمة 3 — مقابلات اليوم وغداً:
أيقونة Calendar زرقاء، كل عنصر: اسم المتقدم + الوظيفة + الوقت + المحاور + Badge النوع.

**الصف الرابع — مؤشرات التجارة الإلكترونية (4 Stat Cards صغيرة):**
أسرع الأقسام توظيفاً، معدل قبول CS، نسبة وظائف الشيفتات، متوسط نقاط قادة الفريق.

### 3. صفحة التقارير
ملف: `app/(dashboard)/reports/page.tsx`

**الفلاتر العامة (تؤثر على كل الشارتس):**
DateRangePicker + Select القسم + Select الوظيفة + Select المحاور
زر "تطبيق" + زر "تصفير"

**Tabs:**

**تبويب 1 — نظرة عامة:**
- 4 KPI Cards (الطلبات، المقابلات، المعيّنون، متوسط وقت التوظيف بالأيام)
- Funnel Chart (طلبات → مؤهلون → مقابلة → مقبولون) — ارسمه بـ SVG بسيط إذا لم تجد مكتبة جاهزة
- Line Chart للاتجاه الشهري

**تبويب 2 — تحليل التقديمات:**
- Bar Chart: الوظائف الأكثر استقطاباً
- Donut Chart: مصادر التقديم
- Horizontal Bar: توزيع حسب المؤهل
- جدول: معدل القبول لكل وظيفة (الوظيفة / الطلبات / المقبولون / المعدل%)

**تبويب 3 — تحليل التقييمات:**
- Histogram: توزيع نقاط التقييم الأولي (0-10, 10-20, ... 90-100)
- Bar Chart: متوسط النقاط لكل وظيفة
- جدول: أعلى 10 متقدمين نقاطاً مع بياناتهم

**تبويب 4 — تحليل المقابلات:**
- Bar Chart: عدد المقابلات لكل محاور
- Donut Chart: توزيع أنواع المقابلات
- جدول: المقابلات التي انتهت ولم تُقيَّم بعد (action مطلوب)

**تبويب 5 — التقرير الكامل:**
جدول شامل بكل المتقدمين مع كل بياناتهم ونقاطهم.
زر "تصدير Excel" يصدّر ما هو معروض (يحترم الفلاتر).

### 4. صفحة الإعدادات
ملف: `app/(dashboard)/settings/page.tsx`

Tabs:
- **الشركة:** اسم الشركة، الشعار (رفع صورة لـ Supabase Storage)، بيانات التواصل.
- **الأقسام:** جدول بالأقسام + CRUD (إضافة، تعديل، حذف مع تأكيد).
- **المستخدمون:** جدول بالمستخدمين + CRUD + تغيير الدور + تفعيل/تعطيل.
- **قوالب الوظائف:** عرض القوالب العشرة + إمكانية إضافة قالب جديد أو تعديل موجود.
- **معايير التقييم الافتراضية:** 6 Sliders مع counter + زر حفظ.

### 5. الصقل النهائي (Polish) — نفّذ هذا في الأخير

**أ. Loading States:**
أضف Skeleton loaders لكل صفحة:
```typescript
// app/(dashboard)/jobs/loading.tsx
export default function JobsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />  {/* toolbar */}
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}
```

**ب. Error Boundaries:**
```typescript
// app/(dashboard)/jobs/error.tsx
'use client'
export default function JobsError({ error, reset }) {
  return (
    <div className="text-center py-20">
      <p className="text-red-500 text-lg mb-4">حدث خطأ في تحميل الوظائف</p>
      <button onClick={reset} className="btn-primary">إعادة المحاولة</button>
    </div>
  )
}
```

**ج. Not Found Pages:**
```typescript
// app/(dashboard)/jobs/[id]/not-found.tsx
export default function JobNotFound() {
  return (
    <div className="text-center py-20">
      <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-medium mb-2">الوظيفة غير موجودة</h2>
      <p className="text-gray-500 mb-6">ربما تم حذفها أو أرشفتها</p>
      <Link href="/jobs" className="btn-primary">العودة للوظائف</Link>
    </div>
  )
}
```

**د. Animations (Tailwind فقط):**
```css
/* في globals.css */
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.animate-fadeIn { animation: fadeIn 0.2s ease-out; }
```
أضف `animate-fadeIn` على:
- الكاردس في لوحة التحكم
- صفوف الجداول عند ظهورها
- الـ Modals والـ Dropdowns

**هـ. Hover Micro-interactions:**
- الكاردس: `hover:shadow-md hover:border-[#4361EE]/30 transition-all duration-200`
- الأزرار Primary: `hover:-translate-y-0.5 active:scale-95 transition-all`
- صفوف الجداول: `hover:bg-[#F9F9F8] cursor-pointer transition-colors`

**و. Responsive Mobile:**
- Sidebar: يُخفى وراء Drawer على شاشات < 768px
- الجداول: تتحول لكاردس على شاشات < 640px
- الـ Charts: `min-h-[200px]` على الجوال

**ز. إنشاء Seed كامل:**
```bash
npx prisma db seed
```
تأكد أن الـ seed يحتوي على:
- 3 مستخدمين (admin, hr, interviewer)
- 10 أقسام
- 10 قوالب وظائف
- 12 وظيفة (منشورة 6، مسودة 2، مغلقة 2، في الانتظار 1، مرفوضة 1)
- 50 متقدم موزعين على الوظائف بنقاط مختلفة
- 20 مقابلة (15 مكتملة بتقييمات، 5 مجدولة)
- بيانات شهرية للـ 12 شهر الماضية للـ charts

**ح. الفحص النهائي:**
```bash
npx tsc --noEmit    # يجب أن ينتهي بدون أخطاء
npm run build       # يجب أن يكمل بنجاح
npm run lint        # يجب أن ينتهي بدون أخطاء
```

## معايير النجاح للمشروع كاملاً:
- `npm run build` يكمل بنجاح بدون أخطاء TypeScript أو lint
- لوحة التحكم تعرض الشارتس ببيانات حقيقية من Supabase
- التقارير تتغير مع تغيير الفلاتر
- النظام يعمل على الجوال (responsive)
- Loading states تظهر أثناء جلب البيانات
- تسجيل الدخول وتسجيل الخروج يعملان بشكل صحيح
- كل النصوص بالعربية والأرقام بالإنجليزية
```

---

## بعد الانتهاء من Phase 5 — خطوات النشر

```bash
# 1. رفع الكود على GitHub
git add .
git commit -m "اكتمال نظام إدارة التوظيف — v1.0"
git push

# 2. على Vercel: أضف كل متغيرات البيئة ثم اضغط Deploy

# 3. على Supabase: شغّل الـ migration إذا لم تكن قد فعلت
npx prisma migrate deploy

# 4. شغّل الـ Seed مرة واحدة على الإنتاج (من Vercel Functions أو Supabase SQL Editor)
```

---

## ملاحظات عامة لكل الـ Phases

1. **بعد كل Phase:** شغّل `npm run build` وتأكد من عدم وجود أخطاء.
2. **إذا واجهت خطأ:** صف الخطأ بالكامل في رسالة جديدة لـ Claude Code.
3. **لا تبدأ Phase جديدة** قبل أن تختبر الـ Phase السابقة يدوياً.
4. **احفظ كل شيء على GitHub** بعد كل Phase: `git add . && git commit -m "Phase X مكتملة" && git push`.
