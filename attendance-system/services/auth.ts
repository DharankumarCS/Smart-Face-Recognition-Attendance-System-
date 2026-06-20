import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export const login = async (credentials: {
  email?: string;
  register_number?: string;
  date_of_birth?: string;
  password: string;
  role: string;
}) => {
  const response = await api.post('/auth/login', credentials);
  const { token, user } = response.data;
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('userRole', user.role);
  await AsyncStorage.setItem('userData', JSON.stringify(user));
  return user;
};

export const logout = async () => {
  await AsyncStorage.multiRemove(['token', 'userRole', 'userData']);
};

export const getCurrentUser = async () => {
  const data = await AsyncStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const getStoredRole = async () => {
  return await AsyncStorage.getItem('userRole');
};
