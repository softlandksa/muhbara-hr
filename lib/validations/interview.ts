// مخططات التحقق من صحة بيانات المقابلات باستخدام Zod
import { z } from "zod";

// أنواع المقابلة المتاحة
const InterviewTypeEnum = z.enum(["PHONE", "VIDEO", "IN_PERSON", "TECHNICAL", "HR"], {
  errorMap: () => ({ message: "نوع المقابلة غير صحيح" }),
});

// حالات المقابلة المتاحة
const InterviewStatusEnum = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"], {
  errorMap: () => ({ message: "حالة المقابلة غير صحيحة" }),
});

// مخطط إنشاء مقابلة جديدة
export const CreateInterviewSchema = z.object({
  applicationId: z.string().cuid("معرف الطلب غير صحيح"),
  jobId: z.string().cuid("معرف الوظيفة غير صحيح"),
  type: InterviewTypeEnum,
  scheduledAt: z
    .string({ required_error: "تاريخ المقابلة مطلوب" })
    .min(1, "تاريخ المقابلة مطلوب"),
  duration: z
    .number()
    .int("المدة يجب أن تكون رقماً صحيحاً")
    .min(15, "المدة الدنيا 15 دقيقة")
    .max(240, "المدة القصوى 240 دقيقة")
    .default(60),
  location: z
    .string()
    .max(500, "الموقع يجب ألا يتجاوز 500 حرف")
    .optional()
    .nullable(),
  interviewerId: z.string().cuid("معرف المحاور غير صحيح"),
  preparationNote: z
    .string()
    .max(2000, "ملاحظات التحضير يجب ألا تتجاوز 2000 حرف")
    .optional()
    .nullable(),
});

// مخطط تعديل المقابلة — جميع الحقول اختيارية
export const UpdateInterviewSchema = z.object({
  type: InterviewTypeEnum.optional(),
  scheduledAt: z.string().min(1, "تاريخ المقابلة لا يمكن أن يكون فارغاً").optional(),
  duration: z
    .number()
    .int("المدة يجب أن تكون رقماً صحيحاً")
    .min(15, "المدة الدنيا 15 دقيقة")
    .max(240, "المدة القصوى 240 دقيقة")
    .optional(),
  location: z
    .string()
    .max(500, "الموقع يجب ألا يتجاوز 500 حرف")
    .optional()
    .nullable(),
  interviewerId: z.string().cuid("معرف المحاور غير صحيح").optional(),
  preparationNote: z
    .string()
    .max(2000, "ملاحظات التحضير يجب ألا تتجاوز 2000 حرف")
    .optional()
    .nullable(),
});

// مخطط تقييم المقابلة
// الكفاءة الوظيفية: 0-40 | المهارات الشخصية: 0-30 | التوافق الوظيفي: 0-30
export const ScoreInterviewSchema = z
  .object({
    technicalCompetence: z
      .number({ required_error: "الكفاءة الوظيفية مطلوبة" })
      .min(0, "الكفاءة الوظيفية لا يمكن أن تكون أقل من 0")
      .max(40, "الكفاءة الوظيفية لا يمكن أن تتجاوز 40"),
    softSkills: z
      .number({ required_error: "المهارات الشخصية مطلوبة" })
      .min(0, "المهارات الشخصية لا يمكن أن تكون أقل من 0")
      .max(30, "المهارات الشخصية لا يمكن أن تتجاوز 30"),
    culturalFit: z
      .number({ required_error: "التوافق الوظيفي مطلوب" })
      .min(0, "التوافق الوظيفي لا يمكن أن يكون أقل من 0")
      .max(30, "التوافق الوظيفي لا يمكن أن يتجاوز 30"),
    note: z
      .string()
      .max(1000, "الملاحظة يجب ألا تتجاوز 1000 حرف")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => data.technicalCompetence <= 40,
    { message: "الكفاءة الوظيفية لا يمكن أن تتجاوز 40", path: ["technicalCompetence"] }
  )
  .refine(
    (data) => data.softSkills <= 30,
    { message: "المهارات الشخصية لا يمكن أن تتجاوز 30", path: ["softSkills"] }
  )
  .refine(
    (data) => data.culturalFit <= 30,
    { message: "التوافق الوظيفي لا يمكن أن يتجاوز 30", path: ["culturalFit"] }
  );

// مخطط تغيير حالة المقابلة
export const ChangeInterviewStatusSchema = z.object({
  status: InterviewStatusEnum,
  note: z
    .string()
    .max(1000, "الملاحظة يجب ألا تتجاوز 1000 حرف")
    .optional()
    .nullable(),
});

// أنواع TypeScript المستخرجة
export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type ScoreInterviewInput = z.infer<typeof ScoreInterviewSchema>;
export type ChangeInterviewStatusInput = z.infer<typeof ChangeInterviewStatusSchema>;
