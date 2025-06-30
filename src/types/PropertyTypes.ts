export type TabType = 'main' | 'amenities' | 'features' | 'locations' | 'images' | 'floorplan';

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


export type PropertyStatistics = {
  data: {
  count_call: number;
  count_whatsapp: number;
  }
}

export type PropertyType = {
  id: number;
  title: string;
  image: string | null;
  descriptions: {
    en: { title: string; image: string | null };
    ar: { title: string; image: string | null };
  };
};

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

export type PropertyAmenity = {
  id: number;
  title: string;
  descriptions: {
    en: { title: string };
    ar: { title: string };
  };
};

export type PropertyImage = {
  id: number;
  image: string;
};

export type PropertyFloorPlan = {
  id: number;
  image: string;
};

export type LocationPoint = {
  latitude: number;
  longitude: number;
};
export interface PropertyLocation {
  id: number;
  name: string;
  location: string;
  location_place_id: string;
  location_lat: number;
  location_lng: number;
  location_points?: LocationPoint[];
}

export type PropertyModule = {
  module: string;
};
export type PropertyData = {
  locations: PropertyLocation[];
  approval_status: string;
  title: string;
  id: number;
  user: PropertyUser;
  type: PropertyType;
  area: PropertyArea;
  price: number;
  down_price: number;
  sqt: number;
  bathroom: number;
  bedroom: number;
  kitichen: number;
  status: string;
  immediate_delivery: string;
  descriptions: {
    en: {
      title: string;
      description: string;
      keywords: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
    };
    ar: {
      title: string;
      description: string;
      keywords: string;
      slug: string;
      meta_title: string;
      meta_description: string;
      meta_keywords: string;
    };
  };
  features: PropertyFeature[];
  amenities: PropertyAmenity[];
  property_listing_images: PropertyImage[];
  property_floor_plans: PropertyFloorPlan[];
  property_locations: PropertyLocation[];
};

export type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};