'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';
import { useLocale } from 'next-intl';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

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

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRemoveExistingImage(false);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const removeExistingImageHandler = () => {
    setRemoveExistingImage(true);
    setPreviewImage(null);
    setSelectedFile(null);
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
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
      showToast(t("Failed to fetch types"), "error");
    } finally {
      setLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast(t("Token not found in localStorage"), "error");
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
      showToast(t("Type deleted successfully"), 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast(t("Delete failed"), 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title[en]', formData.get('title[en]') as string);
    payload.append('title[ar]', formData.get('title[ar]') as string);

    if (selectedFile) {
      payload.append('image', selectedFile);
    } else if (removeExistingImage && modalState.type === 'edit') {
      payload.append('remove_image', 'true');
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/types', payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/types/${modalState.item.id}`, payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      }

      fetchTypes(token);
      setModalState({ type: null });
      resetImageStates();
      showToast(t("Type saved successfully"), 'success');
      router.refresh();
    } catch (error) {
      console.error('Save failed', error);
      showToast(t("Save failed"), 'error');
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
                    className="rounded-lg w-full max-h-20 object-fill"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs">
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
            className="space-y-3"
          >
            <input
              type="text"
              name="title[en]"
              placeholder={t("Title (EN)")}
              defaultValue={modalState.item?.titleObj.en || ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="title[ar]"
              placeholder={t("Title (AR)")}
              defaultValue={modalState.item?.titleObj.ar || ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full border p-2 rounded"
            />

            {modalState.type === 'edit' && modalState.item?.image && !removeExistingImage && !previewImage && (
              <div className="relative">
                <ImageWithFallback
                  src={modalState.item.image}
                  alt={t("Image")}
                  width={500}
                  height={150}
                  className="rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeExistingImageHandler}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6"
                >
                  ×
                </button>
              </div>
            )}

            {previewImage && (
              <div className="relative">
                <ImageWithFallback
                  src={previewImage}
                  alt={t("Image")}
                  width={192}
                  height={144}
                  className="rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6"
                >
                  ×
                </button>
              </div>
            )}

            {removeExistingImage && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {t("Current image will be removed")}
              </div>
            )}

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {t("Submit")}
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}