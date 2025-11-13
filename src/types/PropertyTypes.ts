// src/types/PropertyTypes.ts

export type TabType = 'main' | 'amenities' | 'features' | 'locations' | 'images' | 'floorplan';

// Full user with role, subscription, etc.
export type PropertyUser = {
  modules: PropertyModule[];
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  subscription: string;
  role: string;
};

// Property type (e.g., Apartment, Villa)
export type PropertyType = {
  id: number;
  title: string;
  image: string | null;
  descriptions: {
    en: { title: string; image: string | null };
    ar: { title: string; image: string | null };
  };
};

// Area (district/region)
export type PropertyArea = {
  id: number;
  image: string;
  count_of_properties: number;
  name: string;
  description: {
    en: { name: string };
    ar: { name: string };
  };
};

// Localized content for descriptions, SEO
export interface LocalizedContent {
  title?: string;
  description?: string;
  keywords?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

// Descriptions wrapper
export interface Description {
  en?: LocalizedContent;
  ar?: LocalizedContent;
  [key: string]: LocalizedContent | undefined;
}

// Features (key-value pairs like "Balcony: Yes")
export type PropertyFeature = {
  id: number;
  type: string;
  key: string;
  value: string;
  description: {
    en: Record<string, string | null>;
    ar: Record<string, string | null>;
  };
  key_translations: {
    en: string;
    ar: string;
  };
  value_translations: {
    en: string;
    ar: string;
  };
};

// Amenities (e.g., Pool, Gym)
export type PropertyAmenity = {
  image: string;
  id: number;
  title: string;
  descriptions: {
    en: { title: string };
    ar: { title: string };
  };
};

// Images
export type PropertyImage = {
  id: number;
  image: string;
};

// Floor Plans
export type PropertyFloorPlan = {
  id: number;
  image: string;
};

// Location Points (polygon)
export type LocationPoint = {
  latitude: number;
  longitude: number;
};

// Property Location (Google Place)
export interface PropertyLocation {
  id: number;
  name: string;
  location: string;
  location_place_id: string;
  location_lat: number;
  location_lng: number;
  location_points?: LocationPoint[];
}

// Module access
export type PropertyModule = {
  module: string;
};

// Statistics
export type PropertyStatistics = {
    count_call: number;
    count_whatsapp: number;
};

// Main Property Data
export type PropertyData = {
  property_id: number;
  cover: string;
  id: number;
  title: string;
  approval_status: string;
  price: number;
  down_price: number;
  sqt: number;
  bedroom: number;
  bathroom: number;
  status: string;
  immediate_delivery: string;
  furnishing?: string;
  payment_method: string;
  mortgage: string;
  paid_months: number | null;
  location?: string;
  area_id: number;
  created_at: string;
  views?: number;
  starting_day: string | null; // Added starting_day
  landing_space: number | null; // Added landing_space

  // Relations
  user: PropertyUser;
  property_type: PropertyType;
  type: PropertyType;
  area?: PropertyArea;
  descriptions?: Description;
  features: PropertyFeature[];
  amenities: PropertyAmenity[];
  property_listing_images: PropertyImage[];
  property_floor_plans: PropertyFloorPlan[];
  property_locations: PropertyLocation[];
};

// Toast
export type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

// Form inputs - Updated to match usage in component
export type FormInputs = {
  id?: string; // Changed from property_id to id
  userId: string;
  type: string;
  type_id: string;
  area_id?: string;
  price: string;
  down_price?: string;
  sqt: string;
  bedroom: string;
  bathroom: string;
  status: string;
  immediate_delivery: string;
  payment_method: string;
  paid_months?: string;
  furnishing: string;
  mortgage?: string;
  starting_day: string; // Changed from number to string
  landing_space: string; // Added landing_space as string for form input
  location?: string;
  title_en: string;
  description_en: string;
  keywords_en: string;
  slug_en: string;
  title_ar: string;
  description_ar: string;
  keywords_ar: string;
  slug_ar: string;
};

export interface LocationData {
  address: string;
  placeId: string;
  lat?: number;
  lng?: number;
}

export type ImagePreview = {
  file?: File;
  url: string;
  id: string;
  isExisting?: boolean; // Added isExisting property
};