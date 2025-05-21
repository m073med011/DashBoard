"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import { useLocale } from "next-intl";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const locale = useLocale();
  const isRTL = locale === "ar";

  const sidebarSize = isExpanded || isHovered ? "290px" : "90px";

  const mainContentMargin = isMobileOpen
    ? "ml-0 mr-0"
    : isRTL
    ? `lg:mr-[${sidebarSize}]`
    : `lg:ml-[${sidebarSize}]`;

  return (
    <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
      <AppHeader />
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">{children}</div>
    </div>
  );
}
