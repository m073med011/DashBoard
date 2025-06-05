import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, MapPin, Edit, Save, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
import { useTranslations } from 'next-intl';
import Toast from '@/components/Toast';

// Mapbox GL JS imports
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token-here';

interface LocationTabProps {
  property: PropertyData;
  onUpdate?: () => void;
}

// Updated to match your PropertyLocation type from PropertyTypes
interface LocationPoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  location_points?: { latitude: number; longitude: number }[]; // Optional polygon points
}


type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

interface LocationFormData {
  property_listing_id: string;
  name: string;
  latitude: number;
  longitude: number;
  polygon_points: number; // Number of polygon points to generate
  polygon_radius: number; // Radius for generating polygon points
}

interface TempLocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  polygon_points: number;
  polygon_radius: number;
  marker: mapboxgl.Marker;
}

export const LocationTab: React.FC<LocationTabProps> = ({ property, onUpdate }) => {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations("Location");
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [editingLocation, setEditingLocation] = useState<LocationPoint | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false,
  });
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // Multi-point addition states
  const [isMultiAddMode, setIsMultiAddMode] = useState(false);
  const [tempLocations, setTempLocations] = useState<TempLocationPoint[]>([]);
  const [showMultiAddModal, setShowMultiAddModal] = useState(false);
  const [multiName, setMultiName] = useState(''); // single name for all points

  const [formData, setFormData] = useState<LocationFormData>({
    property_listing_id: propertyId || '',
    name: '',
    latitude: 0,
    longitude: 0,
    polygon_points: 1,
    polygon_radius: 0.0001
  });

  // Generate polygon points around a center coordinate
  const generatePolygonPoints = (centerLat: number, centerLng: number, numPoints: number, radius: number): number[][] => {
    const points: number[][] = [];

    if (numPoints === 1) {
      points.push([centerLng, centerLat]);
      return points;
    }

    const angleStep = (2 * Math.PI) / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const lat = centerLat + radius * Math.cos(angle);
      const lng = centerLng + radius * Math.sin(angle);
      points.push([lng, lat]);
    }

    return points;
  };

  // Convert locations to FormData format for multi-point submission
  const createMultiPointFormData = (locations: TempLocationPoint[]): FormData => {
    const formData = new FormData();

    formData.append('property_listing_id', propertyId);
    formData.append('name', multiName.trim() || 'Bulk Location Upload');

    locations.forEach((location, index) => {
      const polygonPoints = generatePolygonPoints(
        location.latitude,
        location.longitude,
        location.polygon_points,
        location.polygon_radius
      );

      polygonPoints.forEach((point, pointIndex) => {
        const locationPolygonIndex = index * polygonPoints.length + pointIndex;
        formData.append(`polygon[${locationPolygonIndex}][0]`, point[0].toString());
        formData.append(`polygon[${locationPolygonIndex}][1]`, point[1].toString());
      });
    });

    return formData;
  };

  // Convert single location to FormData format
  const createSingleLocationFormData = (locationData: {
    property_listing_id: string;
    name: string;
    latitude: number;
    longitude: number;
    polygon: number[][];
  }): FormData => {
    const formData = new FormData();

    formData.append('property_listing_id', locationData.property_listing_id);
    formData.append('name', locationData.name);
    formData.append('latitude', locationData.latitude.toString());
    formData.append('longitude', locationData.longitude.toString());

    locationData.polygon.forEach((point, index) => {
      formData.append(`polygon[${index}][0]`, point[0].toString());
      formData.append(`polygon[${index}][1]`, point[1].toString());
    });

    return formData;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [31.2357, 30.0444], // Default to Cairo, Egypt
      zoom: 10
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('click', (e) => {
      if (showAddModal || showEditModal) return;

      const { lng, lat } = e.lngLat;

      if (isMultiAddMode) {
        handleMultiPointClick(lng, lat);
      } else {
        handleSinglePointClick(lng, lat);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMultiAddMode]);

  // Load existing locations and add markers
  useEffect(() => {
    if (property?.property_locations) {
      // Convert PropertyLocation[] to LocationPoint[]
      const convertedLocations: LocationPoint[] = property.property_locations.map(loc => ({
        id: loc.id,
        name: loc.name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_points: loc.location_points
      }));
      setLocations(convertedLocations);
      addMarkersToMap(convertedLocations);
    }
  }, [property]);

  const addMarkersToMap = (locationPoints: LocationPoint[]) => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    locationPoints.forEach((location) => {
      const marker = new mapboxgl.Marker({ color: '#3B82F6' })
        .setLngLat([location.longitude, location.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <h3>${location.name}</h3>
            <p>Lat: ${location.latitude.toFixed(6)}<br>Lng: ${location.longitude.toFixed(6)}</p>
            ${location.location_points ? `<p>Polygon Points: ${location.location_points.length}</p>` : ''}
          `)
        )
        .addTo(map.current!);

      markers.current.push(marker);
    });

    if (locationPoints.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      locationPoints.forEach(location => {
        bounds.extend([location.longitude, location.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const handleSinglePointClick = (lng: number, lat: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    setShowAddModal(true);
  };

  const handleMultiPointClick = (lng: number, lat: number) => {
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    const marker = new mapboxgl.Marker({ color: '#EF4444', draggable: true })
      .setLngLat([lng, lat])
      .addTo(map.current!);

    const tempLocation: TempLocationPoint = {
      id: tempId,
      latitude: lat,
      longitude: lng,
      polygon_points: 1,
      polygon_radius: 0.0001,
      marker: marker
    };

    marker.on('drag', () => {
      const lngLat = marker.getLngLat();
      setTempLocations(prev =>
        prev.map(loc =>
          loc.id === tempId
            ? { ...loc, latitude: lngLat.lat, longitude: lngLat.lng }
            : loc
        )
      );
    });

    setTempLocations(prev => [...prev, tempLocation]);
  };

  const resetFormData = () => {
    setFormData({
      property_listing_id: propertyId || '',
      name: '',
      latitude: 0,
      longitude: 0,
      polygon_points: 1,
      polygon_radius: 0.0001
    });
  };

  const resetMultiAddMode = () => {
    tempLocations.forEach(tempLoc => tempLoc.marker.remove());
    setTempLocations([]);
    setMultiName('');
    setIsMultiAddMode(false);
    setShowMultiAddModal(false);
  };

  const handleAddSingleClick = () => {
    resetFormData();
    setIsMultiAddMode(false);
    showToast(t("Click on the map to select a location"), "info");
  };

  const handleAddMultipleClick = () => {
    resetMultiAddMode();
    setIsMultiAddMode(true);
    showToast(t("Multi-add"), "info");
  };

  const handleSaveAllPoints = () => {
    if (tempLocations.length === 0) {
      showToast(t("No points added yet. Click on the map to add points."), "info");
      return;
    }
    setShowMultiAddModal(true);
  };

  const handleCancelMultiAdd = () => {
    resetMultiAddMode();
  };

  const handleEditClick = (location: LocationPoint) => {
    setEditingLocation(location);
    setFormData({
      property_listing_id: propertyId || '',
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      polygon_points: location.location_points ? location.location_points.length : 1,
      polygon_radius: 0.0001
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (locationId: string) => {
    setSelectedLocationIds([locationId]);
    setShowDeleteModal(true);
  };

  const handleBulkDeleteClick = () => {
    if (selectedLocationIds.length === 0) return;
    setShowDeleteModal(true);
  };

  const handleSelectAll = () => {
    if (selectedLocationIds.length === locations.length) {
      setSelectedLocationIds([]);
    } else {
      setSelectedLocationIds(locations.map(loc => loc.id.toString()));
    }
  };

  const removeTempLocation = (tempId: string) => {
    setTempLocations(prev => {
      const locToRemove = prev.find(loc => loc.id === tempId);
      if (locToRemove) locToRemove.marker.remove();
      return prev.filter(loc => loc.id !== tempId);
    });
  };

  const handleDeleteConfirm = async () => {
    if (selectedLocationIds.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = selectedLocationIds.join('&');

      await deleteData(`owner/locations/${queryParams}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));

      setShowDeleteModal(false);
      setSelectedLocationIds([]);
      router.refresh();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to delete locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(t("Please enter a location name"), "error");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const polygonPoints = generatePolygonPoints(
        formData.latitude,
        formData.longitude,
        formData.polygon_points,
        formData.polygon_radius
      );

      const locationData = {
        property_listing_id: formData.property_listing_id,
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        polygon: polygonPoints
      };

      const formDataToSend = createSingleLocationFormData(locationData);

      await postData('owner/locations', formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));

      setShowAddModal(false);
      resetFormData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to add location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation || !formData.name.trim()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const polygonPoints = generatePolygonPoints(
        formData.latitude,
        formData.longitude,
        formData.polygon_points,
        formData.polygon_radius
      );

      const requestBody = {
        _method: 'PUT',
        property_listing_id: formData.property_listing_id,
        name: formData.name,
        latitude: formData.latitude,
        longitude: formData.longitude,
        polygon: polygonPoints
          .map((point, idx) => ({ [`${idx}`]: { 0: point[0], 1: point[1] } }))
          .reduce((acc, curr) => ({ ...acc, ...curr }), {})
      };

      await postData(
        `owner/locations/${editingLocation.id}`,
        requestBody,
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        })
      );

      setShowEditModal(false);
      setEditingLocation(null);
      resetFormData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to update location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMultiAddSubmit = async () => {
    if (!multiName.trim()) {
      showToast(t("Please enter a name for all locations."), "error");
      return;
    }
    if (tempLocations.length === 0) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formDataToSend = createMultiPointFormData(tempLocations);

      await postData('owner/locations', formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));

      resetMultiAddMode();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to add locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' || name === 'polygon_radius'
        ? parseFloat(value) || 0
        : name === 'polygon_points'
        ? parseInt(value) || 1
        : value
    }));
  };

  // Enhanced single location form with better styling similar to multi-add
  const renderLocationForm = (isEdit = false) => (
    <form onSubmit={isEdit ? handleEditSubmit : handleAddSubmit} className="space-y-6">

      {/* Location Name Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">{t("Location Information")}</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("Location Name")} *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder={t("Enter location name")}
          />
        </div>
      </div>

      {/* Coordinates Section */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-3">{t("Coordinates")}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("Latitude")} *
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              step="any"
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("Longitude")} *
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              step="any"
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
              setEditingLocation(null);
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 disabled:opacity-50 flex items-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t("Saving...")}
            </>
          ) : (
            <>
              <Save size={16} />
              {isEdit ? t("Update Location") : t("Add Location")}
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="mb-8">
                  {toast.show && <Toast message={toast.message} type={toast.type} duration={3000} />}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t("Property Locations")}
        </h3>
        <div className="flex items-center gap-2">
          {locations.length > 0 && (
            <>
              <button
                onClick={handleSelectAll}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 text-sm"
              >
                {selectedLocationIds.length === locations.length ? t('Deselect All') : t('Select All')}
              </button>
              {selectedLocationIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteClick}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  {t("Delete Selected")} ({selectedLocationIds.length})
                </button>
              )}
            </>
          )}
          <button
            onClick={handleAddSingleClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t("Add Single")}
          </button>
          <button
            onClick={handleAddMultipleClick}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            {t("Add Multiple")}
          </button>
        </div>
      </div>

      {/* Multi-add mode controls */}
      {isMultiAddMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h4 className="font-medium text-yellow-800">{t("Multi-Add Mode Active")}</h4>
              <p className="text-sm text-yellow-700">
                {t("Points added")}: {tempLocations.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveAllPoints}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
                disabled={tempLocations.length === 0}
              >
                <Save size={16} />
                {t("Save All Points")}
              </button>
              <button
                onClick={handleCancelMultiAdd}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
              >
                <X size={16} />
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="mb-6">
        <div
          ref={mapContainer}
          className="w-full h-96 rounded-lg border border-gray-300 dark:border-gray-600"
        />
        <p className="text-sm text-gray-600 mt-2">
          {isMultiAddMode
            ? t("Multi-add mode: Click on the map to add multiple location points")
            : t("Click on the map to add a new location point")
          }
        </p>
      </div>

      {/* Temporary locations list (when in multi-add mode) */}
      {isMultiAddMode && tempLocations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">{t("Points to be added")}:</h4>
          {/* Single input for name of all points */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("Location Name for All")} *
            </label>
            <input
              type="text"
              value={multiName}
              onChange={(e) => setMultiName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("Enter name for all locations")}
              required
            />
          </div>
          <div className="space-y-3">
            {tempLocations.map((tempLoc, index) => (
              <div key={tempLoc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="text-xs text-gray-500">
                  {tempLoc.latitude.toFixed(6)}, {tempLoc.longitude.toFixed(6)}
                </span>
                <button
                  onClick={() => removeTempLocation(tempLoc.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations List */}
      {property.property_locations.length > 0 ? (
        <div className="space-y-4 mb-6">
          {property.property_locations.map((location) => (
            <div key={location.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={selectedLocationIds.includes(location.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLocationIds(prev => [...prev, location.id.toString()]);
                      } else {
                        setSelectedLocationIds(prev => prev.filter(id => id !== location.id.toString()));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
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
                    {location.location_points && location.location_points.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Polygon points: {location.location_points.length}
                      </div>
                    )}
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

      {/* Add Single Location Modal */}
      <ModalForm
        open={showAddModal}
        title={t("Add New Location")}
        onClose={() => {
          setShowAddModal(false);
          resetFormData();
        }}
      >
        {renderLocationForm(false)}
      </ModalForm>

      {/* Multi-Add Modal */}
      <ModalForm
        open={showMultiAddModal}
        title={t("Save Multiple Locations")}
        onClose={() => {
          setShowMultiAddModal(false);
        }}
      >
        <div className="mb-4">
          <p className="text-gray-600 mb-4">
            {t("You are about to save")} {tempLocations.length} {t("location(s).")}
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tempLocations.map((tempLoc, index) => (
              <div key={tempLoc.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                <span className="text-xs text-gray-500">
                  {tempLoc.latitude.toFixed(4)}, {tempLoc.longitude.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowMultiAddModal(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
            disabled={loading}
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleMultiAddSubmit}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t("Saving...") : t("Save All Locations")}
          </button>
        </div>
      </ModalForm>

      {/* Edit Location Modal */}
      <ModalForm
        open={showEditModal}
        title={t("Edit Location")}
        onClose={() => {
          setShowEditModal(false);
          setEditingLocation(null);
          resetFormData();
        }}
      >
        {renderLocationForm(true)}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        open={showDeleteModal}
        title={t("Confirm Delete")}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedLocationIds([]);
        }}
      >
        <p className="text-gray-600 mb-6">
          {t("Are you sure you want to delete")} {selectedLocationIds.length === 1 ? t('this location') : `${t('these')} ${selectedLocationIds.length} ${t('locations')}`}? {t("This action cannot be undone.")}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedLocationIds([]);
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
            {loading ? t('Deleting...') : `${t('Delete')} ${selectedLocationIds.length === 1 ? t('Location') : t('Locations')}`}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};
