'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';

type Area = {
  id: number;
  name: {
    en: string;
    ar: string;
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
      console.error('Token not found in localStorage');
    }
  }, []);

  useEffect(() => {
    if (token) fetchAreas(token);
  }, [token]);

  const fetchAreas = async (authToken: string) => {
    try {
      const res = await getData('owner/areas', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch areas', error);
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
      showToast('Area deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Delete failed', 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
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
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/areas/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      }

      fetchAreas(token);
      setModalState({ type: null });
      showToast('Area saved successfully', 'success');
    } catch (error) {
      console.error('Save failed', error);
      showToast('Save failed', 'error');
    }
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table<Area>
          data={items}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (item) => `${item.name.en} / ${item.name.ar}`,
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
          <div className="space-y-2">
            <p><strong>Name (EN):</strong> {modalState.item?.name.en}</p>
            <p><strong>Name (AR):</strong> {modalState.item?.name.ar}</p>
            <p><strong>Properties:</strong> {modalState.item?.count_of_properties}</p>
            {modalState.item?.image && (
              <Image
                src={modalState.item.image}
                alt="Area"
                width={100}
                height={100}
                className="w-full rounded"
              />
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-3"
          >
            <input
              type="text"
              name="name[en]"
              placeholder="Area Name (EN)"
              defaultValue={modalState.item?.name.en ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="name[ar]"
              placeholder="Area Name (AR)"
              defaultValue={modalState.item?.name.ar ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="number"
              name="count_of_properties"
              placeholder="Number of Properties"
              defaultValue={
                modalState.item?.count_of_properties?.toString() ?? ''
              }
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="file"
              name="image"
              accept="image/*"
              className="w-full border p-2 rounded"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
