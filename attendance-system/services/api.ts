import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
  HOW TO FIND YOUR IP:
  Windows: ipconfig → IPv4 Address under WiFi adapter
  Phone and laptop MUST be on same WiFi.
  Backend: uvicorn main:app --host 0.0.0.0 --port 8000
*/
export const BASE_URL = 'http://10.32.183.155:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'userRole', 'userData']);
    }
    return Promise.reject(error);
  }
);

export default api;
