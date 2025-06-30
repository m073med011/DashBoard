import React, { useState } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, MessageCircle, Home, Bed, Bath,
  ChefHat, Ruler, MapPin, User, CheckCircle, Clock, ChevronDown
} from 'lucide-react';
import { PropertyData, PropertyStatistics } from '@/types/PropertyTypes';
import { useTranslations } from 'next-intl';
import { postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';

interface MainTabProps {
  propertystat: PropertyStatistics;
  property: PropertyData;
}

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export const MainTab: React.FC<MainTabProps> = ({ property, propertystat }) => {
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(property.approval_status);
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

  return (
    <div className="space-y-8">
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      {/* Modern Approval Status Dropdown */}
      <div className="mt-6  flex justify-end">
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={loading}
            className={`inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold rounded-xl  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${getStatusBgColor(selectedStatus)} ${getStatusColor(selectedStatus)} hover:shadow-md`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4"></div>
                {t("Updating Status...")}
              </>
            ) : (
              <>
                {t("Change Status")}  :  {t(selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1))}
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
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{propertystat?.data?.count_call || 10}</p>
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
              <p className="text-3xl font-bold text-green-700 dark:text-green-300">{propertystat?.data?.count_whatsapp || 0}</p>
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
                <span>{property?.area?.description?.en?.name}</span>
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
              <ChefHat className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{property?.kitichen}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t("kitichen")}</div>
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
              dangerouslySetInnerHTML={{ __html: property?.descriptions?.en?.description }}
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
};