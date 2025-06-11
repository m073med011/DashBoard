"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard, Newspaper, Shapes, Map,
  Building2,
  GalleryHorizontal,
  Users
} from "lucide-react";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";
import Image from "next/image";

type SubItem = {
  name: string;
  path: string;
  pro?: boolean;
  new?: boolean;
  icon?: React.ReactNode;
  image?: string; 
  src?: string;     
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

const NAV_ITEMS: NavItem[] = [
  { icon: <LayoutDashboard />, name: "dashboard", path: "/" },
  {
    icon: <Users />, name: "agents", path: "/agent"
  },
  {
    icon: <Users />, name: "owners", path: "/owner"
  },
  { icon: <Newspaper />, name: "blogs", path: "/blog" },
  { icon: <GalleryHorizontal />, name: "banners", path: "/banners" },
  { icon: <Shapes />, name: "types", path: "/types" },
  { icon: <Map />, name: "areas", path: "/areas" },
  {
    icon: <Building2 />, name: "property_listings", path: "/properties"
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [openSubmenu, setOpenSubmenu] = useState<{ type: string; index: number } | null>(null);
  const [subMenuHeights, setSubMenuHeights] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => pathname === path, [pathname]);
  const isSidebarVisible = isExpanded || isHovered || isMobileOpen;

  const handleSubmenuToggle = (index: number, type: string) => {
    setOpenSubmenu(prev =>
      prev?.type === type && prev.index === index ? null : { type, index }
    );
  };

  // Get modules from localStorage
  const getAvailableModules = () => {
    const storedModules = localStorage.getItem("modules");
    return storedModules ? JSON.parse(storedModules) : [];
  };

  const availableModules = getAvailableModules();

  useEffect(() => {
    let matched = false;

    NAV_ITEMS.forEach((nav, index) => {
      nav.subItems?.forEach(sub => {
        if (isActive(sub.path)) {
          setOpenSubmenu({ type: "main", index });
          matched = true;
        }
      });
    });

    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const el = subMenuRefs.current[key];
      if (el) {
        setSubMenuHeights(prev => ({
          ...prev,
          [key]: el.scrollHeight,
        }));
      }
    }
  }, [openSubmenu]);

  const renderSubItems = (subItems: SubItem[], type: string, index: number) => {
    const key = `${type}-${index}`;
    const isOpen = openSubmenu?.type === type && openSubmenu.index === index;

    return (
      <div
        ref={(el) => {
          subMenuRefs.current[`${type}-${index}`] = el;
        }}
        className="overflow-hidden transition-all duration-300"
        style={{ height: isOpen ? `${subMenuHeights[key]}px` : "0px" }}
      >
        <ul className="mt-2 space-y-1 ml-9">
          {subItems.map(sub => (
            <li key={sub.name}>
              <Link
                href={`/${locale}${sub.path}`}
                className={`menu-dropdown-item ${
                  isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                }`}
              >
                <span className="flex items-center gap-5 text-sm">
                  <span className="w-4 h-4">{sub.icon}</span>
                  {t(sub.name)}
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  {sub.new && (
                    <span className={`menu-dropdown-badge ${isActive(sub.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>
                      {t("new")}
                    </span>
                  )}
                  {sub.pro && (
                    <span className={`menu-dropdown-badge ${isActive(sub.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"}`}>
                      {t("pro")}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderNavItems = (items: NavItem[], type: string) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        // Skip rendering nav item if it's not in availableModules
        if (!availableModules.includes(nav.name)) {
          return null; // Skip this item
        }

        const isOpen = openSubmenu?.type === type && openSubmenu.index === index;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, type)}
                className={`menu-item group ${isOpen ? "menu-item-active" : "menu-item-inactive"}
                  cursor-pointer ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span className={isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                  {nav.icon}
                </span>
                {isSidebarVisible && <span className="menu-item-text">{t(nav.name)}</span>}
                {isSidebarVisible && (
                  <ChevronDownIcon
                    className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180 text-brand-500" : ""}`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={`/${locale}${nav.path}`}
                  className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}
                >
                  <span className={isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}>
                    {nav.icon}
                  </span>
                  {isSidebarVisible && <span className="menu-item-text">{t(nav.name)}</span>}
                </Link>
              )
            )}
            {nav.subItems && isSidebarVisible && renderSubItems(nav.subItems, type, index)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 z-50 px-5 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen flex flex-col transition-all duration-300 ease-in-out mt-16 lg:mt-0
      ${isRtl ? "right-0 border-l border-gray-200" : "left-0 border-r border-gray-200"}
      ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
          ? "w-[290px]"
          : "w-[90px]"
      }
      ${
        isMobileOpen
          ? isRtl ? "-translate-x-0" : "translate-x-0"
          : isRtl ? "translate-x-full" : "-translate-x-full"
      }
      lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/">
          {isSidebarVisible ? (
            <>
              <h1 className="text-4xl">Proplex</h1>
            </>
          ) : (
            <Image src="/images/logo/logo-icon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                !isSidebarVisible ? "lg:justify-center" : "justify-start"
              }`}>
                {isSidebarVisible ? t("menu") : <HorizontaLDots />}
              </h2>
              {renderNavItems(NAV_ITEMS, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
