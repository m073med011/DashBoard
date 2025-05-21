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

  // Determine the sidebar size based on expansion and hover state
  const getSidebarSize = () => (isExpanded || isHovered ? "290px" : "90px");

  // Determine the main content margin based on mobile and RTL settings
  const getMainContentMargin = () => {
    if (isMobileOpen) return "ml-0 mr-0";
    return isRTL ? `lg:mr-[${getSidebarSize()}]` : `lg:ml-[${getSidebarSize()}]`;
  };

  // Construct the main content classes
  const getMainContentClasses = () => {
    const classes = [
      "flex-1",
      "transition-all",
      "duration-300",
      "ease-in-out",
      isLargeScreen && isRTL ? "mr-23 ml-0" : "mr-0 ml-23",
      isExpanded && !isRTL ? "mr-0 ml-73" : null,
      isExpanded && isRTL ? "mr-73 ml-0" : null,
      isHovered && !isRTL ? "mr-0 ml-73" : null,
      isHovered && isRTL ? "mr-73 ml-0" : null,
      getMainContentMargin(),
    ];
    return classes.filter(Boolean).join(" ");
  };

  return (
    <div className={getMainContentClasses()}>
      <AppHeader />
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">{children}</div>
    </div>
  );
}
