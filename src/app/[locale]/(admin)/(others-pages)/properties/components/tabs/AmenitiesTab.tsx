import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { PropertyData } from '@/types/PropertyTypes';
import { deleteData, postData, getData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import ModalForm from '@/components/tables/ModalTableForm';
// import { PropertyAmenity } from '@/types/PropertyTypes';
import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';

interface AmenitiesTabProps {
  // propertyId: string;
  property: PropertyData;
  onUpdate?: () => void; // Callback to refresh property data
  refetch?: () => void; // Callback to refresh property data
}

interface AvailableAmenity {
  id: number;
  title: string;
  descriptions: {
    en: {
      title: string;
    };
    ar: {
      title: string;
    };
  };
  image?: string;
}

export const AmenitiesTab: React.FC<AmenitiesTabProps> = ({ property, onUpdate, refetch }) => {
  const params = useParams();
  const propertyId = params?.id as string;
  const locale = useLocale();
  const t = useTranslations("Amenities");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAmenitiesListModal, setShowAmenitiesListModal] = useState(false);
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [amenitiesListLoading, setAmenitiesListLoading] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<AvailableAmenity[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);

  // Get currently selected amenity IDs from property
  const getCurrentlySelectedAmenityIds = (): number[] => {
    return property?.amenities?.map(amenity => amenity.id) || [];
  };

  const handleAddAmenitiesClick = async () => {
    setShowAmenitiesListModal(true);
    setAmenitiesListLoading(true);
    
    // Initialize with currently selected amenities
    const currentlySelected = getCurrentlySelectedAmenityIds();
    setSelectedAmenityIds(currentlySelected);
    
    try {
      const token = localStorage.getItem('token');
      const response = await getData('owner/amenities', {}, new AxiosHeaders({
        lang: locale,
        Authorization: `Bearer ${token}`,
      }));
      
      setAvailableAmenities(response.data || []);
    } catch (error) {
      console.error('Failed to fetch amenities:', error);
    } finally {
      setAmenitiesListLoading(false);
    }
  };

  const handleAmenityCheckboxChange = (amenityId: number, checked: boolean) => {
    if (checked) {
      setSelectedAmenityIds(prev => [...prev, amenityId]);
    } else {
      setSelectedAmenityIds(prev => prev.filter(id => id !== amenityId));
    }
  };

  const handleAddSelectedAmenities = async () => {
    const currentlySelected = getCurrentlySelectedAmenityIds();
    
    // Check if there are any changes
    const hasChanges = 
      selectedAmenityIds.length !== currentlySelected.length ||
      !selectedAmenityIds.every(id => currentlySelected.includes(id)) ||
      !currentlySelected.every(id => selectedAmenityIds.includes(id));
    
    // If no changes, just close the modal
    if (!hasChanges) {
      setShowAmenitiesListModal(false);
      return;
    }
    
    if (selectedAmenityIds.length === 0) {
      // If user deselected all amenities, we might want to handle this case
      // For now, we'll just close the modal
      setShowAmenitiesListModal(false);
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Send all selected amenity IDs (both existing and new ones)
      const formDataToSend = new FormData();
      formDataToSend.append('property_id', propertyId);
      
      // Add all selected amenity IDs
      selectedAmenityIds.forEach((amenityId, index) => {
        formDataToSend.append(`amenity_ids[${index}]`, amenityId.toString());
      });
      
      // If you need to update/replace amenities instead of just adding, 
      // you might need a different endpoint or method
      await postData(`owner/properties/${propertyId}/amenities`, formDataToSend, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }));
      
      setShowAmenitiesListModal(false);
      setSelectedAmenityIds([]);
      
      // Refetch data to update the UI
      refetch?.();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (amenityId: string) => {
    setSelectedAmenityId(amenityId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAmenityId) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await deleteData(`owner/amenities/${selectedAmenityId}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      setShowDeleteModal(false);
      setSelectedAmenityId(null);
      
      // Refetch data to update the UI
      refetch?.();
      
      // Call the update callback to refresh the property data
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to delete amenity:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAmenitiesListModal = () => {
    const currentlySelected = getCurrentlySelectedAmenityIds();
    const hasChanges = 
      selectedAmenityIds.length !== currentlySelected.length ||
      !selectedAmenityIds.every(id => currentlySelected.includes(id)) ||
      !currentlySelected.every(id => selectedAmenityIds.includes(id));

    return (
      <div>
        {amenitiesListLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-lg">{t("Loading amenities...")}</p>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t("Select amenities for this property:")}
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {availableAmenities.map((amenity) => {
                const isSelected = selectedAmenityIds.includes(amenity.id);
                
                return (
                  <div 
                    key={amenity.id} 
                    className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors duration-200 ${
                      isSelected 
                        ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={`amenity-${amenity.id}`}
                      checked={isSelected}
                      onChange={(e) => handleAmenityCheckboxChange(amenity.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    {/* Amenity Icon */}
                    <div className="flex-shrink-0">
                      {amenity.image ? (
                        <Image
                          width={24}
                          height={24}
                          src={amenity.image} 
                          alt={locale === 'ar' ? amenity.descriptions.ar.title : amenity.descriptions.en.title}
                          className="h-6 w-6 object-contain"
                        />
                      ) : (
                        <div className="h-6 w-6 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">?</span>
                        </div>
                      )}
                    </div>
                    
                    <label htmlFor={`amenity-${amenity.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {locale === 'ar' ? amenity.descriptions.ar.title : amenity.descriptions.en.title}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {locale === 'ar' ? amenity.descriptions.en.title : amenity.descriptions.ar.title}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
            
            {availableAmenities.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t("No amenities available")}
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAmenitiesListModal(false);
                  setSelectedAmenityIds([]);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
                disabled={loading}
              >
                {t("Cancel")}
              </button>
              <button
                onClick={handleAddSelectedAmenities}
                className={`px-4 py-2 text-white rounded-md transition duration-200 disabled:opacity-50 ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={loading || !hasChanges}
              >
                {loading 
                  ? t("Updating...") 
                  : hasChanges 
                    ? t(`Update Selection (${selectedAmenityIds.length})`) 
                    : t("No Changes")
                }
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t("Amenities")}</h3> 
        <button
          onClick={handleAddAmenitiesClick}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2"
        >
          <Plus size={20} />
          {t("Manage Amenities")}
        </button>
      </div>

      {property?.amenities?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {property?.amenities?.map((amenity) => (
            <div key={amenity.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {amenity.image && (
                    <Image
                      width={24}
                      height={24}
                      src={amenity.image} 
                      alt={amenity.title}
                      className="h-6 w-6 object-contain"
                    />
                  )}
                  <div className="font-medium text-gray-800 dark:text-gray-200">
                    {amenity?.title}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteClick(amenity?.id?.toString())}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition duration-200"
                    title="Delete amenity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t("No amenities listed for this property")}
        </div>
      )}

      {/* Manage Amenities Modal */}
      <ModalForm
        className='max-w-xl'
        open={showAmenitiesListModal}
        title={t("Manage Property Amenities")} 
        onClose={() => {
          setShowAmenitiesListModal(false);
          setSelectedAmenityIds([]);
        }}
      >
        {renderAmenitiesListModal()}
      </ModalForm>

      {/* Delete Confirmation Modal */}
      <ModalForm
        className='max-w-md'
        open={showDeleteModal}
        title={t("Confirm Delete")} 
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAmenityId(null);
        }}
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t("Are you sure you want to delete this amenity? This action cannot be undone")}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowDeleteModal(false);
              setSelectedAmenityId(null);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-200"
            disabled={loading}
          >
            {t("Cancel")}
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? t("Deleting") : t("Delete")}
          </button>
        </div>
      </ModalForm>
    </div>
  );
};