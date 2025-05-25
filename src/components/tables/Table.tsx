'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Pencil, Trash2, Plus, ZoomIn } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal'; // adjust path as needed
import { usePathname, useRouter } from "@/i18n/routing";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
};

type TableProps<T> = {
  data: T[];
  columns: Column<T>[];
  onCreate?: () => void;
  onCreatePage?:()=>void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  onQuickView?: (item: T) => void;
};

export default function Table<T extends { id: number }>({
  data,
  columns,
  onCreate,
  onCreatePage,
  onEdit,
  onDelete,
  onView,
  onQuickView,
}: TableProps<T>) {
  const t = useTranslations('Tables');
  const router = useRouter();
  const pathname = usePathname();
  const pathSegment = pathname?.split('/').filter(Boolean).pop() ?? '';

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const handleDeleteClick = (item: T) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
           {t(pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1))}
        </h2>
        <div className='flex gap-3'>
        {onCreate && (
          <button
            onClick={onCreate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {t('Create New')}
          </button>
        )}
        {onCreatePage && (
          <button
          onClick={() => router.push(`${pathname}/add`)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            {t('Create New')}
          </button>
        )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200 transition-colors">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="px-4 py-3 border border-gray-200 dark:border-gray-700">
                  {t(col.label)}
                </th>
              ))}
              <th className="px-4 py-3 border border-gray-200 dark:border-gray-700">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-3 border border-gray-200 dark:border-gray-700">
                    {col.render ? col.render(item) : String(item[col.key])}
                  </td>
                ))}
                <td className=" p-4 border border-gray-200 dark:border-gray-700 max-w-[140px]">
                  <div className="flex gap-2 flex-wrap flex-start">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition px-3 py-1.5 rounded-md shadow-md text-sm font-semibold"
                      >
                        <Eye className="w-4 h-4" />
                        {t('View')}
                      </button>
                    )}
                    {onQuickView && (
                      <button
                      // on click route to page id 
                      onClick={() => router.push(`${pathname}/Edit/${item.id}`)}
                        className="inline-flex items-center gap-2 text-white bg-purple-600 hover:bg-purple-700 transition px-3 py-1.5 rounded-md shadow-md text-sm font-semibold"
                      >
                        <ZoomIn className="w-4 h-4" />
                        {t('edit')}
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="inline-flex items-center gap-2 text-white bg-yellow-500 hover:bg-yellow-600 transition px-3 py-1.5 rounded-md shadow-md text-sm font-semibold"
                      >
                        <Pencil className="w-4 h-4" />
                        {t('quickedit')}
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="inline-flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 transition px-3 py-1.5 rounded-md shadow-md text-sm font-semibold"
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('Delete')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {selectedItem && onDelete && (
        <ConfirmDeleteModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onConfirm={() => {
            onDelete(selectedItem);
            setSelectedItem(null);
          }}
          message={t('Are you sure you want to delete this item?')}
        />
      )}
    </div>
  );
}
