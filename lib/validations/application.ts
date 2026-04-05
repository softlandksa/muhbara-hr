// مخططات التحقق من صحة بيانات الطلبات باستخدام Zod
import { z } from "zod";

// مخطط إنشاء طلب جديد
export const CreateApplicationSchema = z.object({
  fullName: z.string().min(2, "الاسم الكامل يجب أن يكون حرفين على الأقل").max(200, "الاسم طويل جداً"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(8, "رقم الهاتف يجب أن يكون 8 أرقام على الأقل").max(20, "رقم الهاتف طويل جداً"),
  jobId: z.string().cuid("معرف الوظيفة غير صحيح"),
  cvUrl: z.string().url("رابط السيرة الذاتية غير صحيح").optional().nullable(),
  linkedinUrl: z.string().url("رابط LinkedIn غير صحيح").optional().nullable(),
  educationLevel: z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "PHD"], {
    errorMap: () => ({ message: "المستوى التعليمي غير صحيح" }),
  }),
  experienceYears: z
    .number()
    .min(0, "سنوات الخبرة لا يمكن أن تكون سالبة")
    .max(50, "سنوات الخبرة يجب ألا تتجاوز 50"),
  currentLocation: z.string().max(200, "الموقع طويل جداً").optional().nullable(),
  skills: z
    .array(z.string().min(1, "المهارة لا يمكن أن تكون فارغة"))
    .min(1, "يجب إضافة مهارة واحدة على الأقل"),
  source: z.enum(["WEBSITE", "LINKEDIN", "REFERRAL", "EMAIL", "EXCEL_IMPORT", "OTHER"], {
    errorMap: () => ({ message: "مصدر الطلب غير صحيح" }),
  }),
  notes: z.string().max(1000, "الملاحظات يجب ألا تتجاوز 1000 حرف").optional().nullable(),
});

// مخطط تعديل الطلب — جميع الحقول اختيارية عدا id
export const UpdateApplicationSchema = CreateApplicationSchema.partial().extend({
  id: z.string().cuid("معرف الطلب غير صحيح"),
});

// مخطط تغيير حالة الطلب
export const ChangeApplicationStatusSchema = z
  .object({
    status: z.enum(
      ["NEW", "UNDER_REVIEW", "QUALIFIED", "INTERVIEW_SCHEDULED", "OFFER_SENT", "ACCEPTED", "REJECTED", "WITHDRAWN"],
      { errorMap: () => ({ message: "حالة الطلب غير صحيحة" }) }
    ),
    note: z.string().max(1000, "الملاحظة يجب ألا تتجاوز 1000 حرف").optional().nullable(),
  })
  .refine(
    (data) => {
      // الملاحظة مطلوبة عند الرفض
      if (data.status === "REJECTED") {
        return data.note && data.note.trim().length > 0;
      }
      return true;
    },
    { message: "سبب الرفض مطلوب", path: ["note"] }
  );

// أنواع TypeScript المستخرجة
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type ChangeApplicationStatusInput = z.infer<typeof ChangeApplicationStatusSchema>;
