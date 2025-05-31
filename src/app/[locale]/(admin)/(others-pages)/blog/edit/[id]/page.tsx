"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import Image from "next/image";

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
};

const EditContentPage = () => {
  const t = useTranslations("blogs");
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEditing = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormInputs>();

  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general">("ar");
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string>("");
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  const [types, setTypes] = useState<TypeOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch types from the API
  useEffect(() => {
    const fetchTypes = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        showToast("Authentication token not found", "error");
        return;
      }
      try {
        const response = await getData("owner/types", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` }));  
        if (response.status) {
          setTypes(response.data);
        } else {
          showToast("Failed to fetch types", "error");
        }
      } catch (error) {
        console.error("Error fetching types:", error);
        showToast("Error fetching types", "error");
      }
    };

    fetchTypes();
  }, []);

  // Fetch blog data for editing
  useEffect(() => {
    if (isEditing) {
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
            const blog: BlogData = response.data.blog;
            
            // Set form values
            reset({
              type_id: blog.type.id.toString(),
              title_en: blog.descriptions.en.title,
              slug_en: blog.descriptions.en.slug,
              meta_title_en: blog.descriptions.en.meta_title,
              meta_description_en: blog.descriptions.en.meta_description,
              meta_keywords_en: blog.descriptions.en.meta_keywords,
              user_en: blog.descriptions.en.user,
              keywords_en: blog.descriptions.en.keywords,
              title_ar: blog.descriptions.ar.title,
              slug_ar: blog.descriptions.ar.slug,
              meta_title_ar: blog.descriptions.ar.meta_title,
              meta_description_ar: blog.descriptions.ar.meta_description,
              meta_keywords_ar: blog.descriptions.ar.meta_keywords,
              user_ar: blog.descriptions.ar.user,
              keywords_ar: blog.descriptions.ar.keywords,
            });
            
            // Set rich text editor values
            setDescriptionEn(blog.descriptions.en.description || "");
            setDescriptionAr(blog.descriptions.ar.description || "");
            
            // Set current image URLs
            setCurrentCoverUrl(blog.cover || "");
            setCurrentImageUrl(blog.image || "");
            
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
  }, [isEditing, id, reset]);

  const onSubmit = async (data: FormInputs) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    const formData = new FormData();

    formData.append("type_id", data.type_id);
    
    // English fields
    formData.append("title[en]", data.title_en);
    formData.append("slug[en]", data.slug_en);
    formData.append("meta_title[en]", data.meta_title_en);
    formData.append("meta_description[en]", data.meta_description_en);
    formData.append("meta_keywords[en]", data.meta_keywords_en);
    formData.append("user[en]", data.user_en);
    formData.append("keywords[en]", data.keywords_en);
    formData.append("description[en]", descriptionEn);
    
    // Arabic fields
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

    // Add method for editing
    if (isEditing) {
      formData.append("_method", "PUT");
    }

    try {
      const endpoint = isEditing ? `owner/blogs/${id}` : "owner/blogs";
      await postData(endpoint, formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast(t(isEditing ? "Blog updated successfully" : "Blog added successfully"), "success");
      router.back();
    } catch (error) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} blog:`, error);
      showToast(t(isEditing ? "Failed to update blog" : "Failed to add blog"), "error");
    }
  };

  // English fields
  const englishFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_en", label: "Title (EN)" },
    { name: "slug_en", label: "Slug (EN)" },
    { name: "meta_title_en", label: "Meta Title (EN)" },
    { name: "meta_description_en", label: "Meta Description (EN)" },
    { name: "meta_keywords_en", label: "Meta Keywords (EN)" },
    { name: "user_en", label: "User (EN)" },
    { name: "keywords_en", label: "Keywords (EN)" },
  ];

  // Arabic fields
  const arabicFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_ar", label: "Title (AR)" },
    { name: "slug_ar", label: "Slug (AR)" },
    { name: "meta_title_ar", label: "Meta Title (AR)" },
    { name: "meta_description_ar", label: "Meta Description (AR)" },
    { name: "meta_keywords_ar", label: "Meta Keywords (AR)" },
    { name: "user_ar", label: "User (AR)" },
    { name: "keywords_ar", label: "Keywords (AR)" },
  ];

  const TabButton = ({  label, isActive, onClick }: {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t("Loading...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t(isEditing ? "Edit Content" : "Create Content")}
          </h1>
          
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
              tab="general"
              label={t("General Information")}
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* Arabic Content Tab */}
            {activeTab === "ar" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {arabicFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                        dir="rtl"
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <RichTextEditor
                    value={descriptionAr}
                    onChange={setDescriptionAr}
                    label={t("Description (AR)")}
                  />
                </div>
              </div>
            )}

            {/* English Content Tab */}
            {activeTab === "en" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {englishFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <RichTextEditor
                    value={descriptionEn}
                    onChange={setDescriptionEn}
                    label={t("Description (EN)")}
                  />
                </div>
              </div>
            )}

            {/* General Information Tab */}
            {activeTab === "general" && (
              <div className="mb-8">
                {/* Type Selection */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div>
                      <label className="block mb-1 font-medium">{t("Type")}</label>
                      <select
                        {...register("type_id", { required: true })}
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 focus:outline-none focus:ring focus:ring-blue-400"
                      >
                        <option value="">{t("Select a type")}</option>
                        {types.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.title}
                          </option>
                        ))}
                      </select>
                      {errors.type_id && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Upload Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">{t("File Uploads")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block mb-1 font-medium">{t("Cover")}</label>
                      {currentCoverUrl && (
                        <div className="mb-2">
                          <Image 
                            src={currentCoverUrl} 
                            alt="Current cover" 
                            width={100}
                            height={100}
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <p className="text-sm text-gray-500 mt-1">{t("Current cover")}</p>
                        </div>
                      )}
                      <input
                        type="file"
                        onChange={(e) => setCover(e.target.files?.[0] || null)}
                        className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                        required={!isEditing}
                      />
                      {isEditing && (
                        <p className="text-xs text-gray-500 mt-1">{t("Leave empty to keep current cover")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 font-medium">{t("Image")}</label>
                      {currentImageUrl && (
                        <div className="mb-2">
                          <Image
                            width={100}
                            height={100}
                            src={currentImageUrl} 
                            alt="Current image" 
                            className="w-20 h-20 object-cover rounded border"
                          />
                          <p className="text-sm text-gray-500 mt-1">{t("Current image")}</p>
                        </div>
                      )}
                      <input
                        type="file"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                        className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                        required={!isEditing}
                      />
                      {isEditing && (
                        <p className="text-xs text-gray-500 mt-1">{t("Leave empty to keep current image")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-lg shadow-md transition duration-200"
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-md transition duration-200 transform hover:scale-105"
              >
                {t(isEditing ? "Update" : "Submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditContentPage;