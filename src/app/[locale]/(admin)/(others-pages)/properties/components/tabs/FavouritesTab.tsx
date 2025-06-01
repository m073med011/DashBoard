import React from 'react';
import { Home, Heart } from 'lucide-react';
import { FavoriteProperty } from '@/types/PropertyTypes';

interface FavouritesTabProps {
  favoriteProperties: FavoriteProperty[];
  isFavorite: boolean;
  toggleFavorite: () => void;
}

const FavouritesTab: React.FC<FavouritesTabProps> = ({ 
  favoriteProperties, 
  isFavorite, 
  toggleFavorite 
}) => (
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

export default FavouritesTab;