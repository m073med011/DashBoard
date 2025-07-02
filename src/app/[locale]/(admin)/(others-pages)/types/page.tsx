'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
// import Image from 'next/image';
import Toast from '@/components/Toast';
import { useLocale } from 'next-intl';
// import { useTranslations } from 'next-intl';
import ImageWithFallback from '@/components/ImageWithFallback';

import { useRouter } from '@/i18n/routing';
type TypeItem = {
  id: number;
  title: string;
  image: string | null;
  descriptions: {
    en: {
      title: string;
      image: string | null;
    };
    ar: {
      title: string;
      image: string | null;
    };
  };
  titleObj: {
    en: string;
    ar: string;
  };
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export default function TypesPage() {
  const locale = useLocale();
  const router = useRouter();

  // const t = useTranslations("types");
  const [items, setItems] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  }); 
  
  // Image preview states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: TypeItem;
  }>({ type: null });

  // Reset image states when modal closes
  const resetImageStates = () => {
    setPreviewImage(null);
    setSelectedFile(null);
    setRemoveExistingImage(false);
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRemoveExistingImage(false); // Reset remove flag when new file selected
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    
    // Clear the file input
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Remove existing image (for edit mode)
  const removeExistingImageHandler = () => {
    setRemoveExistingImage(true);
    setPreviewImage(null);
    setSelectedFile(null);
    
    // Clear the file input
    const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Use useCallback to memoize fetchTypes function
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
        // Create a computed title object for easier access
        titleObj: {
          en: item.descriptions?.en?.title || item.title || '',
          ar: item.descriptions?.ar?.title || ''
        }
      }));

      setItems(normalized);
    } catch (error) {
      console.error('Failed to fetch types', error);
      showToast("Failed to fetch types", "error");
    } finally {
      setLoading(false);
    }
  }, [locale]); // Include locale as dependency since it's used inside


  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast("Token not found in localStorage", "error");
    }
  }, [locale]);

  useEffect(() => {
    if (token) fetchTypes(token);
  }, [token, fetchTypes]); // Now include fetchTypes in dependency array

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

    // Handle image logic
    if (selectedFile) {
      // New image selected
      payload.append('image', selectedFile);
    } else if (removeExistingImage && modalState.type === 'edit') {
      // Mark for removal (you might need to adjust this based on your API)
      payload.append('remove_image', 'true');
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/types', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/types/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      }

      fetchTypes(token);
      setModalState({ type: null });
      resetImageStates();
      showToast("Type saved successfully", 'success');
      // reloading page
      router.refresh();
    } catch (error) {
      console.error('Save failed', error);
      showToast("Save failed", 'error');
    }
  };

  // Handle modal open
  const handleModalOpen = (type: 'create' | 'edit' | 'view', item?: TypeItem) => {
    setModalState({ type, item });
    resetImageStates();
  };

  // Handle modal close
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
        <p>Loading...</p>
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
              label: 'Image',
              render: (item) => (
                item.image ? (
                  <ImageWithFallback
                    src={item.image|| ''}
                    alt="User Avatar"
                    width={100}
                    height={100}
                    className="rounded-lg w-full max-h-20 object-fill"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                    No Image
                  </div>
                )
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
        className='max-w-2xl'
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Type'
            : modalState.type === 'edit'
            ? 'Edit Type'
            : 'View Type'
        }
        onClose={handleModalClose}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>Title (EN):</strong> {modalState.item?.titleObj?.en || modalState.item?.descriptions?.en?.title}</p>
            <p><strong>Title (AR):</strong> {modalState.item?.titleObj?.ar || modalState.item?.descriptions?.ar?.title}</p>
            {modalState.item?.image && (
              <ImageWithFallback
                src={modalState.item.image|| ''}
                alt="User Avatar"
                width={100}
                height={100}
                className="rounded-full object-cover"
              />
            )}
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
              placeholder="Title (EN)"
              defaultValue={modalState.item?.titleObj?.en || modalState.item?.descriptions?.en?.title || ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="title[ar]"
              placeholder="Title (AR)"
              defaultValue={modalState.item?.titleObj?.ar || modalState.item?.descriptions?.ar?.title || ''}
              className="w-full border p-2 rounded"
              required
            />
            
            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Image
              </label>
              
              {/* File Input */}
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileSelect}
                className="w-full border p-2 rounded"
              />
              
              {/* Existing Image (Edit Mode) */}
              {modalState.type === 'edit' && modalState.item?.image && !removeExistingImage && !previewImage && (
                <div className="relative">
                  <div className="text-sm text-gray-600 mb-2">Current Image:</div>
                  <div className="relative inline-block">
                    <ImageWithFallback
                      src={modalState.item.image}
                      alt="Current image"
                      width={200}
                      height={150}
                      className="rounded-lg object-cover border"
                    />
                    <button
                      type="button"
                      onClick={removeExistingImageHandler}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Remove current image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Image Preview */}
              {previewImage && (
                <div className="relative">
                  <div className="text-sm text-gray-600 mb-2">Preview:</div>
                  <div className="relative inline-block">
                    <ImageWithFallback
                      src={previewImage}
                      alt="Preview"
                      width={192}
                      height={144}
                      className="w-48 h-36 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      title="Remove selected image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Removed Image Indicator */}
              {removeExistingImage && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Current image will be removed
                </div>
              )}
            </div>
            
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}