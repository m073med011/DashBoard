// components/Toast.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  translationValues?: Record<string, number>;
  translate?: boolean; // New optional prop with default true
};

export default function Toast({ 
  message, 
  type = 'info', 
  duration = 6000,
  translationValues = {},
  translate = true // Default to true
}: ToastProps) {
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

  // Determine the display message based on translate prop
  const displayMessage = translate 
    ? (Object.keys(translationValues).length > 0 
        ? t(message, translationValues)
        : t(message))
    : message; // Use raw message if translate is false

  return (
    <div className={`fixed top-6 right-6 z-[99999] px-4 py-2 text-white rounded shadow-lg ${bgColor} transition-all duration-300`}>
      {displayMessage}
    </div>
  );
}