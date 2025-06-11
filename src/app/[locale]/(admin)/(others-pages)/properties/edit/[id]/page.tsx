'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
// import { Heart } from 'lucide-react';
import Toast from '@/components/Toast';
import { TabType } from '@/types/PropertyTypes';
import { useProperty } from '@/app/[locale]/(admin)/(others-pages)/properties/useProperty';
import { PROPERTY_TABS } from '@/app/[locale]/(admin)/(others-pages)/properties/constants/property';
import {
  TabButton,
  LoadingSpinner,
  NotFoundMessage
} from '@/app/[locale]/(admin)/(others-pages)/properties/components/TabButton';
import { MainTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/MainTab';
import { AmenitiesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/AmenitiesTab';
import { FeaturesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/FeaturesTab';
import { LocationTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/LocationsTab'; 
import { ImagesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/ImagesTab';
import { FloorPlanTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/FloorPlanTab';

export default function PropertyDetailsPage() {
  const t = useTranslations("properties");
  const params = useParams();
  const propertyId = params?.id as string;
 
  const { property, propertystat, loading, toast } = useProperty(propertyId);
  const [activeTab, setActiveTab] = useState<TabType>('main');
  // const [isFavorite, setIsFavorite] = useState(false);

  const renderTabContent = () => {
    if (!property) return null;

    switch (activeTab) {
      case 'main':
        return propertystat ? <MainTab property={property} propertystat={propertystat} /> : null;
      case 'amenities':
        return <AmenitiesTab property={property} />;
      case 'features':
        return <FeaturesTab property={property} />;
      case 'locations':
        return <LocationTab property={property} />;
      case 'images':
        return <ImagesTab property={property} />;
      case 'floorplan':
        return <FloorPlanTab property={property} />;
      default:
        return propertystat ? <MainTab property={property} propertystat={propertystat} /> : null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!property) {
    return <NotFoundMessage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6">
      {toast.show && (
        <Toast message={toast?.message} type={toast?.type} duration={3000} />
      )}
      
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {property?.descriptions?.en?.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t("property_id")}: {property?.id} • {property?.type?.descriptions?.en?.title}
              </p>
            </div>
            {/* <div className="flex space-x-3">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
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
            </div> */}
          </div>
         
          {/* Tab Navigation */}
          <div className="flex flex-wrap space-x-2 mb-6 border-b border-gray-200 dark:border-gray-700">
            {PROPERTY_TABS.map((tab) => (
              <TabButton
                key={tab.id}
                label={t(tab.label)}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}