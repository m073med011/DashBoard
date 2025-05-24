'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';

type TypeItem = {
  id: number;
  title: string;
  image: string;
};

export default function TypesPage() {
  const [items, setItems] = useState<TypeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

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
      setItems(res.data ?? []);
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
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title', formData.get('title') as string);
    if (formData.get('image')) {
      const file = formData.get('image') as File;
      if (file && file.size > 0) {
        payload.append('image', file);
      }
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
    } catch (error) {
      console.error('Save failed', error);
    }
  };

  return (
    <div className="p-6">
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table<TypeItem>
          data={items}
          columns={[
            { key: 'title', label: 'Title' },
            {
              key: 'image',
              label: 'Image',
              render: (item) => (
                <img src={item.image} alt="type" className="h-12 w-12 object-cover rounded" />
              ),
            },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={item => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={item => setModalState({ type: 'view', item })}
          // onQuickView={item => setModalState({ type: 'quick', item })}
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
            <p><strong>Title:</strong> {modalState.item?.title}</p>
            {modalState.item?.image && (
              <img
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
              name="title"
              placeholder="Type Title"
              defaultValue={modalState.item?.title ?? ''}
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
