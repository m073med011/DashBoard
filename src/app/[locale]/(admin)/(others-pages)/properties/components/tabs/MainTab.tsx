import React, { useState } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, MessageCircle, Home, Bed, Bath,
  ChefHat, Ruler, MapPin, User, CheckCircle, Clock, ChevronDown,
  Calendar, Hash,Building, Eye,Search
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';

// --- Inline TypeScript Types ---
interface User {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
}

interface AreaDescription {
  en?: { name?: string; description?: string };
  ar?: { name?: string; description?: string };
}

interface Area {
  id?: number;
  description?: AreaDescription;
  governorate_id?: number;
  city_id?: number;
}

interface Description {
  en?: { title?: string; description?: string; meta_title?: string; meta_description?: string };
  ar?: { title?: string; description?: string; meta_title?: string; meta_description?: string };
}

interface PropertyData {
  id: number;
  title?: string;
  descriptions?: Description;
  area?: Area;
  price?: number;
  down_price?: number;
  rent_price?: number;
  bedroom?: number;
  bathroom?: number;
  kitichen?: number;
  sqt?: number;
  floor?: string | number;
  elevator?: boolean;
  finishing?: string;
  facing?: string;
  status?: string;
  type?: string;
  approval_status?: string;
  views?: number;
  priority?: string;
  created_at?: string;
  updated_at?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  keywords?: string;
  slug?: string;
  user?: User;
}

interface PropertyStatistics {
  data?: {
    count_call?: number;
    count_whatsapp?: number;
  };
}

interface MainTabProps {
  propertystat: PropertyStatistics;
  property: PropertyData;
  refetch?: () => void;
}

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

