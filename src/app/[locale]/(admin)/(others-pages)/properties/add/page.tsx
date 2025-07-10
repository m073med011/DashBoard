"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import { useRouter } from "@/i18n/routing";
import { useTranslations,useLocale } from "next-intl";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import { ChevronDown, ChevronUp, DollarSign, Home, FileText, Globe, Camera, Check, X } from "lucide-react";
import Image from "next/image";
import GoogleLocationSearch from "@/components/common/GoogleLocationInput"


type FormInputs = {
  // General Information
  type_id: string;
  area_id: string;
  userId: string;
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
  
  // Arabic fields
  title_ar: string;
  description_ar: string;
  keywords_ar: string;
  slug_ar: string;

  // Location field
  location: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

interface LocationData {
  address: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

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

type AgentOption = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
};

type ImagePreview = {
  file: File;
  url: string;
  id: string;
};

const CreatePropertyPage = () => {
  const t = useTranslations("properties");
  const locale=useLocale();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormInputs>();

  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [locationValue, setLocationValue] = useState<string>("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
  });

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    rooms: true,
    details: true,
    arabic: true,
    english: true,
    images: true
  });

  // State for dropdown options
  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle selecting a single image
  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Clean up previous image URL if exists
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }

    const file = files[0]; // Take only the first file
    const url = URL.createObjectURL(file);
    const id = `${Date.now()}-${Math.random()}`;
    
    setImagePreview({ file, url, id });
  };

  // Handle removing the image
  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
  };

  // Cleanup URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, []);

  // Fetch dropdown data on component mount
  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        showToast(t("auth_token_not_found"), "error");
        return;
      }

      try {
        const [typesResponse, areasResponse, agentsResponse] = await Promise.all([
          getData("owner/types", {}, new AxiosHeaders({ Authorization: `Bearer ${token}`,lang:locale })),
          getData("owner/areas", {}, new AxiosHeaders({ Authorization: `Bearer ${token}`,lang:locale })),
          getData("owner/agents", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` }))
        ]);

        if (typesResponse.status) setPropertyTypes(typesResponse.data);
        if (areasResponse.status) setAreas(areasResponse.data);
        setAgents(agentsResponse);
        console.log(agents, "agents data fetched successfully");

      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        showToast(t("error_fetching_dropdown_data"), "error");
      }
    };

    fetchDropdownData();
  }, []);

  const onSubmit = async (data: FormInputs) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      showToast(t("auth_token_not_found"), "error");
      return;
    }

    if (!imagePreview) {
      showToast("please_select_an_image", "error");
      return;
    }

    const formData = new FormData();
    
    // Add general fields
    formData.append("type_id", data.type_id);
    formData.append("area_id", data.area_id);
    formData.append("user_id", data.userId);
    formData.append("price", data.price);
    formData.append("down_price", data.down_price);
    formData.append("sqt", data.sqt);
    formData.append("bedroom", data.bedroom);
    formData.append("bathroom", data.bathroom);
    formData.append("kitichen", data.kitchen);
    formData.append("status", data.status);
    formData.append("type", data.type);
    formData.append("immediate_delivery", data.immediate_delivery);
    
    // Add location data
    formData.append("location", locationValue);
    if (locationData) {
      // formData.append("location_data", JSON.stringify(locationData));
      formData.append("location_place_id", locationData.placeId);
      if (locationData.lat) formData.append("location_lat", locationData.lat.toString());
      if (locationData.lng) formData.append("location_lng", locationData.lng.toString());
    }

    // Add English fields
    formData.append("title[en]", data.title_en);
    formData.append("description[en]", descriptionEn);
    formData.append("keywords[en]", data.keywords_en);
    formData.append("slug[en]", data.slug_en);
    
    // Add Arabic fields
    formData.append("title[ar]", data.title_ar);
    formData.append("description[ar]", descriptionAr);
    formData.append("keywords[ar]", data.keywords_ar);
    formData.append("slug[ar]", data.slug_ar);

    // Add single image
    formData.append("cover", imagePreview.file);

    try {
      const response = await postData("owner/property_listings", formData, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      showToast("property_added_successfully", "success");
      router.push(`/properties/view/${response?.data?.id}`);
    } catch (error) {
      console.error("Failed to create property:", error);
      showToast("failed_to_add_property", "error");
    }
  };

  const SectionHeader = ({ 
    title, 
    icon, 
    sectionKey, 
    description 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    sectionKey: keyof typeof expandedSections;
    description?: string;
  }) => (
    <div 
      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg cursor-pointer hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 border border-slate-200 dark:border-slate-600"
      onClick={() => toggleSection(sectionKey)}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${expandedSections[sectionKey] ? 'bg-green-500' : 'bg-slate-300'} transition-colors duration-200`}></div>
        {expandedSections[sectionKey] ? 
          <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : 
          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        }
      </div>
    </div>
  );

  const InputField = ({ 
    label, 
    name, 
    type = "text", 
    required = false, 
    options = [], 
    dir = "ltr",
    placeholder = ""
  }: {
    label: string;
    name: keyof FormInputs;
    type?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    dir?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-dark dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === "select" ? (
        <select
          {...register(name, { required })}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          dir={dir}
        >
          <option value="">{placeholder || `${t("select")} ${label}`}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...register(name, { required })}
          type={type}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
          dir={dir}
          placeholder={placeholder}
        />
      )}
      {errors[name] && (
        <p className="text-red-500 text-sm flex items-center">
          <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
          {t("field_required")}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent mb-2">
            {t("create_property")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {t("fill_property_details_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("basic_information")} 
              icon={<Home className="w-5 h-5 text-blue-600" />}
              sectionKey="basic"
              description={t("property_type_location_details")}
            />
            {expandedSections.basic && (
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <GoogleLocationSearch
                    label={t("location")}
                    name="location"
                    value={locationValue}
                    onChange={(value, googleLocationData) => {
                      // Update the location text value
                      setLocationValue(value);

                      // Update react-hook-form value
                      setValue("location", value);

                      // Update the location data if provided
                      if (googleLocationData) {
                        setLocationData(googleLocationData);
                        console.log('Location data:', googleLocationData);
                      }
                    }}
                    placeholder={t("enter_your_location")}
                    required={true}
                    dir="ltr"
                    error={!!errors.location}
                    errorMessage={errors.location ? t("field_required") : undefined}
                    t={t}
                  />
                  </div>
                <InputField
                  label={t("property_type")}
                  name="type_id"
                  type="select"
                  required
                  options={propertyTypes.map(type => ({ value: type.id, label: type.title || '' }))}
                  placeholder={t("select_type")}
                />
                <InputField
                  label={t("area")}
                  name="area_id"
                  type="select"
                  required
                  options={areas.map(area => ({ 
                    value: area.id.toString(), 
                    label: `${area?.name}` 
                  }))}
                  placeholder={t("select_area")}
                />
                
                <InputField
                  label={t("Agent")}
                  name="userId"
                  type="select"
                  required
                  options={agents?.map(agent => ({
                    value: agent.id.toString(),
                    label: agent.name
                  }))}
                  placeholder={t(`select_agent`)}
                />
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("pricing_financial_details")} 
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              sectionKey="pricing"
              description={t("property_pricing_payment_info")}
            />
            {expandedSections.pricing && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label={t("price")}
                  name="price"
                  type="number"
                  required
                  placeholder={t("enter_property_price")}
                />
                <InputField
                  label={t("down_price")}
                  name="down_price"
                  type="number"
                  required
                  placeholder={t("enter_down_payment_amount")}
                />
              </div>
            )}
          </div>

          {/* Room Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("room_configuration")} 
              icon={<Home className="w-5 h-5 text-orange-600" />}
              sectionKey="rooms"
              description={t("bedrooms_bathrooms_kitchen_details")}
            />
            {expandedSections.rooms && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  label={t("square_meters")}
                  name="sqt"
                  type="number"
                  required
                  placeholder={t("property_size")}
                />
                <InputField
                  label={t("bedroom")}
                  name="bedroom"
                  type="number"
                  required
                  placeholder={t("number_of_bedrooms")}
                />
                <InputField
                  label={t("bathroom")}
                  name="bathroom"
                  type="number"
                  required
                  placeholder={t("number_of_bathrooms")}
                />
                <InputField
                  label={t("kitchen")}
                  name="kitchen"
                  type="number"
                  required
                  placeholder={t("number_of_kitchens")}
                />
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("property_details")} 
              icon={<FileText className="w-5 h-5 text-purple-600" />}
              sectionKey="details"
              description={t("status_type_delivery_info")}
            />
            {expandedSections.details && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField
                  label={t("status")}
                  name="status"
                  type="select"
                  required
                  options={[
                    { value: "rent", label: t("rent") },
                    { value: "sale", label: t("sale") }
                  ]}
                  placeholder={t("select_status")}
                />
                <InputField
                  label={t("type")}
                  name="type"
                  type="select"
                  required
                  options={[
                    { value: "apartment", label: t("apartment") },
                    { value: "office", label: t("office") }
                  ]}
                  placeholder={t("select_type")}
                />
                <InputField
                  label={t("immediate_delivery")}
                  name="immediate_delivery"
                  type="select"
                  required
                  options={[
                    { value: "yes", label: t("yes") },
                    { value: "no", label: t("no") }
                  ]}
                  placeholder={t("select_option")}
                />
              </div>
            )}
          </div>

          {/* Arabic Content */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("arabic_content")} 
              icon={<Globe className="w-5 h-5 text-emerald-600" />}
              sectionKey="arabic"
              description={t("arabic_title_description_seo")}
            />
            {expandedSections.arabic && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label={t("title_ar")}
                    name="title_ar"
                    required
                    dir="rtl"
                    placeholder={t("title_arabic_placeholder")}
                  />
                  <InputField
                    label={t("slug_ar")}
                    name="slug_ar"
                    required
                    dir="rtl"
                    placeholder={t("slug_arabic_placeholder")}
                  />
                </div>
                <InputField
                  label={t("keywords_ar")}
                  name="keywords_ar"
                  required
                  dir="rtl"
                  placeholder={t("keywords_arabic_placeholder")}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("description_ar")} <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                    <RichTextEditor
                      value={descriptionAr}
                      onChange={setDescriptionAr}
                      label=""
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* English Content */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("english_content")} 
              icon={<Globe className="w-5 h-5 text-blue-600" />}
              sectionKey="english"
              description={t("english_title_description_seo")}
            />
            {expandedSections.english && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField
                    label={t("title_en")}
                    name="title_en"
                    required
                    placeholder={t("title_english_placeholder")}
                  />
                  <InputField
                    label={t("slug_en")}
                    name="slug_en"
                    required
                    placeholder={t("slug_english_placeholder")}
                  />
                </div>
                <InputField
                  label={t("keywords_en")}
                  name="keywords_en"
                  required
                  placeholder={t("keywords_english_placeholder")}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t("description_en")} <span className="text-red-500">*</span>
                  </label>
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                    <RichTextEditor
                      value={descriptionEn}
                      onChange={setDescriptionEn}
                      label=""
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

         {/* Single Image Upload */}
         <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader 
              title={t("property_image")}
              icon={<Camera className="w-5 h-5 text-pink-600" />}
              sectionKey="images"
              description={t("upload_high_quality_photo")}
            />
            {expandedSections.images && (
              <div className="p-6 space-y-6">
                {/* Upload Area with Preview */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200">
                  {!imagePreview ? (
                    // Upload prompt when no image
                    <div className="p-8 text-center">
                      <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <label className="cursor-pointer">
                        <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
                          {t("click_to_upload_image")}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageSelect(e.target.files)}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {t("select_high_quality_image")}
                      </p>
                    </div>
                  ) : (
                    // Image preview with overlay controls
                    <div className="relative group">
                      <Image
                        width={800}
                        height={400}
                        src={imagePreview.url}
                        alt={t("property_preview")}
                        className="w-full h-64 md:h-80 object-cover"
                      />
                      
                      {/* Overlay controls */}
                      <div className="absolute inset-0  group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-3">
                          {/* Change image button */}
                          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transform hover:scale-110 transition-all duration-200">
                            <Camera className="w-5 h-5" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageSelect(e.target.files)}
                              className="hidden"
                            />
                          </label>
                          
                          {/* Remove image button */}
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transform hover:scale-110 transition-all duration-200"
                            title={t("remove_image")}
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Success indicator */}
                      <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2 shadow-lg">
                        <Check className="w-4 h-4" />
                      </div>
                      
                      {/* Image info overlay */}
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg">
                        <p className="text-sm font-medium">{imagePreview.file.name}</p>
                        <p className="text-xs opacity-90">
                          {(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Helper text */}
                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {imagePreview 
                      ? t("hover_over_image_to_change_or_remove") 
                      : t("supported_formats_jpg_png_webp")
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>{t("create_property")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePropertyPage;