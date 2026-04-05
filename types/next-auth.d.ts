// توسعة أنواع NextAuth لإضافة حقول مخصصة
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      departmentId: string | null;
      avatar: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    avatar: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    departmentId: string | null;
    avatar: string | null;
  }
}
