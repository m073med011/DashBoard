'use client';

import { useEffect, useState, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useLocale } from 'next-intl';

/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

interface GoogleLocationSearchProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (
    value: string,
    locationData?: {
      address: string;
      placeId: string;
      lat?: number;
      lng?: number;
    }
  ) => void;
  placeholder?: string;
  required?: boolean;
  dir?: string;
  error?: boolean;
  errorMessage?: string;
  t?: (key: string) => string;
}

const GoogleLocationSearch: React.FC<GoogleLocationSearchProps> = ({
  label,
  name,
  value = '',
  onChange,
  placeholder = '',
  required = false,
  dir = 'ltr',
  error = false,
  errorMessage,
  t = (key: string) => key,
}) => {
  const [locationQuery, setLocationQuery] = useState(value);
  const locale = useLocale()
  const [locationSuggestions, setLocationSuggestions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        initializeGoogleMapsServices();
        return;
      }

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        window.initGoogleMaps = initializeGoogleMapsServices;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };

    const initializeGoogleMapsServices = () => {
      if (window.google && window.google.maps) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const dummyDiv = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        setIsGoogleMapsLoaded(true);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    setLocationQuery(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocationQuery(query);

    if (query.length > 2 && isGoogleMapsLoaded && autocompleteService.current) {
      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        types: ['geocode'], // Only return geographic locations, not businesses
        componentRestrictions: { country: 'EG' }, // 🇪🇬 restrict to Egypt
      };

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setLocationSuggestions(predictions);
          setShowLocationSuggestions(true);
        } else {
          setLocationSuggestions([]);
          setShowLocationSuggestions(false);
        }
      });
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }

    if (onChange) {
      onChange(query);
    }
  };

  const handleSuggestionSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    setLocationQuery(prediction.description);
    setShowLocationSuggestions(false);

    if (placesService.current) {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: prediction.place_id,
        fields: ['geometry', 'formatted_address', 'name'],
      };

      placesService.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData = {
            address: prediction.description,
            placeId: prediction.place_id,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
          };

          if (onChange) {
            onChange(prediction.description, locationData);
          }
        }
      });
    } else {
      if (onChange) {
        onChange(prediction.description);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowLocationSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      {/* Label */}
      <label
        htmlFor={name}
        className={`block text-sm ${locale === "ar" ? "text-right" : ""} font-medium text-dark dark:text-white`}
        dir={dir}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Field */}
      <div className="relative w-full">
        <div className="relative w-full">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="text"
            placeholder={placeholder || `${t('select')} ${label}`}
            className={`w-full px-4 py-3 pl-10 pr-4 md:px-4 md:pr-4 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-orange-200/30 ${
              error
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-slate-300 dark:border-slate-600 focus:ring-orange-500 focus:border-transparent'
            } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 max-w-full`}
            value={locationQuery}
            onChange={handleInputChange}
            onFocus={() =>
              locationSuggestions.length > 0 && setShowLocationSuggestions(true)
            }
            autoComplete="off"
            dir={dir}
            style={{ boxSizing: 'border-box', paddingLeft: '30px' }}
          />
          <MapPin
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
              error ? 'text-red-500' : 'text-gray-500'
            }`}
            size={18}
          />
        </div>

        {/* Loading Indicator */}
        {!isGoogleMapsLoaded && (
          <div className="absolute top-full left-0 right-0 bg-gray-100 text-sm text-gray-600 p-2 rounded-b-md border-x border-b border-gray-300 z-10">
            Loading location services...
          </div>
        )}

        {showLocationSuggestions && locationSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full mt-1 w-full z-50 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl max-h-64 overflow-y-auto"
          >
            {locationSuggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <MapPin className="mt-1 text-blue-500 dark:text-blue-400 flex-shrink-0" size={18} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-gray-800 dark:text-white break-words">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <div className="mt-2">
          <p className="text-sm text-red-600 flex items-center">
            <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
            {errorMessage || t('field_required')}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleLocationSearch;