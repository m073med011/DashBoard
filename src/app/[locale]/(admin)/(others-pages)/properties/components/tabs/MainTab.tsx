import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useForm, useWatch, useController } from "react-hook-form";
import { postData, getData } from "@/libs/axios/server";
import axios, { AxiosHeaders } from "axios";
import { useTranslations, useLocale } from "next-intl";
import {
  Phone, Mail, MessageCircle, Home, Bed, Bath,
  Ruler, MapPin, User, CheckCircle, Clock, ChevronDown,
  DollarSign, FileText, Globe, Camera, Check, X, Coins, CreditCard, Save,
  ChevronUp, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  PropertyStatistics,
  PropertyData,
  FormInputs,
  ImagePreview
} from '@/types/PropertyTypes';
import Toast from '@/components/Toast';
// import { useRouter } from "@/i18n/routing";

interface MainTabProps {
  propertystat: PropertyStatistics;
  property: PropertyData;
  refetch?: () => void;
  isEditMode?: boolean;
  onEditModeChange?: (editMode: boolean) => void;
  onEditSuccess?: () => void;
}

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
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

type AreaOption = {
  id: number;
  name: string;
  image: string;
  google_maps: string;
  developer: string;
};

export const MainTab: React.FC<MainTabProps> = ({ 
  property, 
  propertystat, 
  refetch, 
  isEditMode = false,
  onEditModeChange,
  onEditSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.approval_status);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', show: false });
  const t = useTranslations("properties");
  const locale = useLocale();
  // const router = useRouter();
  
  // Edit mode states
  const [descriptionEn, setDescriptionEn] = useState<string>("");
  const [descriptionAr, setDescriptionAr] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<SelectOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [areaSearch, setAreaSearch] = useState<string>(property.area?.name || "");
  const [isLoadingAreas, setIsLoadingAreas] = useState<boolean>(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState<boolean>(false);
  const [selectedArea, setSelectedArea] = useState<AreaOption | null>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    rooms: true,
    details: true,
    arabic: false,
    english: false,
    images: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    watch,
    reset,
  } = useForm<FormInputs>();
  
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

  const statusOptions = [
    { value: 'accepted', label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50 hover:bg-yellow-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50 hover:bg-red-100' }
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Initialize form with property data when entering edit mode
  useEffect(() => {
    if (isEditMode && property) {
      const formData: Partial<FormInputs> = {
        type_id: property.property_type?.id?.toString() || "",
        userId: property.user?.id?.toString() || "",
        price: property.price?.toString() || "",
        down_price: property.down_price?.toString() || "",
        sqt: property.sqt?.toString() || "",
        bedroom: property.bedroom?.toString() || "",
        bathroom: property.bathroom?.toString() || "",
        status: property.status || "",
        type: property.type?.title || "",
        immediate_delivery: property.immediate_delivery || "",
        payment_method: property.payment_method || "cash",
        paid_months: property.paid_months?.toString() || "",
        furnishing: property.furnishing || "",
        mortgage: property.mortgage || "no",
        starting_day: property.starting_day || "",
        landing_space: property.landing_space?.toString() || "",
        title_en: property.descriptions?.en?.title || "",
        description_en: property.descriptions?.en?.description || "",
        keywords_en: property.descriptions?.en?.keywords || "",
        slug_en: property.descriptions?.en?.slug || "",
        title_ar: property.descriptions?.ar?.title || "",
        description_ar: property.descriptions?.ar?.description || "",
        keywords_ar: property.descriptions?.ar?.keywords || "",
      };
      reset(formData);
      setDescriptionEn(property.descriptions?.en?.description || "");
      setDescriptionAr(property.descriptions?.ar?.description || "");
      // Set selected area if property has area_id
      if (property.area_id) {
        // We'll fetch the area details when needed
        setValue("area_id", property.area_id.toString());
      }
      if (property.cover) {
        setImagePreview({
          url: property.cover,
          id: `existing-${property.id}`,
          isExisting: true,
        });
      }
    }
  }, [isEditMode, property, reset]);

  // Fetch dropdown data when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchDropdownData = async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        if (!token) return;
        try {
          const [typesResponse, agentsResponse] = await Promise.all([
            getData("owner/types", {}, new AxiosHeaders({ Authorization: `Bearer ${token}`, lang: locale })),
            getData("owner/agents", {}, new AxiosHeaders({ Authorization: `Bearer ${token}` })),
          ]);
          if (typesResponse.status) setPropertyTypes(typesResponse.data);
          setAgents(agentsResponse);
        } catch (error) {
          console.error("Error fetching dropdown data:", error);
          showToast(t("error_fetching_dropdown_data"), "error");
        }
      };
      fetchDropdownData();
    }
  }, [isEditMode, locale, t]);

  // Fetch areas with search
  useEffect(() => {
    if (!isEditMode) return;
    
    const fetchAreas = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
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
          // If we have a selected area_id, find and set it
          if (property.area_id && !selectedArea) {
            const area = response.data.find((a: AreaOption) => a.id === property.area_id);
            if (area) {
              setSelectedArea(area);
            }
        }
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
  }, [areaSearch, locale, isEditMode, property.area_id, selectedArea]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isEditMode) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditMode]);

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'text-gray-600';
  };

  const getStatusBgColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.bgColor.split(' ')[0] : 'bg-gray-50';
  };

  const handleApprovalStatusChange = async (newStatus: string) => {
    setLoading(true);
    setIsDropdownOpen(false);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      let headers: AxiosHeaders = new AxiosHeaders();
      if (token) headers = headers.set('Authorization', `Bearer ${token}`);
      const response = await postData(
        `/owner/property_listings/${property.id}/change-status`,
        { approval_status: newStatus },
        headers
      );
      if (response.status === 200) {
        setSelectedStatus(newStatus);
        showToast(response.message, 'success');
        if (refetch) {
          refetch();
        }
      } else {
        showToast(response.message, 'success');
      }
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        showToast(axiosError.response?.data?.message || 'An error occurred while updating status.', 'error');
      } else {
        showToast('An unknown error occurred.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (imagePreview && !imagePreview.isExisting) {
      URL.revokeObjectURL(imagePreview.url);
    }
    const file = files[0];
    const url = URL.createObjectURL(file);
    const id = `${Date.now()}-${Math.random()}`;
    setImagePreview({ file, url, id, isExisting: false });
  };

  const handleRemoveImage = () => {
    if (imagePreview && !imagePreview.isExisting) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
  };

  useEffect(() => {
    return () => {
      if (imagePreview && !imagePreview.isExisting) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  // Reusable InputField Component
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

  // Reusable Formatted Number Input
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
    
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Store the raw number value
    const numValue = digits ? Number(digits) : '';
    field.onChange(numValue);
    
    // Calculate new cursor position after formatting
    setTimeout(() => {
      if (inputRef.current && digits) {
        const formattedValue = Number(digits).toLocaleString('en-US').replace(/,/g, ' ');
        const digitsBefore = value.slice(0, cursorPosition).replace(/\D/g, '').length;
        
        let newPosition = 0;
        let digitCount = 0;
        
        for (let i = 0; i < formattedValue.length; i++) {
          if (formattedValue[i] !== ' ') {
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
    ? Number(field.value).toLocaleString('en-US').replace(/,/g, ' ')
    : '';

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
          textAlign: locale === 'ar' ? 'right' : 'left',
          unicodeBidi: 'plaintext'
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

  // Date Input Component
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
    
    // Get the field value from react-hook-form
    const fieldValue = watch(name);
    
    // Initialize selected date from form value
    useEffect(() => {
      if (fieldValue) {
        setSelectedDate(new Date(fieldValue));
      }
    }, [fieldValue]);

    // Close calendar when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    };

    const formatDisplayDate = (date: Date): string => {
      return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      setValue(name, formatDate(date));
      setIsOpen(false);
    };

    const getDaysInMonth = (date: Date): Date[] => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const days: Date[] = [];
      
      // Add previous month's trailing days
      const firstDayOfWeek = firstDay.getDay();
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        days.push(new Date(year, month, -i));
      }
      
      // Add current month's days
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }
      
      // Add next month's leading days
      const totalDays = Math.ceil(days.length / 7) * 7;
      const remainingDays = totalDays - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        days.push(new Date(year, month + 1, day));
      }
      return days;
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
      setCurrentMonth(prev => {
        const newMonth = new Date(prev);
        if (direction === 'prev') {
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
      return selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
    };

    const isCurrentMonth = (date: Date): boolean => {
      return date.getMonth() === currentMonth.getMonth();
    };

    const monthNames = locale === 'ar' 
      ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayNames = locale === 'ar'
      ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="space-y-2" ref={calendarRef}>
        <label className="block text-sm font-medium text-dark dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {/* Date Input Field */}
        <div className="relative">
          <input
            {...register(name, { required })}
            type="text"
            readOnly
            value={selectedDate ? formatDisplayDate(selectedDate) : ''}
            onClick={() => setIsOpen(!isOpen)}
            placeholder={t("select_date")}
            className="w-full px-4 py-3 pr-12 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30 cursor-pointer"
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
        {/* Calendar Dropdown */}
        {isOpen && (
          <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg p-4 min-w-[300px]">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {/* Day Names Header */}
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
            {/* Calendar Days */}
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
                        ? 'bg-[#F26A3F] text-white shadow-lg transform scale-105' 
                        : isCurrentMonthDay
                          ? 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                          : 'text-slate-400 dark:text-slate-500'
                      }
                      ${isTodayDay && !isSelectedDay 
                        ? 'ring-2 ring-orange-300 dark:ring-orange-600' 
                        : ''
                      }
                    `}
                    disabled={!isCurrentMonthDay}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            {/* Quick Actions */}
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

  const onSubmit = async (data: FormInputs) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      showToast(t("auth_token_not_found"), "error");
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    
    // General fields
    formData.append("_method", "PUT");
    formData.append("type_id", data.type_id);
    formData.append("user_id", data.userId);
    formData.append("price", data.price);
    formData.append("sqt", data.sqt);
    formData.append("bedroom", data.bedroom);
    formData.append("bathroom", data.bathroom);
    formData.append("status", data.status);
    formData.append("type", data.type);
    formData.append("immediate_delivery", data.immediate_delivery);
    formData.append("furnishing", data.furnishing);
    formData.append("payment_method", data.payment_method);
    
    // Conditional fields (installment)
    if (data.payment_method === "installment") {
      if (data.down_price) formData.append("down_price", data.down_price);
      if (data.paid_months) formData.append("paid_months", data.paid_months);
    }
    
    // Mortgage (optional)
    if (data.mortgage) {
      formData.append("mortgage", data.mortgage);
    }
    
    // New fields - only send starting_day when immediate delivery is "no"
    if (data.immediate_delivery === "no" && data.starting_day) {
      formData.append("starting_day", data.starting_day);
    } else {
      formData.append("starting_day", "");
    }
    // Only append landing_space if property type is not apartment
    if (!isApartment) {
      formData.append("landing_space", data.landing_space || "");
    }
    
    // Area
    if (data.area_id) {
      formData.append("area_id", data.area_id);
    }
    
    // English
    formData.append("title[en]", data.title_en);
    formData.append("description[en]", descriptionEn);
    formData.append("keywords[en]", data.keywords_en);
    formData.append("slug[en]", data.slug_en);
    
    // Arabic
    formData.append("title[ar]", data.title_ar);
    formData.append("description[ar]", descriptionAr);
    formData.append("keywords[ar]", data.keywords_ar);
    
    // Cover image (only if a new image was selected)
    if (imagePreview && imagePreview.file) {
      formData.append("cover", imagePreview.file);
    }
    
    try {
      const response = await postData(
        `/owner/property_listings/${property.id}`,
        formData,
        new AxiosHeaders({ Authorization: `Bearer ${token}` })
      );
      showToast(t("property_updated_successfully"), "success");
      setTimeout(() => {
        if (onEditSuccess) onEditSuccess();
      }, 1000);
      console.log(response);
    } catch (error) {
      console.error("Failed to update property:", error);
      showToast(t("failed_to_update_property"), "error");
    } finally {
      setSubmitting(false);
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
        <div className={`w-3 h-3 rounded-full ${expandedSections[sectionKey] ? 'bg-[#F26A3F]' : 'bg-slate-300'} transition-colors duration-200`}></div>
        {expandedSections[sectionKey] ? 
          <ChevronUp className="w-5 h-5 text-slate-600 dark:text-slate-400" /> : 
          <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        }
      </div>
    </div>
  );

  // VIEW MODE COMPONENT
  if (!isEditMode) {
    return (
      <div className="space-y-8">
        {toast.show && <Toast message={toast.message} type={toast.type} />}
        {/* Status Dropdown */}
        <div className="mt-6 flex justify-end">
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={loading}
              className={`inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusBgColor(selectedStatus)} ${getStatusColor(selectedStatus)} hover:shadow-md`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4"></div>
                  {t("Updating Status")}
                </>
              ) : (
                <>
                  {t("Change Status")} : {t(selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1))}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
            {isDropdownOpen && !loading && (
              <div className="absolute right-0 mt-2 w-56 z-50 rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-400 ring-opacity-5 focus:outline-none border border-gray-200 dark:border-gray-700">
                <div className="py-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleApprovalStatusChange(option.value)}
                      className={`${option.bgColor} ${option.color} gap-3 group flex w-full items-center px-4 py-3 text-sm font-medium transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg hover:shadow-sm`}
                      disabled={selectedStatus === option.value}
                    >
                      <div className={`w-3 h-3 rounded-full mr-3 ${option.value === 'accepted' ? 'bg-green-500' : option.value === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                      {t(option.label)}
                      {selectedStatus === option.value && (
                        <CheckCircle className="ml-auto h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">{t("Phone Calls")}</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{propertystat?.count_call }</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">{t("WhatsApp Messages")}</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">{propertystat.count_whatsapp}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Property Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {property?.descriptions?.en?.title}
                </h2>
                <div className="flex items-center gap-2 text-blue-100 mb-3">
                  <MapPin className="h-4 w-4" />
                  <span>{property?.area?.name|| '-'}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{t("Status")}: {selectedStatus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{t("State")}: {property?.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold mb-1">
                  {property?.price?.toLocaleString()} EGP
                </div>
                {property?.down_price && (
                  <div className="text-blue-100 text-lg">
                    Down: {property?.down_price?.toLocaleString()} EGP
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Property Details */}
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <Bed className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{property?.bedroom}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("bedroom")}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <Bath className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{property?.bathroom}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{t("bathroom")}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <Ruler className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{property?.sqt}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">sq ft</div>
              </div>
            </div>
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                {t("description")}
              </h3>
              <div 
                className="prose prose-gray dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                dangerouslySetInnerHTML={{ __html: property?.descriptions?.en?.description || "" }}
              />
            </div>
          </div>
        </div>
        {/* Owner Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("owner_information")}
            </h3>
          </div>
          <div className="p-6 grid-cols-2 grid">
            <div className="flex items-start gap-6 mb-6 ">
              {property?.user?.avatar && (
                <div className="relative">
                  <Image
                    src={property?.user?.avatar}
                    alt={property?.user?.name}
                    width={80}
                    height={80}
                    className="rounded-full ring-4 ring-purple-100 dark:ring-purple-900"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
              )}
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {property?.user?.name}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <span>{property?.user?.email}</span>
                  </div>
                  {property?.user?.phone ? (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span>{property?.user?.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-500">
                      <Phone className="h-4 w-4" />
                      <span className="font-medium">{t("phone_not_found")}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Click outside handler */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-0"
                onClick={() => setIsDropdownOpen(false)}
              ></div>
            )}
          </div>
        </div>
      </div>
    );
  }
  // EDIT MODE COMPONENT
  return (
    <div className="space-y-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
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
                options={propertyTypes.map((type) => ({ value: type.id, label: type.title || "" }))}
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
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <InputField
                label={t("status")}
                name="status"
                type="select"
                required
                options={[
                  { value: "rent", label: t("rent") },
                  { value: "sale", label: t("sale") },
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
              <div className="space-y-3" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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
                    onClick={() => {
                      const currentValue = watch("mortgage") === "yes";
                      setValue("mortgage", currentValue ? "no" : "yes");
                    }}
                    className={`relative inline-flex items-center h-7 rounded-full w-12 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transform hover:scale-105 ${
                      watch("mortgage") === "yes"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-200/50"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block w-5 h-5 transform bg-white rounded-full transition-all duration-300 ease-in-out shadow-lg ${
                        watch("mortgage") === "yes"
                          ? locale === 'ar' ? "-translate-x-1" : "translate-x-6 shadow-orange-200/50"
                          : locale === 'ar' ? "-translate-x-6" : "translate-x-1"
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
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden hover:border-orange-400 dark:hover:border-orange-500 transition-colors duration-200">
                {!imagePreview ? (
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
                  <div className="relative group">
                    <Image
                      width={800}
                      height={400}
                      src={imagePreview.url}
                      alt={t("property_preview")}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-3">
                        <label className="cursor-pointer bg-[#F26A3F] hover:bg-orange-600 text-white rounded-full p-3 shadow-lg transform hover:scale-110 transition-all duration-200">
                          <Camera className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e.target.files)}
                            className="hidden"
                          />
                        </label>
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
                    <div className="absolute top-4 right-4 bg-[#F26A3F] text-white rounded-full p-2 shadow-lg">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg">
                      <p className="text-sm font-medium">
                        {imagePreview.isExisting ? t("current_image") : imagePreview.file?.name}
                      </p>
                      {imagePreview.file && (
                        <p className="text-xs opacity-90">{(imagePreview.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
            onClick={() => onEditModeChange?.(false)}
            className="px-8 py-3 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{t("updating_property")}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{t("update_property")}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};