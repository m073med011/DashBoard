'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
// import Image from 'next/image';
import Toast from '@/components/Toast';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import ImageWithFallback from '@/components/ImageWithFallback';

type ModuleItem = {
  id: number;
  path: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

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
  modules: string[];
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
  const [modules, setModules] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
  });
  document.title =  `Proplex`;

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | null;
    item?: OwnerItem;
  }>({ type: null });

  const fetchModules = useCallback(
    async (authToken: string) => {
      try {
        const res = await getData(
          'owner/modules',
          {},
          new AxiosHeaders({
            lang: locale,
            Authorization: `Bearer ${authToken}`,
          }),
        );

        setModules(res ?? []);
      } catch (error) {
        console.error('Failed to fetch modules', error);
        showToast(t('Failed to fetch modules'), 'error');
      } finally {
        setModulesLoading(false);
      }
    },
    [locale, t],
  );

  const fetchOwners = useCallback(
    async (authToken: string) => {
      try {
        const res = await getData(
          'owner/owners',
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
        //   subscription: item.subscription,
        //   provider_id: item.provider_id,
        //   email_verified_at: item.email_verified_at,
        //   role: item.role,
          modules: item.modules || [],
        }));

        setItems(normalized);
      } catch (error) {
        console.error('Failed to fetch owners', error);
        showToast(t('Failed to fetch owners'), 'error');
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
      fetchModules(token);
    }
  }, [token, fetchOwners, fetchModules]);

  const handleDelete = async (item: OwnerItem) => {
    if (!token) return;
    try {
      await deleteData(
        `owner/owners/${item.id}`,
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }),
      );
      fetchOwners(token);
      showToast(t('Owner deleted successfully'), 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast(t('Delete failed'), 'error');
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    try {
      if (modalState.type === 'create') {
        // Create owner: name, email, phone, password, password_confirmation, modules
        const payload = new FormData();
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);
        payload.append('password', formData.get('password') as string);
        payload.append('password_confirmation', formData.get('password_confirmation') as string);
        
        // Handle modules - send selected module IDs
        const selectedModules = formData.getAll('modules') as string[];
        selectedModules.forEach((moduleId, index) => {
          payload.append(`modules[${index}]`, moduleId);
        });

        await postData('owner/owners', payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      } else if (modalState.type === 'edit' && modalState.item) {
        // Edit owner: _method=PUT, name, email, password (optional), modules
        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);
        
        const password = formData.get('password') as string;
        if (password) {
          payload.append('password', password);
        }

        // Handle modules - send selected module IDs
        const selectedModules = formData.getAll('modules') as string[];
        selectedModules.forEach((moduleId, index) => {
          payload.append(`modules[${index}]`, moduleId);
        });

        await postData(`owner/owners/${modalState.item.id}`, payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      }

      fetchOwners(token);
      setModalState({ type: null });
      showToast(t('Owner saved successfully'), 'success');
    } catch (error) {
      console.error('Save failed', error);
      showToast('Save failed', 'error');
    }
  };

  return (
    <div className="p-6">
      {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}

      {loading ? (
        <p>{t('Loading')}</p>
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
                  <ImageWithFallback
  src={item?.avatar || ''}
  alt="User Avatar"
  width={80}
  height={80}
  className="rounded-xl object-cover"
/>
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
              render: (item) => item.email || '-',
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (item) => item.phone || '-',
            },
           
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
        />
      )}

      <ModalForm
              className='max-w-1/2'
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? t('Create Owner')
            : modalState.type === 'edit'
            ? t('Edit Owner')
            : t('View Owner')
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' ? (
          <div className="space-y-3">
            {modalState.item?.avatar && (
              <div className="flex justify-center">
               <ImageWithFallback
  src={modalState.item.avatar}
  alt="User Avatar"
  width={120}
  height={120}
  className="rounded-xl object-cover"
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
            </p> */}
            {/* <p>
              <strong>Role:</strong> {modalState.item?.role}
            </p> */}
            <div>
              <strong>{t('Modules')}:</strong>
              {modalState.item?.modules && modalState.item.modules.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {modalState.item.modules.map((modulePath, index) => {
                    const moduleItem = modules.find(m => m.path === modulePath);
                    return (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {moduleItem?.name || modulePath}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-gray-500 ml-2">{t('No modules assigned')}</span>
              )}
            </div>
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
            <input
              type="phone"
              name="phone"
              placeholder={t('phone')}
              defaultValue={modalState.item?.phone || ''}
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
              <input
                type="password"
                name="password"
                placeholder={t('New Password (leave blank to keep current)')}
                className="w-full border p-2 rounded"
              />
            )}
            
            
            {/* Modules Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('Modules Access')}
              </label>
              {modulesLoading ? (
                <p className="text-sm text-gray-500">{t('Loading modules')}</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded p-3 space-y-2">
                  {modules.map((module) => {
                    // Check if this module is currently assigned to the owner
                    const isChecked = modalState.item?.modules?.includes(module.path) || false;
                    
                    return (
                      <label key={module.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="modules"
                          value={module.id.toString()}
                          defaultChecked={isChecked}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{t(module.name)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

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