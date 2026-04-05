// الصفحة الرئيسية — تحويل مباشر للـ dashboard
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
