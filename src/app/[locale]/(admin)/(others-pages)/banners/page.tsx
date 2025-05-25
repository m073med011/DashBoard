'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';

type Banner = {
  id: number;
  link: string;
  type: string;
  name: string;
  description: string;
  image: string;
};

export default function Page() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | null;
    item?: Banner;
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
    if (token) fetchItems(token);
  }, [token]);

  const fetchItems = async (authToken: string) => {
    try {
      const res = await getData('owner/banners', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch banners', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Banner) => {
    if (!token) return;
    try {
      await deleteData(`owner/banners/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchItems(token);
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;
  
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
      } else if (modalState.type === 'edit' && modalState.item) {
        // 👇 Add this line to spoof PUT method
        payload.append('_method', 'PUT');
  
        await postData(`owner/banners/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      }
  
      fetchItems(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
    }
  };
  

  return (
    <div className="p-6">
      {loading ? (
        <p>loading</p>
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
            onSubmit={e => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-3"
          >
            <input name="link" type="text" placeholder="Link" className="w-full border p-2 rounded" defaultValue={modalState.item?.link ?? ''} />
            <input name="type" type="text" placeholder="Type" className="w-full border p-2 rounded" defaultValue={modalState.item?.type ?? ''} />

            <input name="name[en]" type="text" placeholder="Name (EN)" className="w-full border p-2 rounded" />
            <textarea name="description[en]" placeholder="Description (EN)" className="w-full border p-2 rounded" />
            <input name="image[en]" type="file" accept="image/*" className="w-full border p-2 rounded" />

            <input name="name[ar]" type="text" placeholder="Name (AR)" className="w-full border p-2 rounded" />
            <textarea name="description[ar]" placeholder="Description (AR)" className="w-full border p-2 rounded" />
            <input name="image[ar]" type="file" accept="image/*" className="w-full border p-2 rounded" />

            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Submit
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
