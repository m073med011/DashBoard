import React, { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { PropertyAmenity } from '@/types/PropertyTypes';

interface AmenitiesTabProps {
  property: PropertyData;
  onUpdate?: () => void; // Callback to refresh property data
}

interface AmenityFormData {
  property_listing_id: string;
  'title[en]': string;
  'title[ar]': string;
}

export const AmenitiesTab: React.FC<AmenitiesTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AmenityFormData>({
    property_listing_id: propertyId || '',
    'title[en]': '',
    'title[ar]': ''
  });

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
      'title[en]': '',
      'title[ar]': ''
    });
  };

  const handleAddClick = () => {
    resetFormData();
    setShowAddModal(true);
  };

  const handleEditClick = (amenity: PropertyAmenity) => {
    setFormData({
      property_listing_id: propertyId || '',
      'title[en]': amenity.descriptions.en.title,
      'title[ar]': amenity.descriptions.ar.title
    });
    setSelectedAmenityId(amenity.id.toString());
    setShowEditModal(true);
  };

  const handleDeleteClick = (amenityId: string) => {
    setSelectedAmenityId(amenityId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAmenityId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await deleteData(`owner/amenities/${selectedAmenityId}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedAmenityId(null);
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete amenity:', error);
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
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      formDataToSend.append('title[en]', formData['title[en]']);
      formDataToSend.append('title[ar]', formData['title[ar]']);
      
      await postData('owner/amenities', formDataToSend, new AxiosHeaders({
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
      console.error('Failed to add amenity:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAmenityId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      formDataToSend.append('title[en]', formData['title[en]']);
      formDataToSend.append('title[ar]', formData['title[ar]']);
      formDataToSend.append('_method', 'PUT'); // Laravel method spoofing for FormData
      
      await postData(`owner/amenities/${selectedAmenityId}`, formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowEditModal(false);
      setSelectedAmenityId(null);
      resetFormData();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update amenity:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AmenityFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderAmenityForm = (isEdit: boolean = false) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleAddSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (English)
        </label>
        <input
          type="text"
          value={formData['title[en]']}
          onChange={(e) => handleInputChange('title[en]', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Swimming Pool, Gym"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title (Arabic)
        </label>
        <input
          type="text"
          value={formData['title[ar]']}
          onChange={(e) => handleInputChange('title[ar]', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., حمام سباحة، صالة رياضية"
          required
        />
      </div>
      <div className="flex justify-end space-x-3">
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
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Amenity' : 'Add Amenity')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Amenities</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Amenity
        </button>
      </div>

      {property.amenities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {property.amenities.map((amenity) => (
            <div key={amenity.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {amenity.descriptions.en.title}
                  </div>
                  <div className="text-sm text-green-600">Available</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(amenity)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition duration-200"
                    title="Edit amenity"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(amenity.id.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200"
                    title="Delete amenity"
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
          No amenities listed for this property
        </div>
      )}

      {/* Add Amenity Modal */}
      <ModalForm
        open={showAddModal}
        title="Add New Amenity"
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderAmenityForm(false)}
      </ModalForm>

      {/* Edit Amenity Modal */}
      <ModalForm
        open={showEditModal}
        title="Edit Amenity"
        onClose={() => {
          setShowEditModal(false);
          setSelectedAmenityId(null);
          resetFormData();
        }}
      >
        {renderAmenityForm(true)}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        open={showDeleteModal}
        title="Confirm Delete"
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAmenityId(null);
        }}
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this amenity? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedAmenityId(null);
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
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};