// components/Toast.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
};

export default function Toast({ message, type = 'info', duration = 3000 }: ToastProps) {
    const t = useTranslations("toast");
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!show) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 text-white rounded shadow ${bgColor}`}>
      {t(message)}
    </div>
  );
}
