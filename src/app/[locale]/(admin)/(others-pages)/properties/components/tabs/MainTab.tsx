import React from 'react';
import Image from 'next/image';
import { Phone, Mail } from 'lucide-react';
import { PropertyData } from '@/types/PropertyTypes';
import { ReadOnlyField } from '../TabButton';

interface MainTabProps {
  property: PropertyData;
}

export const MainTab: React.FC<MainTabProps> = ({ property }) => {
  return (
    <div className="mb-8">
      {/* Property Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {property?.descriptions?.en?.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {property?.area?.description?.en?.name}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">
                Type: {property?.type?.descriptions?.en?.title}
              </span>
              <span className="text-gray-500">
                Status: {property?.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              ${property?.price?.toLocaleString()}
            </div>
            {property?.down_price && (
              <div className="text-gray-600 dark:text-gray-400">
                Down: ${property?.down_price?.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Basic Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <ReadOnlyField label="Bedrooms" value={property?.bedroom} />
        <ReadOnlyField label="Bathrooms" value={property?.bathroom} />
        <ReadOnlyField label="Kitchens" value={property?.kitichen} />
        <ReadOnlyField label="Square Feet" value={`${property?.sqt} sq ft`} />
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
        <div 
          className="w-full px-4 py-2 border rounded-md bg-gray-50 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200 min-h-[100px]"
          dangerouslySetInnerHTML={{ __html: property?.descriptions?.en?.description }}
        />
      </div>

      {/* Owner Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">Owner Information</h3>
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-500">
          <div className="flex items-center gap-4 mb-4">
            {property?.user?.avatar && (
              <Image
                src={property?.user?.avatar}
                alt={property?.user?.name}
                width={60}
                height={60}
                className="rounded-full"
              />
            )}
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {property?.user?.name}
              </div>
              <div className="text-sm text-gray-500">
                {property?.user?.email}
              </div>
              {property?.user?.phone && (
                <div className="text-sm text-gray-500">
                  {property?.user?.phone}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2">
              <Phone size={18} />
              Call Owner
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition duration-200 flex items-center gap-2">
              <Mail size={18} />
              Email Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};