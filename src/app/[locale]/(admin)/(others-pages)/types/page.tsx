'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';
import { useLocale } from 'next-intl';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import ImageUploadField from "@/components/ImageUploadField";


import { TYPE_IMAGE_SIZE } from "@/libs/constants/imageSizes";

type TypeItem = {
  id: number;
  title: string;
  image: string | null;
  descriptions: {
    en: { title: string; image: string | null };
    ar: { title: string; image: string | null };
  };
  titleObj: { en: string; ar: string };
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export default function TypesPage() {
  const locale = useLocale();
  const t = useTranslations("types");
  const router = useRouter();

  const [items, setItems] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
  });

  // Image upload states for the ImageUploadField component
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: TypeItem;
  }>({ type: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const resetImageStates = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setRemoveExistingImage(false);
  };

  // Handle image upload from ImageUploadField component
  const handleImageUpload = (file: File | null) => {
    setSelectedFile(file);
    setRemoveExistingImage(false);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }
  };

  const fetchTypes = useCallback(async (authToken: string) => {
    try {
      const res = await getData('owner/types', {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${authToken}`,
      }));

      const normalized = (res.data ?? []).map((item: TypeItem) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        descriptions: item.descriptions,
        titleObj: {
          en: item.descriptions?.en?.title || item.title || '',
          ar: item.descriptions?.ar?.title || '',
        },
      }));

      setItems(normalized);
    } catch (error) {
      console.error('Failed to fetch types', error);
      showToast("Failed to fetch types", "error");
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast("Token not found in localStorage", "error");
    }
  }, [locale, t]);

  useEffect(() => {
    if (token) fetchTypes(token);
  }, [token, fetchTypes]);

  const handleDelete = async (item: TypeItem) => {
    if (!token) return;
    try {
      await deleteData(`owner/types/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchTypes(token);
      showToast("Type deleted successfully", 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast("Delete failed", 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title[en]', formData.get('title[en]') as string);
    payload.append('title[ar]', formData.get('title[ar]') as string);

    // Add _method field for edit operations
    if (modalState.type === 'edit') {
      payload.append('_method', 'PUT');
    }

    if (selectedFile) {
      payload.append('image', selectedFile);
    } else if (removeExistingImage && modalState.type === 'edit') {
      payload.append('remove_image', 'true');
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/types', payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      } else if (modalState.type === 'edit' && modalState.item) {
        await postData(`owner/types/${modalState.item.id}`, payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      }
      
      window.location.reload();
      setModalState({ type: null });
      resetImageStates();
      showToast("Type saved successfully", 'success');
      router.refresh();
    } catch (error) {
      console.error('Save failed', error);
      showToast("Save failed", 'error');
    }
  };

  const handleModalOpen = (type: 'create' | 'edit' | 'view', item?: TypeItem) => {
    setModalState({ type, item });
    resetImageStates();
  };

  const handleModalClose = () => {
    setModalState({ type: null });
    resetImageStates();
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
        <p>{t("Loading")}</p>
      ) : (
        <Table<TypeItem>
          data={items}
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (item) => item.titleObj?.en || item.title || '-',
            },
            {
              key: 'image',
              label:'Image',
              render: (item) =>
                item.image ? (
                  <ImageWithFallback
                    src={item.image}
                    alt={t("Image")}
                    width={100}
                    height={100}
                    className="rounded-full w-full max-h-25 object-contain"

                  />
                ) : (
                  <div className="h-15 w-15 bg-gray-200 rounded flex items-center justify-center text-xs">
                    {t("No Image")}
                  </div>
                ),
            },
          ]}
          onCreate={() => handleModalOpen('create')}
          onEdit={item => handleModalOpen('edit', item)}
          onDelete={handleDelete}
          onView={item => handleModalOpen('view', item)}
        />
      )}

      <ModalForm
        className="max-w-lg"
        open={!!modalState.type}
        title={
          modalState.type === 'create' ? t('Create Type')
          : modalState.type === 'edit' ? t('Edit Type')
          : t('View Type')
        }
        onClose={handleModalClose}
      >
        {modalState.type === 'view' ? (
          <div className="space-y-4">
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {t("Type Details")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("Title (EN)")}</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {modalState.item?.titleObj.en || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t("Title (AR)")}</p>
                <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {modalState.item?.titleObj.ar || '-'}
                </p>
              </div>
            </div>

            {modalState.item?.image && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t("Image")}</p>
                <ImageWithFallback
                  src={modalState.item.image}
                  alt={t("Image")}
                  width={500}
                  height={200}
                  className="rounded-lg border shadow-md object-cover max-w-full"
                />
              </div>
            )}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-4"
          >
            {/* Add hidden _method field for edit operations */}
            {modalState.type === 'edit' && (
              <input type="hidden" name="_method" value="PUT" />
            )}
            
            <div>
              <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
                {t("Title (EN)")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title[en]"
                placeholder={t("Title (EN)")}
                defaultValue={modalState.item?.titleObj.en || ''}
                className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">
                {t("Title (AR)")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title[ar]"
                placeholder={t("Title (AR)")}
                defaultValue={modalState.item?.titleObj.ar || ''}
                className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            {/* Replace the old file input with ImageUploadField */}
            <ImageUploadField
              label="Image"
              id="type-image"
              name="image"
              value={modalState.item?.image || null}
              preview={previewImage}
              onChange={handleImageUpload}
              accept="image/*"
              allowedSizes={TYPE_IMAGE_SIZE.width + 'x' + TYPE_IMAGE_SIZE.height}
            />

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t("Cancel")}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {modalState.type === 'create' ? t("Create") : t("Update")}
              </button>
            </div>
          </form>
        )}
      </ModalForm>
    </div>
  );
}