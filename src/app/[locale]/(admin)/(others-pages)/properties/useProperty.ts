import { useEffect, useState, useCallback } from 'react';
import { getData } from '@/libs/axios/server';
import { AxiosHeaders } from 'axios';
import { PropertyData, ToastState,PropertyStatistics } from '@/types/PropertyTypes';


export const useProperty = (propertyId: string) => {
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [propertystat, setPropertystat] = useState<PropertyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    show: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const fetchProperty = useCallback(async (authToken: string, id: string) => {
    try {
      setLoading(true);
      const res = await getData(`owner/property_listings/${id}`, {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      if (res.data) {
        setProperty(res.data);
      } else {
        showToast('Property not found', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch property', error);
      showToast('Failed to load property details', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPropertyStatistics = useCallback(async (authToken: string, id: string) => {
    try {
      const res = await getData(`owner/property/${id}/statistics`, {}, new AxiosHeaders({
        Authorization: `Bearer ${authToken}`,
      }));
      if (res.data) {
        setPropertystat(res.data);
      } else {
        showToast('Property statistics not found', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch property statistics', error);
      showToast('Failed to load property statistics', 'error');
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      console.error('Token not found in localStorage');
      showToast('Authentication required', 'error');
    }
  }, []);

  useEffect(() => {
    if (token && propertyId) {
      fetchProperty(token, propertyId);
      fetchPropertyStatistics(token, propertyId);
    }
  }, [token, propertyId, fetchProperty, fetchPropertyStatistics]);

  return {
    property,
    propertystat,
    loading,
    toast,
    showToast,
    fetchProperty, // Export fetchProperty for manual refetching
    fetchPropertyStatistics // Export fetchPropertyStatistics for manual refetching
  };
};