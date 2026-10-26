import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// const API_BASE_URL = 'https://tms-backend-ob37.onrender.com/api';

const getToken = () => {
  return localStorage.getItem('token');
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  register: (userData) =>
    api.post('/auth/register', userData),
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
  create: (formData) => api.post('/complaints', formData),
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getStats: () => api.get('/complaints/stats'),
  assign: (id, assignedTo) => api.patch(`/complaints/${id}/assign`, { assignedTo }),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
  report: (params) => api.get('/complaints/report', { params }),
};

export default api;
