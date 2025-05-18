// lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lemonchiffon-octopus-104052.hostingersite.com/api/v1/dashboard', // change to your API
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
