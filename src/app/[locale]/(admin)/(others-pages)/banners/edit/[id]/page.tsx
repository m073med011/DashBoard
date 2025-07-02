"use client";

import React, { useState, useEffect } from "react";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useForm } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
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

const EditBannerPage = () => {
  const t = useTranslations("banners");
  const router = useRouter();
  const params = useParams();
  const bannerId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormInputs>();

  // Tab state - starting with Arabic like the original page
  const [activeTab, setActiveTab] = useState<"ar" | "en" | "general">("ar");

  const [imageEn, setImageEn] = useState<File | null>(null);
  const [imageAr, setImageAr] = useState<File | null>(null);
  const [currentImageEn, setCurrentImageEn] = useState<string>("");
  const [currentImageAr, setCurrentImageAr] = useState<string>("");
  // Add preview URLs state
  const [imageEnPreview, setImageEnPreview] = useState<string | null>(null);
  const [imageArPreview, setImageArPreview] = useState<string | null>(null);
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

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

  // Fetch banner data on component mount
  useEffect(() => {
    const fetchBannerData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        showToast("Authentication token not found", "error");
        return;
      }

      try {
        const response = await getData(`owner/banners/${bannerId}`,{}, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
        
        if (response.status && response.data) {
          const bannerData: BannerData = response.data;
          
          // Set form values
          setValue("link", bannerData.link);
          setValue("type", bannerData.type);
          setValue("name_en", bannerData.en.name);
          setValue("name_ar", bannerData.ar.name);
          
          // Set rich text editor values
          setDescriptionEn(bannerData.en.description);
          setDescriptionAr(bannerData.ar.description);
          
          // Set current images
          setCurrentImageEn(bannerData.en.image);
          setCurrentImageAr(bannerData.ar.image);
        }
      } catch (error) {
        console.error("Failed to fetch banner data:", error);
        showToast(t("Failed to load banner data"), "error");
      } finally {
        setLoading(false);
      }
    };

    if (bannerId) {
      fetchBannerData();
    }
  }, [bannerId, setValue, t]);

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
    formData.append("description[en]", descriptionEn);
    
    // Arabic fields
    formData.append("name[ar]", data.name_ar);
    formData.append("description[ar]", descriptionAr);

    // Images (only append if new images are selected)
    if (imageEn) formData.append("image[en]", imageEn);
    if (imageAr) formData.append("image[ar]", imageAr);

    // Add method override for PUT request
    formData.append("_method", "PUT");

    try {
      await postData(`owner/banners/${bannerId}`, formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast(t("Banner updated successfully"), "success");
      router.back();
    } catch (error) {
      console.error("Failed to update banner:", error);
      showToast(t("Failed to update banner"), "error");
    }
  };

  // English fields
  const englishFields: { name: keyof FormInputs; label: string }[] = [
    { name: "name_en", label: "Name (EN)" },
  ];

  // Arabic fields
  const arabicFields: { name: keyof FormInputs; label: string }[] = [
    { name: "name_ar", label: "Name (AR)" },
  ];

  // General fields
  const generalFields: { name: keyof FormInputs; label: string }[] = [
    { name: "link", label: "Link" },
    { name: "type", label: "Type" },
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

  if (loading) {
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
          <h1 className="text-3xl font-bold mb-6 text-center">
            {t("Edit Banner")}
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
                
                {/* Arabic Description Rich Text Editor */}
                <div className="mt-6">
                  <RichTextEditor
                    value={descriptionAr}
                    onChange={setDescriptionAr}
                    label={t("Description (AR)")}
                  />
                </div>
                
                {/* Arabic Image Upload */}
                <div className="mt-6">
                  <label className="block mb-1 font-medium">{t("Image (AR)")}</label>
                  {currentImageAr && !imageAr && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t("Current Image:")}</p>
                      <ImageWithFallback
                        src={currentImageAr || ''}
                        alt="Current Arabic image"
                        width={200}
                        height={150}
                        className="w-48 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <input
                    id="image-ar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageArChange}
                    className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("Leave empty to keep current image")}</p>
                  
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
                
                {/* English Description Rich Text Editor */}
                <div className="mt-6">
                  <RichTextEditor
                    value={descriptionEn}
                    onChange={setDescriptionEn}
                    label={t("Description (EN)")}
                  />
                </div>
                
                {/* English Image Upload */}
                <div className="mt-6">
                  <label className="block mb-1 font-medium">{t("Image (EN)")}</label>
                  {currentImageEn && !imageEn && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t("Current Image:")}</p>
                      <ImageWithFallback
                        src={currentImageEn || ''}
                        alt="Current English image"
                        width={200}
                        height={150}
                        className="w-48 h-32 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                  <input
                    id="image-en-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageEnChange}
                    className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("Leave empty to keep current image")}</p>
                  
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
                  {generalFields.map(({ name, label }) => (
                    <div key={name}>
                      <label className="block mb-1 font-medium">{t(label)}</label>
                      <input
                        {...register(name, { required: true })}
                        className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                        placeholder={name === "link" ? "https://example.com" : "Enter banner type"}
                      />
                      {errors[name] && (
                        <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                      )}
                    </div>
                  ))}
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
                {t("Update Banner")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBannerPage;