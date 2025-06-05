'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, Edit, Save } from 'lucide-react';
import { getData, postData } from '@/libs/axios/server'; // Import your API functions
import ModalForm from '@/components/tables/ModalTableForm';
import Image from 'next/image';
import { AxiosHeaders } from 'axios';
import Toast from "@/components/Toast";
// Type definitions
interface ProfileData {
  id: number;
  name: string;
  email: string;
  phone: string;
  second_phone?: string;
  parent_id: number | null;
  avatar: string | null;
  subscription: 'yes' | 'no';
  provider_id: number | null;
  email_verified_at: string | null;
  role: string;
  modules: string[];
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  second_phone: string;
  avatar: File | null;
}

interface ApiResponse {
  data: ProfileData;
}
type ToastState = {
  message: string;
  type: "success" | "error" | "info";
  show: boolean;
};
const OwnerProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({ message: "", type: "info", show: false });

  const showToast = useCallback((message: string, type: ToastState["type"] = "info") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }, []);
  
  // Form state for update modal
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    second_phone: '',
    avatar: null
  });

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async (): Promise<void> => {
    try {
      setLoading(true);
      const token: string | null = localStorage.getItem('token'); // Get token from localStorage
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = new AxiosHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const response: ApiResponse = await getData('owner/profile', {}, headers);
      setProfileData(response.data);
      
      // Initialize form data with current profile data
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        second_phone: response.data.second_phone || '',
        avatar: null
      });
      
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile data';
      setError(errorMessage);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({
      ...prev,
      avatar: file || null
    }));
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create FormData for multipart/form-data
      const updateFormData = new FormData();
      updateFormData.append('name', formData.name);
      updateFormData.append('email', formData.email);
      updateFormData.append('phone', formData.phone);
      updateFormData.append('second_phone', formData.second_phone);
      
      if (formData.avatar) {
        updateFormData.append('avatar', formData.avatar);
      }

      const headers = new AxiosHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      });

      await postData('owner/profile/update', updateFormData, headers);
      
      // Refresh profile data after successful update
      await fetchProfileData();
      setIsModalOpen(false);
      showToast('Profile updated successfully!', 'success');
      
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const openUpdateModal = () => {
    setIsModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsModalOpen(false);
    // Reset form data to current profile data
    if (profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        second_phone: profileData.second_phone || '',
        avatar: null
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <button 
            onClick={fetchProfileData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No profile data available</p>
      </div>
    );
  }

  return (
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
        {/* Header */}
        <div className="">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Owner Profile</h1>
              <button
                onClick={openUpdateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 py-6">
            <div className="flex items-center space-x-6 mb-6">
              <div className="flex-shrink-0">
                <Image
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover"
                  src={profileData.avatar || '/default-avatar.png'}
                  alt={profileData.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80?text=Avatar';
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{profileData.name}</h2>
                <p className="text-sm text-gray-500 uppercase">{profileData.role}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    profileData.subscription === 'yes' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {profileData.subscription === 'yes' ? 'Subscribed' : 'No Subscription'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{profileData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">{profileData.phone}</p>
                  </div>
                </div>

                {profileData.second_phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Second Phone</p>
                      <p className="text-sm text-gray-600">{profileData.second_phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">User ID</p>
                    <p className="text-sm text-gray-600">#{profileData.id}</p>
                  </div>
                </div>
              </div>

              {/* Modules */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Available Modules</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.modules.map((module, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {module.replace('_', ' ').replace('/', ' / ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Update Modal */}
        <ModalForm
          open={isModalOpen}
          title="Update Profile"
          onClose={closeUpdateModal}
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Second Phone
              </label>
              <input
                type="tel"
                name="second_phone"
                value={formData.second_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeUpdateModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalForm>
      </div>
  );
};

export default OwnerProfilePage;