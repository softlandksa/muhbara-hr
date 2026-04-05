// نظام التقييم الأولي للمتقدمين
// يُحسب تلقائياً عند تقديم الطلب

export interface ScoringWeights {
  experience: number;      // الخبرة
  education: number;       // التعليم
  requiredSkills: number;  // المهارات الإلزامية
  preferredSkills: number; // المهارات المفضلة
  completeness: number;    // اكتمال الملف
  location: number;        // الموقع الجغرافي
}

// الأوزان الافتراضية
export const DEFAULT_WEIGHTS: ScoringWeights = {
  experience: 25,
  education: 20,
  requiredSkills: 30,
  preferredSkills: 10,
  completeness: 10,
  location: 5,
};

export interface ScoringInput {
  // بيانات المتقدم
  applicantExperienceYears: number;
  applicantEducation: string;
  applicantSkills: string[];
  applicantLocation?: string;
  cvUrl?: string;
  linkedinUrl?: string;

  // متطلبات الوظيفة
  jobExperienceMin: number;
  jobExperienceMax?: number;
  jobEducationRequired: string;
  jobRequiredSkills: string[];
  jobPreferredSkills: string[];
  jobLocation?: string;

  // أوزان التقييم
  weights: ScoringWeights;
}

export interface ScoringResult {
  totalScore: number;
  breakdown: {
    experience: number;
    education: number;
    requiredSkills: number;
    preferredSkills: number;
    completeness: number;
    location: number;
  };
}

const educationLevels: Record<string, number> = {
  HIGH_SCHOOL: 1,
  DIPLOMA: 2,
  BACHELOR: 3,
  MASTER: 4,
  PHD: 5,
};

// حساب نقاط الخبرة
function scoreExperience(
  applicantYears: number,
  minYears: number,
  maxYears?: number,
  weight: number = 25
): number {
  if (applicantYears >= minYears) {
    if (maxYears && applicantYears > maxYears * 1.5) {
      // خبرة زائدة جداً — قد لا يقبل الراتب
      return weight * 0.7;
    }
    return weight;
  }
  // ناقص عن الحد الأدنى
  const ratio = applicantYears / minYears;
  return Math.round(weight * ratio * 0.8);
}

// حساب نقاط التعليم
function scoreEducation(
  applicantEdu: string,
  requiredEdu: string,
  weight: number = 20
): number {
  const applicantLevel = educationLevels[applicantEdu] ?? 1;
  const requiredLevel = educationLevels[requiredEdu] ?? 3;

  if (applicantLevel >= requiredLevel) return weight;
  if (applicantLevel === requiredLevel - 1) return weight * 0.7;
  return weight * 0.4;
}

// حساب نقاط المهارات الإلزامية
function scoreRequiredSkills(
  applicantSkills: string[],
  requiredSkills: string[],
  weight: number = 30
): number {
  if (requiredSkills.length === 0) return weight;

  const normalizedApplicant = applicantSkills.map((s) => s.toLowerCase().trim());
  const matched = requiredSkills.filter((skill) =>
    normalizedApplicant.some(
      (as) => as.includes(skill.toLowerCase()) || skill.toLowerCase().includes(as)
    )
  );

  const ratio = matched.length / requiredSkills.length;
  return Math.round(weight * ratio);
}

// حساب نقاط المهارات المفضلة
function scorePreferredSkills(
  applicantSkills: string[],
  preferredSkills: string[],
  weight: number = 10
): number {
  if (preferredSkills.length === 0) return weight;

  const normalizedApplicant = applicantSkills.map((s) => s.toLowerCase().trim());
  const matched = preferredSkills.filter((skill) =>
    normalizedApplicant.some(
      (as) => as.includes(skill.toLowerCase()) || skill.toLowerCase().includes(as)
    )
  );

  const ratio = matched.length / preferredSkills.length;
  return Math.round(weight * ratio);
}

// حساب نقاط اكتمال الملف
function scoreCompleteness(
  cvUrl?: string,
  linkedinUrl?: string,
  weight: number = 10
): number {
  let score = weight * 0.5; // نصف النقاط للبيانات الأساسية
  if (cvUrl) score += weight * 0.35;
  if (linkedinUrl) score += weight * 0.15;
  return Math.round(score);
}

// حساب نقاط الموقع
function scoreLocation(
  applicantLocation?: string,
  jobLocation?: string,
  weight: number = 5
): number {
  if (!jobLocation || !applicantLocation) return weight * 0.5;
  if (applicantLocation.toLowerCase().includes(jobLocation.toLowerCase())) {
    return weight;
  }
  return Math.round(weight * 0.3);
}

// الدالة الرئيسية للتقييم الأولي
export function calculateInitialScore(input: ScoringInput): ScoringResult {
  const { weights } = input;

  const breakdown = {
    experience: scoreExperience(
      input.applicantExperienceYears,
      input.jobExperienceMin,
      input.jobExperienceMax,
      weights.experience
    ),
    education: scoreEducation(
      input.applicantEducation,
      input.jobEducationRequired,
      weights.education
    ),
    requiredSkills: scoreRequiredSkills(
      input.applicantSkills,
      input.jobRequiredSkills,
      weights.requiredSkills
    ),
    preferredSkills: scorePreferredSkills(
      input.applicantSkills,
      input.jobPreferredSkills,
      weights.preferredSkills
    ),
    completeness: scoreCompleteness(input.cvUrl, input.linkedinUrl, weights.completeness),
    location: scoreLocation(input.applicantLocation, input.jobLocation, weights.location),
  };

  const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    totalScore: Math.min(Math.round(totalScore), 100),
    breakdown,
  };
}

// حساب النقطة النهائية (بعد المقابلة)
// النقطة النهائية = (أولية × 40%) + (مقابلة × 60%)
export function calculateFinalScore(
  initialScore: number,
  interviewScore: number
): number {
  return Math.round(initialScore * 0.4 + interviewScore * 0.6);
}
