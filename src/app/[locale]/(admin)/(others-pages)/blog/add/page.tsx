"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";

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

const CreateContentPage = () => {
  const t = useTranslations("blogs");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  // Tab state - starting with Arabic like the edit page, now with meta tab
  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general" | "meta">("ar");

  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [cover, setCover] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  // Add preview URLs state
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  const [types, setTypes] = useState<TypeOption[]>([]);

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

  // Handle cover image selection
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCover(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    } else {
      setCoverPreview(null);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  // Remove cover image
  const removeCover = () => {
    setCover(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    // Reset the input value
    const coverInput = document.getElementById('cover-input') as HTMLInputElement;
    if (coverInput) coverInput.value = '';
  };

  // Remove image
  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    // Reset the input value
    const imageInput = document.getElementById('image-input') as HTMLInputElement;
    if (imageInput) imageInput.value = '';
  };

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [coverPreview, imagePreview]);

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

    try {
      await postData("owner/blogs", formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      router.back();
      showToast("Blog added successfully", "success");
    } catch {
      // console.error("Failed to create blog:", error);
      showToast("Failed to add blog", "error");
    }
  };

  // English fields (without meta and keywords fields)
  const englishFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_en", label: "Title (EN)" },
    { name: "slug_en", label: "Slug (EN)" },
    { name: "user_en", label: "User (EN)" },
  ];

  // Arabic fields (without meta and keywords fields)
  const arabicFields: { name: keyof FormInputs; label: string }[] = [
    { name: "title_ar", label: "Title (AR)" },
    { name: "slug_ar", label: "Slug (AR)" },
    { name: "user_ar", label: "User (AR)" },
  ];

  // Meta fields for both languages (including keywords)
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

  const TabButton = ({ label, isActive, onClick }: {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t("Create Content")}
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            <TabButton
              label={t("Arabic Content")}
              isActive={activeTab === "ar"}
              onClick={() => setActiveTab("ar")}
            />
            <TabButton
              label={t("English Content")}
              isActive={activeTab === "en"}
              onClick={() => setActiveTab("en")}
            />
            <TabButton
              label={t("Meta Information")}
              isActive={activeTab === "meta"}
              onClick={() => setActiveTab("meta")}
            />
            <TabButton
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

            {/* Meta Information Tab */}
            {activeTab === "meta" && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t("SEO Meta Information & Keywords")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {metaFields.map(({ name, label, dir }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                        dir={dir}
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
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
                    {/* Cover Upload */}
                    <div>
                      <label className="block mb-1 font-medium">{t("Cover")}</label>
                      <input
                        id="cover-input"
                        type="file"
                        onChange={handleCoverChange}
                        accept="image/*"
                        className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                        required
                      />
                      
                      {/* Cover Preview */}
                      {coverPreview && (
                        <div className="mt-3 relative">
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={removeCover}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors duration-200"
                            title="Remove cover"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block mb-1 font-medium">{t("Image")}</label>
                      <input
                        id="image-input"
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                        required
                      />
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="mt-3 relative">
                          <img
                            src={imagePreview}
                            alt="Image preview"
                            className="w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors duration-200"
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
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
                {t("Submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateContentPage;