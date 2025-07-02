"use client";

import React, { useState, useEffect } from "react";
import { getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
// import Image from "next/image";
import ImageWithFallback from "@/components/ImageWithFallback";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

type BannerData = {
  id: number;
  type: string;
  link: string;
  en: {
    name: string;
    description: string;
    image: string;
  };
  ar: {
    name: string;
    description: string;
    image: string;
  };
};

const ViewBannerPage = () => {
  const t = useTranslations("banners");
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general">("ar");
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  const [bannerData, setBannerData] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  useEffect(() => {
    const fetchBannerData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        showToast("Authentication token not found", "error");
        return;
      }

      try {
        const response = await getData(
          `owner/banners/${bannerId}`,
          {},
          new AxiosHeaders({ Authorization: `Bearer ${token}` })
        );
        if (response.status && response.data) {
          setBannerData(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch banner data:", error);
        showToast(t("Failed to load banner data"), "error");
      } finally {
        setLoading(false);
      }
    };

    if (bannerId) fetchBannerData();
  }, [bannerId, t]);

  const TabButton = ({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded-t-lg font-medium transition-colors duration-200 ${
        isActive
          ? "bg-blue-600 text-white border-b-2 border-blue-600"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  if (loading || !bannerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("Loading banner data...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">{t("View Banner")}</h1>

          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <TabButton label={t("Arabic Content")} isActive={activeTab === "ar"} onClick={() => setActiveTab("ar")} />
            <TabButton label={t("English Content")} isActive={activeTab === "en"} onClick={() => setActiveTab("en")} />
            <TabButton
              label={t("General Information")}
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
          </div>

          {/* Arabic Content */}
          {activeTab === "ar" && (
            <div className="mb-8 space-y-6">
              <div>
                <label className="block mb-1 font-medium">{t("Name (AR)")}</label>
                <input
                  value={bannerData.ar.name}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  dir="rtl"
                />
              </div>
              <RichTextEditor value={bannerData.ar.description} readOnly label={t("Description (AR)")} />
              <div>
                <label className="block mb-2 font-medium">{t("Image (AR)")}</label>
                {/* <Image 
                  width={192}
                  height={128}
                  src={bannerData.ar.image}
                  alt="Arabic Image"
                  className="w-48 h-32 object-cover rounded-md border"
                /> */}
                <ImageWithFallback
  src={bannerData.ar.image || ''}
  alt="User Avatar"
  width={100}
  height={100}
  className="rounded-lg w-full max-h-56 object-fill"
/>
              </div>
            </div>
          )}

          {/* English Content */}
          {activeTab === "en" && (
            <div className="mb-8 space-y-6">
              <div>
                <label className="block mb-1 font-medium">{t("Name (EN)")}</label>
                <input
                  value={bannerData.en.name}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                />
              </div>
              <RichTextEditor value={bannerData.en.description} readOnly label={t("Description (EN)")} />
              <div>
                <label className="block mb-2 font-medium">{t("Image (EN)")}</label>
                {/* <Image 
                  width={192}
                  height={128}
                  src={bannerData.en.image}
                  alt="English Image"
                  className="w-48 h-32 object-cover rounded-md border"
                /> */}
                <ImageWithFallback
  src={bannerData.en.image || ''}
  alt="User Avatar"
  width={300}
  height={300}
  className="rounded-lg w-full max-h-56 object-fill"
/>
              </div>
            </div>
          )}

          {/* General Information */}
          {activeTab === "general" && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-medium">{t("Link")}</label>
                <input
                  value={bannerData.link}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">{t("Type")}</label>
                <input
                  value={bannerData.type}
                  readOnly
                  className="w-full px-4 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                />
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg shadow-md transition duration-200"
            >
              {t("Back")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBannerPage;
