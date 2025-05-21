import { redirect } from "@/i18n/routing";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { cookies } from "next/headers";
import ClientLayout from "./ClientLayout"; // 👈 import client wrapper

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect({ href: `/signin`, locale });
  }

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <ClientLayout>{children}</ClientLayout>
    </div>
  );
}
