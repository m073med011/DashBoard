"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData, PropertyLocation, LocationPoint } from '@/types/PropertyTypes';
import { postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import mapboxgl from 'mapbox-gl';
import { useTranslations } from 'next-intl';
import GoogleLocationSearch from '@/components/common/GoogleLocationInput';

// IMPORTANT: Remove the CSS import from here and add it to your _app.tsx or layout.tsx:
// import 'mapbox-gl/dist/mapbox-gl.css';

// Set token directly (ensure env variable is set)
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZGxsZW5pIiwiYSI6ImNtYXJ6czU0YzBla2MybHFyZ3ZzODZvZHoifQ.hLCLgDINOXDSiijw56p15w';

if (!MAPBOX_TOKEN) {
  console.error('⚠️ MAPBOX TOKEN IS MISSING! Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file');
}

mapboxgl.accessToken = MAPBOX_TOKEN || '';

interface LocationTabProps {
  property: PropertyData;
  onUpdate?: () => void;
  refetch?: () => void;
}

interface LocationData {
  address: string;
  placeId: string;
  lat?: number;
  lng?: number;
  name?: string;
}

interface LocationGroup {
  [key: string]: PropertyLocation[];
}

interface PolygonGeoJSONFeature {
  type: 'Feature';
  properties: {
    name: string;
    color: string;
    pointCount?: number;
    locations?: PropertyLocation[];
    id?: number;
    location_points?: LocationPoint[];
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

interface PointGeoJSONFeature {
  type: 'Feature';
  properties: {
    color: string;
    pointCount?: number;
    locations?: PropertyLocation[];
    id?: number;
    location_points?: LocationPoint[];
  };
  geometry: {
    type: 'Point';
    coordinates: number[];
  };
}

export const LocationTab: React.FC<LocationTabProps> = ({ property, onUpdate, refetch }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations('properties');
  
  const getInitialLocationValue = useCallback(() => {
    if (property?.property_locations && property.property_locations.length > 0) {
      const firstLocation = property.property_locations[0];
      return firstLocation.location || '';
    }
    return '';
  }, [property?.property_locations]);

  const getInitialSelectedLocation = useCallback((): LocationData | null => {
    if (property?.property_locations && property.property_locations.length > 0) {
      const firstLocation = property.property_locations[0];
      
      if (firstLocation.location && firstLocation.location_place_id) {
        const locationData = {
          address: firstLocation.location,
          placeId: firstLocation.location_place_id,
          lat: firstLocation.location_lat ? parseFloat(firstLocation.location_lat.toString()) : undefined,
          lng: firstLocation.location_lng ? parseFloat(firstLocation.location_lng.toString()) : undefined,
          name: firstLocation.name || firstLocation.location.split(',')[0].trim()
        };
        
        return locationData;
      }
    }
    
    return null;
  }, [property?.property_locations]);
  
  const [locationValue, setLocationValue] = useState<string>(getInitialLocationValue());
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(getInitialSelectedLocation());
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const existingMarkers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const newLocationValue = getInitialLocationValue();
    const newSelectedLocation = getInitialSelectedLocation();
    
    setLocationValue(newLocationValue);
    setSelectedLocation(newSelectedLocation);
  }, [property, getInitialLocationValue, getInitialSelectedLocation]);

  const loadExistingLocations = useCallback(() => {
    if (!map.current || !property?.property_locations) return;

    existingMarkers.current.forEach(marker => marker.remove());
    existingMarkers.current = [];

    const existingSources = ['existing-areas', 'existing-points'];
    existingSources.forEach(sourceId => {
      if (map.current!.getSource(sourceId)) {
        const layersToRemove = [`${sourceId}-fill`, `${sourceId}-stroke`, `${sourceId}-labels`, `${sourceId}-points`];
        layersToRemove.forEach(layerId => {
          if (map.current!.getLayer(layerId)) {
            map.current!.removeLayer(layerId);
          }
        });
        map.current!.removeSource(sourceId);
      }
    });

    const locationGroups: LocationGroup = property.property_locations.reduce((groups: LocationGroup, location: PropertyLocation) => {
      if (!groups[location.name]) {
        groups[location.name] = [];
      }
      groups[location.name].push(location);
      return groups;
    }, {});

    const areaFeatures: PolygonGeoJSONFeature[] = [];
    const pointFeatures: PointGeoJSONFeature[] = [];
    const colors = ['#45B7D1', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    let colorIndex = 0;

    Object.entries(locationGroups).forEach(([name, locations]) => {
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      if (locations.length >= 3) {
        const coordinates = locations.map(loc => [loc.location_lng, loc.location_lat]);
        coordinates.push(coordinates[0]);

        areaFeatures.push({
          type: 'Feature',
          properties: {
            name: name,
            color: color,
            pointCount: locations.length,
            locations: locations
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        });
      } else {
        locations.forEach(location => {
          pointFeatures.push({
            type: 'Feature',
            properties: {
              color: color,
              id: location.id,
              location_points: location.location_points
            },
            geometry: {
              type: 'Point',
              coordinates: [location.location_lng, location.location_lat]
            }
          });
        });
      }
    });

    if (areaFeatures.length > 0) {
      map.current!.addSource('existing-areas', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: areaFeatures
        }
      });

      map.current!.addLayer({
        id: 'existing-areas-fill',
        type: 'fill',
        source: 'existing-areas',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.3
        }
      });

      map.current!.addLayer({
        id: 'existing-areas-stroke',
        type: 'line',
        source: 'existing-areas',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      map.current!.addLayer({
        id: 'existing-areas-labels',
        type: 'symbol',
        source: 'existing-areas',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-anchor': 'center'
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    if (pointFeatures.length > 0) {
      map.current!.addSource('existing-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: pointFeatures
        }
      });

      map.current!.addLayer({
        id: 'existing-points-points',
        type: 'circle',
        source: 'existing-points',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-opacity': 0.8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        }
      });

      map.current!.addLayer({
        id: 'existing-points-labels',
        type: 'symbol',
        source: 'existing-points',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    if (property.property_locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      property.property_locations.forEach((location: PropertyLocation) => {
        bounds.extend([location.location_lng, location.location_lat]);
      });
      map.current!.fitBounds(bounds, { padding: 50 });
    }
  }, [property?.property_locations]);

  // Initialize map - FIXED VERSION
  useEffect(() => {
    // Prevent double initialization
    if (map.current) return;
    
    // Ensure container exists
    if (!mapContainer.current) {
      console.error('Map container not found');
      return;
    }

    // Check for Mapbox token
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === '') {
      const errorMsg = 'Mapbox access token is missing. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file.';
      console.error(errorMsg);
      setMapError(errorMsg);
      return;
    }

    console.log('🗺️ Initializing Mapbox map...');

    let initialCenter: [number, number] = [31.2357, 30.0444]; // Cairo, Egypt
    let initialZoom = 12;

    if (property?.property_locations?.length > 0) {
      const firstLocation = property.property_locations[0];
      
      if (firstLocation.location_lng && firstLocation.location_lat) {
        const lng = parseFloat(firstLocation.location_lng.toString());
        const lat = parseFloat(firstLocation.location_lat.toString());
        
        if (!isNaN(lng) && !isNaN(lat)) {
          initialCenter = [lng, lat];
          initialZoom = 15;
        }
      }
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: true
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapLoaded(true);
        setMapError(null);
        
        if (property?.property_locations?.length > 0) {
          loadExistingLocations();
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setMapError('Error loading map. Please check your Mapbox token.');
      });

    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapError('Failed to initialize map: ' + (error as Error).message);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, []); // Empty dependency array - only run once

  // Load locations when they change
  useEffect(() => {
    if (mapLoaded && property?.property_locations) {
      loadExistingLocations();
    }
  }, [mapLoaded, property?.property_locations, loadExistingLocations]);

  const handleSaveLocation = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not authenticated');
      return;
    }

    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      alert('Please select a valid location');
      return;
    }

    try {
      setLoading(true);

      await postData(
        `owner/locations`,
        {
          property_listing_id: propertyId,
          location: selectedLocation.address,
          location_place_id: selectedLocation.placeId,
          location_lat: selectedLocation.lat,
          location_lng: selectedLocation.lng
        },
        new AxiosHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        })
      );

      alert('Location saved successfully!');

      const isInitialLocation = property?.property_locations?.[0]?.location_place_id === selectedLocation.placeId;
      if (!isInitialLocation) {
        setLocationValue("");
        setSelectedLocation(null);
      }

      if (refetch) {
        refetch();
      } else if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  // Add selected location marker - FIXED VERSION
  useEffect(() => {
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng || !mapLoaded) {
      return;
    }

    if (!map.current) {
      return;
    }

    const addMarker = () => {
      try {
        // Clear any existing new location markers
        const existingNewMarkers = document.querySelectorAll('.new-location-marker');
        existingNewMarkers.forEach(marker => marker.remove());

        const isInitialLocation = property?.property_locations?.[0]?.location_place_id === selectedLocation.placeId;
        
        const el = document.createElement('div');
        el.className = 'new-location-marker';
        
        if (isInitialLocation) {
          el.style.cssText = `
            background-color: #10b981;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.4);
            cursor: pointer;
            position: relative;
            z-index: 1000;
          `;
          const indicator = document.createElement('div');
          indicator.style.cssText = `
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            background-color: #059669;
            border-radius: 50%;
            border: 1px solid white;
          `;
          el.appendChild(indicator);
        } else {
          el.style.cssText = `
            background-color: #ef4444;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 1000;
          `;
        }

        const lng = parseFloat(selectedLocation.lng?.toString() ?? '0');
        const lat = parseFloat(selectedLocation.lat?.toString() ?? '0');
        
        if (isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinates:', { lng, lat });
          return;
        }

        new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 10px;">
              <p style="margin: 0 0 4px 0; font-size: 12px;">${selectedLocation.address}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Lat: ${lat.toFixed(6)}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Lng: ${lng.toFixed(6)}</p>
              ${isInitialLocation ? '<p style="color: #10b981; font-size: 10px; margin: 0;"><strong>Current Location</strong></p>' : ''}
            </div>
          `))
          .addTo(map.current!);

        map.current!.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        });

      } catch (error) {
        console.error('Error adding marker:', error);
      }
    };

    addMarker();
  }, [selectedLocation, property, mapLoaded]);

  return (
    <div className="mb-8">
      {/* Google Location Search */}
      <div className="mb-6">
        <GoogleLocationSearch
          label={t("location")}
          name="location"
          value={locationValue}
          onChange={(value, googleLocationData) => {
            setLocationValue(value);
            if (googleLocationData) {
              setSelectedLocation(googleLocationData);
            }
          }}
          placeholder={t("enter_your_location")}
          required={true}
          dir="ltr"
          t={t}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          {selectedLocation && (
            <button
              onClick={handleSaveLocation}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <MapPin size={20} />
              {loading ? t('loading') : t('Save Location')}
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="my-16">
        {mapError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-semibold">Map Error:</p>
            <p className="text-sm">{mapError}</p>
          </div>
        )}
        <div
          ref={mapContainer}
          className="h-96 w-full rounded-lg border border-gray-300 bg-gray-100"
          style={{ minHeight: '400px' }}
        />
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <p className="text-gray-500">Loading map...</p>
          </div>
        )}
      </div>
    </div>
  );
};