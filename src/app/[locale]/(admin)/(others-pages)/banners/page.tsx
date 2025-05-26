'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';

type Banner = {
  id: number;
  link: string;
  type: string;
  name: string;
  description: string;
  image: string;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export default function Page() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  });

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | null;
    item?: Banner;
  }>({ type: null });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('Token not found in localStorage');
      showToast('Authentication token not found', 'error');
    }
  }, []);

  useEffect(() => {
    if (token) fetchItems(token);
  },[token]);

  const fetchItems = async (authToken: string) => {
    try {
      const res = await getData('owner/banners', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch banners', error);
      showToast('Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Banner) => {
    if (!token) {
      showToast('Authentication token not found', 'error');
      return;
    }

    try {
      await deleteData(`owner/banners/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      await fetchItems(token);
      showToast('Banner deleted successfully', 'success');
    } catch {
      showToast('Failed to delete banner', 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) {
      showToast('Authentication token not found', 'error');
      return;
    }

    const payload = new FormData();
    payload.append('link', formData.get('link') || '');
    payload.append('type', formData.get('type') || '');
    payload.append('name[en]', formData.get('name[en]') || '');
    payload.append('description[en]', formData.get('description[en]') || '');
    const imageEn = formData.get('image[en]') as File;
    if (imageEn && imageEn.size > 0) payload.append('image[en]', imageEn);

    payload.append('name[ar]', formData.get('name[ar]') || '');
    payload.append('description[ar]', formData.get('description[ar]') || '');
    const imageAr = formData.get('image[ar]') as File;
    if (imageAr && imageAr.size > 0) payload.append('image[ar]', imageAr);

    try {
      if (modalState.type === 'create') {
        await postData('owner/banners', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast('Banner created successfully', 'success');
      } else if (modalState.type === 'edit' && modalState.item) {
        payload.append('_method', 'PUT');
        await postData(`owner/banners/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast('Banner updated successfully', 'success');
      }

      await fetchItems(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
      showToast('Failed to save banner', 'error');
    }
  };

  const handleView = (item: Banner) => {
    setModalState({ type: 'view', item });
    showToast('Viewing banner', 'info');
  };

  const handleEdit = (item: Banner) => {
    setModalState({ type: 'edit', item });
    showToast('Editing banner', 'info');
  };

  const handleCreate = () => {
    setModalState({ type: 'create' });
    showToast('Create form opened', 'info');
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table<Banner>
          data={items}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'link', label: 'Link' },
            { key: 'type', label: 'Type' },
            { key: 'name', label: 'Name' },
            { key: 'description', label: 'Description' },
          ]}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Banner'
            : modalState.type === 'edit'
              ? 'Edit Banner'
              : 'View Banner'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' ? (
          <div className="space-y-3">
            <p><strong>ID:</strong> {modalState.item?.id}</p>
            <p><strong>Link:</strong> {modalState.item?.link}</p>
            <p><strong>Type:</strong> {modalState.item?.type}</p>
            <p><strong>Name:</strong> {modalState.item?.name}</p>
            <p><strong>Description:</strong> {modalState.item?.description}</p>
            {modalState.item?.image && (
              <Image src={modalState.item.image} alt="Banner" width={200} height={100} />
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
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Link</label>
              <input
                name="link"
                type="text"
                placeholder="https://example.com"
                defaultValue={modalState.item?.link ?? ''}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
        
            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Type</label>
              <select
                name="type"
                defaultValue={modalState.item?.type ?? 'banner'}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              >
                <option value="banner">Banner</option>
              </select>
            </div>
        
            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Name (EN)</label>
              <input
                name="name[en]"
                type="text"
                placeholder="Name in English"
                defaultValue=""
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
        
            
        
           
        
            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Name (AR)</label>
              <input
                name="name[ar]"
                type="text"
                placeholder="Name in Arabic"
                defaultValue=""
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Description (EN)</label>
              <textarea
                name="description[en]"
                placeholder="English description"
                defaultValue=""
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Description (AR)</label>
              <textarea
                name="description[ar]"
                placeholder="Arabic description"
                defaultValue=""
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
        
            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Image (AR)</label>
              <input
                name="image[ar]"
                type="file"
                accept="image/*"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-sm text-gray-700">Image (EN)</label>
              <input
                name="image[en]"
                type="file"
                accept="image/*"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            
          </div>
        
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition"
            >
              {modalState.type === 'edit' ? 'Update Banner' : 'Create Banner'}
            </button>
          </div>
        </form>
        
        )}
      </ModalForm>
    </div>
  );
}
