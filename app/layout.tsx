// Layout الجذر — يشمل كل الصفحات
import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "نظام إدارة التوظيف",
    template: "%s | نظام إدارة التوظيف",
  },
  description: "نظام إدارة التوظيف العربي للتجارة الإلكترونية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
