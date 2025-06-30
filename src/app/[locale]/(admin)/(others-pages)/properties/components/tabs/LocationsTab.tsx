"use client"
import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { MapPin, Eye, EyeOff } from 'lucide-react';
import { MapPin } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData, PropertyLocation, LocationPoint } from '@/types/PropertyTypes';
import { postData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslations } from 'next-intl';
import GoogleLocationSearch from '@/components/common/GoogleLocationInput';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-token-here';

interface LocationTabProps {
  property: PropertyData;
  onUpdate?: () => void;
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
    // name: string;
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

export const LocationTab: React.FC<LocationTabProps> = ({ property, onUpdate }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations('properties');
  
  // Initialize states with first property location if exists
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
      
      console.log('=== Initial Location Debug ===');
      console.log('First location raw data:', firstLocation);
      
      // Check if we have the required data for location
      if (firstLocation.location && firstLocation.location_place_id) {
        const locationData = {
          address: firstLocation.location,
          placeId: firstLocation.location_place_id,
          lat: firstLocation.location_lat ? parseFloat(firstLocation.location_lat.toString()) : undefined,
          lng: firstLocation.location_lng ? parseFloat(firstLocation.location_lng.toString()) : undefined,
          name: firstLocation.name || firstLocation.location.split(',')[0].trim()
        };
        
        console.log('Processed location data:', locationData);
        console.log('Has valid coordinates:', locationData.lat && locationData.lng && !isNaN(locationData.lat) && !isNaN(locationData.lng));
        console.log('=== End Initial Location Debug ===');
        
        return locationData;
      }
    }
    
