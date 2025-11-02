"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import ImageUploadField from "@/components/ImageUploadField"; // ✅ Reusable component

// Example: Import your image size constants
// Adjust the path and values as needed
import {
  BLOG_COVER_MIN_WIDTH,
  BLOG_COVER_MIN_HEIGHT,
  BLOG_IMAGE_MIN_WIDTH,
  BLOG_IMAGE_MIN_HEIGHT,
} from "@/libs/constants/imageSizes";

type FormInputs = {
  type_id: string;
  title_en: string;
  slug_en: string;
  meta_title_en: string;
  meta_description_en: string;
  meta_keywords_en: string;
  user_en: string;
  keywords_en: string;
  title_ar: string;
  slug_ar: string;
  meta_title_ar: string;
  meta_description_ar: string;
  meta_keywords_ar: string;
  user_ar: string;
  keywords_ar: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

type TypeOption = {
  id: string;
  title: string;
};

type BlogData = {
  id: number;
  type: { id: number; title: string } | null;
  image: string;
  cover: string;
  keywords: string;
  descriptions: {
    en: {
      title: string;
      description: string;
      keywords?: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
      user: string;
    };
    ar: {
      title: string;
      description: string;
      keywords?: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
      user: string;
    };
  };
};

const EditContentPage = () => {
  const t = useTranslations("blogs");
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEditing = !!id;
  const locale = useLocale();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormInputs>();

  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general" | "meta">("ar");
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "success", show: false });
  const [types, setTypes] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // Fetch types
  useEffect(() => {
    const fetchTypes = async () => {
      const token = localStorage.getItem("token");
      if (!token) return showToast("Authentication token not found", "error");

      try {
        const response = await getData("owner/types", {}, new AxiosHeaders({ Authorization: `Bearer ${token}`, lang: locale }));
        if (response.status) setTypes(response.data);
        else showToast(t("Failed to fetch types"), "error");
      } catch  {
        showToast(t("Error fetching types"), "error");
      }
    };
    fetchTypes();
  }, [locale]);

  // Fetch blog data for editing
  useEffect(() => {
    if (isEditing) {
      const fetchBlogData = async () => {
        const token = localStorage.getItem("token");
        if (!token) return showToast("Authentication token not found", "error");

        setLoading(true);
        try {
          const response = await getData(`owner/blogs/${id}`, {}, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
          if (response.status && response.data?.blog) {
            const blog: BlogData = response.data.blog;

            reset({
              type_id: blog.type?.id?.toString() || "",
              title_en: blog.descriptions.en.title,
              slug_en: blog.descriptions.en.slug,
              meta_title_en: blog.descriptions.en.meta_title,
              meta_description_en: blog.descriptions.en.meta_description,
              meta_keywords_en: blog.descriptions.en.meta_keywords,
              user_en: blog.descriptions.en.user,
              keywords_en: blog.descriptions.en.keywords || blog.keywords || "",
              title_ar: blog.descriptions.ar.title,
              slug_ar: blog.descriptions.ar.slug,
              meta_title_ar: blog.descriptions.ar.meta_title,
              meta_description_ar: blog.descriptions.ar.meta_description,
              meta_keywords_ar: blog.descriptions.ar.meta_keywords,
              user_ar: blog.descriptions.ar.user,
              keywords_ar: blog.descriptions.ar.keywords || blog.keywords || "",
            });

            setDescriptionEn(blog.descriptions.en.description || "");
            setDescriptionAr(blog.descriptions.ar.description || "");
            setCurrentCoverUrl(blog.cover || "");
            setCurrentImageUrl(blog.image || "");
          } else {
            showToast(t("Failed to fetch blog data"), "error");
          }
        } catch  {
          showToast(t("Error fetching blog data"), "error");
        } finally {
          setLoading(false);
        }
      };
      fetchBlogData();
    }
  }, [isEditing, id, reset, t]);

  // Handle image changes
  const handleCoverChange = (file: File | null) => {
    setCover(file);
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    } else {
      setCoverPreview(null);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [coverPreview, imagePreview]);

  // Submit form
  const onSubmit = async (data: FormInputs) => {
    const token = localStorage.getItem("token");
    if (!token) return showToast("Authentication token not found", "error");

    const formData = new FormData();
    formData.append("type_id", data.type_id);
    formData.append("title[en]", data.title_en);
    formData.append("slug[en]", data.slug_en);
    formData.append("meta_title[en]", data.meta_title_en);
    formData.append("meta_description[en]", data.meta_description_en);
    formData.append("meta_keywords[en]", data.meta_keywords_en);
    formData.append("user[en]", data.user_en);
    formData.append("keywords[en]", data.keywords_en);
    formData.append("description[en]", descriptionEn);

    formData.append("title[ar]", data.title_ar);
    formData.append("slug[ar]", data.slug_ar);
    formData.append("meta_title[ar]", data.meta_title_ar);
    formData.append("meta_description[ar]", data.meta_description_ar);
    formData.append("meta_keywords[ar]", data.meta_keywords_ar);
    formData.append("user[ar]", data.user_ar);
    formData.append("keywords[ar]", data.keywords_ar);
    formData.append("description[ar]", descriptionAr);

    if (cover) formData.append("cover", cover);
    if (image) formData.append("image", image);
    if (isEditing) formData.append("_method", "PUT");

    try {
      const endpoint = isEditing ? `owner/blogs/${id}` : "owner/blogs";
      await postData(endpoint, formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      router.back();
      showToast(t("Blog updated successfully"), "success");
    } catch  {
      showToast(t("Failed to update blog"), "error");
    }
  };

  // Form fields
  const englishFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_en", label: "Title (EN)" },
    { name: "slug_en", label: "Slug (EN)" },
    { name: "user_en", label: "User (EN)" },
  ];

  const arabicFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_ar", label: "Title (AR)" },
    { name: "slug_ar", label: "Slug (AR)" },
    { name: "user_ar", label: "User (AR)" },
  ];

  const metaFields: { name: keyof FormInputs; label: string; dir?: string }[] = [
    { name: "meta_title_en", label: "Meta Title (EN)" },
    { name: "meta_description_en", label: "Meta Description (EN)" },
    { name: "meta_keywords_en", label: "Meta Keywords (EN)" },
    { name: "keywords_en", label: "Keywords (EN)" },
    { name: "meta_title_ar", label: "Meta Title (AR)", dir: "rtl" },
    { name: "meta_description_ar", label: "Meta Description (AR)", dir: "rtl" },
    { name: "meta_keywords_ar", label: "Meta Keywords (AR)", dir: "rtl" },
    { name: "keywords_ar", label: "Keywords (AR)", dir: "rtl" },
  ];

  // Tab Button
  const TabButton = ({ label, isActive, onClick }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 rounded-t-lg text-sm sm:text-base font-medium transition-colors duration-200 whitespace-nowrap ${
        isActive
          ? "bg-blue-600 text-white border-b-2 border-blue-600"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-3 sm:p-4 md:p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 sm:h-32 sm:w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">{t("Loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 sm:p-4 md:p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}

      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">
            {t("Edit Content")}
          </h1>

          {/* Tab Navigation */}
          <div className="flex space-x-1 sm:space-x-2 mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8">
            <TabButton label={t("Arabic Content")} isActive={activeTab === "ar"} onClick={() => setActiveTab("ar")} />
            <TabButton label={t("English Content")} isActive={activeTab === "en"} onClick={() => setActiveTab("en")} />
            <TabButton label={t("SEO Information")} isActive={activeTab === "meta"} onClick={() => setActiveTab("meta")} />
            <TabButton label={t("General Information")} isActive={activeTab === "general"} onClick={() => setActiveTab("general")} />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Arabic Content Tab */}
            {activeTab === "ar" && (
              <div className="mb-6 sm:mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {arabicFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 text-sm sm:text-base font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        dir="rtl"
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      />
                      {errors[name] && <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:mt-6">
                  <RichTextEditor value={descriptionAr} onChange={setDescriptionAr} label={t("Description (AR)")} />
                </div>
              </div>
            )}

            {/* English Content Tab */}
            {activeTab === "en" && (
              <div className="mb-6 sm:mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {englishFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 text-sm sm:text-base font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      />
                      {errors[name] && <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 sm:mt-6">
                  <RichTextEditor value={descriptionEn} onChange={setDescriptionEn} label={t("Description (EN)")} />
                </div>
              </div>
            )}

            {/* Meta Information Tab */}
            {activeTab === "meta" && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("SEO Meta Information & Keywords")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {metaFields.map(({ name, label, dir }) => (
                    <div key={name}>
                      <label className="block mb-1 text-sm sm:text-base font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        dir={dir}
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      />
                      {errors[name] && <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General Information Tab */}
            {activeTab === "general" && (
              <div className="mb-6 sm:mb-8">
                {/* Type Selection */}
                <div className="mb-4 sm:mb-6">
                  <label className="block mb-1 text-sm sm:text-base font-medium">{t("Type")}</label>
                  <select
                    {...register("type_id", { required: true })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400"
                  >
                    <option value="">{t("Select a type")}</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>{type.title}</option>
                    ))}
                  </select>
                  {errors.type_id && <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>}
                </div>

                {/* File Uploads */}
                <div className="mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">{t("File Uploads")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Cover Upload */}
                    <ImageUploadField
                      label="Cover"
                      id="cover-input"
                      value={currentCoverUrl}
                      preview={coverPreview}
                      onChange={handleCoverChange}
                      required={!isEditing}
                      allowedSizes={`${BLOG_COVER_MIN_WIDTH}x${BLOG_COVER_MIN_HEIGHT}`} // e.g., "1200x630"
                    />

                    {/* Image Upload */}
                    <ImageUploadField
                      label="Image"
                      id="image-input"
                      value={currentImageUrl}
                      preview={imagePreview}
                      onChange={handleImageChange}
                      required={!isEditing}
                      allowedSizes={`${BLOG_IMAGE_MIN_WIDTH}x${BLOG_IMAGE_MIN_HEIGHT}`} // e.g., "800x600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 sm:space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-md transition duration-200 w-full sm:w-auto order-2 sm:order-1"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105 w-full sm:w-auto order-1 sm:order-2"
              >
                {t("Update")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditContentPage;