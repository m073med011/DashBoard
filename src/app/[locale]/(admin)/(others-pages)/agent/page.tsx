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
import { AxiosError } from 'axios';
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
  translate?: boolean;
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
    translate: true,
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isNameValid, setIsNameValid] = useState(false);
  
  // Password validation states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | null;
    item?: OwnerItem;
  }>({ type: null });

  // Phone validation function
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^01\d{9}$/; // Must start with 01 and be exactly 11 digits
    return phoneRegex.test(phone);
  };

  // Name validation function
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s]+$/; // Only letters and spaces allowed
    return name.length <= 30 && nameRegex.test(name) && name.trim().length > 0;
  };

  // Password validation function
  const validatePasswords = (pass: string, confirmPass: string): boolean => {
    if (!pass && !confirmPass) return true; // Both empty is valid for edit
    if (modalState.type === 'create' && (!pass || !confirmPass)) return false; // Both required for create
    return pass === confirmPass;
  };

  // Handle phone input change for create form
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    const numbersOnly = value.replace(/\D/g, '');
    // Limit to 11 digits
    const limitedPhone = numbersOnly.slice(0, 11);
    
    setPhoneNumber(limitedPhone);
    setIsPhoneValid(validatePhone(limitedPhone));
  };

  // Handle name input change for create form
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameValue(value);
    setIsNameValid(validateName(value));
  };

  // Handle name input change for edit form
  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setIsNameValid(validateName(value));
  };

  // Handle phone input change for edit form
  const handleEditPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    const numbersOnly = value.replace(/\D/g, '');
    // Limit to 11 digits
    const limitedPhone = numbersOnly.slice(0, 11);
    
    // Update the input value directly
    e.target.value = limitedPhone;
    
    // Validate the phone number
    const isValid = validatePhone(limitedPhone);
    
    // Update validation state for edit form
    setIsPhoneValid(isValid);
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordTouched(true);
    setIsPasswordValid(validatePasswords(value, confirmPassword));
  };

  // Handle confirm password input change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordTouched(true);
    setIsPasswordValid(validatePasswords(password, value));
  };

  // Reset all validation states when modal closes
  const closeModal = () => {
    setModalState({ type: null });
    setPhoneNumber('');
    setIsPhoneValid(false);
    setNameValue('');
    setIsNameValid(false);
    setPassword('');
    setConfirmPassword('');
    setIsPasswordValid(true);
  };

  // Initialize validation states when opening edit modal
  const openEditModal = (item: OwnerItem) => {
    setModalState({ type: 'edit', item });
    // Set initial validation state based on current phone
    setIsPhoneValid(validatePhone(item.phone || ''));
    // Set initial validation state based on current name
    setIsNameValid(validateName(item.name || ''));
    // Reset password fields
    setPassword('');
    setConfirmPassword('');
    setIsPasswordValid(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordTouched(false);
    setConfirmPasswordTouched(false);
  };

  // Fixed showToast function
  const showToast = (
    message: string, 
    type: 'success' | 'error' | 'info' = 'info',
    translate: boolean = true
  ) => {
    // First, hide any existing toast
    setToast(prev => ({ ...prev, show: false }));
    
    // Then show the new toast after a brief delay to ensure state change
    setTimeout(() => {
      setToast({ message, type, show: true, translate });
    }, 50);
    
    // Hide the toast after 3 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3050); // 3000ms + 50ms delay
  };

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
          role: item.role,
        }));

        setItems(normalized);
      } catch (error: unknown) {
        if (error instanceof AxiosError) {
          showToast(error.response?.data.message || 'An error occurred', 'error', false);
        } else {
          showToast('An unknown error occurred', 'error', true);
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
      showToast('Token not found in localStorage', 'error', false);
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
      showToast('Delete failed', 'error', false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    try {
      if (modalState.type === 'create') {
        const payload = new FormData();
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);
        payload.append('password', formData.get('password') as string);
        payload.append('password_confirmation', formData.get('password_confirmation') as string);

        await postData('owner/agents', payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      } else if (modalState.type === 'edit' && modalState.item) {
        const payload = new FormData();
        payload.append('_method', 'PUT');
        payload.append('name', formData.get('name') as string);
        payload.append('email', formData.get('email') as string);
        payload.append('phone', formData.get('phone') as string);

        const password = formData.get('password') as string;
        const passwordConfirmation = formData.get('password_confirmation') as string;
        
        if (password) {
          payload.append('password', password);
          payload.append('password_confirmation', passwordConfirmation);
        }

        await postData(`owner/agents/${modalState.item.id}`, payload, new AxiosHeaders({ Authorization: `Bearer ${token}` }));
      }

      fetchOwners(token);
      setModalState({ type: null });
      showToast('Agent saved successfully', 'success');
    } catch (error) {
      if (error instanceof AxiosError) {
        showToast(error.response?.data.message || 'An error occurred', 'error', false);
      } else {
        showToast('An unknown error occurred', 'error', true);
      }
    }
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={3000} 
          translate={toast.translate}
        />
      )}

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
                  <div className="flex items-center justify-center">
                    <ImageWithFallback 
                      src={item?.avatar || ''} 
                      alt="User Avatar" 
                      width={400} 
                      height={400} 
                      className="rounded-xl w-[100px] h-[100px] object-cover" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-[100px] h-[100px] bg-gray-200 rounded-xl flex items-center justify-center">
                      No Image
                    </div>
                  </div>
                )
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
                <div className="max-w-[clamp(10.00px,10vw,100.00px)] w-full mx-1">
                  {item.email || '-'}
                </div>
              ),
            },
            {
              key: 'phone',
              label: 'Phone',
              render: (item) => item.phone || '-',
            },
          ]}
          onCreate={() => {
            setModalState({ type: 'create' });
            setNameValue('');
            setIsNameValid(false);
            setPassword('');
            setConfirmPassword('');
            setIsPasswordValid(true);
            setShowPassword(false);
            setShowConfirmPassword(false);
            setPasswordTouched(false);
            setConfirmPasswordTouched(false);
          }}
          onEdit={(item) => openEditModal(item)}
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
        onClose={closeModal}
      >
        {modalState.type === 'view' ? (
          <div className="space-y-3">
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
            <div>
              <input
                type="text"
                name="name"
                placeholder={t('Owner Name')}
                defaultValue={modalState.item?.name || ''}
                value={modalState.type === 'create' ? nameValue : undefined}
                onChange={modalState.type === 'create' ? handleNameChange : handleEditNameChange}
                className={`w-full border p-2 rounded ${
                  (modalState.type === 'create' && nameValue && !isNameValid) || (modalState.type === 'edit' && !isNameValid) ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {((modalState.type === 'create' && nameValue && !isNameValid) || (modalState.type === 'edit' && !isNameValid)) && (
                <p className="text-red-500 text-sm mt-1">
                  {t('nameInvalidError')}
                </p>
              )}
            </div>
            <input
              type="email"
              name="email"
              placeholder={t('Email Address')}
              defaultValue={modalState.item?.email || ''}
              className="w-full border p-2 rounded border-gray-300"
              required
            />
            {modalState.type === 'create' && (
              <>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={t('Phone Number')}
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    className={`w-full border p-2 rounded ${
                      phoneNumber && !isPhoneValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {phoneNumber && !isPhoneValid && (
                    <p className="text-red-500 text-sm mt-1">
                      {t('phoneInvalidError')}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t('Password')}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full border p-2 rounded ${
                      locale === 'ar' ? 'pl-10 pr-2' : 'pr-10 pl-2'
                    } ${
                      passwordTouched && !isPasswordValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                      locale === 'ar' ? 'left-2' : 'right-2'
                    }`}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    placeholder={t('Confirm Password')}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`w-full border p-2 rounded ${
                      locale === 'ar' ? 'pl-10 pr-2' : 'pr-10 pl-2'
                    } ${
                      confirmPasswordTouched && !isPasswordValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                      locale === 'ar' ? 'left-2' : 'right-2'
                    }`}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {!isPasswordValid && (passwordTouched || confirmPasswordTouched) && (password || confirmPassword) && (
                  <p className="text-red-500 text-sm">
                    {t('passwordMismatchError')}
                  </p>
                )}
              </>
            )}
            {modalState.type === 'edit' && (
              <>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={t('Phone Number')}
                    defaultValue={modalState.item?.phone || ''}
                    onChange={handleEditPhoneChange}
                    className={`w-full border p-2 rounded ${
                      !isPhoneValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {!isPhoneValid && (
                    <p className="text-red-500 text-sm mt-1">
                      {t('phoneInvalidError')}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder={t('New Password (leave blank to keep current)')}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full border p-2 rounded ${
                      locale === 'ar' ? 'pl-10 pr-2' : 'pr-10 pl-2'
                    } ${
                      passwordTouched && !isPasswordValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                      locale === 'ar' ? 'left-2' : 'right-2'
                    }`}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="password_confirmation"
                    placeholder={t('Confirm New Password')}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={`w-full border p-2 rounded ${
                      locale === 'ar' ? 'pl-10 pr-2' : 'pr-10 pl-2'
                    } ${
                      confirmPasswordTouched && !isPasswordValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 ${
                      locale === 'ar' ? 'left-2' : 'right-2'
                    }`}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {!isPasswordValid && (passwordTouched || confirmPasswordTouched) && (password || confirmPassword) && (
                  <p className="text-red-500 text-sm">
                    {t('passwordMismatchError')}
                  </p>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={modalState.type === 'create' ? (!isPhoneValid || !isNameValid || !isPasswordValid || !nameValue) : (!isPhoneValid || !isNameValid || !isPasswordValid)}
              className={`px-4 py-2 rounded w-full text-white ${
                (modalState.type === 'create' ? (!isPhoneValid || !isNameValid || !isPasswordValid || !nameValue) : (!isPhoneValid || !isNameValid || !isPasswordValid))
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {modalState.type === 'create' ? t('Create Owner') : t('Update Owner')}
            </button>
          </form>
        )}
      </ModalForm>
    </div>
  );
}