import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Edit } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { PropertyLocation } from '@/types/PropertyTypes';

interface LocationsTabProps {
  property: PropertyData;
  onUpdate?: () => void; // Callback to refresh property data
}

interface LocationFormData {
  property_listing_id: string;
  name: string;
  latitude: string;
  longitude: string;
}

export const LocationsTab: React.FC<LocationsTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>({
    property_listing_id: propertyId || '',
    name: '',
    latitude: '',
    longitude: ''
  });

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
      name: '',
      latitude: '',
      longitude: ''
    });
  };

  const handleAddClick = () => {
    resetFormData();
    setShowAddModal(true);
  };

  const handleEditClick = (location: PropertyLocation) => {
    setFormData({
      property_listing_id: propertyId || '',
      name: location.name,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString()
    });
    setSelectedLocationId(location.id.toString());
    setShowEditModal(true);
  };

  const handleDeleteClick = (locationId: string) => {
    setSelectedLocationId(locationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocationId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await deleteData(`owner/locations/${selectedLocationId}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedLocationId(null);
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
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
      formDataToSend.append('name', formData.name);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      
      await postData('owner/locations', formDataToSend, new AxiosHeaders({
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
      console.error('Failed to add location:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocationId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Create FormData object
      const formDataToSend = new FormData();
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('_method', 'PUT'); // Laravel method spoofing for FormData
      
      await postData(`owner/locations/${selectedLocationId}`, formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowEditModal(false);
      setSelectedLocationId(null);
      resetFormData();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update location:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LocationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCoordinate = (value: string, type: 'latitude' | 'longitude') => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    
    if (type === 'latitude') {
      return num >= -90 && num <= 90;
    } else {
      return num >= -180 && num <= 180;
    }
  };

  const renderLocationForm = (isEdit: boolean = false) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleAddSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Main Entrance, Parking Area"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Latitude
        </label>
        <input
          type="number"
          step="any"
          value={formData.latitude}
          onChange={(e) => handleInputChange('latitude', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 31.2001"
          min="-90"
          max="90"
          required
        />
        {formData.latitude && !validateCoordinate(formData.latitude, 'latitude') && (
          <p className="text-red-500 text-sm mt-1">Latitude must be between -90 and 90</p>
        )}
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Longitude
        </label>
        <input
          type="number"
          step="any"
          value={formData.longitude}
          onChange={(e) => handleInputChange('longitude', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 29.9187"
          min="-180"
          max="180"
          required
        />
        {formData.longitude && !validateCoordinate(formData.longitude, 'longitude') && (
          <p className="text-red-500 text-sm mt-1">Longitude must be between -180 and 180</p>
        )}
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
          // disabled={loading || (formData.latitude && !validateCoordinate(formData.latitude, 'latitude')) || (formData.longitude && !validateCoordinate(formData.longitude, 'longitude'))}
        >
          {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Location' : 'Add Location')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Property Locations</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Location
        </button>
      </div>

      {property.property_locations.length > 0 ? (
        <div className="space-y-4 mb-6">
          {property.property_locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <MapPin size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {location.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Lat: {location.latitude}, Lng: {location.longitude}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(location)}
                    className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition duration-200"
                    title="Edit location"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(location.id.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200"
                    title="Delete location"
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
          No specific locations marked for this property
        </div>
      )}

      {/* Add Location Modal */}
      <ModalForm
        open={showAddModal}
        title="Add New Location"
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderLocationForm(false)}
      </ModalForm>

      {/* Edit Location Modal */}
      <ModalForm
        open={showEditModal}
        title="Edit Location"
        onClose={() => {
          setShowEditModal(false);
          setSelectedLocationId(null);
          resetFormData();
        }}
      >
        {renderLocationForm(true)}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        open={showDeleteModal}
        title="Confirm Delete"
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLocationId(null);
        }}
      >
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this location? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedLocationId(null);
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