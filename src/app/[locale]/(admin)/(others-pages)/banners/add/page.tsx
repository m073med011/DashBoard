"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { postData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
import Image from "next/image";

type FormInputs = {
  link: string;
  type: string;
  name_en: string;
  description_en: string;
  name_ar: string;
  description_ar: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

const CreateBannerPage = () => {
  const t = useTranslations("banners");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  // Tab state - starting with Arabic like the original page
  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general">("ar");

  const [imageEn, setImageEn] = useState<File | null>(null);
  const [imageAr, setImageAr] = useState<File | null>(null);
  // Add preview URLs state
  const [imageEnPreview, setImageEnPreview] = useState<string | null>(null);
  const [imageArPreview, setImageArPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  // Banner type options
  const bannerTypes = [
    { value: "", label: "Select banner type" },
    { value: "banner", label: "Banner" },
   
  ];

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle English image selection
  const handleImageEnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageEn(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageEnPreview(previewUrl);
    } else {
      setImageEnPreview(null);
    }
  };

  // Handle Arabic image selection
  const handleImageArChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageAr(file);
    
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImageArPreview(previewUrl);
    } else {
      setImageArPreview(null);
    }
  };

  // Remove English image
  const removeImageEn = () => {
    setImageEn(null);
    if (imageEnPreview) {
      URL.revokeObjectURL(imageEnPreview);
      setImageEnPreview(null);
    }
    // Reset the input value
    const imageInput = document.getElementById('image-en-input') as HTMLInputElement;
    if (imageInput) imageInput.value = '';
  };

  // Remove Arabic image
  const removeImageAr = () => {
    setImageAr(null);
    if (imageArPreview) {
      URL.revokeObjectURL(imageArPreview);
      setImageArPreview(null);
    }
    // Reset the input value
    const imageInput = document.getElementById('image-ar-input') as HTMLInputElement;
    if (imageInput) imageInput.value = '';
  };

  // Cleanup preview URLs on component unmount
  useEffect(() => {
    return () => {
      if (imageEnPreview) URL.revokeObjectURL(imageEnPreview);
      if (imageArPreview) URL.revokeObjectURL(imageArPreview);
    };
  }, [imageEnPreview, imageArPreview]);

  const onSubmit = async (data: FormInputs) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    const formData = new FormData();

    // General fields
    formData.append("link", data.link);
    formData.append("type", data.type);
    
    // English fields
    formData.append("name[en]", data.name_en);
    formData.append("description[en]", data.description_en);
    
    // Arabic fields
    formData.append("name[ar]", data.name_ar);
    formData.append("description[ar]", data.description_ar);

    // Images
    if (imageEn) formData.append("image[en]", imageEn);
    if (imageAr) formData.append("image[ar]", imageAr);

    try {
      await postData("owner/banners", formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast(t("Banner added successfully"), "success");
      router.back();
    } catch (error) {
      console.error("Failed to create banner:", error);
      showToast(t("Failed to add banner"), "error");
    }
  };

  // English fields
  const englishFields: { name: keyof FormInputs; label: string }[] = [
    { name: "name_en", label: "Name (EN)" },
    { name: "description_en", label: "Description (EN)" },
  ];

  // Arabic fields
  const arabicFields: { name: keyof FormInputs; label: string }[] = [
    { name: "name_ar", label: "Name (AR)" },
    { name: "description_ar", label: "Description (AR)" },
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
            {t("Create Banner")}
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
              label={t("General Information")}
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* Arabic Content Tab */}
            {activeTab === "ar" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 gap-6">
                  {arabicFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      {name === "description_ar" ? (
                        <textarea
                          {...register(name, { required: true })}
                          rows={4}
                          className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                          dir="rtl"
                        />
                      ) : (
                        <input
                          {...register(name, { required: true })}
                          className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                          dir="rtl"
                        />
                      )}
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Arabic Image Upload */}
                <div className="mt-6">
                  <label className="block mb-1 font-medium">{t("Image (AR)")}</label>
                  <input
                    id="image-ar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageArChange}
                    className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                    required
                  />
                  
                  {/* Arabic Image Preview */}
                  {imageArPreview && (
                    <div className="mt-3 relative">
                      <Image
                      width={100}
                      height={100}
                        src={imageArPreview}
                        alt="Arabic image preview"
                        className="w-full h-48 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeImageAr}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors duration-200"
                        title="Remove Arabic image"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* English Content Tab */}
            {activeTab === "en" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 gap-6">
                  {englishFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      {name === "description_en" ? (
                        <textarea
                          {...register(name, { required: true })}
                          rows={4}
                          className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                        />
                      ) : (
                        <input
                          {...register(name, { required: true })}
                          className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                        />
                      )}
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* English Image Upload */}
                <div className="mt-6">
                  <label className="block mb-1 font-medium">{t("Image (EN)")}</label>
                  <input
                    id="image-en-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageEnChange}
                    className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                    required
                  />
                  
                  {/* English Image Preview */}
                  {imageEnPreview && (
                    <div className="mt-3 relative">
                      <Image
                      width={100}
                      height={100}
                        src={imageEnPreview}
                        alt="English image preview"
                        className="w-full h-48 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={removeImageEn}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors duration-200"
                        title="Remove English image"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Information Tab */}
            {activeTab === "general" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Link Field */}
                  <div>
                    <label className="block mb-1 font-medium">{t("Link")}</label>
                    <input
                      {...register("link", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      placeholder="https://example.com"
                    />
                    {errors.link && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  {/* Type Select Field */}
                  <div>
                    <label className="block mb-1 font-medium">{t("Type")}</label>
                    <select
                      {...register("type", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      {bannerTypes.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.label)}
                        </option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
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
                {t("Create Banner")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBannerPage;