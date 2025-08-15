"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Phone,
  Mail,
  MessageCircle,
  Home,
  Bed,
  Bath,
  ChefHat,
  Ruler,
  CheckCircle,
  Clock,
  ChevronDown,
  // Calendar,
  Hash,
  Eye,
  Edit,
  Save,
  X,
  FileText,
  DollarSign,
  Globe,
  ChevronUp,
} from "lucide-react";
import {
  PropertyData,
  PropertyStatistics,
  PropertyUser,
  PropertyType,
} from "@/types/PropertyTypes";
import { useTranslations, useLocale } from "next-intl";
import { postData, getData } from "@/libs/axios/server";
import { AxiosHeaders } from "axios";
import Toast from "@/components/Toast";
import RichTextEditor from "@/components/RichTextEditor";
import GoogleLocationSearch from "@/components/common/GoogleLocationInput";

interface MainTabProps {
  propertystat: PropertyStatistics;
  property: PropertyData;
  refetch?: () => void;
}

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};

export const MainTab: React.FC<MainTabProps> = ({ property, propertystat, refetch }) => {
  const t = useTranslations("properties");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.approval_status || "pending");
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<PropertyData>(property);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", show: false });

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    rooms: true,
    details: true,
    arabic: true,
    english: true,
    images: true,
  });

  // Dropdown options
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [agents, setAgents] = useState<PropertyUser[]>([]);

  // Location state
  const [locationValue, setLocationValue] = useState<string>(property.location || "");
  const [locationData, setLocationData] = useState<{ address: string; placeId: string; lat?: number; lng?: number } | null>(null);

  // Rich text content
  const [descriptionEn, setDescriptionEn] = useState<string>(property.descriptions?.en?.description || "");
  const [descriptionAr, setDescriptionAr] = useState<string>(property.descriptions?.ar?.description || "");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setEditData({
      ...property,
      descriptions: property.descriptions || { en: {}, ar: {} },
      type: property.type || { id: 0, title: "Unknown", descriptions: { en: { title: "Unknown" }, ar: { title: "مجهول" } } },
      user: property.user || { id: 0, name: "Unknown", email: "", phone: "", avatar: "" },
    });
    setDescriptionEn(property.descriptions?.en?.description || "");
    setDescriptionAr(property.descriptions?.ar?.description || "");
    setLocationValue(property.location || "");
  }, [property]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchOptions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      const headers = new AxiosHeaders({ Authorization: `Bearer ${token}`, lang: locale });

      try {
        const [typesRes, agentsRes] = await Promise.all([
          getData("owner/types", {}, headers),
          getData("owner/agents", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` })),
        ]);
        if (typesRes.status) setPropertyTypes(typesRes.data);
        setAgents(agentsRes);
      } catch (err) {
        console.error("Failed to fetch dropdown data", err);
      }
    };
    fetchOptions();
  }, [locale]);

  const statusOptions = [
    { value: "accepted", label: "Accepted", color: "text-emerald-600", bgColor: "bg-emerald-50 hover:bg-emerald-100" },
    { value: "pending", label: "Pending", color: "text-amber-600", bgColor: "bg-amber-50 hover:bg-amber-100" },
    { value: "cancelled", label: "Cancelled", color: "text-rose-600", bgColor: "bg-rose-50 hover:bg-rose-100" },
  ];

  const getOptions = (key: string) => {
    switch (key) {
      case "status": return ["rent", "sale"];
      case "type": return ["apartment", "office"];
      case "immediate_delivery": return ["yes", "no"];
      case "furnishing": return ["all-furnished", "partly-furnished", "unfurnished"];
      default: return [];
    }
  };

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleApprovalStatusChange = async (newStatus: string) => {
    setLoading(true);
    setIsDropdownOpen(false);
    try {
      const token = localStorage.getItem("token");
      const headers = new AxiosHeaders();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await postData(`/owner/property_listings/${property.id}/change-status`, { approval_status: newStatus }, headers);
      if (response.status === 200) {
        setSelectedStatus(newStatus);
        showToast(t("Status updated successfully"), "success");
        window.location.reload();
      } else {
        showToast(response.message || t("Update failed"), "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      showToast(t("Status update failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = new AxiosHeaders();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const formData = new FormData();
      formData.append("_method", "PUT");

      // Basic Fields
      formData.append("type_id", editData.type.id.toString());
      formData.append("user_id", editData.user.id.toString());
      formData.append("price", editData.price.toString());
      formData.append("down_price", editData.down_price.toString());
      formData.append("sqt", editData.sqt.toString());
      formData.append("bedroom", editData.bedroom.toString());
      formData.append("bathroom", editData.bathroom.toString());
      formData.append("kitichen", editData.kitichen.toString());
      formData.append("status", editData.status);
      formData.append("immediate_delivery", editData.immediate_delivery);
      formData.append("furnishing", editData.furnishing || "");
      formData.append("payment_method", editData.payment_method);
      formData.append("mortgage", editData.mortgage);
      if (editData.paid_months) formData.append("paid_months", editData.paid_months.toString());

      // Location
      formData.append("location", locationValue);
      if (locationData) {
        formData.append("location_place_id", locationData.placeId);
        if (locationData.lat) formData.append("location_lat", locationData.lat.toString());
        if (locationData.lng) formData.append("location_lng", locationData.lng.toString());
      }

      // Descriptions
      formData.append("title[en]", editData.descriptions?.en?.title || "");
      formData.append("description[en]", descriptionEn);
      formData.append("keywords[en]", editData.descriptions?.en?.keywords || "");
      formData.append("slug[en]", editData.descriptions?.en?.slug || "");

      formData.append("title[ar]", editData.descriptions?.ar?.title || "");
      formData.append("description[ar]", descriptionAr);
      formData.append("keywords[ar]", editData.descriptions?.ar?.keywords || "");
      formData.append("slug[ar]", editData.descriptions?.ar?.slug || "");

      const response = await postData(`/owner/property_listings/${property.id}`, formData, headers);
      if (response.status === 200) {
        showToast(t("Property updated successfully"), "success");
        setIsEditing(false);
        refetch?.();
      } else {
        showToast(response.message || t("Update failed"), "error");
      }
    } catch (error) {
      console.error("Update error:", error);
      showToast(t("Update failed"), "error");
    } finally {
      setLoading(false);
    }
  };

  // const displayText = (text?: string) => text || "—";
  const displayNumber = (num?: number) => num || 0;

  // Reusable Components
  const SectionHeader = ({ title, icon, sectionKey, description }: { title: string; icon: React.ReactNode; sectionKey: keyof typeof expandedSections; description?: string }) => (
    <div
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition"
      onClick={() => setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#F26A3F] text-white rounded-lg">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      </div>
      {expandedSections[sectionKey] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
    </div>
  );

  const InputField = ({ label, value, onChange, type = "text", dir = "ltr", placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; dir?: string; placeholder?: string }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        dir={dir}
        placeholder={placeholder}
        className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800"
      />
    </div>
  );

  return (
    <div className="space-y-10 px-4 py-8 max-w-7xl mx-auto font-sans relative">
      {toast.show && <Toast message={toast.message} type={toast.type} />}

      {/* === Header: Status & Edit Button === */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative inline-block text-left w-64">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className="flex items-center justify-between w-full px-6 py-3 rounded-2xl font-semibold text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-f26a3f focus:outline-none focus:ring-4 focus:ring-f26a3f/30"
            style={{ borderColor: "#F26A3F20", boxShadow: "0 1px 3px #F26A3F10" }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                <span>{t("Updating")}</span>
              </>
            ) : (
              <>
                <span>{t("Status")}:</span>
                <span
                  className="capitalize font-bold"
                  style={{
                    color: selectedStatus === "accepted" ? "#059669" : selectedStatus === "pending" ? "#D97706" : "#DC2626",
                  }}
                >
                  {t(selectedStatus)}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>

          {isDropdownOpen && !loading && (
            <ul className="absolute right-0 mt-2 w-full rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
              {statusOptions.map((option) => (
                <li key={option.value}>
                  <button
                    onClick={() => handleApprovalStatusChange(option.value)}
                    disabled={selectedStatus === option.value}
                    className={`w-full flex items-center px-5 py-4 text-sm gap-3 ${option.bgColor} ${option.color} border-b border-gray-100 dark:border-gray-700 last:border-0 text-left`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.value === "accepted" ? "bg-emerald-500" : option.value === "pending" ? "bg-amber-500" : "bg-rose-500"}`}></div>
                    {t(option.label)}
                    {selectedStatus === option.value && <CheckCircle className="ml-auto h-4 w-4 opacity-70" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition"
            >
              <X className="h-4 w-4 inline mr-1" /> {t("Cancel")}
            </button>
          )}
          <button
            type="button"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={loading}
            className="px-5 py-2 bg-f26a3f text-black dark:text-white rounded-xl hover:bg-f26a3f/90 transition flex items-center gap-1 disabled:opacity-70"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-black dark:border-white border-t-transparent"></div>
                {t("Saving...")}
              </>
            ) : isEditing ? (
              <>
                <Save className="h-4 w-4" /> {t("Save")}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4" /> {t("Edit")}
              </>
            )}
          </button>
        </div>
      </div>

      {isDropdownOpen && (
        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} aria-hidden="true"></div>
      )}

      {/* === Statistics Cards === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Phone, label: t("Phone Calls"), value: displayNumber(propertystat?.data?.count_call) },
          { icon: MessageCircle, label: t("WhatsApp Messages"), value: displayNumber(propertystat?.data?.count_whatsapp) },
          { icon: Eye, label: t("Total Views"), value: displayNumber(property.views) },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border border-f26a3f/10 shadow-sm hover:shadow-lg transform ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: `${300 + i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: "#F26A3F" }}>{stat.value}</p>
              </div>
              <div className="p-3 rounded-xl bg-f26a3f text-white">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* === EDIT MODE === */}
      {isEditing && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("basic_information")}
              icon={<Home className="w-5 h-5" />}
              sectionKey="basic"
              description={t("property_type_location_details")}
            />
            {expandedSections.basic && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <GoogleLocationSearch
                    name="location"
                    label={t("location")}
                    value={locationValue}
                    onChange={(value, data) => {
                      setLocationValue(value);
                      setEditData({ ...editData, location: value });
                      if (data) setLocationData(data);
                    }}
                    placeholder={t("enter_your_location")}
                    required
                    t={t}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("property_type")}</label>
                  <select
                    value={editData.type.id}
                    onChange={(e) => setEditData({
                      ...editData,
                      type: { ...editData.type, id: Number(e.target.value) }
                    })}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800"
                  >
                    {propertyTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t("Agent")}</label>
                  <select
                    value={editData.user.id}
                    onChange={(e) => setEditData({
                      ...editData,
                      user: agents.find(a => a.id === Number(e.target.value)) || editData.user
                    })}
                    className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800"
                  >
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("pricing_financial_details")}
              icon={<DollarSign className="w-5 h-5" />}
              sectionKey="pricing"
            />
            {expandedSections.pricing && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label={t("price")}
                  value={editData.price.toString()}
                  onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                  type="number"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">{t("payment_method")}</label>
                  <div className="flex rounded-lg overflow-hidden border">
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, payment_method: "cash" })}
                      className={editData.payment_method === "cash" ? "bg-green-500 text-white flex-1 py-2" : "bg-gray-100 flex-1 py-2"}
                    >
                      {t("cash")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, payment_method: "installment" })}
                      className={editData.payment_method === "installment" ? "bg-blue-500 text-white flex-1 py-2" : "bg-gray-100 flex-1 py-2"}
                    >
                      {t("installment")}
                    </button>
                  </div>
                </div>
                {editData.payment_method === "installment" && (
                  <>
                    <InputField
                      label={t("down_price")}
                      value={editData.down_price.toString()}
                      onChange={(e) => setEditData({ ...editData, down_price: Number(e.target.value) })}
                      type="number"
                    />
                    <InputField
                      label={t("paid_months")}
                      value={editData.paid_months?.toString() || ""}
                      onChange={(e) => setEditData({
                        ...editData,
                        paid_months: e.target.value ? parseInt(e.target.value, 10) : null
                      })}
                      type="number"
                    />
                  </>
                )}
                <div className="space-y-3">
                  <label>{t("mortgage")}</label>
                  <button
                    type="button"
                    onClick={() => setEditData({ ...editData, mortgage: editData.mortgage === "yes" ? "no" : "yes" })}
                    className={`w-12 h-6 rounded-full transition ${editData.mortgage === "yes" ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white transform transition ${editData.mortgage === "yes" ? "translate-x-6" : "translate-x-1"}`}></span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rooms */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("room_configuration")}
              icon={<Home className="w-5 h-5" />}
              sectionKey="rooms"
            />
            {expandedSections.rooms && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(["sqt", "bedroom", "bathroom", "kitichen"] as const).map((field) => {
                  type Field = "sqt" | "bedroom" | "bathroom" | "kitichen";
                  const value = editData[field as Field];
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium mb-1">{t(field)}</label>
                      <input
                        type="number"
                        value={value.toString()}
                        onChange={(e) => setEditData({
                          ...editData,
                          [field]: Number(e.target.value)
                        })}
                        className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("property_details")}
              icon={<FileText className="w-5 h-5" />}
              sectionKey="details"
            />
            {expandedSections.details && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {(["status", "type", "immediate_delivery", "furnishing"] as const).map((key) => {
                  const value = editData[key as keyof PropertyData];
                  return (
                    <div key={key}>
                      <label>{t(key)}</label>
                      <select
                        value={value as string}
                        onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800"
                      >
                        {getOptions(key).map((opt) => (
                          <option key={opt} value={opt}>{t(opt)}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Arabic Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("arabic_content")}
              icon={<Globe className="w-5 h-5" />}
              sectionKey="arabic"
            />
            {expandedSections.arabic && (
              <div className="p-6 space-y-6" dir="rtl">
                <InputField
                  label={t("title_ar")}
                  value={editData.descriptions?.ar?.title || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    descriptions: {
                      ...editData.descriptions,
                      ar: { ...editData.descriptions?.ar, title: e.target.value }
                    }
                  })}
                  dir="rtl"
                />
                <InputField
                  label={t("keywords_ar")}
                  value={editData.descriptions?.ar?.keywords || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    descriptions: {
                      ...editData.descriptions,
                      ar: { ...editData.descriptions?.ar, keywords: e.target.value }
                    }
                  })}
                  dir="rtl"
                />
                <div>
                  <label className="block text-sm font-medium mb-2">{t("description_ar")}</label>
                  <RichTextEditor value={descriptionAr} onChange={setDescriptionAr} />
                </div>
              </div>
            )}
          </div>

          {/* English Content */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <SectionHeader
              title={t("english_content")}
              icon={<Globe className="w-5 h-5" />}
              sectionKey="english"
            />
            {expandedSections.english && (
              <div className="p-6 space-y-6">
                <InputField
                  label={t("title_en")}
                  value={editData.descriptions?.en?.title || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    descriptions: {
                      ...editData.descriptions,
                      en: { ...editData.descriptions?.en, title: e.target.value }
                    }
                  })}
                />
                <InputField
                  label={t("keywords_en")}
                  value={editData.descriptions?.en?.keywords || ""}
                  onChange={(e) => setEditData({
                    ...editData,
                    descriptions: {
                      ...editData.descriptions,
                      en: { ...editData.descriptions?.en, keywords: e.target.value }
                    }
                  })}
                />
                <div>
                  <label className="block text-sm font-medium mb-2">{t("description_en")}</label>
                  <RichTextEditor value={descriptionEn} onChange={setDescriptionEn} />
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* === VIEW MODE === */}
      {!isEditing && (
        <>
          <section
            className={`bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: "500ms" }}
          >
            <div className="p-8 text-white" style={{ background: "linear-gradient(135deg, #1e1e1e, #333)" }}>
              <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-2">
  {editData.descriptions?.[locale]?.title ||
   editData.descriptions?.en?.title ||
   editData.descriptions?.ar?.title ||
   editData.title ||
   "Untitled Property"}
</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-orange-100">
                    <StatusBadge label={t("Status")} value={selectedStatus} color="text-f26a3f" />
                    <StatusBadge label={t("State")} value={editData.status} color="text-blue-200" />
                    <StatusBadge label={t("Type")} value={editData?.type?.descriptions?.en?.title} color="text-purple-200" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-white">{displayNumber(editData.price).toLocaleString()} EGP</div>
                  {editData.down_price > 0 && <div className="text-orange-200 mt-1">Down: {displayNumber(editData.down_price).toLocaleString()} EGP</div>}
                  {/* Rent not in your type */}
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Bed, label: t("bedroom"), value: editData.bedroom },
                  { icon: Bath, label: t("bathroom"), value: editData.bathroom },
                  { icon: ChefHat, label: t("kitchen"), value: editData.kitichen },
                  { icon: Ruler, label: "Sq Ft", value: editData.sqt },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <item.icon className="h-6 w-6 mb-2" style={{ color: "#F26A3F" }} />
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-100">{item.value}</div>
                    <div className="text-sm text-gray-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <OwnerInfo user={editData.user} t={t} />
        </>
      )}
    </div>
  );
};

// === Reusable Components ===
const StatusBadge = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <span className="flex items-center gap-1 text-xs">
    <Clock className="h-3 w-3 opacity-70" />
    <strong>{label}:</strong>
    <span className={color} style={{ color: color === "text-f26a3f" ? "#F26A3F" : undefined }}>
      {value}
    </span>
  </span>
);

const OwnerInfo: React.FC<{ user?: PropertyUser; t: (key: string) => string }> = ({ user, t }) => (
  <section className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
    <div className="p-5 text-white" style={{ background: 'linear-gradient(135deg, #333, #1e1e1e)' }}>
      <h3 className="text-xl font-semibold flex items-center gap-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
        {t('Owner Information')}
      </h3>
    </div>
    <div className="p-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {user?.avatar && (
          <div className="relative">
            <Image src={user.avatar} alt={user.name} width={96} height={96} className="rounded-2xl ring-4 ring-slate-100 dark:ring-slate-900" />
            <div className="absolute -bottom-1 -right-1 bg-f26a3f w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <CheckCircle className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
        <div className="flex-1">
          <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user?.name || '—'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Mail className="h-4 w-4" style={{ color: '#F26A3F' }} /> {user?.email || '—'}
              </div>
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Phone className="h-4 w-4" style={{ color: '#F26A3F' }} /> {user?.phone || t('phone_not_found')}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Hash className="h-4 w-4" style={{ color: '#F26A3F' }} /> ID: {user?.id}
              </div>
              {/* <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4" style={{ color: '#F26A3F' }} /> {t('Joined')}: {new Date(user?.created_at || '').toLocaleDateString()}
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);