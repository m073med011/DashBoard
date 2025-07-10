import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { useTranslations } from 'next-intl';

interface ImagesTabProps {
  property: PropertyData;
  onUpdate?: () => void; 
  refetch?: () => void; 
}

interface ImageFormData {
  property_listing_id: string;
  images: FileList | null;
}

export const ImagesTab: React.FC<ImagesTabProps> = ({ property, onUpdate, refetch }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations("Images");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ImageFormData>({
    property_listing_id: propertyId || '',
    images: null
  });

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
      images: null
    });
  };

  const handleAddClick = () => {
    resetFormData();
    setShowAddModal(true);
  };

  const handleDeleteClick = (imageId: string) => {
    setSelectedImageIds([imageId]);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedImageIds.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleImageSelect = (imageId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedImageIds(prev => [...prev, imageId]);
    } else {
      setSelectedImageIds(prev => prev.filter(id => id !== imageId));
    }
  };

  const handleSelectAll = () => {
    if (selectedImageIds.length === property.property_listing_images.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(property.property_listing_images.map(img => img.id.toString()));
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedImageIds.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query string for multiple IDs
      const queryParams = selectedImageIds
        .map((id, index) => `ids[${index}]=${id}`)
        .join('&');
      
      await deleteData(`owner/property/images?${queryParams}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedImageIds([]);
      
      // Use refetch if available, otherwise fall back to onUpdate
      if (refetch) {
        refetch();
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete images:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.images || formData.images.length === 0) {
      alert('Please select at least one image');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      
      // Append multiple images
      Array.from(formData.images).forEach((file, index) => {
        formDataToSend.append(`images[${index}]`, file);
      });
      
      await postData('owner/property/images', formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowAddModal(false);
      resetFormData();
      
      // Use refetch if available, otherwise fall back to onUpdate
      if (refetch) {
        refetch();
      } else if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add images:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      images: e.target.files
    }));
  };

  const renderImageForm = () => (
    <form onSubmit={handleAddSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("Select Images")}
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {formData.images && formData.images.length > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {formData.images.length} {t("image(s) selected")}
          </p>
        )}
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => {
            setShowAddModal(false);
            resetFormData();
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
          disabled={loading}
        >
          {t("Cancel")}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? t("Uploading...") : t("Upload Images")}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t("Property Images")}</h3>
        <div className="flex items-center gap-2">
          {property?.property_listing_images?.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 text-sm"
              >
                {selectedImageIds.length === property?.property_listing_images?.length ? t('Deselect All') : t('Select All')}
              </button>
              {selectedImageIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  {t("Delete Selected")} ({selectedImageIds?.length})
                </button>
              )}
            </>
          )}
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            {t("Add New Images")}
          </button>
        </div>
      </div>

      {property?.property_listing_images?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {property?.property_listing_images?.map((image, index) => (
            <div key={image.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500 relative">
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedImageIds.includes(image?.id?.toString())}
                  onChange={(e) => handleImageSelect(image?.id?.toString(), e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              {/* Delete Button */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => handleDeleteClick(image?.id?.toString())}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200 shadow-md"
                  title="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="aspect-video relative rounded overflow-hidden mb-2">
                <Image
                  src={image?.image}
                  alt={`Property image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <a
                href={image?.image}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
              >
                View Full Size
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No images available for this property
        </div>
      )}

      {/* Add Images Modal */}
      <ModalForm
        className='max-w-1/3'
        open={showAddModal}
        title={t("Add New Images")}
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderImageForm()}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        className='max-w-1/3'
        open={showDeleteModal}
        title="Confirm Delete"
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedImageIds([]);
        }}
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {selectedImageIds?.length === 1 ? 'this image' : `these ${selectedImageIds?.length} images`}? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedImageIds([]);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Deleting...' : `Delete ${selectedImageIds?.length === 1 ? 'Image' : 'Images'}`}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};