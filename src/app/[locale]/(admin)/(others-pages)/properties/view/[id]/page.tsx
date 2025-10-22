'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Toast from '@/components/Toast';
import { TabType } from '@/types/PropertyTypes';
import { useProperty } from '@/app/[locale]/(admin)/(others-pages)/properties/useProperty';
import { PROPERTY_TABS } from '@/app/[locale]/(admin)/(others-pages)/properties/constants/property';
import {TabButton,LoadingSpinner,NotFoundMessage} from '@/app/[locale]/(admin)/(others-pages)/properties/components/TabButton';
import { MainTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/MainTab';
import { AmenitiesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/AmenitiesTab';
import { FeaturesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/FeaturesTab';
import { LocationTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/LocationsTab';
import { ImagesTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/ImagesTab';
import { FloorPlanTab } from '@/app/[locale]/(admin)/(others-pages)/properties/components/tabs/FloorPlanTab';
import { useTranslations } from 'next-intl';
import { Edit, Eye } from 'lucide-react';

export default function PropertyDetailsPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  const t = useTranslations("properties");
  const { property, propertystat, loading, toast, refetch } = useProperty(propertyId);
  const [activeTab, setActiveTab] = useState<TabType>('images');
  const [isEditMode, setIsEditMode] = useState(false);

  // Update page title when property loads
  useEffect(() => {
    if (property) {
      const title = property?.title || 'Property Details';
      const propertyType = property.type?.title || '';
      document.title = `${title} ${propertyType ? '- ' + propertyType : ''} | Real Estate`;
    } else if (!loading) {
      document.title = 'Property Not Found';
    } else {
      document.title = 'Loading Property...';
    }
  }, [property, loading]);

  const handleEditSuccess = () => {
    setIsEditMode(false);
    refetch(); // Refresh the property data
  };

  const renderTabContent = () => {
    if (!property) return null;
    switch (activeTab) {
      case 'main':
        return propertystat ? (
          <MainTab
            property={property}
            propertystat={propertystat}
            refetch={refetch}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onEditSuccess={handleEditSuccess}
          />
        ) : null;
      case 'amenities':
        return <AmenitiesTab property={property} refetch={refetch} />;
      case 'features':
        return <FeaturesTab property={property} refetch={refetch} />;
      case 'locations':
        return <LocationTab property={property} refetch={refetch} />;
      case 'images':
        return <ImagesTab property={property} refetch={refetch} />;
      case 'floorplan':
        return <FloorPlanTab property={property} refetch={refetch} />;
      default:
        return propertystat ? (
          <MainTab
            refetch={refetch}
            property={property}
            propertystat={propertystat}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            onEditSuccess={handleEditSuccess}
          />
        ) : null;
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
      {toast?.show && (
        <Toast message={toast?.message} type={toast?.type} duration={3000} />
      )}
     
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">
                {t("Name")} : {property?.descriptions?.en?.title}
              </h1>
            </div>
            
            {/* View/Edit Mode Toggle - Only show on main tab */}
            {activeTab === 'main' && (
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setIsEditMode(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    !isEditMode 
                      ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {t("view")}
                </button>
                <button
                  onClick={() => setIsEditMode(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                    isEditMode 
                      ? 'bg-white dark:bg-gray-600 text-orange-600 dark:text-orange-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  {t("edit")}
                </button>
              </div>
            )}
          </div>
         
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
              {PROPERTY_TABS.map((tab) => (
                <TabButton
                  key={tab.id}
                  label={t(tab.label)}
                  isActive={activeTab === tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Reset edit mode when switching tabs
                    if (tab.id !== 'main') {
                      setIsEditMode(false);
                    }
                  }}
                />
              ))}
            </div>
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