    console.log('No valid initial location found');
    return null;
  }, [property?.property_locations]);
  
  console.log('====================================');
  console.log('First property location:', property.property_locations?.[0]);
  console.log('Initial location value:', getInitialLocationValue());
  console.log('Initial selected location:', getInitialSelectedLocation());
  console.log('====================================');
  
  // States - Initialize with first property location if available
  const [locationValue, setLocationValue] = useState<string>(getInitialLocationValue());
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(getInitialSelectedLocation());
  const [loading, setLoading] = useState(false);
  // const [showOldLocations, setShowOldLocations] = useState(true);

  // Refs
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const existingMarkers = useRef<mapboxgl.Marker[]>([]);

  // Update states when property changes
  useEffect(() => {
    const newLocationValue = getInitialLocationValue();
    const newSelectedLocation = getInitialSelectedLocation();
    
    setLocationValue(newLocationValue);
    setSelectedLocation(newSelectedLocation);
  }, [property, getInitialLocationValue, getInitialSelectedLocation]);

  const loadExistingLocations = useCallback(() => {
    if (!map.current || !property?.property_locations) return;

    // Clear existing markers and sources
    existingMarkers.current.forEach(marker => marker.remove());
    existingMarkers.current = [];

    // Remove existing sources and layers
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

    // Group locations by name
    const locationGroups: LocationGroup = property.property_locations.reduce((groups: LocationGroup, location: PropertyLocation) => {
      if (!groups[location.name]) {
        groups[location.name] = [];
      }
      groups[location.name].push(location);
      return groups;
    }, {});

    // Create features
    const areaFeatures: PolygonGeoJSONFeature[] = [];
    const pointFeatures: PointGeoJSONFeature[] = [];
    const colors = ['#45B7D1', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    let colorIndex = 0;

    Object.entries(locationGroups).forEach(([name, locations]) => {
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      if (locations.length >= 3) {
        // Create polygon for 3+ points
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
        // Create points for 1-2 points
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

    // Add areas to map
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

    // Add points to map
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

    // Fit bounds to all locations
    if (property.property_locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      property.property_locations.forEach((location: PropertyLocation) => {
        bounds.extend([location.location_lng, location.location_lat]);
      });
      map.current!.fitBounds(bounds, { padding: 50 });
    }
  }, [property?.property_locations]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    console.log('=== Map Initialization Debug ===');
    console.log('Mapbox token:', mapboxgl.accessToken ? 'Token exists' : 'No token');
    console.log('Property locations:', property?.property_locations);

    // Determine initial center based on first location or default to Cairo
    let initialCenter: [number, number] = [31.2357, 30.0444]; // Default to Cairo, Egypt
    let initialZoom = 12;

    if (property?.property_locations?.length > 0) {
      const firstLocation = property.property_locations[0];
      console.log('First location for map center:', firstLocation);
      
      if (firstLocation.location_lng && firstLocation.location_lat) {
        const lng = parseFloat(firstLocation.location_lng.toString());
        const lat = parseFloat(firstLocation.location_lat.toString());
        
        if (!isNaN(lng) && !isNaN(lat)) {
          initialCenter = [lng, lat];
          initialZoom = 15; // Zoom closer when we have a specific location
          console.log('Using property location as center:', initialCenter);
        } else {
          console.log('Invalid coordinates, using default center');
        }
      }
    }

    console.log('Map center:', initialCenter, 'Zoom:', initialZoom);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        if (property?.property_locations?.length > 0) {
          console.log('Loading existing locations...');
          loadExistingLocations();
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
    }

    console.log('=== End Map Initialization Debug ===');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapContainer, property, loadExistingLocations]);

  // Toggle old locations visibility
  // const toggleOldLocations = () => {
  //   setShowOldLocations(!showOldLocations);

  //   const layers = ['existing-areas-fill', 'existing-areas-stroke', 'existing-areas-labels', 'existing-points-points', 'existing-points-labels'];

  //   layers.forEach(layerId => {
  //     if (map.current && map.current.getLayer(layerId)) {
  //       map.current.setLayoutProperty(
  //         layerId,
  //         'visibility',
  //         showOldLocations ? 'none' : 'visible'
  //       );
  //     }
  //   });
  // };

  // Save selected location to API
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

      // Removed name field from the API request
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

      // Reset form only if this was a new location (not the initial one)
      const isInitialLocation = property?.property_locations?.[0]?.location_place_id === selectedLocation.placeId;
      if (!isInitialLocation) {
        setLocationValue("");
        setSelectedLocation(null);
      }

      // Call onUpdate function
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('Error saving location:', error);
      alert('Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  // Add selected location marker to map
  useEffect(() => {
    console.log('=== Marker Effect Debug ===');
    console.log('selectedLocation:', selectedLocation);
    console.log('map.current:', map.current);
    console.log('map loaded:', map.current?.loaded());
    
    if (!selectedLocation || !selectedLocation.lat || !selectedLocation.lng) {
      console.log('No selected location or missing coordinates');
      return;
    }

    if (!map.current) {
      console.log('Map not initialized');
      return;
    }

    // Wait for map to be loaded
    const addMarker = () => {
      try {
        console.log('Adding marker at:', [selectedLocation.lng, selectedLocation.lat]);
        
        // Clear any existing new location markers
        const existingNewMarkers = document.querySelectorAll('.new-location-marker');
        existingNewMarkers.forEach(marker => marker.remove());

        // Check if this is the initial location from API
        const isInitialLocation = property?.property_locations?.[0]?.location_place_id === selectedLocation.placeId;
        console.log('Is initial location:', isInitialLocation);
        
        // Add new marker for selected location
        const el = document.createElement('div');
        el.className = 'new-location-marker';
        
        // Different styling for initial vs new locations
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
          // Add a small indicator for initial location
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

        // Validate coordinates
        const lng = parseFloat(selectedLocation.lng?.toString() ?? '0');
        const lat = parseFloat(selectedLocation.lat?.toString() ?? '0');
        
        if (isNaN(lng) || isNaN(lat)) {
          console.error('Invalid coordinates:', { lng, lat });
          return;
        }

        console.log('Creating marker with coordinates:', [lng, lat]);

new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 10px;">
              <p style="margin: 0 0 4px 0; font-size: 12px;">${selectedLocation.address}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Lat: ${lat.toFixed(6)}</p>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;">Lng: ${lng.toFixed(6)}</p>
              ${isInitialLocation ? '<p style="color: #10b981; font-size: 10px; margin: 0;"><strong>current location </strong></p>' : ''}
            </div>
          `))
          .addTo(map.current!);

        console.log('Marker added successfully');

        // Center map on location
        map.current!.flyTo({
          center: [lng, lat],
          zoom: 15,
          duration: 1000
        });

        console.log('Map centered on location');

      } catch (error) {
        console.error('Error adding marker:', error);
      }
    };

    if (map.current.loaded()) {
      addMarker();
    } else {
      map.current.on('load', addMarker);
    }

    console.log('=== End Marker Effect Debug ===');
  }, [selectedLocation, property]);

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
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          {t("Property Locations")}
        </h3>
        <div className="flex gap-2">
          {/* <button
            onClick={toggleOldLocations}
            className={`${showOldLocations
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-600 hover:bg-gray-700'
              } text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2`}
          >
            {showOldLocations ? <Eye size={20} /> : <EyeOff size={20} />}
            {showOldLocations ? t('Hide Old Locations') : t('Show Old Locations')}
          </button> */}

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
      <div className="mb-6">
        <div
          ref={mapContainer}
          className="h-96 w-full rounded-lg border border-gray-300"
          style={{ height: '400px' }}
        />
      </div>
    </div>
  );
};