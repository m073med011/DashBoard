// components/ConfirmDeleteModal.tsx
import { X, Trash2 } from 'lucide-react';
import React from 'react';
import { useTranslations } from 'next-intl';
type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
};

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, message }: Props) {
  const t = useTranslations('Tables');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg max-w-sm w-full p-9 relative">
        {/* Close icon */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        {/* Icon and Title */}
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="text-red-600" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('Confirm Delete')}</h2>
        </div>

        {/* Message */}
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            {t('Cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
          >
            {t('Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