// --- Main Component ---
export const MainTab: React.FC<MainTabProps> = ({ property, propertystat, refetch }) => {
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.approval_status || 'pending');
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', show: false });
  const t = useTranslations("properties");

  const statusOptions = [
    { value: 'accepted', label: 'Accepted', color: 'text-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50 hover:bg-yellow-100' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-50 hover:bg-red-100' }
  ];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(opt => opt.value === status)?.color || 'text-gray-600';
  };

  const getStatusBgColor = (status: string) => {
    return statusOptions.find(opt => opt.value === status)?.bgColor.split(' ')[0] || 'bg-gray-50';
  };

  const handleApprovalStatusChange = async (newStatus: string) => {
    setLoading(true);
    setIsDropdownOpen(false);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const headers: AxiosHeaders = new AxiosHeaders();
      if (token) headers.set('Authorization', `Bearer ${token}`);

      const response = await postData(
        `/owner/property_listings/${property.id}/change-status`,
        { approval_status: newStatus },
        headers
      );

      if (response.status === 200) {
        setSelectedStatus(newStatus);
        showToast(t('Status updated successfully'), 'success');
        refetch?.();
      } else {
        showToast(response.message || t('Update failed'), 'error');
      }
    } catch (error: unknown) {
      console.error('Status update error:', error);
      // const message = (error as any)?.response?.data?.message || t('An error occurred');
      showToast("Status updated failed", 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const displayText = (text?: string) => text || '—';
  const displayNumber = (num?: number) => num || 0;

  return (
    <div className="space-y-8 px-4 py-6 max-w-7xl mx-auto">
      {toast.show && <Toast message={toast.message} type={toast.type} />}

      {/* Status Dropdown */}
      <div className="flex justify-end">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
              ${getStatusBgColor(selectedStatus)} ${getStatusColor(selectedStatus)} hover:shadow-lg`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                {t("Updating Status")}
              </>
            ) : (
              <>
                {t("Change Status")}:
                <span className="font-bold capitalize">{t(selectedStatus)}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {isDropdownOpen && !loading && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 z-50">
              <div className="py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleApprovalStatusChange(option.value)}
                    disabled={selectedStatus === option.value}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium gap-3 transition-colors
                      ${option.bgColor} ${option.color} ${selectedStatus === option.value ? 'opacity-70 cursor-not-allowed' : 'hover:bg-opacity-80'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${option.value === 'accepted' ? 'bg-green-500' : option.value === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    {t(option.label)}
                    {selectedStatus === option.value && <CheckCircle className="ml-auto h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards - Modern Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Phone, label: t("Phone Calls"), value: displayNumber(propertystat?.data?.count_call), color: "blue" },
          { icon: MessageCircle, label: t("WhatsApp Messages"), value: displayNumber(propertystat?.data?.count_whatsapp), color: "green" },
          { icon: Eye, label: t("Total Views"), value: displayNumber(property.views), color: "purple" }
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100 dark:from-${stat.color}-900/20 dark:to-${stat.color}-800/20 rounded-xl p-6 border border-${stat.color}-200 dark:border-${stat.color}-700 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-${stat.color}-600 dark:text-${stat.color}-400 text-sm font-medium`}>{stat.label}</p>
                <p className={`text-2xl font-bold text-${stat.color}-700 dark:text-${stat.color}-300`}>{stat.value}</p>
              </div>
              <div className={`bg-${stat.color}-500 p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Property Header */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {displayText(property.descriptions?.en?.title || property.descriptions?.ar?.title)}
              </h2>
              <div className="flex items-center gap-2 text-blue-100 mb-3">
                <MapPin className="h-4 w-4" />
                <span>{displayText(property.area?.description?.en?.name || property.area?.description?.ar?.name)}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" /> {t("Status")}: <strong>{selectedStatus}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {t("State")}: <strong>{displayText(property.status)}</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" /> {t("Type")}: <strong>{displayText(property.type)}</strong>
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-extrabold">{displayNumber(property.price).toLocaleString()} EGP</div>
              {property.down_price && <div className="text-blue-100 mt-1">Down: {property.down_price.toLocaleString()} EGP</div>}
              {property.rent_price && <div className="text-blue-100 text-sm">Rent: {property.rent_price.toLocaleString()}/mo</div>}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Bed, label: t("bedroom"), value: property.bedroom },
              { icon: Bath, label: t("bathroom"), value: property.bathroom },
              { icon: ChefHat, label: t("kitchen"), value: property.kitichen },
              { icon: Ruler, label: "sq ft", value: property.sqt }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
                <item.icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-xl font-bold">{displayNumber(item.value)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" /> {t("description")}
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5 border border-gray-200 dark:border-gray-600 prose dark:prose-invert max-w-none">
              <div
                dangerouslySetInnerHTML={{
                  __html: property.descriptions?.en?.description || property.descriptions?.ar?.description || '<p class="text-gray-500">No description available.</p>'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* SEO Section */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Search className="h-5 w-5" /> {t("SEO Information")}
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Meta Info */}
            <div className="space-y-5">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                <div className="flex justify-between mb-3">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{t("Meta Title")}</label>
                  <span className={`text-xs ${((property.meta_title || '').length) > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                    {(property.meta_title || '').length}/60
                  </span>
                </div>
                <div className="text-gray-900 dark:text-gray-100 mb-2">{displayText(property.meta_title)}</div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                <div className="flex justify-between mb-3">
                  <label className="font-medium text-gray-700 dark:text-gray-300">{t("Meta Description")}</label>
                  <span className={`text-xs ${((property.meta_description || '').replace(/<[^>]*>/g, '').length) > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                    {(property.meta_description || '').replace(/<[^>]*>/g, '').length}/160
                  </span>
                </div>
                <div
                  className="text-gray-900 dark:text-gray-100 mb-2 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: property.meta_description || '—' }}
                ></div>
                
              </div>
            </div>

            {/* Keywords & URL */}
            <div className="space-y-5">
              <KeywordsList title={t("Meta Keywords")} keywords={property.meta_keywords} color="indigo" />
              <KeywordsList title={t("Keywords")} keywords={property.keywords} color="blue" />

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Property Slug/URL")}</label>
                <code className="text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded border block text-indigo-600 dark:text-indigo-400">
                  {property.slug ? property.slug : `/properties/${property.id}`}
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Owner Info */}
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5" /> {t("owner_information")}
          </h3>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {property.user?.avatar && (
              <div className="relative">
                <Image
                  src={property.user.avatar}
                  alt={property.user.name || 'Owner'}
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-purple-100 dark:ring-purple-900"
                />
                <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
            )}
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayText(property.user?.name)}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Mail className="h-4 w-4 text-purple-600" />
                    <span>{displayText(property.user?.email)}</span>
                  </div>
                  {property.user?.phone ? (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4 text-purple-600" />
                      <span>{property.user.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-500">
                      <Phone className="h-4 w-4" />
                      <span>{t("phone_not_found")}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {property.user?.id && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Hash className="h-4 w-4 text-purple-600" />
                      <span>ID: {property.user.id}</span>
                    </div>
                  )}
                  {property.user?.created_at && (
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span>Member since: {formatDate(property.user.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      

      {/* Click Outside Overlay */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

const KeywordsList = ({ title, keywords, color }: { title: string; keywords?: string; color: string }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-5">
    <label className="block font-medium text-gray-700 dark:text-gray-300 mb-3">{title}</label>
    {keywords ? (
      <div className="flex flex-wrap gap-2">
        {keywords.split(',').map((kw, i) => (
          <span
            key={i}
            className={`px-2 py-1 bg-${color}-100 dark:bg-${color}-900 text-${color}-800 dark:text-${color}-200 text-xs rounded-full`}
          >
            {kw.trim()}
          </span>
        ))}
      </div>
    ) : (
      <div className="text-gray-500 dark:text-gray-400 text-sm">{title} {("not set")}</div>
    )}
  </div>
);