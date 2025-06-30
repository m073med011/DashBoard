// components/GoogleLocationSearch.tsx

import { useEffect, useState, useRef } from "react";
import { MapPin } from "lucide-react";

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface GoogleLocationSearchProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string, locationData?: any) => void;
  placeholder?: string;
  required?: boolean;
  dir?: string;
  error?: boolean;
  errorMessage?: string;
  t?: (key: string) => string; // Translation function
}

const GoogleLocationSearch: React.FC<GoogleLocationSearchProps> = ({
  label,
  name,
  value = "",
  onChange,
  placeholder = "",
  required = false,
  dir = "ltr",
  error = false,
  errorMessage,
  t = (key: string) => key, // Default fallback for translation
}) => {
  const [locationQuery, setLocationQuery] = useState(value);
  const [locationSuggestions, setLocationSuggestions] = useState<Prediction[]>(
    []
  );
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google && window.google.maps) {
        initializeGoogleMapsServices();
        return;
      }

      if (!document.querySelector('script[src*="maps.googleapis.com"]')) {
        window.initGoogleMaps = initializeGoogleMapsServices;
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };

    const initializeGoogleMapsServices = () => {
      if (window.google && window.google.maps) {
        autocompleteService.current =
          new window.google.maps.places.AutocompleteService();

        const dummyDiv = document.createElement("div");
        placesService.current = new window.google.maps.places.PlacesService(
          dummyDiv
        );

        setIsGoogleMapsLoaded(true);
      }
    };

    loadGoogleMapsAPI();
  }, []);

  // Update local state when value prop changes
  useEffect(() => {
    setLocationQuery(value);
  }, [value]);

  // Handle input change with autocomplete
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocationQuery(query);

    if (query.length > 2 && isGoogleMapsLoaded && autocompleteService.current) {
      const request = {
        input: query,
        types: ["establishment", "geocode"],
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions: Prediction[], status: string) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setLocationSuggestions(predictions);
            setShowLocationSuggestions(true);
          } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
          }
        }
      );
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }

    // Notify parent about text change
    if (onChange) {
      onChange(query);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (prediction: Prediction) => {
    setLocationQuery(prediction.description);
    setShowLocationSuggestions(false);

    if (placesService.current) {
      const request = {
        placeId: prediction.place_id,
        fields: ["geometry", "formatted_address", "name"],
      };

      placesService.current.getDetails(request, (place: any, status: string) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
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

  // Hide suggestions when clicking outside
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

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-4">
      {/* Label */}
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-2"
        dir={dir}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative w-full">
        <div className="relative">
          <input
            ref={inputRef}
            id={name}
            name={name}
            type="text"
            placeholder={placeholder || `${t("select")} ${label}`}
            className={`w-full px-4 py-3 pl-10 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
              error 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
            value={locationQuery}
            onChange={handleInputChange}
            onFocus={() =>
              locationSuggestions.length > 0 &&
              setShowLocationSuggestions(true)
            }
            autoComplete="off"
            dir={dir}
          />
          <MapPin
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
              error ? 'text-red-500' : 'text-gray-500'
            }`}
            size={18}
          />
        </div>

        {/* Loading Message */}
        {!isGoogleMapsLoaded && (
          <div className="absolute top-full left-0 right-0 bg-gray-100 text-sm text-gray-600 p-2 rounded-b-md border-x border-b border-gray-300 z-10">
            Loading location services...
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showLocationSuggestions && locationSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 z-20 bg-white shadow-lg rounded-b-md border border-t-0 border-gray-300 max-h-60 overflow-y-auto"
          >
            {locationSuggestions.map((suggestion) => (
              <div
                key={suggestion.place_id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className="flex items-center p-3 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <MapPin className="text-gray-600 mr-3" size={16} />
                <div>
                  <div className="font-medium text-gray-800">
                    {suggestion.structured_formatting?.main_text ||
                      suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-xs text-gray-500 mt-1">
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
          <p className="text-sm text-red-600">
            {errorMessage || t("field_required")}
          </p>
        </div>
      )}
    </div>
  );
};

export default GoogleLocationSearch;