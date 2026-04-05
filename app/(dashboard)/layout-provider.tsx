// مزود الجلسة للـ Dashboard
"use client";

import { SessionProvider } from "next-auth/react";

export default function DashboardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
