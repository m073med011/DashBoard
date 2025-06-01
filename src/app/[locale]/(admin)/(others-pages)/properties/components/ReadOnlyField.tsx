import React from 'react';

interface ReadOnlyFieldProps {
  label: string;
  value: string;
}

const ReadOnlyField: React.FC<ReadOnlyFieldProps> = ({ label, value }) => (
  <div>
    <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
    <div className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[40px] flex items-center">
      {value || "No data"}
    </div>
  </div>
);

export default ReadOnlyField;