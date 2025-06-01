import { 
    Wifi, 
    Car, 
    Dumbbell, 
    Shield 
  } from 'lucide-react';
  import { PropertyData, Amenity, Location, PropertyImage, FloorPlan, FavoriteProperty, Tab } from '@/types/PropertyTypes';
  
  export const propertyData: PropertyData = {
    title: "Luxury Downtown Apartment",
    price: "$2,500/month",
    type: "2 Bedroom Apartment",
    address: "123 Main Street, Downtown, NY 10001",
    description: "Beautiful modern apartment in the heart of downtown with stunning city views and premium amenities. This property features high-end finishes, modern appliances, and access to building amenities including fitness center, rooftop terrace, and 24-hour concierge service.",
    bedrooms: 2,
    bathrooms: 2,
    area: "1,200 sq ft",
    yearBuilt: "2020",
    rating: 4.8,
    reviews: 24
  };
  
  export const amenities: Amenity[] = [
    { name: "High-Speed WiFi", icon: Wifi, available: true },
    { name: "Parking Space", icon: Car, available: true },
    { name: "Gym Access", icon: Dumbbell, available: true },
    { name: "24/7 Security", icon: Shield, available: true },
    { name: "Swimming Pool", icon: "🏊", available: false },
    { name: "Laundry", icon: "🧺", available: true },
    { name: "Air Conditioning", icon: "❄️", available: true },
    { name: "Balcony", icon: "🌿", available: true }
  ];
  
  export const features: string[] = [
    "Hardwood Floors",
    "Stainless Steel Appliances", 
    "Granite Countertops",
    "Walk-in Closets",
    "Floor-to-ceiling Windows",
    "In-unit Washer/Dryer",
    "Central Air & Heat",
    "Modern Kitchen",
    "Updated Bathrooms",
    "City Views"
  ];
  
  export const nearbyLocations: Location[] = [
    { name: "Central Park", distance: "0.5 miles", type: "Park" },
    { name: "Subway Station", distance: "0.2 miles", type: "Transport" },
    { name: "Whole Foods", distance: "0.3 miles", type: "Grocery" },
    { name: "Coffee Shop", distance: "0.1 miles", type: "Cafe" },
    { name: "Hospital", distance: "1.2 miles", type: "Healthcare" },
    { name: "School", distance: "0.8 miles", type: "Education" }
  ];
  
  export const images: PropertyImage[] = [
    { id: 1, url: "/api/placeholder/600/400", title: "Living Room", category: "Interior" },
    { id: 2, url: "/api/placeholder/600/400", title: "Kitchen", category: "Interior" },
    { id: 3, url: "/api/placeholder/600/400", title: "Master Bedroom", category: "Interior" },
    { id: 4, url: "/api/placeholder/600/400", title: "Bathroom", category: "Interior" },
    { id: 5, url: "/api/placeholder/600/400", title: "Building Exterior", category: "Exterior" },
    { id: 6, url: "/api/placeholder/600/400", title: "City View", category: "View" }
  ];
  
  export const floorPlans: FloorPlan[] = [
    { id: 1, name: "2 Bed Floor Plan", url: "/api/placeholder/500/600", area: "1,200 sq ft" },
    { id: 2, name: "Layout Overview", url: "/api/placeholder/500/600", area: "1,200 sq ft" }
  ];
  
  export const favoriteProperties: FavoriteProperty[] = [
    { id: 1, title: "Modern Studio", price: "$1,800", image: "/api/placeholder/300/200" },
    { id: 2, title: "Penthouse Suite", price: "$4,200", image: "/api/placeholder/300/200" },
    { id: 3, title: "Garden Apartment", price: "$2,100", image: "/api/placeholder/300/200" }
  ];
  
  export const tabs: Tab[] = [
    { id: 'main', label: 'Main' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'features', label: 'Features' },
    { id: 'locations', label: 'Locations' },
    { id: 'images', label: 'Images' },
    { id: 'floorplan', label: 'Floor Plan' },
    { id: 'favourites', label: 'Favourites' }
  ];