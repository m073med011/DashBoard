'use client';

import { useEffect, useState } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, patchData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';

type Item = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Item;
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
      const data = await getData('owner/locations', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Item) => {
    if (!token) return;
    try {
      await deleteData(`owner/locations/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      fetchItems(token);
    } catch (error) {
      console.error('Delete failed', error);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = {
      name: formData.get('name') as string,
      latitude: Number(formData.get('latitude')),
      longitude: Number(formData.get('longitude')),
    };

    try {
      if (modalState.type === 'create') {
        await postData('owner/locations', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }))             ;
      } else if (modalState.type === 'edit' && modalState.item) {
        await patchData(`owner/locations/${modalState.item.id}`, payload, new AxiosHeaders({
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
        <p>Loading...</p>
      ) : (
        <Table<Item>
          data={items}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'latitude', label: 'Latitude' },
            { key: 'longitude', label: 'Longitude' },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={item => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={item => setModalState({ type: 'view', item })}
          onQuickView={item => setModalState({ type: 'quick', item })}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Location'
            : modalState.type === 'edit'
            ? 'Edit Location'
            : 'View Location'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-2">
            <p><strong>Name:</strong> {modalState.item?.name}</p>
            <p><strong>Latitude:</strong> {modalState.item?.latitude}</p>
            <p><strong>Longitude:</strong> {modalState.item?.longitude}</p>
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
              name="name"
              placeholder="Name"
              defaultValue={modalState.item?.name}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="number"
              step="any"
              name="latitude"
              placeholder="Latitude"
              defaultValue={modalState.item?.latitude}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="number"
              step="any"
              name="longitude"
              placeholder="Longitude"
              defaultValue={modalState.item?.longitude}
              className="w-full border p-2 rounded"
              required
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
