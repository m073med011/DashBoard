import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plus, Trash2, Edit, Map } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { PropertyLocation } from '@/types/PropertyTypes';

interface LocationsTabProps {
  property: PropertyData;
  onUpdate?: () => void;
}

interface LocationFormData {
  property_listing_id: string;
  name: string;
  latitude: string;
  longitude: string;
}

// Mapbox component
interface MapboxMapProps {
  locations: PropertyLocation[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (location: PropertyLocation) => void;
  center?: [number, number];
  zoom?: number;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ 
  locations, 
  onMapClick, 
  onMarkerClick,
  center = [30.0444, 31.2357], // Default to Cairo, Egypt
  zoom = 10
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);

  useEffect(() => {
    // Load Mapbox GL JS
    if (!window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initializeMap;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (map.current) {
      updateMarkers();
    }
  }, [locations]);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    // You need to set your Mapbox access token here
    // Get it from https://account.mapbox.com/access-tokens/
    window.mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: zoom
    });

    map.current.on('load', () => {
      updateMarkers();
      
      // Add click handler for adding new locations
      if (onMapClick) {
        map.current.on('click', (e: any) => {
          const { lat, lng } = e.lngLat;
          onMapClick(lat, lng);
        });
      }
    });
  };

  const updateMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for each location
    locations.forEach(location => {
      const marker = new window.mapboxgl.Marker({
        color: '#3B82F6'
      })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new window.mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-semibold">${location.name}</h3>
                <p class="text-sm text-gray-600">
                  Lat: ${location.latitude}<br>
                  Lng: ${location.longitude}
                </p>
              </div>
            `)
        )
        .addTo(map.current);

      if (onMarkerClick) {
        marker.getElement().addEventListener('click', () => {
          onMarkerClick(location);
        });
      }

      markers.current.push(marker);
    });

    // Fit map to show all markers if there are any
    if (locations.length > 0) {
      const bounds = new window.mapboxgl.LngLatBounds();
      locations.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      
      if (locations.length === 1) {
        map.current.setCenter([locations[0].longitude, locations[0].latitude]);
        map.current.setZoom(15);
      } else {
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  };

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
      style={{ minHeight: '400px' }}
    />
  );
};

export const LocationsTab: React.FC<LocationsTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(true);
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

  const handleMapClick = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }));
    setShowAddModal(true);
  };

  const handleMarkerClick = (location: PropertyLocation) => {
    handleEditClick(location);
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
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
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
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add location:', error);
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
      
      const formDataToSend = new FormData();
      formDataToSend.append('property_listing_id', formData.property_listing_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('_method', 'PUT');
      
      await postData(`owner/locations/${selectedLocationId}`, formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowEditModal(false);
      setSelectedLocationId(null);
      resetFormData();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update location:', error);
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

      {!isEdit && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            💡 Tip: You can click on the map to automatically fill the coordinates!
          </p>
        </div>
      )}
      
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
          >
            <Map size={20} />
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
          >
            <Plus size={20} />
            Add New Location
          </button>
        </div>
      </div>

      {/* Map Section */}
      {showMap && (
        <div className="mb-6">
          <div className="mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click on the map to add a new location, or click on existing markers to edit them.
            </p>
          </div>
          <MapboxMap
            locations={property.property_locations}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            center={property.property_locations.length > 0 
              ? [property.property_locations[0].longitude, property.property_locations[0].latitude]
              : [30.0444, 31.2357]
            }
          />
        </div>
      )}

      {/* Locations List */}
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
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No locations marked yet</p>
          <p className="text-sm">Click on the map above or use the &quot;Add New Location&quot; button to mark your first location.</p>
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