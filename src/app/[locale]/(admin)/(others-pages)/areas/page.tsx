'use client';

import { useEffect, useState, useRef } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import ImageUploadField from '@/components/ImageUploadField';
import Toast from '@/components/Toast';
import { useLocale, useTranslations } from 'next-intl';
import { AREA_IMAGE_SIZE } from '@/libs/constants/imageSizes';
import { Upload, Trash2, ImageIcon } from 'lucide-react';

// Add area image size constants


type Area = {
  id: number;
  name: string;
  image: string;
  developer: string;
  google_maps: string;
  description?:{
    en: {
      name: string;
      developer: string;
    };
    ar: {
      name: string;
      developer: string;
    };
  }
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

type ImportLocation = {
  project_en: string;
  project_ar: string;
  developer_en: string;
  developer_ar: string;
  name_en: string;
  name_ar: string;
  google_maps: string;
};

export default function AreasPage() {
  const locale = useLocale();
  const t = useTranslations("areas");
  const [items, setItems] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [currentArea, setCurrentArea] = useState<Area | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [selectedAreas, setSelectedAreas] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const [modalState, setModalState] = useState<{
    type: 'create' | 'edit' | 'view' | 'quick' | null;
    item?: Area;
  }>({ type: null });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      showToast("Token not found in localStorage", 'error');
    }
  }, [t]);

  useEffect(() => {
    if (token) fetchAreas(token);
  }, [token,locale]);

  // Clear selections when items change
  useEffect(() => {
    setSelectedAreas(new Set());
  }, [items.length]);

  // Reset image preview when modal closes or opens
  useEffect(() => {
    if (!modalState.type) {
      setImagePreview(null);
      setSelectedImageFile(null);
      setCurrentArea(null);
    } else if (modalState.type === 'create') {
      setImagePreview(null);
      setSelectedImageFile(null);
      setCurrentArea(null);
    } else if (modalState.item && (modalState.type === 'edit' || modalState.type === 'view')) {
      fetchSingleArea(modalState.item.id);
    }
  }, [modalState]);

  const fetchAreas = async (authToken: string) => {
    try {
      const res = await getData('owner/areas', {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch areas', error);
      showToast("Failed to fetch areas", 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleArea = async (areaId: number) => {
    if (!token) return;
    
    setModalLoading(true);
    try {
      const res = await getData(`owner/areas/${areaId}`, {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${token}`,
      }));
      
      if (res.status === 200 && res.data) {
        setCurrentArea(res.data);
        // Set image preview for edit mode
        if (modalState.type === 'edit' && res.data.image) {
          setImagePreview(res.data.image);
        }
        // Reset selected file when loading existing area
        setSelectedImageFile(null);
      }
    } catch (error) {
      console.error('Failed to fetch single area', error);
      showToast(t("Failed to fetch area details"), 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (item: Area) => {
    if (!token) return;
    setIsDeleting(true);
    setDeleteProgress({ current: 0, total: 1 });
    try {
      await deleteData(`owner/areas/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      setDeleteProgress({ current: 1, total: 1 });
      fetchAreas(token);
      showToast(t("Area deleted successfully"), 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast(t("Delete failed"), 'error');
    } finally {
      setIsDeleting(false);
      setDeleteProgress({ current: 0, total: 0 });
    }
  };

  const handleSelectAll = () => {
    if (selectedAreas.size === items.length) {
      setSelectedAreas(new Set());
    } else {
      setSelectedAreas(new Set(items.map(item => item.id)));
    }
  };

  const handleToggleSelect = (areaId: number) => {
    const newSelected = new Set(selectedAreas);
    if (newSelected.has(areaId)) {
      newSelected.delete(areaId);
    } else {
      newSelected.add(areaId);
    }
    setSelectedAreas(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (!token || selectedAreas.size === 0) {
      showToast(t("No areas selected"), 'info');
      return;
    }

    if (!confirm(t("Are you sure you want to delete selected areas?"))) {
      return;
    }

    setIsDeleting(true);
    const selectedArray = Array.from(selectedAreas);
    setDeleteProgress({ current: 0, total: selectedArray.length });
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedArray.length; i++) {
      const areaId = selectedArray[i];
      try {
        await deleteData(`owner/areas/${areaId}`, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        successCount++;
      } catch (error) {
        console.error(`Failed to delete area ${areaId}`, error);
        errorCount++;
      }
      setDeleteProgress({ current: i + 1, total: selectedArray.length });
    }

    setSelectedAreas(new Set());
    fetchAreas(token);
    setIsDeleting(false);
    setDeleteProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      showToast(`${successCount} ${t("area(s)")} ${t("Area deleted successfully")}${errorCount > 0 ? `. ${errorCount} ${t("error(s)")}.` : ''}`, 'success');
    } else {
      showToast(t("Delete failed"), 'error');
    }
  };



  const handleImageChange = (file: File | null) => {
    setSelectedImageFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // If no file selected, reset to current image (for edit mode) or null (for create mode)
      if (modalState.type === 'edit' && currentArea?.image) {
        setImagePreview(currentArea.image);
      } else {
        setImagePreview(null);
      }
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!token) return;

    const payload = new FormData();
    payload.append('name[en]', formData.get('name[en]') as string);
    payload.append('name[ar]', formData.get('name[ar]') as string);
    payload.append('developer[en]', formData.get('developer[en]') as string);
    payload.append('developer[ar]', formData.get('developer[ar]') as string);
    payload.append('google_maps', formData.get('google_maps') as string);

    // Use the selected image file from ImageUploadField
    if (selectedImageFile) {
      payload.append('image', selectedImageFile);
    }

    try {
      if (modalState.type === 'create') {
        await postData('owner/areas', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Area created successfully", 'success');
      } else if (modalState.type === 'edit' && currentArea) {
        await postData(`owner/areas/${currentArea.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast("Area updated successfully", 'success');
      }

      fetchAreas(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
      showToast("Save failed", 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      showToast("Token not found", 'error');
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: 0 });
    try {
      const text = await file.text();
      const locations: ImportLocation[] = JSON.parse(text);

      if (!Array.isArray(locations)) {
        showToast("Invalid JSON format. Expected an array.", 'error');
        setImporting(false);
        return;
      }

      setImportProgress({ current: 0, total: locations.length });
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < locations.length; i++) {
        const location = locations[i];
        try {
          const payload = new FormData();
          payload.append('name[en]', location.name_en || location.project_en || '');
          payload.append('name[ar]', location.name_ar || location.project_ar || '');
          payload.append('developer[en]', location.developer_en || '');
          payload.append('developer[ar]', location.developer_ar || '');
          payload.append('google_maps', location.google_maps || '');

          await postData('owner/areas', payload, new AxiosHeaders({
            Authorization: `Bearer ${token}`,
          }));
          successCount++;
        } catch (error) {
          console.error(`Failed to import area: ${location.name_en || location.project_en}`, error);
          errorCount++;
        }
        setImportProgress({ current: i + 1, total: locations.length });
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (successCount > 0) {
        showToast(`${t("Successfully imported")} ${successCount} ${t("area(s)")}${errorCount > 0 ? `. ${errorCount} ${t("failed")}.` : ''}`, 'success');
        fetchAreas(token);
      } else {
        showToast(`${t("Failed to import areas")}. ${errorCount} ${t("error(s)")}.`, 'error');
      }
    } catch (error) {
      console.error('Import failed', error);
      showToast("Failed to parse JSON file", 'error');
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} duration={3000} />
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">{t("Loading")}</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4 gap-3">
            <div className="flex items-center gap-3">
              {selectedAreas.size > 0 && (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedAreas.size} {t("areas selected")}
                  </span>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md shadow transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("Delete Selected")}
                  </button>
                </>
              )}
             
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleImportClick}
                disabled={importing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md shadow transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                {importing ? t("Importing...") : t("Import Areas")}
              </button>
            </div>
          </div>
          <Table<Area>
          data={items}
          columns={[
            {
              key: 'id' as keyof Area,
              label: '',
              headerRender: () => (
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedAreas.size === items.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              ),
              render: (item: Area) => (
                <input
                  type="checkbox"
                  checked={selectedAreas.has(item.id)}
                  onChange={() => handleToggleSelect(item.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              ),
            },
            {
              key: 'name',
              label: t('Name'),
              render: (item) => `${item?.name}`,
            },
            {
              key: 'image',
              label: t('Image'),
              render: (item: Area) => (
                item.image && item.image.trim() !== '' && item.image !== "https://proplix.shop/" ? (
                  <Image
                    src={item.image}
                    alt={"area"}
                    width={100}
                    height={100}
                    className=" max-h-25 rounded object-fill w-full items-center"
                  />
                ) : (
                  <div className="flex items-center justify-center w-24 h-24 mx-auto bg-gray-100 rounded border border-gray-300">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )
              ),
            },
        
            {
              key: 'developer',
              label: t('Developer'),
              render: (item) => item?.developer || '-',
            },
            {
              key: 'google_maps',
              label: t('Google Maps'),
              render: (item) => item?.google_maps || '-',
            },
          ]}
          onCreate={() => setModalState({ type: 'create' })}
          onEdit={(item) => setModalState({ type: 'edit', item })}
          onDelete={handleDelete}
          onView={(item) => setModalState({ type: 'view', item })}
        />
        </div>
      )}

      <ModalForm
        className='max-w-[500px] '
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? t('Create Area')
            : modalState.type === 'edit'
            ? t('Edit Area')
            : t('View Area')
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-lg">{t("Loading area details")}</p>
          </div>
        ) : modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="w-full">
            <div className="">
              <table className="w-full">
                <thead className="bg-gray-50">
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Name (EN)')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentArea?.description?.en?.name || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Name (AR)')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentArea?.description?.ar?.name || '-'}
                    </td>
                  </tr>
           
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Developer (EN)')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentArea?.developer || '-'}
                    </td>
                  </tr>
               
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {t('Google Maps')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currentArea?.google_maps || '-'}
                    </td>
                  </tr>
                  {currentArea?.image && (
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {t('Image')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="overflow-hidden rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
                          <Image
                            src={currentArea.image}
                            alt={t("Area")}
                            width={400}
                            height={400}
                            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="name_en" className="block text-sm font-medium text-gray-700">
                {t('Area Name (English)')}
              </label>
              <input
                id="name_en"
                type="text"
                name="name[en]"
                placeholder={t('Enter area name in English')}
                defaultValue={currentArea?.description?.en?.name ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="name_ar" className="block text-sm font-medium text-gray-700">
                {t('Area Name (Arabic)')}
              </label>
              <input
                id="name_ar"
                type="text"
                name="name[ar]"
                placeholder={t('Enter area name in Arabic')}
                defaultValue={currentArea?.description?.ar?.name ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="developer_en" className="block text-sm font-medium text-gray-700">
                {t('Developer (English)')}
              </label>
              <input
                id="developer_en"
                type="text"
                name="developer[en]"
                placeholder={t('Enter developer name in English')}
                defaultValue={currentArea?.description?.en?.developer ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="developer_ar" className="block text-sm font-medium text-gray-700">
                {t('Developer (Arabic)')}
              </label>
              <input
                id="developer_ar"
                type="text"
                name="developer[ar]"
                placeholder={t('Enter developer name in Arabic')}
                defaultValue={currentArea?.description?.ar?.developer ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="google_maps" className="block text-sm font-medium text-gray-700">
                {t('Google Maps')}
              </label>
              <input
                id="google_maps"
                type="text"
                name="google_maps"
                placeholder={t('Enter Google Maps value')}
                defaultValue={currentArea?.google_maps ?? ''}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Replace the old file input with ImageUploadField */}
            <ImageUploadField
              label={t('Area Image')}
              id="area-image"
              name="image"
              value={currentArea?.image || null}
              preview={imagePreview}
              onChange={handleImageChange}
              accept="image/*"
              allowedSizes={`${AREA_IMAGE_SIZE.width}x${AREA_IMAGE_SIZE.height}`}
            />
            
            <div className="flex justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setModalState({ type: null })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                {t('Cancel')}
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={modalLoading}
              >
                {modalState.type === 'create' ? t('Create') : t('Update')}
              </button>
            </div>
          </form>
        )}
      </ModalForm>

      {/* Import Loading Modal */}
      {importing && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("Importing areas")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {importProgress.total > 0
                  ? `${importProgress.current} / ${importProgress.total} ${t("area(s)")}`
                  : t("Loading...")}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Loading Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/80 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t("Deleting areas")}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {deleteProgress.total > 0
                  ? `${deleteProgress.current} / ${deleteProgress.total} ${t("area(s)")}`
                  : t("Loading...")}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${deleteProgress.total > 0 ? (deleteProgress.current / deleteProgress.total) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}