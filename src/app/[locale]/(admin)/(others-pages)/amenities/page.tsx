'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';

type Amenity = {
  id: number;
  title: string;
  type: string | null;
};

export default function AmenitiesPage() {
  const [items, setItems] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Amenity;
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
    if (token) fetchAmenities(token);
  }, [token]);

  const fetchAmenities = async (authToken: string) => {
    try {
      const res = await getData('owner/amenities', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch amenities', error);
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
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('title', formData.get('title') as string);
    if (formData.get('type')) {
      payload.append('type', formData.get('type') as string);
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/amenities', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/amenities/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
      }

      fetchAmenities(token);
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
        <Table<Amenity>
          data={items}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'title', label: 'Title' },
            { key: 'type', label: 'Type' },
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
            ? 'Create Amenity'
            : modalState.type === 'edit'
            ? 'Edit Amenity'
            : 'View Amenity'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>ID:</strong> {modalState.item?.id}</p>
            <p><strong>Title:</strong> {modalState.item?.title}</p>
            <p><strong>Type:</strong> {modalState.item?.type ?? 'null'}</p>
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
              placeholder="Title"
              defaultValue={modalState.item?.title ?? ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              name="type"
              placeholder="Type (optional)"
              defaultValue={modalState.item?.type ?? ''}
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
