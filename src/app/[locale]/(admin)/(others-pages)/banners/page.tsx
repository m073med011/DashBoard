'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Table from '@/components/tables/Table';
import { getData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';

type Banner = {
  id: number;
  link: string;
  type: string;
  name: string;
  image: string;
};
type RawBanner = {
  id: number;
  link: string;
  type: string;
  en?: {
    name?: string;
    image?: string;
  };
  ar?: {
    name?: string;
    image?: string;
  };
};


type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export default function Page() {
  const locale = useLocale(); // 'en' or 'ar'
  const [items, setItems] = useState<Banner[]>([]);
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

  // View-only handlers for create/edit, but keep delete functionality
  const handleView = (item: Banner) => {
    showToast(`Viewing banner: ${item.name}`, 'info');
  };

  const handleEdit = () => {
    showToast('Edit functionality is disabled in view-only mode', 'info');
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

  const handleCreate = () => {
    showToast('Create functionality is disabled in view-only mode', 'info');
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
  }, [token]);

  const fetchItems = async (authToken: string) => {
    try {
      const res = await getData('owner/banners', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));

      const rawData = res.data ?? [];

      const localizedData: Banner[] = (rawData as RawBanner[]).map((item) => ({
        id: item.id,
        link: item.link,
        type: item.type,
        name: item[locale as 'en' | 'ar']?.name || '',
        image: item[locale as 'en' | 'ar']?.image || '',
      }));
      

      setItems(localizedData);
    } catch (error) {
      console.error('Failed to fetch banners', error);
      showToast('Failed to fetch banners', 'error');
    } finally {
      setLoading(false);
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
        <Table<Banner>
          data={items}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'link', label: 'Link' },
            { key: 'type', label: 'Type' },
            { key: 'name', label: 'Name' },
          ]}
          onCreatePage={handleCreate}
          onEditPage={handleEdit}
          onDelete={handleDelete}
          onViewPage={handleView}
        />
      )}
    </div>
  );
}