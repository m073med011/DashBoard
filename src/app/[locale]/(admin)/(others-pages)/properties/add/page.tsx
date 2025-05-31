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
  // General Information
  type_id: string;
  area_id: string;
  price: string;
  down_price: string;
  sqt: string;
  bedroom: string;
  bathroom: string;
  kitchen: string;
  status: string;
  type: string;
  immediate_delivery: string;
  
  // English fields
  title_en: string;
  description_en: string;
  keywords_en: string;
  slug_en: string;
  meta_title_en: string;
  meta_description_en: string;
  meta_keywords_en: string;
  
  // Arabic fields
  title_ar: string;
  description_ar: string;
  keywords_ar: string;
  slug_ar: string;
  meta_title_ar: string;
  meta_description_ar: string;
  meta_keywords_ar: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

type SelectOption = {
  id: string;
  title?: string;
  name?: string;
};

type AreaOption = {
  id: number;
  image: string;
  count_of_properties: number;
  name: string;
  description: {
    en: {
      name: string;
    };
    ar: {
      name: string;
    };
  };
};

const CreatePropertyPage = () => {
  const t = useTranslations("properties");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>();

  // Tab state - starting with general information
  const [activeTab, setActiveTab] = useState<"general" | "ar" | "en" | "seo">("general");

  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [images, setImages] = useState<FileList | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  // State for dropdown options
  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        showToast("Authentication token not found", "error");
        return;
      }

      try {
        // Fetch types and areas - adjust API endpoints as needed
        const [typesResponse, areasResponse] = await Promise.all([
          getData("owner/types", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` })),
          getData("owner/areas", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` }))
        ]);

        if (typesResponse.status) setPropertyTypes(typesResponse.data);
        if (areasResponse.status) setAreas(areasResponse.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        showToast("Error fetching dropdown data", "error");
      }
    };

    fetchDropdownData();
  }, []);

  const onSubmit = async (data: FormInputs) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("Authentication token not found", "error");
      return;
    }

    const formData = new FormData();
    
    // Add general fields
    formData.append("type_id", data.type_id);
    formData.append("area_id", data.area_id);
    formData.append("price", data.price);
    formData.append("down_price", data.down_price);
    formData.append("sqt", data.sqt);
    formData.append("bedroom", data.bedroom);
    formData.append("bathroom", data.bathroom);
    formData.append("kitichen", data.kitchen);
    formData.append("status", data.status);
    formData.append("type", data.type);
    formData.append("immediate_delivery", data.immediate_delivery);
    
    // Add English fields
    formData.append("title[en]", data.title_en);
    formData.append("description[en]", descriptionEn);
    formData.append("keywords[en]", data.keywords_en);
    formData.append("slug[en]", data.slug_en);
    formData.append("meta_title[en]", data.meta_title_en);
    formData.append("meta_description[en]", data.meta_description_en);
    formData.append("meta_keywords[en]", data.meta_keywords_en);
    
    // Add Arabic fields
    formData.append("title[ar]", data.title_ar);
    formData.append("description[ar]", descriptionAr);
    formData.append("keywords[ar]", data.keywords_ar);
    formData.append("slug[ar]", data.slug_ar);
    formData.append("meta_title[ar]", data.meta_title_ar);
    formData.append("meta_description[ar]", data.meta_description_ar);
    formData.append("meta_keywords[ar]", data.meta_keywords_ar);

    // Add images
    if (images) {
      for (let i = 0; i < images.length; i++) {
        formData.append("images[]", images[i]);
      }
    }

    try {
      await postData("owner/property_listings", formData,  new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast(t("Property added successfully"), "success");
      router.back();
    } catch (error) {
      console.error("Failed to create property:", error);
      showToast(t("Failed to add property"), "error");
    }
  };

  const TabButton = ({ label, isActive, onClick }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-shrink-0 px-6 py-3 rounded-t-lg font-medium transition-colors duration-200 whitespace-nowrap ${
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
            {t("Create Property")}
          </h1>
          
          {/* Tab Navigation - Sliding on small screens */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              <TabButton
                label={t("General Information")}
                isActive={activeTab === "general"}
                onClick={() => setActiveTab("general")}
              />
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
                label={t("SEO Settings")}
                isActive={activeTab === "seo"}
                onClick={() => setActiveTab("seo")}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* General Information Tab */}
            {activeTab === "general" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                  <div>
                    <label className="block mb-1 font-medium">{t("Property Type")}</label>
                    <select
                      {...register("type_id", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      <option value="">{t("Select Type")}</option>
                      {propertyTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.title}
                        </option>
                      ))}
                    </select>
                    {errors.type_id && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Area")}</label>
                    <select
                      {...register("area_id", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      <option value="">{t("Select Area")}</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.description.en.name} / {area.description.ar.name}
                        </option>
                      ))}
                    </select>
                    {errors.area_id && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Price")}</label>
                    <input
                      {...register("price", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Down Price")}</label>
                    <input
                      {...register("down_price", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.down_price && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Square Meters")}</label>
                    <input
                      {...register("sqt", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.sqt && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Bedroom")}</label>
                    <input
                      {...register("bedroom", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.bedroom && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Bathroom")}</label>
                    <input
                      {...register("bathroom", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.bathroom && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Kitchen")}</label>
                    <input
                      {...register("kitchen", { required: true })}
                      type="number"
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.kitchen && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Status")}</label>
                    <select
                      {...register("status", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      
                      <option value="">{t("Select Status")}</option>
                      <option value="rent">{t("Rent")}</option>
                      <option value="sale">{t("Sale")}</option>
                    </select>
                    {errors.status && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Type")}</label>
                    <select
                      {...register("type", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      <option value="">{t("Select Type")}</option>
                      <option value="apartment">{t("Apartment")}</option>
                      <option value="office">{t("Office")}</option>
                    </select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Immediate Delivery")}</label>
                    <select
                      {...register("immediate_delivery", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    >
                      <option value="">{t("Select Option")}</option>
                      <option value="yes">{t("Yes")}</option>
                      <option value="no">{t("No")}</option>
                    </select>
                    {errors.immediate_delivery && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mt-6">
                  <label className="block mb-1 font-medium">{t("Property Images")}</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImages(e.target.files)}
                    className="w-full border px-4 py-2 rounded-md bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-sm"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">{t("Select multiple images for the property")}</p>
                </div>
              </div>
            )}

            {/* Arabic Content Tab */}
            {activeTab === "ar" && (
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-1 font-medium">{t("Title (AR)")}</label>
                    <input
                      {...register("title_ar", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.title_ar && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Slug (AR)")}</label>
                    <input
                      {...register("slug_ar", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.slug_ar && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Keywords (AR)")}</label>
                    <input
                      {...register("keywords_ar", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.keywords_ar && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>
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
                  <div>
                    <label className="block mb-1 font-medium">{t("Title (EN)")}</label>
                    <input
                      {...register("title_en", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.title_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Slug (EN)")}</label>
                    <input
                      {...register("slug_en", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.slug_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Keywords (EN)")}</label>
                    <input
                      {...register("keywords_en", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.keywords_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>
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

            {/* SEO Settings Tab */}
            {activeTab === "seo" && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t("English SEO")}</h3>
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Title (EN)")}</label>
                    <input
                      {...register("meta_title_en", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.meta_title_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Description (EN)")}</label>
                    <textarea
                      {...register("meta_description_en", { required: true })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.meta_description_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Keywords (EN)")}</label>
                    <input
                      {...register("meta_keywords_en", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                    />
                    {errors.meta_keywords_en && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">{t("Arabic SEO")}</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Title (AR)")}</label>
                    <input
                      {...register("meta_title_ar", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.meta_title_ar && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Description (AR)")}</label>
                    <textarea
                      {...register("meta_description_ar", { required: true })}
                      rows={3}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.meta_description_ar && (
                      <p className="text-red-500 text-sm mt-1">{t("This field is required")}</p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-1 font-medium">{t("Meta Keywords (AR)")}</label>
                    <input
                      {...register("meta_keywords_ar", { required: true })}
                      className="w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring focus:ring-blue-400"
                      dir="rtl"
                    />
                    {errors.meta_keywords_ar && (
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
                {t("Submit")}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CreatePropertyPage;