import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { useTranslations } from 'next-intl';
// import { PropertyFeature } from '@/types/PropertyTypes';

interface PropertyFeature {
  id: number;
  type: string;
  key: string;
  value: string;
  description: {
    en: {
      title: string | null;
      description: string | null;
      keywords: string | null;
      slug: string | null;
      meta_title: string | null;
      meta_description: string | null;
      meta_keywords: string | null;
    };
    ar: {
      title: string | null;
      description: string | null;
      keywords: string | null;
      slug: string | null;
      meta_title: string | null;
      meta_description: string | null;
      meta_keywords: string | null;
    };
  };
}

interface FeaturesTabProps {
  property: PropertyData;
  onUpdate?: () => void; // Callback to refresh property data
}

interface FeatureFormData {
  property_listing_id: string;
  
  type: string;
  'key[en]': string;
  'key[ar]': string;
  'value[en]': string;
  'value[ar]': string;
}

const FEATURE_TYPES = [
  { value: 'property_feature', label: 'Property Feature' },
  { value: 'utility_detail', label: 'Utility Detail' },
  { value: 'outdoor_feature', label: 'Outdoor Feature' },
  { value: 'indoor_feature', label: 'Indoor Feature' }
];

export const FeaturesTab: React.FC<FeaturesTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const  t  = useTranslations("features");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FeatureFormData>({
    property_listing_id: propertyId || '',
    type: 'property_feature',
    'key[en]': '',
    'key[ar]': '',
    'value[en]': '',
    'value[ar]': ''
  });

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
     
      type: 'property_feature',
      'key[en]': '',
      'key[ar]': '',
      'value[en]': '',
      'value[ar]': ''
    });
  };

  const handleAddClick = () => {
    resetFormData();
    setShowAddModal(true);
  };

  const handleEditClick = (feature: PropertyFeature) => {
    setFormData({
      property_listing_id: propertyId || '',
      
      type: feature?.type || 'property_feature',
      'key[en]': feature?.key || '',
      'key[ar]': feature?.key || '', // Assuming key is the same for both languages based on JSON structure
      'value[en]': feature?.value || '',
      'value[ar]': feature.value || '' // Assuming value is the same for both languages based on JSON structure
    });
    setSelectedFeatureId(feature.id.toString());
    setShowEditModal(true);
  };

  const handleDeleteClick = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFeatureId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await deleteData(`owner/features/${selectedFeatureId}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedFeatureId(null);
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete feature:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      
      await postData('owner/features', formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowAddModal(false);
      resetFormData();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add feature:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFeatureId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });
      formDataToSend.append('_method', 'PUT'); // Laravel method spoofing for FormData
      
      await postData(`owner/features/${selectedFeatureId}`, formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowEditModal(false);
      setSelectedFeatureId(null);
      resetFormData();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update feature:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FeatureFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderFeatureForm = (isEdit: boolean = false) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleAddSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Feature Type")}
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {FEATURE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {t(type.label)}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Key (English)")}
          </label>
          <input
            type="text"
            value={formData['key[en]']}
            onChange={(e) => handleInputChange('key[en]', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Key (Arabic)")}
          </label>
          <input
            type="text"
            value={formData['key[ar]']}
            onChange={(e) => handleInputChange('key[ar]', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Value (English)")}
          </label>
          <input
            type="text"
            value={formData['value[en]']}
            onChange={(e) => handleInputChange('value[en]', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Value (Arabic)")}
          </label>
          <input
            type="text"
            value={formData['value[ar]']}
            onChange={(e) => handleInputChange('value[ar]', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
            } else {
              setShowAddModal(false);
            }
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
          {loading ? (isEdit ? t('Updating') : t('Adding')) : (isEdit ? t('Update Feature') : t('Add Feature'))}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t("Property Features")}</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          {t("Add New Feature")}
        </button>
      </div>

      {property?.features?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {property?.features?.map((feature) => (
            <div key={feature.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      {feature?.key}:
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">
                      {feature?.value}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(feature as unknown as PropertyFeature)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition duration-200"
                    title="Edit feature"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(feature?.id?.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200"
                    title="Delete feature"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t("No features listed for this property")}
        </div>
      )}

      {/* Add Feature Modal */}
      <ModalForm
        className='max-w-1/2'
        open={showAddModal}
        title={t("Add New Feature")}
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderFeatureForm(false)}
      </ModalForm>

      {/* Edit Feature Modal */}
      <ModalForm
        className='max-w-1/2'
        open={showEditModal}
        title={t("Edit Feature")}
        onClose={() => {
          setShowEditModal(false);
          setSelectedFeatureId(null);
          resetFormData();
        }}
      >
        {renderFeatureForm(true)}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        open={showDeleteModal}
        title={t("Confirm Delete")}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedFeatureId(null);
        }}
      >
        <p className="text-gray-600 mb-6">
          {t("Are you sure you want to delete this feature? This action cannot be undone")}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedFeatureId(null);
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
            disabled={loading}
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t('Deleting') : t('Delete')}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};