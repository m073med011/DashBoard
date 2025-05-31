"use client"
import React, { useState, useCallback } from 'react';
import { 
  Home, 
  MapPin, 
  Star, 
  Heart, 
  Wifi, 
  Car, 
  Dumbbell, 
  Shield, 
  Camera,
  Layout,
  Map,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

type TabType = 'main' | 'amenities' | 'features' | 'locations' | 'images' | 'floorplan' | 'favourites';

const PropertyDetailsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');
  const [isFavorite, setIsFavorite] = useState(false);

  // Sample data - in real app this would come from props/API
  const propertyData = {
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

  const amenities = [
    { name: "High-Speed WiFi", icon: Wifi, available: true },
    { name: "Parking Space", icon: Car, available: true },
    { name: "Gym Access", icon: Dumbbell, available: true },
    { name: "24/7 Security", icon: Shield, available: true },
    { name: "Swimming Pool", icon: "🏊", available: false },
    { name: "Laundry", icon: "🧺", available: true },
    { name: "Air Conditioning", icon: "❄️", available: true },
    { name: "Balcony", icon: "🌿", available: true }
  ];

  const features = [
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

  const nearbyLocations = [
    { name: "Central Park", distance: "0.5 miles", type: "Park" },
    { name: "Subway Station", distance: "0.2 miles", type: "Transport" },
    { name: "Whole Foods", distance: "0.3 miles", type: "Grocery" },
    { name: "Coffee Shop", distance: "0.1 miles", type: "Cafe" },
    { name: "Hospital", distance: "1.2 miles", type: "Healthcare" },
    { name: "School", distance: "0.8 miles", type: "Education" }
  ];

  const images = [
    { id: 1, url: "/api/placeholder/600/400", title: "Living Room", category: "Interior" },
    { id: 2, url: "/api/placeholder/600/400", title: "Kitchen", category: "Interior" },
    { id: 3, url: "/api/placeholder/600/400", title: "Master Bedroom", category: "Interior" },
    { id: 4, url: "/api/placeholder/600/400", title: "Bathroom", category: "Interior" },
    { id: 5, url: "/api/placeholder/600/400", title: "Building Exterior", category: "Exterior" },
    { id: 6, url: "/api/placeholder/600/400", title: "City View", category: "View" }
  ];

  const floorPlans = [
    { id: 1, name: "2 Bed Floor Plan", url: "/api/placeholder/500/600", area: "1,200 sq ft" },
    { id: 2, name: "Layout Overview", url: "/api/placeholder/500/600", area: "1,200 sq ft" }
  ];

  const favoriteProperties = [
    { id: 1, title: "Modern Studio", price: "$1,800", image: "/api/placeholder/300/200" },
    { id: 2, title: "Penthouse Suite", price: "$4,200", image: "/api/placeholder/300/200" },
    { id: 3, title: "Garden Apartment", price: "$2,100", image: "/api/placeholder/300/200" }
  ];

  const tabs = [
    { id: 'main', label: 'Main' },
    { id: 'amenities', label: 'Amenities' },
    { id: 'features', label: 'Features' },
    { id: 'locations', label: 'Locations' },
    { id: 'images', label: 'Images' },
    { id: 'floorplan', label: 'Floor Plan' },
    { id: 'favourites', label: 'Favourites' }
  ];

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  const toggleFavorite = useCallback(() => {
    setIsFavorite(prev => !prev);
  }, []);

  const TabButton = ({ label, isActive, onClick }: {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-6 py-3 rounded-t-lg font-medium transition-colors duration-200 ${
        isActive
          ? "bg-blue-600 text-white border-b-2 border-blue-600"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">{label}</span>
      </div>
    </button>
  );

  const ReadOnlyField = ({ label, value }: {
    label: string;
    value: string;
  }) => (
    <div>
      <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[40px] flex items-center">
        {value || "No data"}
      </div>
    </div>
  );

  const renderMainTab = () => (
    <div className="mb-8">
      {/* Property Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {propertyData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{propertyData.address}</p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="fill-yellow-400 text-yellow-400" size={16} />
                <span>{propertyData.rating}</span>
                <span className="text-gray-500">({propertyData.reviews} reviews)</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{propertyData.price}</div>
            <div className="text-gray-600 dark:text-gray-400">{propertyData.type}</div>
          </div>
        </div>
      </div>

      {/* Basic Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <ReadOnlyField label="Bedrooms" value={propertyData.bedrooms.toString()} />
        <ReadOnlyField label="Bathrooms" value={propertyData.bathrooms.toString()} />
        <ReadOnlyField label="Area" value={propertyData.area} />
        <ReadOnlyField label="Year Built" value={propertyData.yearBuilt} />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
        <div className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[100px]">
          {propertyData.description}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Contact Information</h3>
        <div className="flex flex-wrap gap-3">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2">
            <Phone size={18} />
            Call Now
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2">
            <Mail size={18} />
            Email
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2">
            <Calendar size={18} />
            Schedule Tour
          </button>
        </div>
      </div>
    </div>
  );

  const renderAmenitiesTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Amenities</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {amenities.map((amenity, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
            <div className="flex items-center gap-3">
              {typeof amenity.icon === 'string' ? (
                <span className="text-2xl">{amenity.icon}</span>
              ) : (
                <amenity.icon 
                  size={24} 
                  className={amenity.available ? 'text-green-600' : 'text-gray-400'} 
                />
              )}
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-200">
                  {amenity.name}
                </div>
                <div className={`text-sm ${
                  amenity.available ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {amenity.available ? 'Available' : 'Not Available'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Property Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-800 dark:text-gray-200">{feature}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLocationsTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Nearby Locations</h3>
      <div className="space-y-4 mb-6">
        {nearbyLocations.map((location, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100">{location.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{location.type}</div>
                </div>
              </div>
              <div className="text-blue-600 font-medium">{location.distance}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500 h-64 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Map size={48} className="mx-auto mb-2" />
          <div>Interactive Map View</div>
          <div className="text-sm">Map integration would go here</div>
        </div>
      </div>
    </div>
  );

  const renderImagesTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Property Images</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images.map((image) => (
          <div key={image.id}>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{image.title}</label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center rounded">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Camera size={32} className="mx-auto mb-2" />
                  <div className="font-medium">{image.title}</div>
                  <div className="text-sm">{image.category}</div>
                </div>
              </div>
              <a 
                href="#" 
                className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                View Full Size
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFloorPlanTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Floor Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {floorPlans.map((plan) => (
          <div key={plan.id}>
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-300">{plan.name}</label>
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="aspect-[4/5] bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center rounded mb-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Layout size={48} className="mx-auto mb-4" />
                  <div className="font-medium text-lg">{plan.name}</div>
                  <div className="text-sm">{plan.area}</div>
                </div>
              </div>
              <a 
                href="#" 
                className="inline-block text-blue-600 hover:text-blue-800 text-sm"
              >
                Download Floor Plan
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFavouritesTab = () => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Your Favourite Properties</h3>
      {favoriteProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteProperties.map((property) => (
            <div key={property.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center rounded mb-4 relative">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <Home size={32} className="mx-auto mb-2" />
                  <div className="font-medium">{property.title}</div>
                </div>
                <button 
                  onClick={toggleFavorite}
                  className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <Heart 
                    size={20} 
                    className={`${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} transition-colors`} 
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-600 font-bold text-xl">{property.price}</span>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-center text-gray-500 dark:text-gray-400">
          <Heart size={48} className="mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No favourites yet</h3>
          <p>Properties you favourite will appear here</p>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'main': return renderMainTab();
      case 'amenities': return renderAmenitiesTab();
      case 'features': return renderFeaturesTab();
      case 'locations': return renderLocationsTab();
      case 'images': return renderImagesTab();
      case 'floorplan': return renderFloorPlanTab();
      case 'favourites': return renderFavouritesTab();
      default: return renderMainTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                Property Details: {propertyData.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete information about this property
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleFavorite}
                className={`font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 ${
                  isFavorite 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                <Heart 
                  size={20} 
                  className={`inline mr-2 ${isFavorite ? 'fill-current' : ''}`} 
                />
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                label={tab.label}
                isActive={activeTab === tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
              />
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsPage;