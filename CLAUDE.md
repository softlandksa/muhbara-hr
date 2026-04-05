# CLAUDE.md — نظام إدارة التوظيف للتجارة الإلكترونية

## هذا الملف يُقرأ تلقائياً عند بدء كل جلسة Claude Code

---

## ما هو هذا المشروع؟

نظام إدارة توظيف (ATS) عربي كامل مخصص لشركة تجارة إلكترونية. النظام يُدار داخلياً من فريق HR لتوظيف أقسام: خدمة العملاء، المبيعات، الشحن، المستودعات، التسويق الرقمي، وتقنية المعلومات.

---

## Stack التقني — لا تتغير منه أبداً

```
Framework:    Next.js 14 (App Router) — لا Pages Router
Language:     TypeScript الصارم (strict: true)
Styling:      Tailwind CSS + shadcn/ui
Database:     PostgreSQL عبر Supabase
ORM:          Prisma
Auth:         NextAuth.js v5 (beta)
Charts:       Recharts
Forms:        React Hook Form + Zod
Tables:       TanStack Table v8
Excel:        ExcelJS
Rich Text:    Tiptap
State:        Zustand
Icons:        Lucide React
Dates:        date-fns مع locale عربي
Toasts:       react-hot-toast
Hosting:      Vercel
Storage:      Supabase Storage
```

---

## قواعد لا تُكسر أبداً

### اللغة والاتجاه
- كل نص في الواجهة بالعربية الفصحى المبسطة — labels، placeholders، رسائل الخطأ، التأكيدات، tooltips.
- الأرقام فقط بالإنجليزية (Latin): 1, 2, 3 — ممنوع ١ ٢ ٣.
- `dir="rtl"` على `<html>` وكل layout.
- الخط: Noto Kufi Arabic + Tajawal من Google Fonts.

### TypeScript
- ممنوع `any` — استخدم أنواع صريحة دائماً.
- كل API route لها Zod schema للـ validation.
- كل Prisma query في Server Component أو API route — ليس في Client Component.

### بنية الملفات
```
/app
  /(auth)/login          — صفحة تسجيل الدخول
  /(dashboard)/          — كل صفحات النظام (محمية بـ auth)
    dashboard/
    jobs/
    applicants/
    interviews/
    reports/
    settings/
  /api/                  — API routes فقط
/components
  /ui/                   — shadcn components
  /dashboard/
  /jobs/
  /applicants/
  /interviews/
  /reports/
  /layout/               — Sidebar, Header, Breadcrumb
  /forms/                — نماذج مشتركة
  /charts/               — Recharts components
/lib
  /db.ts                 — Prisma client (singleton)
  /auth.ts               — NextAuth config
  /scoring.ts            — منطق التقييم
  /excel.ts              — استيراد/تصدير Excel
  /supabase.ts           — Supabase client
  /validations/          — Zod schemas
  /utils.ts              — دوال مساعدة
/prisma
  schema.prisma
  seed.ts
```

### Design System — الألوان والمقاسات

```css
:root {
  --bg-main: #F7F6F3;        /* خلفية الصفحة */
  --bg-card: #FFFFFF;        /* خلفية الكاردس */
  --accent-dark: #1A1A2E;    /* كحلي غامق — Sidebar */
  --accent-blue: #4361EE;    /* أزرق ملكي — Primary action */
  --success: #2D9B6F;
  --warning: #E07B39;
  --danger: #C0392B;
  --purple: #7B61FF;
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --border: #E8E6E0;
}
```

- Card border-radius: `16px`
- Button border-radius: `10px`
- Input border-radius: `10px`
- Card shadow: `0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)`

### Sidebar
- خلفية `#1A1A2E`، نص أبيض، عرض `260px`
- العنصر النشط: خلفية `#4361EE`، border-radius `10px`

---

## متغيرات البيئة المطلوبة

```env
DATABASE_URL=                    # Supabase PostgreSQL connection string
NEXTAUTH_SECRET=                 # 32+ char random string
NEXTAUTH_URL=                    # http://localhost:3000 (dev) أو Vercel URL (prod)
NEXT_PUBLIC_SUPABASE_URL=        # https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=       # Supabase service role (سري — لا يُعرض للـ client)
NEXT_PUBLIC_APP_NAME=            # نظام إدارة التوظيف
NEXT_PUBLIC_COMPANY_NAME=        # اسم الشركة
```

---

## الأقسام والمسميات الوظيفية (Seed Data)

### الأقسام العشرة
| الكود | الاسم |
|-------|-------|
| CS | خدمة العملاء |
| SALES | المبيعات والتحويل |
| SHIP | الشحن والتوصيل |
| WH | المستودعات والمخزون |
| MKTG | التسويق الرقمي |
| TECH | تقنية المعلومات |
| QA | ضمان الجودة |
| HR | الموارد البشرية |
| FIN | المالية والمحاسبة |
| PROC | المشتريات والموردين |

### نماذج الوظائف الجاهزة (10 قوالب)
كل قالب عنده: المسمى، القسم، الوصف الكامل، المتطلبات، المهارات الإلزامية والمفضلة، وأوزان التقييم المناسبة لطبيعة الدور.

أمثلة: ممثل خدمة عملاء أونلاين، أخصائي دعم عملاء، مدير فريق (TL)، أخصائي مبيعات أونلاين، منسق شحن، أخصائي مخزون، أخصائي Paid Ads، مطور متجر إلكتروني، مدير فريق مبيعات، مدير فريق شحن.

---

## نظام التقييم — الأهم في المشروع

### التقييم الأولي (يُحسب تلقائياً عند التقديم)
```typescript
// lib/scoring.ts
interface ScoringWeights {
  experience: number;       // افتراضي: 25
  education: number;        // افتراضي: 20
  requiredSkills: number;   // افتراضي: 30
  preferredSkills: number;  // افتراضي: 10
  completeness: number;     // افتراضي: 10
  location: number;         // افتراضي: 5
}
// المجموع دائماً 100
```

الأوزان تتغير حسب نوع الوظيفة:
- وظائف CS/Sales: الخبرة 15، المهارات الشخصية أعلى
- وظائف Tech: الخبرة 30، المهارات التقنية 35
- وظائف TL/MGR: الخبرة 35، القيادة الأعلى

### التقييم بعد المقابلة (يملأه المحاور)
- الكفاءة الوظيفية: حتى 40 نقطة
- المهارات الشخصية: حتى 30 نقطة
- التوافق الوظيفي: حتى 30 نقطة

**النقطة النهائية = (أولية × 40%) + (مقابلة × 60%)**

النموذج ديناميكي — يكتشف نوع الوظيفة ويعدّل الأوزان تلقائياً.

---

## حالات الوظيفة (Status Flow)

```
DRAFT → PENDING_APPROVAL → PUBLISHED → CLOSED → ARCHIVED
                        ↘ REJECTED
```

## حالات الطلب (Application Status Flow)

```
NEW → UNDER_REVIEW → QUALIFIED → INTERVIEW_SCHEDULED → OFFER_SENT → ACCEPTED
                              ↘ REJECTED
                                         ↘ WITHDRAWN
```

---

## Phases التنفيذ

- **Phase 1:** Setup + Auth + Layout + Design System
- **Phase 2:** إدارة الوظائف (CRUD كامل + القوالب)
- **Phase 3:** إدارة المتقدمين + نظام التقييم الأولي
- **Phase 4:** المقابلات + التقييم بعد المقابلة
- **Phase 5:** Dashboard + Reports + Excel Import/Export

الـ Phase الحالية موضحة في رسالة المستخدم.

---

## ملاحظات مهمة

1. **Server Components أولاً** — استخدم Client Components فقط عند الحاجة لـ interactivity.
2. **Error Handling** — كل API route تُرجع أخطاء واضحة بالعربية.
3. **Loading States** — Skeleton loaders لكل جدول وكارد.
4. **Empty States** — رسالة عربية + أيقونة + زر إجراء لكل قائمة فارغة.
5. **Responsive** — يعمل على الموبايل والتابلت والديسكتوب.
6. **Accessibility** — aria-labels بالعربية على كل العناصر التفاعلية.
7. **لا تحذف أي ملف موجود** دون أن تسأل أولاً.
8. **اكتب comments بالعربية** في الكود لتسهيل الفهم.
