"use client";

import React, { useState, useEffect } from "react";
import { getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Toast from "@/components/Toast";
import Image from "next/image";

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

type BlogData = {
  id: number;
  title: string;
  type: { id: number; title: string };
  image: string;
  cover: string;
  descriptions: {
    en: {
      title: string;
      description: string;
      keywords: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
      user: string;
    };
    ar: {
      title: string;
      description: string;
      keywords: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
      user: string;
    };
  };
  created_at: string;
};

const ViewContentPage = () => {
  const t = useTranslations("blogs");
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general" | "meta">("ar");
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });
  const [loading, setLoading] = useState<boolean>(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch blog data
  useEffect(() => {
    if (id) {
      const fetchBlogData = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!token) {
          showToast("Authentication token not found", "error");
          return;
        }
        
        setLoading(true);
        try {
          const response = await getData(`owner/blogs/${id}`, {}, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
          if (response.status && response.data?.blog) {
            setBlogData(response.data.blog);
          } else {
            showToast("Failed to fetch blog data", "error");
          }
        } catch (error) {
          console.error("Error fetching blog data:", error);
          showToast("Error fetching blog data", "error");
        } finally {
          setLoading(false);
        }
      };

      fetchBlogData();
    }
  }, [id]);

  // Arabic fields (without meta and keywords fields)
  const arabicFields: { name: string; label: string; value: string }[] = [
    { name: "title_ar", label: "Title (AR)", value: blogData?.descriptions?.ar?.title || "" },
    { name: "slug_ar", label: "Slug (AR)", value: blogData?.descriptions?.ar?.slug || "" },
    { name: "user_ar", label: "User (AR)", value: blogData?.descriptions?.ar?.user || "" },
  ];

  // English fields (without meta and keywords fields)
  const englishFields: { name: string; label: string; value: string }[] = [
    { name: "title_en", label: "Title (EN)", value: blogData?.descriptions?.en?.title || "" },
    { name: "slug_en", label: "Slug (EN)", value: blogData?.descriptions?.en?.slug || "" },
    { name: "user_en", label: "User (EN)", value: blogData?.descriptions?.en?.user || "" },
  ];

  // Meta fields for both languages (including keywords)
  const metaFields: { name: string; label: string; value: string; isRtl?: boolean }[] = [
    { name: "meta_title_en", label: "Meta Title (EN)", value: blogData?.descriptions?.en?.meta_title || "" },
    { name: "meta_description_en", label: "Meta Description (EN)", value: blogData?.descriptions?.en?.meta_description || "" },
    { name: "meta_keywords_en", label: "Meta Keywords (EN)", value: blogData?.descriptions?.en?.meta_keywords || "" },
    { name: "keywords_en", label: "Keywords (EN)", value: blogData?.descriptions?.en?.keywords || "" },
    { name: "meta_title_ar", label: "Meta Title (AR)", value: blogData?.descriptions?.ar?.meta_title || "", isRtl: true },
    { name: "meta_description_ar", label: "Meta Description (AR)", value: blogData?.descriptions.ar.meta_description || "", isRtl: true },
    { name: "meta_keywords_ar", label: "Meta Keywords (AR)", value: blogData?.descriptions.ar.meta_keywords || "", isRtl: true },
    { name: "keywords_ar", label: "Keywords (AR)", value: blogData?.descriptions.ar.keywords || "", isRtl: true },
  ];

  const TabButton = ({ label, isActive, onClick }: {
    tab: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
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

  const ReadOnlyField = ({ label, value, isRtl = false }: {
    label: string;
    value: string;
    isRtl?: boolean;
  }) => (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div 
        className={`w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[40px] flex items-center ${isRtl ? 'text-right' : 'text-left'}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {value || t("No data")}
      </div>
    </div>
  );

  const ReadOnlyRichText = ({ label, value }: {
    label: string;
    value: string;
  }) => (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[100px]">
        {value ? (
          <div 
            dangerouslySetInnerHTML={{ __html: value }}
            className="prose dark:prose-invert max-w-none"
          />
        ) : (
          <span className="text-gray-500">{t("No description")}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("Loading")}</p>
        </div>
      </div>
    );
  }

  if (!blogData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">{t("Blog not found")}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg"
          >
            {t("Go Back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">
              {t("Blog title")} : {blogData?.title}
            </h1>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/${locale}/blog/edit/${id}`)}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200"
              >
                {t("Edit")}
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <TabButton
              tab="ar"
              label={t("Arabic Content")}
              isActive={activeTab === "ar"}
              onClick={() => setActiveTab("ar")}
            />
            <TabButton
              tab="en"
              label={t("English Content")}
              isActive={activeTab === "en"}
              onClick={() => setActiveTab("en")}
            />
            <TabButton
              tab="meta"
              label={t("SEO Information")}
              isActive={activeTab === "meta"}
              onClick={() => setActiveTab("meta")}
            />
            <TabButton
              tab="general"
              label={t("General Information")}
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
          </div>

          {/* Arabic Content Tab */}
          {activeTab === "ar" && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {arabicFields.map(({ name, label, value }) => (
                  <ReadOnlyField
                    key={name}
                    label={t(label)}
                    value={value}
                    isRtl={true}
                  />
                ))}
              </div>
              
              <div className="mt-6">
                <ReadOnlyRichText
                  label={t("Description (AR)")}
                  value={blogData.descriptions.ar.description}
                />
              </div>
            </div>
          )}

          {/* English Content Tab */}
          {activeTab === "en" && (
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {englishFields.map(({ name, label, value }) => (
                  <ReadOnlyField
                    key={name}
                    label={t(label)}
                    value={value}
                  />
                ))}
              </div>
              
              <div className="mt-6">
                <ReadOnlyRichText
                  label={t("Description (EN)")}
                  value={blogData.descriptions.en.description}
                />
              </div>
            </div>
          )}

          {/* Meta Information Tab */}
          {activeTab === "meta" && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{t("SEO Meta Information & Keywords")}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metaFields.map(({ name, label, value, isRtl }) => (
                  <ReadOnlyField
                    key={name}
                    label={t(label)}
                    value={value}
                    isRtl={isRtl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* General Information Tab */}
          {activeTab === "general" && (
            <div className="mb-8">
              {/* Type Information */}
              <div className="mb-6">
                <ReadOnlyField
                  label={t("Type")}
                  value={blogData?.type?.title}
                />
              </div>

              {/* Images Section */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t("Images")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{t("Cover")}</label>
                    {blogData.cover ? (
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <Image
                          width={100}
                          height={100}
                          src={blogData.cover} 
                          alt="Cover" 
                          className="w-full h-48 object-cover rounded border"
                        />
                        <a 
                          href={blogData.cover} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {t("View Full Size")}
                        </a>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 text-center text-gray-500">
                        {t("No cover image")}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{t("Image")}</label>
                    {blogData.image ? (
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                        <Image 
                          width={100}
                          height={100}
                          src={blogData.image} 
                          alt="Image" 
                          className="w-full h-48 object-cover rounded border"
                        />
                        <a 
                          href={blogData.image} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {t("View Full Size")}
                        </a>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 text-center text-gray-500">
                        {t("No image")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewContentPage;