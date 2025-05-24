"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import { useLocale } from "next-intl";
import React, { useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = isExpanded || isHovered ? 290 : 90;

  // Inline styles for dynamic margin (LTR/RTL)
  const mainContentStyle: React.CSSProperties = (() => {
    if (!isLargeScreen || isMobileOpen) return {};
    return isRTL
      ? { marginRight: `${sidebarWidth}px`, marginLeft: 0 }
      : { marginLeft: `${sidebarWidth}px`, marginRight: 0 };
  })();

  // Combine class names without clsx
  const mainContentClasses = [
    "flex-1",
    "transition-all",
    "duration-300",
    "ease-in-out",
    "relative",
    "min-h-screen",
    isMobileOpen ? "overflow-hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={mainContentClasses} style={mainContentStyle}>
      <AppHeader />
      <div className="p-4 mx-auto max-w-[--breakpoint-2xl] md:p-6">{children}</div>
    </div>
  );
}
