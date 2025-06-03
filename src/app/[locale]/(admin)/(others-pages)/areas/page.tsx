'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { useLocale, useTranslations } from 'next-intl';
// Updated type to match API response structure
type Area = {
  id: number;
  name: string; // This is the single name field from API
  description: {
    en: {
      name: string;
    };
    ar: {
      name: string;
    };
  };
  image: string;
  count_of_properties: number;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

  export default function AreasPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [items, setItems] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  }); 
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Area;
  }>({ type: null });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast(t("Token not found in localStorage"), 'error');
    }
  }, [t]);

  useEffect(() => {
    if (token) fetchAreas(token);
  }, [token, t]);

  const fetchAreas = async (authToken: string) => {
    try {
      const res = await getData('owner/areas', {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch areas', error);
      showToast(t("Failed to fetch areas"), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Area) => {
    if (!token) return;
    try {
      await deleteData(`owner/areas/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchAreas(token);
      showToast(t("Area deleted successfully"), 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast(t("Delete failed"), 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    // Updated to match the API structure based on your form data table
    payload.append('name[en]', formData.get('name[en]') as string);
    payload.append('name[ar]', formData.get('name[ar]') as string);
    payload.append('count_of_properties', formData.get('count_of_properties') as string);

    const file = formData.get('image') as File;
    if (file && file.size > 0) {
      payload.append('image', file);
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/areas', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast(t("Area created successfully"), 'success');
      } else if (modalState.type === 'edit' && modalState.item) {
        // For updates, we need to add _method field for PATCH
        payload.append('_method', 'PATCH');
        await patchData(`owner/areas/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast(t("Area updated successfully"), 'success');
      }

      fetchAreas(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
      showToast(t("Save failed"), 'error');
    }
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading areas...</p>
        </div>
      ) : (
        <Table<Area>
          data={items}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (item) => `${item.description.en.name} / ${item.description.ar.name}`,
            },
            {
              key: 'image',
              label: 'Image',
              render: (item: Area) => (
                <Image
                  src={item.image}
                  alt="area"
                  width={48}
                  height={48}
                  className="rounded object-cover"
                />
              ),
            },
            {
              key: 'count_of_properties',
              label: 'Properties',
              render: (item) => item.count_of_properties.toString(),
            },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Area'
            : modalState.type === 'edit'
            ? 'Edit Area'
            : 'View Area'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-4">
            <div>
              <strong className="block text-sm font-medium text-gray-700">Name (EN):</strong>
              <p className="mt-1">{modalState.item?.description.en.name}</p>
            </div>
            <div>
              <strong className="block text-sm font-medium text-gray-700">Name (AR):</strong>
              <p className="mt-1">{modalState.item?.description.ar.name}</p>
            </div>
            <div>
              <strong className="block text-sm font-medium text-gray-700">Properties:</strong>
              <p className="mt-1">{modalState.item?.count_of_properties}</p>
            </div>
            {modalState.item?.image && (
              <div>
                <strong className="block text-sm font-medium text-gray-700 mb-2">Image:</strong>
                <Image
                  src={modalState.item.image}
                  alt="Area"
                  width={200}
                  height={200}
                  className="w-full max-w-sm rounded-lg object-cover"
                />
              </div>
            )}
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
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700">
                Area Name (English)
              </label>
              <input
                id="name_en"
                type="text"
                name="name[en]"
                placeholder="Enter area name in English"
                defaultValue={modalState.item?.description.en.name ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="name_ar" className="block text-sm font-medium text-gray-700">
                Area Name (Arabic)
              </label>
              <input
                id="name_ar"
                type="text"
                name="name[ar]"
                placeholder="Enter area name in Arabic"
                defaultValue={modalState.item?.description.ar.name ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label htmlFor="count_properties" className="block text-sm font-medium text-gray-700">
                Number of Properties
              </label>
              <input
                id="count_properties"
                type="number"
                name="count_of_properties"
                placeholder="Enter number of properties"
                defaultValue={modalState.item?.count_of_properties?.toString() ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                required
              />
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Area Image
              </label>
              <input
                id="image"
                type="file"
                name="image"
                accept="image/*"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {modalState.type === 'edit' && (
                <p className="mt-1 text-sm text-gray-500">Leave empty to keep current image</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setModalState({ type: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {modalState.type === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </ModalForm>
    </div>
  );
}