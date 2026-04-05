"use client";

// صفحة تسجيل الدخول
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Briefcase, Loader2 } from "lucide-react";

// مخطط التحقق
const loginSchema = z.object({
  email: z.string().email("أدخل بريداً إلكترونياً صحيحاً"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("حدث خطأ، يرجى المحاولة مرة أخرى");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      <div
        className="w-full max-w-md mx-4 p-8 rounded-[16px]"
        style={{
          backgroundColor: "var(--bg-card)",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] mb-4"
            style={{ backgroundColor: "#4361EE" }}
          >
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {process.env.NEXT_PUBLIC_APP_NAME ?? "نظام إدارة التوظيف"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {process.env.NEXT_PUBLIC_COMPANY_NAME ?? "منظومة التوظيف الداخلية"}
          </p>
        </div>

        {/* نموذج تسجيل الدخول */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* حقل البريد الإلكتروني */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
              htmlFor="email"
            >
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@company.com"
              dir="ltr"
              className="w-full px-4 py-2.5 text-sm transition-colors outline-none"
              style={{
                border: `1px solid ${errors.email ? "var(--danger)" : "var(--border)"}`,
                borderRadius: "10px",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
              aria-label="البريد الإلكتروني"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* حقل كلمة المرور */}
          <div>
            <label
              className="block text-sm font-medium mb-1.5"
              style={{ color: "var(--text-primary)" }}
              htmlFor="password"
            >
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 ps-10 text-sm transition-colors outline-none"
                style={{
                  border: `1px solid ${errors.password ? "var(--danger)" : "var(--border)"}`,
                  borderRadius: "10px",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                }}
                aria-label="كلمة المرور"
                {...register("password")}
              />
              {/* زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 start-0 flex items-center px-3 transition-colors"
                style={{ color: "var(--text-secondary)" }}
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* رسالة الخطأ العامة */}
          {error && (
            <div
              className="px-4 py-3 rounded-[10px] text-sm font-medium"
              style={{
                backgroundColor: "#FEF2F2",
                color: "var(--danger)",
                border: "1px solid #FECACA",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* زر تسجيل الدخول */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            style={{
              backgroundColor: "var(--accent-blue)",
              borderRadius: "10px",
            }}
            aria-label="تسجيل الدخول"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جارٍ تسجيل الدخول...</span>
              </>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>

        {/* تذييل */}
        <p className="text-center text-xs mt-6" style={{ color: "var(--text-secondary)" }}>
          نظام داخلي — لا يُتاح للعموم
        </p>
      </div>
    </div>
  );
}
