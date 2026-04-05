// مخططات التحقق من صحة بيانات الوظائف باستخدام Zod
import { z } from "zod";

// أوزان التقييم
export const ScoringWeightsSchema = z.object({
  experience: z.number().min(0).max(100),
  education: z.number().min(0).max(100),
  requiredSkills: z.number().min(0).max(100),
  preferredSkills: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  location: z.number().min(0).max(100),
}).refine(
  (weights) => {
    const total = Object.values(weights).reduce((sum, val) => sum + val, 0);
    return total === 100;
  },
  { message: "مجموع أوزان التقييم يجب أن يساوي 100" }
);

// مخطط المهارة
export const JobSkillSchema = z.object({
  skillName: z.string().min(1, "اسم المهارة مطلوب").max(100, "اسم المهارة طويل جداً"),
  isRequired: z.boolean().default(true),
});

// مخطط إنشاء الوظيفة
export const CreateJobSchema = z.object({
  title: z.string().min(3, "عنوان الوظيفة يجب أن يكون 3 أحرف على الأقل").max(200, "عنوان الوظيفة طويل جداً"),
  departmentId: z.string().min(1, "القسم مطلوب"),
  location: z.string().max(200, "الموقع طويل جداً").optional().nullable(),
  isRemote: z.boolean().default(false),
  type: z.enum(["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "TEMPORARY"], {
    errorMap: () => ({ message: "نوع الوظيفة غير صحيح" }),
  }),
  ecommerceCategory: z.string().max(100).optional().nullable(),
  templateCode: z.string().max(50).optional().nullable(),
  description: z.string().min(10, "وصف الوظيفة يجب أن يكون 10 أحرف على الأقل"),
  requirements: z.string().min(10, "متطلبات الوظيفة يجب أن تكون 10 أحرف على الأقل"),
  salaryMin: z.number().positive("الحد الأدنى للراتب يجب أن يكون موجباً").optional().nullable(),
  salaryMax: z.number().positive("الحد الأقصى للراتب يجب أن يكون موجباً").optional().nullable(),
  currency: z.enum(["SAR", "USD", "AED"]).default("SAR"),
  showSalary: z.boolean().default(false),
  experienceMin: z.number().min(0, "الحد الأدنى للخبرة لا يمكن أن يكون سالباً").default(0),
  experienceMax: z.number().positive("الحد الأقصى للخبرة يجب أن يكون موجباً").optional().nullable(),
  educationRequired: z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "PHD"], {
    errorMap: () => ({ message: "المستوى التعليمي غير صحيح" }),
  }).default("BACHELOR"),
  headcount: z.number().int().positive("عدد الشواغر يجب أن يكون موجباً").default(1),
  deadline: z.string().optional().nullable(),
  scoringWeights: ScoringWeightsSchema.optional(),
  skills: z.array(JobSkillSchema).optional().default([]),
}).refine(
  (data) => {
    if (data.salaryMin !== null && data.salaryMin !== undefined &&
        data.salaryMax !== null && data.salaryMax !== undefined) {
      return data.salaryMax >= data.salaryMin;
    }
    return true;
  },
  { message: "الحد الأقصى للراتب يجب أن يكون أكبر من الحد الأدنى", path: ["salaryMax"] }
).refine(
  (data) => {
    if (data.experienceMax !== null && data.experienceMax !== undefined) {
      return data.experienceMax >= data.experienceMin;
    }
    return true;
  },
  { message: "الحد الأقصى للخبرة يجب أن يكون أكبر من الحد الأدنى", path: ["experienceMax"] }
);

// مخطط تعديل الوظيفة — نستخدم ZodObject مباشرة بدون refine لدعم .partial()
const BaseJobSchema = z.object({
  title: z.string().min(3, "عنوان الوظيفة يجب أن يكون 3 أحرف على الأقل").max(200, "عنوان الوظيفة طويل جداً"),
  departmentId: z.string().min(1, "القسم مطلوب"),
  location: z.string().max(200, "الموقع طويل جداً").optional().nullable(),
  isRemote: z.boolean().default(false),
  type: z.enum(["FULL_TIME", "PART_TIME", "REMOTE", "HYBRID", "TEMPORARY"]),
  ecommerceCategory: z.string().max(100).optional().nullable(),
  templateCode: z.string().max(50).optional().nullable(),
  description: z.string().min(10, "وصف الوظيفة يجب أن يكون 10 أحرف على الأقل"),
  requirements: z.string().min(10, "متطلبات الوظيفة يجب أن تكون 10 أحرف على الأقل"),
  salaryMin: z.number().positive("الحد الأدنى للراتب يجب أن يكون موجباً").optional().nullable(),
  salaryMax: z.number().positive("الحد الأقصى للراتب يجب أن يكون موجباً").optional().nullable(),
  currency: z.enum(["SAR", "USD", "AED"]).default("SAR"),
  showSalary: z.boolean().default(false),
  experienceMin: z.number().min(0, "الحد الأدنى للخبرة لا يمكن أن يكون سالباً").default(0),
  experienceMax: z.number().positive("الحد الأقصى للخبرة يجب أن يكون موجباً").optional().nullable(),
  educationRequired: z.enum(["HIGH_SCHOOL", "DIPLOMA", "BACHELOR", "MASTER", "PHD"]).default("BACHELOR"),
  headcount: z.number().int().positive("عدد الشواغر يجب أن يكون موجباً").default(1),
  deadline: z.string().optional().nullable(),
  scoringWeights: ScoringWeightsSchema.optional(),
  skills: z.array(JobSkillSchema).optional().default([]),
});

export const UpdateJobSchema = BaseJobSchema.partial().extend({
  id: z.string().min(1, "معرف الوظيفة مطلوب"),
});

// مخطط تغيير حالة الوظيفة
export const ChangeJobStatusSchema = z.object({
  newStatus: z.enum(["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "CLOSED", "ARCHIVED", "REJECTED"], {
    errorMap: () => ({ message: "حالة الوظيفة غير صحيحة" }),
  }),
  note: z.string().max(500, "الملاحظة طويلة جداً").optional().nullable(),
}).refine(
  (data) => {
    // الملاحظة مطلوبة عند الرفض
    if (data.newStatus === "REJECTED") {
      return data.note && data.note.trim().length > 0;
    }
    return true;
  },
  { message: "سبب الرفض مطلوب", path: ["note"] }
);

// أنواع TypeScript المستخرجة من المخططات
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type ChangeJobStatusInput = z.infer<typeof ChangeJobStatusSchema>;
export type ScoringWeightsInput = z.infer<typeof ScoringWeightsSchema>;
export type JobSkillInput = z.infer<typeof JobSkillSchema>;
