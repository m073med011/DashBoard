import React from 'react';
import { useTranslations } from 'next-intl';

export const TabButton = ({ label, isActive, onClick }: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-6 py-3 rounded-t-lg font-medium transition-colors duration-200 ${
      isActive
        ? "bg-blue-600 text-white border-b-2 border-blue-600"
        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
    }`}
  >
    {label}
  </button>
);

export const ReadOnlyField = ({ label, value }: { 
  label: string; 
  value: string | number 
}) => (
  <div>
    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">
      {label}
    </label>
    <div className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[40px] flex items-center">
      {value || "No data"}
    </div>
  </div>
);

export const LoadingSpinner = () => {
  const t = useTranslations('Amenities');
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{t('Loading amenities')}</p>
      </div>
    </div>
  );
};

export const NotFoundMessage = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="text-4xl mb-4">🏠</div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Property Not Found
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        The requested property could not be loaded.
      </p>
    </div>
  </div>
);