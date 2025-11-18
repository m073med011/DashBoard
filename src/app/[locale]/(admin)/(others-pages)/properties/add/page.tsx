"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useForm, useWatch, useController } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import axios, { AxiosHeaders } from "axios";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import Toast from "@/components/Toast";
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  Home,
  FileText,
  Globe,
  Camera,
  Check,
  X,
  Coins,
  CreditCard,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

// ============= TYPES =============
type FormInputs = {
  // General Information
  type_id: string;
  userId: string;
  price: string;
  down_price: string;
  sqt: string;
  bedroom: string;
  bathroom: string;
  status: string;
  type: string;
  immediate_delivery: string;
  payment_method: string;
  paid_months?: string;
  furnishing: string;
  mortgage?: string;
  starting_day: string;
  landing_space: string;

  // English fields
  title_en: string;
  description_en: string;
  keywords_en: string;
  slug_en: string;

  // Arabic fields
  title_ar: string;
  description_ar: string;
  keywords_ar: string;

  // Area field
  area_id: string;
};

type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
  translate?: boolean;
};

type AreaOption = {
  id: number;
  name: string;
  image: string;
  google_maps: string;
  developer: string;
};

type SelectOption = {
  id: string;
  title?: string;
  name?: string;
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

// ============= MAIN COMPONENT =============
const CreatePropertyPage = () => {
  const t = useTranslations("properties");
  const locale = useLocale();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
  } = useForm<FormInputs>();

  // ============= STATE HOOKS =============
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areaSearch, setAreaSearch] = useState<string>("");
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<AreaOption | null>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    show: false,
    translate: true,
  });

  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    rooms: true,
    details: true,
    arabic: true,
    english: true,
    images: true,
  });

  // ============= DERIVED STATE / WATCHERS =============
  const paymentMethod = useWatch({ control, name: "payment_method" }) || "cash";
  const status = useWatch({ control, name: "status" }) || "";
  const immediateDelivery = useWatch({ control, name: "immediate_delivery" }) || "";
  const selectedTypeId = useWatch({ control, name: "type_id" }) || "";
  
  // Check if selected property type is apartment
  const isApartment = useMemo(() => {
    if (!selectedTypeId || !propertyTypes.length) return false;
    const selectedType = propertyTypes.find(type => String(type.id) === String(selectedTypeId));
    if (!selectedType) return false;
    const typeTitle = (selectedType.title || "").toLowerCase();
    return typeTitle.includes("apartment") || typeTitle.includes("شقة");
  }, [selectedTypeId, propertyTypes]);

  // ============= CUSTOM HOOKS / UTILITIES =============
  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "info",
      translate: boolean = true
    ) => {
      setToast((prev) => ({ ...prev, show: false }));
      setTimeout(() => {
        setToast({ message, type, show: true, translate });
      }, 50);
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3050);
    },
    []
  );

  const toggleSection = useCallback(
    (section: keyof typeof expandedSections) => {
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
    },
    []
  );

  // ============= EVENT HANDLERS =============
  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }
    const file = files[0];
    const url = URL.createObjectURL(file);
    const id = `${Date.now()}-${Math.random()}`;
    setImagePreview({ file, url, id });
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
    }
  };

  const handleMortgageToggle = () => {
    const currentValue = watch("mortgage") === "yes";
    setValue("mortgage", currentValue ? "no" : "yes");
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        showToast(t("auth_token_not_found"), "error");
        return;
      }

      try {
        const [typesResponse, agentsResponse] = await Promise.all([
          getData(
            "owner/types",
            {},
            new AxiosHeaders({ Authorization: `Bearer ${token}`, lang: locale })
          ),
          getData(
            "owner/agents",
            {},
            new AxiosHeaders({ Authorization: `Bearer ${token}` })
          ),
        ]);

        if (typesResponse.status) setPropertyTypes(typesResponse.data);
        setAgents(agentsResponse);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        showToast("error_fetching_dropdown_data", "error");
      }
    };

    fetchDropdownData();
  }, [locale, t, showToast]);

  // Fetch areas with search
  useEffect(() => {
    const fetchAreas = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      setIsLoadingAreas(true);
      try {
        const params = areaSearch ? { search: areaSearch } : {};
        const response = await axios.get(
          "https://proplix.shop/api/v1/area-search",
          {
            params,
            headers: new AxiosHeaders({ Authorization: `Bearer ${token}`, lang: locale })
          }
        );
          setAreas(response.data.data);
      } catch (error) {
        console.error("Error fetching areas:", error);
      } finally {
        setIsLoadingAreas(false);
      }
    };

    // Fetch immediately on mount, then debounce on search
    if (!areaSearch) {
      fetchAreas();
    } else {
      const debounceTimer = setTimeout(() => {
        fetchAreas();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [areaSearch, locale]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setValue("payment_method", "cash");
  }, [setValue]);

  // ============= FORM SUBMISSION =============
  const onSubmit = async (data: FormInputs) => {
    // حماية من الضغط المتكرر
    if (isSubmitting) {
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      showToast("auth_token_not_found", "error");
      return;
    }
    if (!imagePreview) {
      showToast("please_select_an_image", "error");
      return;
    }

    // بدء عملية الإرسال
    setIsSubmitting(true);

    // Debug log to check form data before submission
    console.log("Form data before submission:", data);
    console.log("Starting day value:", data.starting_day);

    const formData = new FormData();

    // --- General Fields ---
    formData.append("type_id", data.type_id || "");
    formData.append("user_id", data.userId || "");
    formData.append("price", String(data.price || ""));
    formData.append("sqt", String(data.sqt || ""));
    formData.append("bedroom", String(data.bedroom || ""));
    formData.append("bathroom", String(data.bathroom || ""));
    
    
    formData.append("status", data.status || "");
    formData.append("type", data.type || "");
    formData.append("immediate_delivery", data.immediate_delivery || "");
    formData.append("furnishing", data.furnishing || "");
    formData.append("payment_method", data.payment_method || "");
    // Only append landing_space if property type is not apartment
    if (!isApartment) {
      formData.append("landing_space", String(data.landing_space || ""));
    }

    // --- Conditional Fields (Installment) ---
    if (data.payment_method === "installment") {
      if (data.down_price) formData.append("down_price", String(data.down_price));
      if (data.paid_months) formData.append("paid_months", String(data.paid_months));
    }

    // --- Optional Fields ---
    if (data.mortgage) {
      formData.append("mortgage", data.mortgage);
    }
    
    // Fix: Only send starting_day when immediate delivery is "no"
    if (data.immediate_delivery === "no" && data.starting_day) {
      formData.append("starting_day", data.starting_day);
    } else {
      formData.append("starting_day", "");
    }

    // --- Area ---
    if (data.area_id) {
      formData.append("area_id", data.area_id);
    }

    // --- English Content ---
    formData.append("title[en]", data.title_en || "");
    formData.append("description[en]", descriptionEn || "");
    formData.append("keywords[en]", data.keywords_en || "");
    formData.append("slug[en]", data.slug_en || "");

    // --- Arabic Content ---
    formData.append("title[ar]", data.title_ar || "");
    formData.append("description[ar]", descriptionAr || "");
    formData.append("keywords[ar]", data.keywords_ar || "");
    

    // --- Cover Image ---
    formData.append("cover", imagePreview.file);

    try {
      const response = await postData(
        "owner/property_listings",
        formData,
        new AxiosHeaders({ Authorization: `Bearer ${token}` })
      );
      showToast("property_added_successfully", "success");
      router.push(`/properties/view/${response?.data?.id}`);
    } catch (error: unknown) {
      console.error("Failed to create property:", error);
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
        t("failed_to_add_property");
      showToast(errorMessage, "error", false);
    } finally {
      // إنهاء عملية الإرسال
      setIsSubmitting(false);
    }
  };

  // ============= REUSABLE COMPONENTS =============
  const InputField = ({
    label,
    name,
    type = "text",
    required = false,
    options = [],
    dir = "ltr",
    placeholder = "",
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
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30"
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
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30"
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

  const FormattedNumberInput = ({
    label,
    name,
    required = false,
    placeholder = "",
    error,
  }: {
    label: string;
    name: keyof FormInputs;
    required?: boolean;
    placeholder?: string;
    error?: boolean;
  }) => {
    const { field } = useController({ name, control });
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const cursorPosition = input.selectionStart || 0;
      const value = e.target.value;

      const digits = value.replace(/\D/g, "");
      const numValue = digits ? Number(digits) : 0; 
      field.onChange(numValue);

      setTimeout(() => {
        if (inputRef.current && digits) {
          const formattedValue = Number(digits)
            .toLocaleString("en-US")
            .replace(/,/g, " ");
          const digitsBefore = value
            .slice(0, cursorPosition)
            .replace(/\D/g, "").length;
          let newPosition = 0;
          let digitCount = 0;
          for (let i = 0; i < formattedValue.length; i++) {
            if (formattedValue[i] !== " ") {
              digitCount++;
            }
            if (digitCount === digitsBefore) {
              newPosition = i + 1;
              break;
            }
          }
          inputRef.current.setSelectionRange(newPosition, newPosition);
        }
      }, 0);
    };

    const displayValue = field.value
      ? Number(field.value)
          .toLocaleString("en-US")
          .replace(/,/g, " ")
      : "";

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-dark dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30"
          dir="ltr"
          style={{
            textAlign: locale === "ar" ? "right" : "left",
            unicodeBidi: "plaintext",
          }}
          inputMode="numeric"
          pattern="[0-9 ]*"
        />
        {error && (
          <p className="text-red-500 text-sm flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
            {t("field_required")}
          </p>
        )}
      </div>
    );
  };

  const DateInput = ({
    label,
    name,
    required = false,
  }: {
    label: string;
    name: keyof FormInputs;
    required?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const calendarRef = useRef<HTMLDivElement>(null);

    const fieldValue = watch(name);

    useEffect(() => {
      if (fieldValue) {
        setSelectedDate(new Date(fieldValue));
      }
    }, [fieldValue]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString("en-CA");
    };

    const formatDisplayDate = (date: Date): string => {
      return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      const formattedDate = formatDate(date);
      setValue(name, formattedDate, { shouldValidate: true });
      setIsOpen(false);
    };

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const days: Date[] = [];

      const firstDayOfWeek = firstDay.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }

      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      const totalDays = Math.ceil(days.length / 7) * 7;
      const remainingDays = totalDays - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        days.push(new Date(year, month + 1, day));
      }
      return days;
    };

    const navigateMonth = (direction: "prev" | "next") => {
      setCurrentMonth((prev) => {
        const newMonth = new Date(prev);
        if (direction === "prev") {
          newMonth.setMonth(prev.getMonth() - 1);
        } else {
          newMonth.setMonth(prev.getMonth() + 1);
        }
        return newMonth;
      });
    };

    const isToday = (date: Date): boolean => {
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date): boolean => {
      return selectedDate
        ? date.toDateString() === selectedDate.toDateString()
        : false;
    };

    const isCurrentMonth = (date: Date): boolean => {
      return date.getMonth() === currentMonth.getMonth();
    };

    const monthNames = useMemo(
      () =>
        locale === "ar"
          ? [
              "يناير",
              "فبراير",
              "مارس",
              "أبريل",
              "مايو",
              "يونيو",
              "يوليو",
              "أغسطس",
              "سبتمبر",
              "أكتوبر",
              "نوفمبر",
              "ديسمبر",
            ]
          : [
              "January",
              "February",
              "March",
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ],
      [locale]
    );

    const dayNames = useMemo(
      () =>
        locale === "ar"
          ? ["أح", "إث", "ثل", "أر", "خم", "جم", "سب"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      [locale]
    );

    return (
      <div className="space-y-2" ref={calendarRef}>
        <label className="block text-sm font-medium text-dark dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <input
            {...register(name, { required })}
            type="text"
            readOnly
            value={selectedDate ? formatDisplayDate(selectedDate) : ""}
            onClick={() => setIsOpen(!isOpen)}
            placeholder={t("select_date")}
            className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30 cursor-pointer"
            dir={locale === "ar" ? "rtl" : "ltr"}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                const isCurrentMonthDay = isCurrentMonth(date);
                const isSelectedDay = isSelected(date);
                const isTodayDay = isToday(date);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleDateSelect(date)}
                    className={`
                      w-8 h-8 text-sm rounded-lg transition-all duration-200 hover:bg-orange-100 dark:hover:bg-orange-900/30
                      ${isSelectedDay
                        ? "bg-[#F26A3F] text-white shadow-lg transform scale-105"
                        : isCurrentMonthDay
                        ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        : "text-slate-400 dark:text-slate-500"
                      }
                      ${isTodayDay && !isSelectedDay
                        ? "ring-2 ring-orange-300 dark:ring-orange-600"
                        : ""
                      }
                    `}
                    disabled={!isCurrentMonthDay}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  handleDateSelect(today);
                  setCurrentMonth(today);
                }}
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                {t("today")}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {t("close")}
              </button>
            </div>
          </div>
        )}

        {errors[name] && (
          <p className="text-red-500 text-sm flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
            {t("field_required")}
          </p>
        )}
      </div>
    );
  };

  const SectionHeader = ({
    title,
    icon,
    sectionKey,
    description,
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
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            expandedSections[sectionKey] ? "bg-[#F26A3F]" : "bg-slate-300"
          } transition-colors duration-200`}
        ></div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        )}
      </div>
    </div>
  );

  // ============= RENDER =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          translate={toast.translate}
        />
      )}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-4 shadow-lg">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-700 to-red-600 dark:from-orange-500 dark:to-red-500 bg-clip-text text-transparent mb-2">
            {t("create_property")}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            {t("fill_property_details_subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 ">
            <SectionHeader
              title={t("basic_information")}
              icon={<Home className="w-5 h-5 text-[#F26A3F]" />}
              sectionKey="basic"
              description={t("property_type_location_details")}
            />
            {expandedSections.basic && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2" ref={areaDropdownRef}>
                  <label className="block text-sm font-medium text-dark dark:text-white">
                    {t("area")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedArea ? selectedArea.name : areaSearch}
                      onChange={(e) => {
                        setAreaSearch(e.target.value);
                        setSelectedArea(null);
                        setIsAreaDropdownOpen(true);
                      }}
                      onFocus={() => setIsAreaDropdownOpen(true)}
                      placeholder={t("select_area")}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30"
                    />
                    {isLoadingAreas && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {isAreaDropdownOpen && areas.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {areas.map((area, index) => (
                          <div key={area.id}>
                            {index > 0 && <div className="border-t border-slate-200 dark:border-slate-600"></div>}
                            <button
                              type="button"
                              onClick={() => {
                                setValue("area_id", area.id.toString());
                                setSelectedArea(area);
                                setAreaSearch("");
                                setIsAreaDropdownOpen(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex flex-col gap-1"
                            >
                              <span className="text-slate-900 dark:text-slate-100">{area.name}</span>
                              {area.developer && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">{area.developer}</span>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {isAreaDropdownOpen && !isLoadingAreas && areas.length === 0 && areaSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-4 text-center text-slate-500 dark:text-slate-400">
                        {t("No areas found")}
                      </div>
                    )}
                  </div>
                  <select
                    {...register("area_id", { required: true })}
                    className="hidden"
                  >
                    <option value="">{t("select_area")}</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                  {errors.area_id && (
                    <p className="text-red-500 text-sm flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {t("field_required")}
                    </p>
                  )}
                </div>
                <InputField
                  label={t("property_type")}
                  name="type_id"
                  type="select"
                  required
                  options={propertyTypes.map((type) => ({
                    value: type.id,
                    label: type.title || "",
                  }))}
                  placeholder={t("select_type")}
                />
                <InputField
                  label={t("Agent")}
                  name="userId"
                  type="select"
                  required
                  options={agents.map((agent) => ({
                    value: agent.id.toString(),
                    label: agent.name,
                  }))}
                  placeholder={t("select_agent")}
                />
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("property_details")}
              icon={<FileText className="w-5 h-5 text-[#F26A3F]" />}
              sectionKey="details"
              description={t("status_type_delivery_info")}
            />
            {expandedSections.details && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  label={t("status")}
                  name="status"
                  type="select"
                  required
                  options={[
                    { value: "rent", label: t("rent") },
                    { value: "sale", label: t("sale") },
                    {value:"commercial_rent", label: t("commercial_rent")},
                    {value:"commercial_sale", label: t("commercial_sale")},
                  ]}
                  placeholder={t("select_status")}
                />
                <InputField
                  label={t("immediate_delivery")}
                  name="immediate_delivery"
                  type="select"
                  required
                  options={[
                    { value: "yes", label: t("yes") },
                    { value: "no", label: t("no") },
                  ]}
                  placeholder={t("select_option")}
                />
                <InputField
                  label={t("furnishing")}
                  name="furnishing"
                  type="select"
                  required
                  options={[
                    { value: "all-furnished", label: t("furnished") },
                    { value: "unfurnished", label: t("unfurnished") },
                    { value: "semi-furnished", label: t("semi_furnished") },
                    { value: "partly-furnished", label: t("partly_furnished") },
                    ...(status === "sale"
                      ? [
                          { value: "finished", label: t("finished") },
                          { value: "half-finished", label: t("half_finished") },
                        ]
                      : []),
                  ]}
                  placeholder={t("select_furnishing")}
                />
                {immediateDelivery === "no" && (
                  <DateInput
                    label={t("starting_day")}
                    name="starting_day"
                    required
                  />
                )}
              </div>
            )}
          </div>

          {/* Pricing Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("pricing_financial_details")}
              icon={<DollarSign className="w-5 h-5 text-[#F26A3F]" />}
              sectionKey="pricing"
              description={t("property_pricing_payment_info")}
            />
            {expandedSections.pricing && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormattedNumberInput
                  label={t("price")}
                  name="price"
                  required
                  placeholder={t("enter_property_price")}
                  error={!!errors.price}
                />

                {/* Payment Method Toggle */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-dark dark:text-white">
                    {t("payment_method")}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="flex rounded-lg overflow-hidden shadow-sm border border-slate-300 dark:border-slate-600">
                    <button
                      type="button"
                      onClick={() => setValue("payment_method", "cash")}
                      className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        paymentMethod === "cash"
                          ? "bg-[#F26A3F] text-white shadow-inner"
                          : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      {t("cash")}
                    </button>
                    {status === "sale" && (
                      <button
                        type="button"
                        onClick={() => setValue("payment_method", "installment")}
                        className={`flex-1 py-3 px-4 text-center font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          paymentMethod === "installment"
                            ? "bg-[#F26A3F] text-white shadow-inner"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        {t("installment")}
                      </button>
                    )}
                  </div>
                  {errors.payment_method && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {t("field_required")}
                    </p>
                  )}
                </div>

                {/* Down Payment & Paid Months */}
                {paymentMethod === "installment" && status === "sale" && (
                  <>
                    <FormattedNumberInput
                      label={t("down_price")}
                      name="down_price"
                      required
                      placeholder={t("enter_down_payment_amount")}
                      error={!!errors.down_price}
                    />
                    <FormattedNumberInput
                      label={t("number_of_months")}
                      name="paid_months"
                      required
                      placeholder={t("enter_number_of_installment_months")}
                      error={!!errors.paid_months}
                    />
                  </>
                )}

                {/* Mortgage Toggle */}
                <div
                  className="space-y-3"
                  dir={locale === "ar" ? "rtl" : "ltr"}
                >
                  <label className="block text-sm font-medium text-dark dark:text-white">
                    {t("mortgage")}
                  </label>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm">
                        <Home className="w-4 h-4 text-[#F26A3F]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {t("mortgage_available")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("mortgage_placeholder")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleMortgageToggle}
                      className={`relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105 ${
                        watch("mortgage") === "yes"
                          ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-200/50"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    >
                      <span
                        className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 ease-in-out shadow-lg ${
                          watch("mortgage") === "yes"
                            ? locale === "ar"
                              ? "-translate-x-1"
                              : "translate-x-6 shadow-orange-200/50"
                            : locale === "ar"
                            ? "-translate-x-6"
                            : "translate-x-1"
                        }`}
                      >
                        {watch("mortgage") === "yes" && (
                          <Check className="w-3 h-3 text-[#F26A3F] absolute inset-0 m-auto" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Room Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("room_configuration")}
              icon={<Home className="w-5 h-5 text-[#F26A3F]" />}
              sectionKey="rooms"
              description={t("bedrooms_bathrooms_details")}
            />
            {expandedSections.rooms && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <FormattedNumberInput
                  label={t("square_meters")}
                  name="sqt"
                  required
                  placeholder={t("property_size")}
                  error={!!errors.sqt}
                />
                <FormattedNumberInput
                  label={t("bedroom")}
                  name="bedroom"
                  required
                  placeholder={t("number_of_bedrooms")}
                  error={!!errors.bedroom}
                />
                <FormattedNumberInput
                  label={t("bathroom")}
                  name="bathroom"
                  required
                  placeholder={t("number_of_bathrooms")}
                  error={!!errors.bathroom}
                />
                {!isApartment && (
                  <FormattedNumberInput
                    label={t("landing_space")}
                    name="landing_space"
                    required
                    placeholder={t("enter_landing_space")}
                    error={!!errors.landing_space}
                  />
                )}
              </div>
            )}
          </div>

          {/* Arabic Content */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("arabic_content")}
              icon={<Globe className="w-5 h-5 text-[#F26A3F]" />}
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
                  <textarea
                    value={descriptionAr}
                    onChange={(e) => setDescriptionAr(e.target.value)}
                    placeholder="Enter description in Arabic..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30 resize-y"
                    dir="rtl"
                  />
                  {!descriptionAr && errors.description_ar && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {t("field_required")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* English Content */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("english_content")}
              icon={<Globe className="w-5 h-5 text-[#F26A3F]" />}
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
                  <textarea
                    value={descriptionEn}
                    onChange={(e) => setDescriptionEn(e.target.value)}
                    placeholder="Enter description in English..."
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30 resize-y"
                    dir="ltr"
                  />
                  {!descriptionEn && errors.description_en && (
                    <p className="text-red-500 text-sm flex items-center mt-1">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {t("field_required")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Single Image Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <SectionHeader
              title={t("property_image")}
              icon={<Camera className="w-5 h-5 text-[#F26A3F]" />}
              sectionKey="images"
              description={t("upload_high_quality_photo")}
            />
            {expandedSections.images && (
              <div className="p-6 space-y-6">
                <div
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden hover:border-orange-400 dark:hover:border-orange-500 transition-colors duration-200 cursor-pointer"
                  onClick={() =>
                    document.getElementById("file-input")?.click()
                  }
                >
                  {!imagePreview ? (
                    <div className="p-8 text-center">
                      <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <span className="text-lg font-medium text-slate-700 dark:text-slate-300">
                        {t("click_to_upload_image")}
                      </span>
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageSelect(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <Image
                        width={800}
                        height={400}
                        src={imagePreview.url}
                        alt={t("property_preview")}
                        className="w-full h-64 md:h-80 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transform hover:scale-110 transition-all duration-200"
                          title={t("remove_image")}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg">
                        <p className="text-sm font-medium">
                          {imagePreview.file.name}
                        </p>
                        <p className="text-xs opacity-90">
                          {(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  )}
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
              disabled={isSubmitting}
              className={`px-8 py-3 font-medium rounded-lg shadow-lg transition-all duration-200 flex items-center space-x-2 ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed transform-none"
                  : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 hover:shadow-xl transform hover:scale-105"
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t("creating")}...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t("create_property")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePropertyPage;