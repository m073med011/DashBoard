'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ImageWithFallback from '@/components/ImageWithFallback';
import ImageUploadField from '@/components/ImageUploadField';
import Toast from '@/components/Toast';
import { useLocale, useTranslations } from 'next-intl';
import { AMENITY_IMAGE_SIZE } from '@/libs/constants/imageSizes';
import Image from 'next/image';

type Amenity = {
  id: number;
  title: string;
  descriptions: {
    en: {
      title: string;
    };
    ar: {
      title: string;
    };
  };
  image?: string;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
  translate?: boolean;
};

export default function AmenitiesPage() {
  const locale = useLocale();
  const t = useTranslations("Amenities");
  const [items, setItems] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false); 
  const [token, setToken] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentAmenity, setCurrentAmenity] = useState<Amenity | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
    translate: true,
  }); 
  
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    translate: boolean = true
  ) => {
    // First, hide any existing toast
    setToast(prev => ({ ...prev, show: false }));

    // Then show the new toast after a brief delay to ensure state change
    setTimeout(() => {
      setToast({ message, type, show: true, translate });
    }, 50);

    // Hide the toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3050); // 3000ms + 50ms delay
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Amenity;
  }>({ type: null });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast("Token not found in localStorage", 'error');
    }
  }, [t]);

  useEffect(() => {
    if (token) fetchAmenities(token);
  }, [token, locale]);

  useEffect(() => {
    if (!modalState.type) {
      setImagePreview(null);
      setSelectedImageFile(null);
      setCurrentAmenity(null);
      setSubmitting(false); 
    } else if (modalState.type === 'create') {
      setImagePreview(null);
      setSelectedImageFile(null);
      setCurrentAmenity(null);
      setSubmitting(false);
    } else if (modalState.item && (modalState.type === 'view' || modalState.type === 'edit')) {
      // Use the existing table data for both view and edit modes
      setCurrentAmenity(modalState.item);
      // Set image preview for edit mode
      if (modalState.type === 'edit' && modalState.item.image) {
        setImagePreview(modalState.item.image);
      }
      setSelectedImageFile(null);
    }
  }, [modalState]);

  const fetchAmenities = async (authToken: string) => {
    try {
      const res = await getData('owner/amenities', {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch amenities', error);
      showToast("Failed to fetch amenities", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Amenity) => {
    if (!token) return;
    try {
      await deleteData(`owner/amenities/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchAmenities(token);
      showToast("Amenity deleted successfully", 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast("Delete failed", 'error');
    }
  };

  const handleImageChange = (file: File | null) => {
    setSelectedImageFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      if (modalState.type === 'edit' && currentAmenity?.image) {
        setImagePreview(currentAmenity.image);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token || submitting) return;

    // Validate image is required for create mode
    if (modalState.type === 'create' && !selectedImageFile) {
      showToast("Please select an image for the amenity", 'error');
      return;
    }

    setSubmitting(true); 

    const payload = new FormData();
    payload.append('title[en]', formData.get('title[en]') as string);
    payload.append('title[ar]', formData.get('title[ar]') as string);

    if (selectedImageFile) {
      payload.append('image', selectedImageFile);
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/amenities', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Amenity created successfully", 'success');
        fetchAmenities(token);

      } else if (modalState.type === 'edit' && currentAmenity) {
        payload.append('_method', 'PATCH');
        await postData(`owner/amenities/${currentAmenity.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Amenity updated successfully", 'success');
      }

      fetchAmenities(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
      showToast("Save failed", 'error');
    } finally {
      setSubmitting(false); 
    }
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          translate={toast.translate}
        />)}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">{t("Loading")}</p>
        </div>
      ) : (
        <Table<Amenity>
          data={items}
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (item) => locale === 'ar' ? item?.descriptions?.ar?.title : item?.descriptions?.en?.title,
            },
            {
              key: "image",
              label: "Image",
              render: (item) =>
                item.image ? (
                  <div className="flex items-center justify-center">
                    <Image
                      src={item.image}
                      alt="cover"
                      width={80}
                      height={80}
                      className="rounded object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )
            },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
        />
      )}

      <ModalForm
        className='max-w-[500px] '
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? t('Create Amenity')
            : modalState.type === 'edit'
            ? t('Edit Amenity')
            : t('View Amenity')
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-lg">{t("Loading amenity details")}</p>
          </div>
        ) : modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="w-full">
            <div className="">
              <table className="w-full">
                <thead className="bg-gray-50">
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Title (EN)')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentAmenity?.descriptions.en.title}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Title (AR)')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentAmenity?.descriptions.ar.title}
                    </td>
                  </tr>
                  {currentAmenity?.image && (
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {t('Image')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="overflow-hidden rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
                          <ImageWithFallback
                            src={currentAmenity.image}
                            alt={t("Amenity")}
                            width={400}
                            height={400}
                            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="title_en" className="block text-sm font-medium text-gray-700">
                {t('Amenity Title (English)')}
              </label>
              <input
                id="title_en"
                type="text"
                name="title[en]"
                placeholder={t('Enter amenity title in English')}
                defaultValue={currentAmenity?.descriptions.en.title ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                    disabled={submitting}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      // Allow English letters, spaces, numbers, and common punctuation
                      const englishPattern = /^[a-zA-Z0-9\s\-'.,!?()&]*$/;
                      if (!englishPattern.test(target.value)) {
                        // Remove non-English characters
                        target.value = target.value.replace(/[^a-zA-Z0-9\s\-'.,!?()&]/g, '');
                      }
                    }}
                    onKeyPress={(e) => {
                      const char = e.key;
                      const englishPattern = /^[a-zA-Z0-9\s\-'.,!?()&]$/;
                      if (!englishPattern.test(char)) {
                        e.preventDefault();
                      }
                    }}
              />
            </div>
            
            <div>
              <label htmlFor="title_ar" className="block text-sm font-medium text-gray-700">
                {t('Amenity Title (Arabic)')}
              </label>
              <input
                id="title_ar"
                type="text"
                name="title[ar]"
                placeholder={t('Enter amenity title in Arabic')}
                defaultValue={currentAmenity?.descriptions.ar.title ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                    disabled={submitting}
                    dir="rtl"
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      // Allow Arabic letters, spaces, numbers, and common punctuation
                      const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s\-'.,!?()&]*$/;
                      if (!arabicPattern.test(target.value)) {
                        // Remove non-Arabic characters
                        target.value = target.value.replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s\-'.,!?()&]/g, '');
                      }
                    }}
                    onKeyPress={(e) => {
                      const char = e.key;
                      const arabicPattern = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF0-9\s\-'.,!?()&]$/;
                      if (!arabicPattern.test(char)) {
                        e.preventDefault();
                      }
                    }}
              />
            </div>

            <ImageUploadField
              label="Amenity Image"
              id="amenity-image"
              name="image"
              value={currentAmenity?.image || null}
              preview={imagePreview}
              onChange={handleImageChange}
              required={modalState.type === 'create'}
              accept="image/*"
                  allowedSizes={`${AMENITY_IMAGE_SIZE.width}x${AMENITY_IMAGE_SIZE.height}`}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setModalState({ type: null })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={submitting} 
              >
                {t('Cancel')}
              </button>
              <button 
                type="submit" 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-blue-400"
                    disabled={submitting || modalLoading} 
              >
                    {submitting
                      ? (modalState.type === 'create' ? t('Creating') : t('Updating'))
                      : (modalState.type === 'create' ? t('Create') : t('Update'))
                    }
              </button>
            </div>
          </form>
        )}
      </ModalForm>
    </div>
  );
}