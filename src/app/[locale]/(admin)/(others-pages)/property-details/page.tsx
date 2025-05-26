'use client';

import { useEffect, useState, useCallback } from 'react';
import Table from '@/components/tables/Table';
import ModalForm from '@/components/tables/ModalTableForm';
import { getData, postData, deleteData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import Image from 'next/image';
import Toast from '@/components/Toast';

type PropertyFeature = {
  id: number;
  type: string;
  key: string;
  value: string;
};

type PropertyAmenity = {
  id: number;
  title: string;
};

type PropertyImage = {
  id: number;
  image: string;
};

type Property = {
  id: number;
  user: string | null;
  type: string;
  area: string | null;
  price: number;
  down_price: number;
  sqt: number;
  bathroom: number;
  bedroom: number;
  kitichen: number;
  status: string;
  apartment_office: string;
  immediate_delivery: string;
  title: string;
  description: string;
  keywords: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  counts: number | null;
  features: PropertyFeature[];
  amenities: PropertyAmenity[];
  property_listing_images: PropertyImage[];
  // property_floor_plans: any[];
  // property_locations: any[];
  // property_price_trackings: any[];
};

type ToastState = {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
};

type ModalState = {
  type: 'create' | 'edit' | 'view' | 'quick' | null;
  item?: Property;
};

export default function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  });
  const [modalState, setModalState] = useState<ModalState>({ type: null });

  // Toast helper function
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // Initialize token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('Token not found in localStorage');
      showToast('Authentication token not found', 'error');
    }
  }, [showToast]);

  // Fetch properties when token is available
  const fetchItems = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const res = await getData('owner/property_listings', {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      setItems(res.data ?? []);
    } catch (error) {
      console.error('Failed to fetch properties', error);
      showToast('Failed to fetch properties', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (token) {
      fetchItems(token);
    }
  }, [token, fetchItems]);

  // Handler functions
  const handleDelete = useCallback(async (item: Property) => {
    if (!token) {
      showToast('Authentication token not found', 'error');
      return;
    }
    try {
      await deleteData(`owner/property_listings/${item.id}`, new AxiosHeaders({
        Authorization: `Bearer ${token}`,
      }));
      
      await fetchItems(token);
      showToast('Property deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed', error);
      showToast('Failed to delete property', 'error');
    }
  }, [token, fetchItems, showToast]);

  const handleView = useCallback((item: Property) => {
    setModalState({ type: 'view', item });
    showToast('Property loaded successfully', 'success');
  }, [showToast]);

  const handleEdit = useCallback((item: Property) => {
    setModalState({ type: 'edit', item });
    showToast('Edit form opened', 'info');
  }, [showToast]);

  const handleQuickView = useCallback((item: Property) => {
    setModalState({ type: 'quick', item });
    showToast('Opening quick view', 'info');
  }, [showToast]);

  const handleCreate = useCallback(() => {
    setModalState({ type: 'create' });
    showToast('Create form opened', 'info');
  }, [showToast]);

  const handleSubmit = useCallback(async (formData: FormData) => {
    if (!token) {
      showToast('Authentication token not found', 'error');
      return;
    }

    const payload = new FormData();
    
    // Basic property fields
    payload.append('title', formData.get('title') as string);
    payload.append('description', formData.get('description') as string);
    payload.append('slug', formData.get('slug') as string);
    payload.append('type', formData.get('type') as string);
    payload.append('price', formData.get('price') as string);
    payload.append('down_price', formData.get('down_price') as string);
    payload.append('sqt', formData.get('sqt') as string);
    payload.append('bathroom', formData.get('bathroom') as string);
    payload.append('bedroom', formData.get('bedroom') as string);
    payload.append('kitichen', formData.get('kitichen') as string);
    payload.append('status', formData.get('status') as string);
    payload.append('apartment_office', formData.get('apartment_office') as string);
    payload.append('immediate_delivery', formData.get('immediate_delivery') as string);
    payload.append('keywords', formData.get('keywords') as string);
    payload.append('meta_title', formData.get('meta_title') as string);
    payload.append('meta_description', formData.get('meta_description') as string);
    payload.append('meta_keywords', formData.get('meta_keywords') as string);

    // Handle file uploads
    const images = formData.getAll('images') as File[];
    images.forEach((image, index) => {
      if (image.size > 0) {
        payload.append(`images[${index}]`, image);
      }
    });

    try {
      if (modalState.type === 'create') {
        await postData('owner/property_listings', payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast('Property created successfully', 'success');
      } else if (modalState.type === 'edit' && modalState.item) {
        await postData(`owner/property_listings/${modalState.item.id}`, payload, new AxiosHeaders({
          Authorization: `Bearer ${token}`,
        }));
        showToast('Property updated successfully', 'success');
      }

      await fetchItems(token);
      setModalState({ type: null });
    } catch (error) {
      console.error('Save failed', error);
      showToast('Failed to save property', 'error');
    }
  }, [token, modalState, fetchItems, showToast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          duration={3000}
        />
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Table<Property>
          data={items}
          columns={[
            { key: 'title', label: 'Title' },
            { 
              key: 'type', 
              label: 'Type',
              render: (item) => (
                <span className="capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                  {item.type}
                </span>
              )
            },
            { 
              key: 'price', 
              label: 'Price',
              render: (item) => (
                <span className="font-semibold text-green-600">
                  {formatPrice(item.price)}
                </span>
              )
            },
            { 
              key: 'status', 
              label: 'Status',
              render: (item) => (
                <span className={`capitalize px-2 py-1 rounded-full text-sm ${
                  item.status === 'sale' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.status}
                </span>
              )
            },
            {
              key: 'property_listing_images',
              label: 'Images',
              render: (item) => (
                <div className="flex space-x-1">
                  {item.property_listing_images.slice(0, 3).map((img, index) => (
                    <Image 
                      key={img.id} 
                      src={img.image} 
                      alt={`Property ${index + 1}`} 
                      width={40} 
                      height={40} 
                      className="rounded object-cover" 
                    />
                  ))}
                  {item.property_listing_images.length > 3 && (
                    <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs">
                      +{item.property_listing_images.length - 3}
                    </div>
                  )}
                </div>
              ),
            },
            { 
              key: 'bedroom', 
              label: 'Beds',
              render: (item) => `${item.bedroom} BR`
            },
            { 
              key: 'bathroom', 
              label: 'Baths',
              render: (item) => `${item.bathroom} BA`
            },
          ]}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onView={handleView}
          onEdit={handleEdit}
          onQuickView={handleQuickView}
        />
      )}

      <ModalForm
        open={!!modalState.type}
        title={
          modalState.type === 'create'
            ? 'Create Property'
            : modalState.type === 'edit'
            ? 'Edit Property'
            : 'View Property'
        }
        onClose={() => setModalState({ type: null })}
      >
        {modalState.type === 'view' || modalState.type === 'quick' ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Title:</p>
                <p>{modalState.item?.title}</p>
              </div>
              <div>
                <p className="font-semibold">Type:</p>
                <p className="capitalize">{modalState.item?.type}</p>
              </div>
              <div>
                <p className="font-semibold">Price:</p>
                <p className="text-green-600 font-semibold">
                  {modalState.item && formatPrice(modalState.item.price)}
                </p>
              </div>
              <div>
                <p className="font-semibold">Down Payment:</p>
                <p>{modalState.item && formatPrice(modalState.item.down_price)}</p>
              </div>
              <div>
                <p className="font-semibold">Square Feet:</p>
                <p>{modalState.item?.sqt} sqft</p>
              </div>
              <div>
                <p className="font-semibold">Status:</p>
                <p className="capitalize">{modalState.item?.status}</p>
              </div>
              <div>
                <p className="font-semibold">Bedrooms:</p>
                <p>{modalState.item?.bedroom}</p>
              </div>
              <div>
                <p className="font-semibold">Bathrooms:</p>
                <p>{modalState.item?.bathroom}</p>
              </div>
            </div>
            
            <div>
              <p className="font-semibold">Description:</p>
              <p className="text-gray-600">{modalState.item?.description}</p>
            </div>

            {modalState.item?.features && modalState.item.features.length > 0 && (
              <div>
                <p className="font-semibold">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {modalState.item.features.map((feature) => (
                    <span key={feature.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {feature.key}: {feature.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {modalState.item?.amenities && modalState.item.amenities.length > 0 && (
              <div>
                <p className="font-semibold">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {modalState.item.amenities.map((amenity) => (
                    <span key={amenity.id} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {amenity.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {modalState.item?.property_listing_images && modalState.item.property_listing_images.length > 0 && (
              <div>
                <p className="font-semibold">Images:</p>
                <div className="grid grid-cols-3 gap-2">
                  {modalState.item.property_listing_images.map((img) => (
                    <Image 
                      key={img.id}
                      src={img.image} 
                      alt="Property" 
                      width={120} 
                      height={80} 
                      className="rounded object-cover"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleSubmit(formData);
            }}
            className="space-y-4 max-h-96 overflow-y-auto"
          >
            <div className="grid grid-cols-2 gap-4">
              <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Property Title"
                defaultValue={modalState.item?.title ?? ''}
                className="w-full border p-2 rounded"
                required
              />
              <label htmlFor="type" className="block text-sm font-medium mb-2">Type</label>
              <select
                name="type"
                defaultValue={modalState.item?.type ?? 'apartment'}
                className="w-full border p-2 rounded"
                required
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="office">Office</option>
              </select>
              <label htmlFor="price" className="block text-sm font-medium mb-2">Price</label>
              <input
                type="number"
                name="price"
                placeholder="Price"
                defaultValue={modalState.item?.price ?? ''}
                className="w-full border p-2 rounded"
                required
              />
              <label htmlFor="down_price" className="block text-sm font-medium mb-2">Down Payment</label>
              <input
                type="number"
                name="down_price"
                placeholder="Down Payment"
                defaultValue={modalState.item?.down_price ?? ''}
                className="w-full border p-2 rounded"
              />
              <label htmlFor="sqt" className="block text-sm font-medium mb-2">Square Feet</label>
              <input
                type="number"
                name="sqt"
                placeholder="Square Feet"
                defaultValue={modalState.item?.sqt ?? ''}
                className="w-full border p-2 rounded"
                required
              />
              <label htmlFor="status" className="block text-sm font-medium mb-2">Status</label>
              <select
                name="status"
                defaultValue={modalState.item?.status ?? 'sale'}
                className="w-full border p-2 rounded"
                required
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="sold">Sold</option>
              </select>
              <label htmlFor="bedroom" className="block text-sm font-medium mb-2">Bedrooms</label>
              <input
                type="number"
                name="bedroom"
                placeholder="Bedrooms"
                defaultValue={modalState.item?.bedroom ?? ''}
                className="w-full border p-2 rounded"
                required
              />
              <label htmlFor="bathroom" className="block text-sm font-medium mb-2">Bathrooms</label>
              <input
                type="number"
                name="bathroom"
                placeholder="Bathrooms"
                defaultValue={modalState.item?.bathroom ?? ''}
                className="w-full border p-2 rounded"
                required
              />
              <label htmlFor="kitichen" className="block text-sm font-medium mb-2">Kitchens</label>
              <input
                type="number"
                name="kitichen"
                placeholder="Kitchens"
                defaultValue={modalState.item?.kitichen ?? ''}
                className="w-full border p-2 rounded"
              />
              <label htmlFor="apartment_office" className="block text-sm font-medium mb-2">Apartment/Office</label>
              <select
                name="apartment_office"
                defaultValue={modalState.item?.apartment_office ?? 'apartment'}
                className="w-full border p-2 rounded"
              >
                <option value="apartment">Apartment</option>
                <option value="office">Office</option>
              </select>
              <label htmlFor="immediate_delivery" className="block text-sm font-medium mb-2">Immediate Delivery</label>
                    <select
                name="immediate_delivery"
                defaultValue={modalState.item?.immediate_delivery ?? 'no'}
                className="w-full border p-2 rounded"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>

            <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              placeholder="Property Description"
              defaultValue={modalState.item?.description ?? ''}
              className="w-full border p-2 rounded h-24"
              required
            />

            <label htmlFor="slug" className="block text-sm font-medium mb-2">URL Slug</label>
            <input
              type="text"
              name="slug"
              placeholder="URL Slug"
              defaultValue={modalState.item?.slug ?? ''}
              className="w-full border p-2 rounded"
              required
            />

            <label htmlFor="keywords" className="block text-sm font-medium mb-2">Keywords</label>
            <input
              type="text"
              name="keywords"
              placeholder="Keywords (comma separated)"
              defaultValue={modalState.item?.keywords ?? ''}
              className="w-full border p-2 rounded"
            />

            <label htmlFor="meta_title" className="block text-sm font-medium mb-2">Meta Title</label>
            <input
              type="text"
              name="meta_title"
              placeholder="Meta Title"
              defaultValue={modalState.item?.meta_title ?? ''}
              className="w-full border p-2 rounded"
            />

            <label htmlFor="meta_description" className="block text-sm font-medium mb-2">Meta Description</label>
            <textarea
              name="meta_description"
              placeholder="Meta Description"
              defaultValue={modalState.item?.meta_description ?? ''}
              className="w-full border p-2 rounded h-20"
            />

            <label htmlFor="meta_keywords" className="block text-sm font-medium mb-2">Meta Keywords</label>
            <input
              type="text"
              name="meta_keywords"
              placeholder="Meta Keywords"
              defaultValue={modalState.item?.meta_keywords ?? ''}
              className="w-full border p-2 rounded"
            />

              <div>
              <label className="block text-sm font-medium ">Property Images</label>
              <input 
                type="file" 
                name="images" 
                accept="image/*" 
                multiple 
                className="w-full border p-2 rounded" 
              />
              <p className="text-sm text-gray-500 mt-1">You can select multiple images</p>
            </div>

            <div className="flex space-x-2">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                {modalState.type === 'create' ? 'Create Property' : 'Update Property'}
              </button>
              <button 
                type="button" 
                onClick={() => setModalState({ type: null })}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </ModalForm>
    </div>
  );
}