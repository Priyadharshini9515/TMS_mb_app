import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Current Wi-Fi IPv4: 10.39.79.244
const DEV_LAN_IP = '10.39.79.244';

// Use localhost/window.location when running in web browser, or dynamically detect LAN IP when running on mobile device
const getBaseHost = () => {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }

  // Auto-detect host IP from Metro bundle URL on mobile devices
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:5000`;
      }
    }
  } catch (e) {
    console.log('Error detecting host IP:', e);
  }

  return `http://${DEV_LAN_IP}:5000`;
};

export const SERVER_ROOT_URL = getBaseHost();
export const API_BASE_URL = `${SERVER_ROOT_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});



// Attach JWT Token to every outgoing request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching token from storage:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const departmentService = {
  create: (data) => api.post('/departments', data),
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
};

export const programmeService = {
  create: (data) => api.post('/programmes', data),
  getAll: (params) => api.get('/programmes', { params }),
  getById: (id) => api.get(`/programmes/${id}`),
  update: (id, data) => api.put(`/programmes/${id}`, data),
  delete: (id) => api.delete(`/programmes/${id}`),
};

export const blockService = {
  create: (data) => api.post('/blocks', data),
  getAll: (params) => api.get('/blocks', { params }),
  getById: (id) => api.get(`/blocks/${id}`),
  update: (id, data) => api.put(`/blocks/${id}`, data),
  delete: (id) => api.delete(`/blocks/${id}`),
};

export const roomService = {
  create: (data) => api.post('/rooms', data),
  getAll: (params) => api.get('/rooms', { params }),
  getById: (id) => api.get(`/rooms/${id}`),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
};

export const roleService = {
  create: (data) => api.post('/roles', data),
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
};

export const userService = {
  create: (data) => api.post('/users', data),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const complaintService = {
  create: (formData) => {
    if (Platform.OS === 'web') {
      return api.post('/complaints', formData);
    }
    return api.post('/complaints', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getStats: () => api.get('/complaints/stats'),
  assign: (id, assignedTo) => api.patch(`/complaints/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  report: (params) => api.get('/complaints/report', { params }),
};

export default api;
