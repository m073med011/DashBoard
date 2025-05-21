"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import { useLocale } from "next-intl";
import React, { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const locale = useLocale();
  const isRTL = locale === "ar";

  // State for detecting if screen is large
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);

  useEffect(() => {
    function handleResize() {
      // Define breakpoint here (e.g., 1024px for large screens)
      setIsLargeScreen(window.innerWidth >= 1024);
    }

    handleResize(); // Initial check

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarSize = isExpanded || isHovered ? "290px" : "90px";

  const mainContentMargin = isMobileOpen
    ? "ml-0 mr-0"
    : isRTL
    ? `lg:mr-[${sidebarSize}]`
    : `lg:ml-[${sidebarSize}]`;

  return (
    <div className={`flex-1 transition-all duration-300 ease-in-out ${isLargeScreen && isRTL ? "mr-23" : "mr-0"} ${mainContentMargin}`}>
      <AppHeader />
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">{children}</div>
    </div>
  );
}
