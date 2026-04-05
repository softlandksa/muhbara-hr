// NextAuth v5 Configuration
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

// مخطط التحقق من بيانات الدخول
const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(6, "كلمة المرور قصيرة جداً"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @ts-expect-error — توافق أنواع next-auth v5 beta مع @auth/prisma-adapter
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        // التحقق من صحة المدخلات
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // البحث عن المستخدم في قاعدة البيانات
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            departmentId: true,
            avatar: true,
            isActive: true,
          },
        });

        if (!user || !user.isActive) return null;

        // التحقق من كلمة المرور
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          departmentId: user.departmentId,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    // إضافة بيانات إضافية للـ JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.departmentId = (user as { departmentId: string | null }).departmentId;
        token.avatar = (user as { avatar: string | null }).avatar;
      }
      return token;
    },
    // إضافة بيانات إضافية للـ session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.departmentId = token.departmentId as string | null;
        session.user.avatar = token.avatar as string | null;
      }
      return session;
    },
  },
});
