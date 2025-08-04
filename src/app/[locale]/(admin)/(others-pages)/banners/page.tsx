'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import Table from '@/components/tables/Table';
import { getData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Toast from '@/components/Toast';
import { useTranslations } from "next-intl";
// import Image from "next/image";
import ImageWithFallback from "@/components/ImageWithFallback";


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
    show: false,
  });
  const t = useTranslations("blogs");

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  }, []);

  const fetchItems = useCallback(
    async (authToken: string) => {
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
    },
    [locale, showToast]
  );

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
  }, [showToast]);

  useEffect(() => {
    if (token) fetchItems(token);
  }, [token, fetchItems]);

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {loading ? (
                 <div className="loader w-full h-100vw flex items-center justify-center">{t("Loading")}</div>
      ) : (
        <Table<Banner>
          data={items}
          columns={[
            // { key: 'id', label: 'ID' },
            {
              key: 'image',
              label:'Image',
              render: (item) =>
                item.image ? (
                  <ImageWithFallback
                    src={item.image}
                    alt={t("Image")}
                    width={100}
                    height={150}
                    className="rounded-lg w-full max-h-40 object-fill"
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                    {t("No Image")}
                  </div>
                ),
            },
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
