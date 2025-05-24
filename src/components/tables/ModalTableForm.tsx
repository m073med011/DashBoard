'use client';

import React from 'react';

interface ModalFormProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function ModalForm({ open, title, onClose, children }: ModalFormProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fadeIn">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition text-xl"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800 mb-5">{title}</h2>

        {/* Form Content */}
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
