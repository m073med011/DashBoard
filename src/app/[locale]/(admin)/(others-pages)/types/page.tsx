'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';


type TitleObject = {
  en: string;
  ar: string;
};

type TypeItem = {
  id: number;
  title: TitleObject;
  image: string;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};


export default function TypesPage() {
  const [items, setItems] = useState<TypeItem[]>([]);
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
    item?: TypeItem;
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
    if (token) fetchTypes(token);
  }, [token]);

  const fetchTypes = async (authToken: string) => {
    try {
      const res = await getData('owner/types', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));

      const normalized = (res.data ?? []).map((item: TypeItem) => ({
        ...item,
        title: typeof item.title === 'string'
          ? { en: item.title, ar: '' }
          : item.title,
      }));

      setItems(normalized);
    } catch (error) {
      console.error('Failed to fetch types', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: TypeItem) => {
    if (!token) return;
    try {
      await deleteData(`owner/types/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchTypes(token);
      showToast('Type deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Delete failed', 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title[en]', formData.get('title[en]') as string);
    payload.append('title[ar]', formData.get('title[ar]') as string);

    const file = formData.get('image') as File;
    if (file && file.size > 0) {
      payload.append('image', file);
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
      showToast('Type saved successfully', 'success');
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
        <Table<TypeItem>
          data={items}
          columns={[
            {
              key: 'title',
              label: 'Title',
              render: (item) => item.title.en ?? '-',
            },
            {
              key: 'image',
              label: 'Image',
              render: (item) => (
                <Image
                  width={50}
                  height={50}
                  src={item.image}
                  alt="type"
                  className="h-12 w-12 object-cover rounded"
                />
              ),
            },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={item => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={item => setModalState({ type: 'view', item })}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Type'
            : modalState.type === 'edit'
            ? 'Edit Type'
            : 'View Type'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>Title (EN):</strong> {modalState.item?.title.en}</p>
            <p><strong>Title (AR):</strong> {modalState.item?.title.ar}</p>
            {modalState.item?.image && (
              <Image
                width={300}
                height={200}
                src={modalState.item.image}
                alt="Type"
                className="w-full rounded"
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
              defaultValue={modalState.item?.title.en}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="title[ar]"
              placeholder="Title (AR)"
              defaultValue={modalState.item?.title.ar ?? ''}
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
