'use client';

import axios from 'axios';
import api from '@/libs/axios/server';
import { useAuthStore } from '../store/auth';

type LoginPayload = {
  email: string;  
  password: string;
};

export const login = async (data: LoginPayload) => {
  const response = await api.post('/owner/login', data);
  const { token, data: user } = response.data;

  await axios.post(`/api/auth/login`, { token, user: JSON.stringify(user), remember: false });

  // Save token to localStorage
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));

  // Save to Zustand
  useAuthStore.getState().login(user, token);
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  useAuthStore.getState().logout();
};
