'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { AxiosError } from 'axios'; // Make sure to import AxiosError type
import ImageWithFallback from '@/components/ImageWithFallback';


type OwnerItem = {
  id: number;
  name: string;
  email: string;
  phone: string;
  parent_id: number | null;
  avatar: string | null;
  subscription: string;
  provider_id: number | null;
  email_verified_at: string | null;
  role: string;
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

export default function OwnersPage() {

  const locale = useLocale();
  const t = useTranslations("Tables");
  const [items, setItems] = useState<OwnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | null;
    item?: OwnerItem;
  }>({ type: null });

  const fetchOwners = useCallback(
    async (authToken: string) => {
      try {
        const res = await getData(
          'owner/agents',
          {},
          new AxiosHeaders({
            lang: locale,
            Authorization: `Bearer ${authToken}`,
          }),
        );

        const normalized = (res ?? []).map((item: OwnerItem) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          parent_id: item.parent_id,
          avatar: item.avatar,
          // subscription: item.subscription,
          // provider_id: item.provider_id,
          // email_verified_at: item.email_verified_at,
          role: item.role,
        }));

        setItems(normalized);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          showToast(error.response?.data.message, 'error');
        } else {
          showToast(t('An unknown error occurred'), 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [locale, t],
  );

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast(t('Token not found in localStorage'), 'error');
    }
  }, [t]);

  useEffect(() => {
    if (token) {
      fetchOwners(token);
    }
  }, [token, fetchOwners]);

  const handleDelete = async (item: OwnerItem) => {
    if (!token) return;
    try {
      await deleteData(
        `owner/agents/${item.id}`,
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }),
      );
      fetchOwners(token);
      showToast('Agent deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Delete failed', 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    try {
      if (modalState.type === 'create') {
        // Create owner: name, email, phone, password, password_confirmation
        const payload = new FormData();
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);
        payload.append('password', formData.get('password') as string);
        payload.append('password_confirmation', formData.get('password_confirmation') as string);

        await postData('owner/agents', payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      } else if (modalState.type === 'edit' && modalState.item) {
        // Edit owner: _method=PUT, name, email, password (optional)
        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);

        const password = formData.get('password') as string;
        if (password) {
          payload.append('password', password);
        }

        await postData(`owner/agents/${modalState.item.id}`, payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      }

      fetchOwners(token);
      setModalState({ type: null });
      showToast(t('agent saved successfully'), 'success');  
    } catch (error) {
      if (error instanceof AxiosError) {
        showToast('error', 'error');
      } else {
        showToast(t('An unknown error occurred'), 'error');
      }
    }
  };

  return (
    <div className="p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Table<OwnerItem>
          data={items}
          columns={[
            {
              key: 'avatar',
              label: 'Avatar',
              render: (item) =>
                item.avatar ? (
                  // <Image
                  //   width={50}
                  //   height={50}
                  //   src={item.avatar}
                  //   alt="owner avatar"
                  //   className="h-12 w-12 object-cover rounded-full"
                  // />
                  <ImageWithFallback
  src={item?.avatar || ''}
  alt="User Avatar"
  width={80}
  height={80}
  className="rounded-xl object-cover"
/>
                ) : (
                  <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                    No Avatar
                  </div>
                ),
            },
            {
              key: 'name',
              label: 'Name',
              render: (item) => item.name || '-',
            },
            {
              key: 'email',
              label: 'Email',
               render: (item) => (
    <div className="max-w-[clamp(10.00px,10vw,100.00px)] w-full truncate overflow-hidden whitespace-nowrap">
      {item.email || '-'}
    </div>
  ),
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (item) => item.phone || '-',
            },
            // {
            //   key: 'subscription',
            //   label: 'Subscription',
            //   render: (item) => (
            //     <span className={`px-2 py-1 rounded text-xs ${
            //       item.subscription === 'yes' 
            //         ? 'bg-green-100 text-green-800' 
            //         : 'bg-red-100 text-red-800'
            //     }`}>
            //       {item.subscription}
            //     </span>
            //   ),
            // },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
        />
      )}

      <ModalForm
              className='max-w-1/3'

        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? t('Create a new agent')
            : modalState.type === 'edit'
            ? t('Edit agent')
            : t('View agent')
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' ? (
          <div className="space-y-3  ">
            {modalState.item?.avatar && (
              <div className="flex justify-center">
                <Image
                  width={120}
                  height={120}
                  src={modalState.item.avatar}
                  alt="Owner Avatar"
                  className="w-30 h-30 object-cover rounded-full"
                />
              </div>
            )}
            <p className='flex items-center gap-2'>
              <strong>{t('Name')}:</strong> {modalState.item?.name}
            </p>
            <p className='flex items-center gap-2'>
              <strong>{t('Email')}:</strong> {modalState.item?.email}
            </p>
            <p className='flex items-center gap-2'>
              <strong>{t('Phone')}:</strong> {modalState.item?.phone}
            </p>
            {/* <p>
              <strong>Subscription:</strong> {modalState.item?.subscription}
            </p>
            <p>
              <strong>Role:</strong> {modalState.item?.role}
            </p> */}
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
              name="name"
              placeholder={t('Owner Name')}
              defaultValue={modalState.item?.name || ''}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="email"
              name="email"
              placeholder={t('Email Address')}
              defaultValue={modalState.item?.email || ''}
              className="w-full border p-2 rounded"
              required
            />
            {modalState.type === 'create' && (
              <>
                <input
                  type="tel"
                  name="phone"
                  placeholder={t('Phone Number')}
                  defaultValue=""
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder={t('Password')}
                  className="w-full border p-2 rounded"
                  required
                />
                <input
                  type="password"
                  name="password_confirmation"
                  placeholder={t('Confirm Password')}
                  className="w-full border p-2 rounded"
                  required
                />
              </>
            )}
            {modalState.type === 'edit' && (
              <>
                <input
                  type="tel"
                  name="phone"
                  placeholder={t('Phone Number')}
              defaultValue={modalState.item?.phone || ''}
              className="w-full border p-2 rounded"
              required
                />
              <input
                type="password"
                name="password"
                placeholder={t('New Password (leave blank to keep current)')}
                className="w-full border p-2 rounded"
              />
              {/* // phone */}
            
                </>
            )}

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              {modalState.type === 'create' ? t('Create Owner') : t('Update Owner')}
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}
