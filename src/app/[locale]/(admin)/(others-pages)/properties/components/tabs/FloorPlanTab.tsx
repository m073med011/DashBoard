import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { useTranslations } from 'next-intl';

interface FloorPlanTabProps {
  property: PropertyData;
  onUpdate?: () => void; // Callback to refresh property data
}

interface FloorPlanFormData {
  property_listing_id: string;
  floor_plans: FileList | null;
}

export const FloorPlanTab: React.FC<FloorPlanTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations("floorplan");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FloorPlanFormData>({
    property_listing_id: propertyId || '',
    floor_plans: null
  });

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
      floor_plans: null
    });
  };

  const handleAddClick = () => {
    resetFormData();
    setShowAddModal(true);
  };

  const handleDeleteClick = (planId: string) => {
    setSelectedPlanIds([planId]);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedPlanIds.length === 0) return;
    setShowDeleteModal(true);
  };

  const handlePlanSelect = (planId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPlanIds(prev => [...prev, planId]);
    } else {
      setSelectedPlanIds(prev => prev.filter(id => id !== planId));
    }
  };

  const handleSelectAll = () => {
    if (selectedPlanIds.length === property.property_floor_plans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(property.property_floor_plans.map(plan => plan.id.toString()));
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedPlanIds.length === 0) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query string for multiple IDs
      const queryParams = selectedPlanIds
        .map((id, index) => `ids[${index}]=${id}`)
        .join('&');
      
      await deleteData(`owner/property/floor-plan?${queryParams}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedPlanIds([]);
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      // console.error(t("Failed to delete floor plans"), error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.floor_plans || formData.floor_plans.length === 0) {
      alert('Please select at least one floor plan');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      
      // Append multiple floor plans
      Array.from(formData.floor_plans).forEach((file, index) => {
        formDataToSend.append(`floor_plans[${index}]`, file);
      });
      
      await postData('owner/property/floor-plan', formDataToSend, new AxiosHeaders({
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
      console.error('Failed to add floor plans:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      floor_plans: e.target.files
    }));
  };

  const renderFloorPlanForm = () => (
    <form onSubmit={handleAddSubmit}>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("Select Floor Plans")}
        </label>
        <input
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {formData.floor_plans && formData.floor_plans.length > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {formData.floor_plans.length} {t("floor plan(s) selected")}
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
          {loading ? t("Uploading...") : t("Upload Floor Plans")}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t("Floor Plans")}</h3>
        <div className="flex items-center gap-2">
          {property.property_floor_plans.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 text-sm"
              >
                {selectedPlanIds.length === property.property_floor_plans.length ? t('Deselect All') : t('Select All')}
              </button>
              {selectedPlanIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  {/* {t("Delete Selected")} ({selectedPlanIds.length}) */}
                </button>
              )}
            </>
          )}
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            {t("Add New Floor Plans")}
          </button>
        </div>
      </div>

      {property.property_floor_plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {property.property_floor_plans.map((plan, index) => (
            <div key={plan.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500 relative">
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedPlanIds.includes(plan.id.toString())}
                  onChange={(e) => handlePlanSelect(plan.id.toString(), e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              
              {/* Delete Button */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => handleDeleteClick(plan.id.toString())}
                  className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200 shadow-md"
                  title={t("Delete floor plan")}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">
                Floor Plan {index + 1}
              </label>
              <div className="aspect-[4/5] relative rounded overflow-hidden mb-4">
                <Image
                  src={plan.image}
                  alt={`Floor plan ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <a
                href={plan.image}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
              >
                {t("Download Floor Plan")}
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t("No floor plans available for this property")}
        </div>
      )}

      {/* Add Floor Plans Modal */}
      <ModalForm
        open={showAddModal}
        title={t("Add New Floor Plans")} 
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderFloorPlanForm()}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        open={showDeleteModal}
        title={t("confirm_delete")}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedPlanIds([]);
        }}
      >
        <p className="text-gray-600 mb-6">
          {t("Are you sure you want to delete")} {selectedPlanIds.length === 1 ? t("this floor plan") : `these ${selectedPlanIds.length} floor plans`}? {t("This action cannot be undone")}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedPlanIds([]);
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
            {loading ? 'Deleting...' : `Delete ${selectedPlanIds.length === 1 ? 'Floor Plan' : 'Floor Plans'}`}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};