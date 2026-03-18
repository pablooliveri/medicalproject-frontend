import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://medicalproject-backend-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  seed: () => api.post('/auth/seed')
};

// Residents
export const residentsAPI = {
  getAll: (params) => api.get('/residents', { params }),
  getOne: (id) => api.get(`/residents/${id}`),
  getFull: (id) => api.get(`/residents/${id}/full`),
  create: (data) => api.post('/residents', data),
  update: (id, data) => api.put(`/residents/${id}`, data),
  delete: (id) => api.delete(`/residents/${id}`)
};

// Medications
export const medicationsAPI = {
  getAll: (params) => api.get('/medications', { params }),
  getOne: (id) => api.get(`/medications/${id}`),
  create: (data) => api.post('/medications', data),
  update: (id, data) => api.put(`/medications/${id}`, data),
  delete: (id) => api.delete(`/medications/${id}`)
};

// Resident Medications
export const residentMedicationsAPI = {
  getAll: (params) => api.get('/resident-medications', { params }),
  getOne: (id) => api.get(`/resident-medications/${id}`),
  assign: (data) => api.post('/resident-medications', data),
  update: (id, data) => api.put(`/resident-medications/${id}`, data),
  deactivate: (id, data) => api.put(`/resident-medications/${id}/deactivate`, data),
  reactivate: (id) => api.put(`/resident-medications/${id}/reactivate`)
};

// Medication History
export const medicationHistoryAPI = {
  getHistory: (residentId, params) => api.get(`/medication-history/${residentId}`, { params }),
  getMonths: (residentId) => api.get(`/medication-history/${residentId}/months`),
  getSnapshot: (residentId, params) => api.get(`/medication-history/${residentId}/snapshot`, { params })
};

// Deliveries
export const deliveriesAPI = {
  getAll: (params) => api.get('/deliveries', { params }),
  getOne: (id) => api.get(`/deliveries/${id}`),
  create: (data) => api.post('/deliveries', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/deliveries/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/deliveries/${id}`),
  getHistory: (params) => api.get('/deliveries/history', { params })
};

// Stock
export const stockAPI = {
  getStatus: (residentId) => api.get(`/stock/status/${residentId}`),
  adjust: (data) => api.put('/stock/adjust', data),
  manualDeduction: () => api.post('/stock/deduct'),
  getMovements: (params) => api.get('/stock/movements', { params })
};

// Notifications
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.put('/notifications/mark-all-read'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  delete: (id) => api.delete(`/notifications/${id}`),
  checkStock: () => api.post('/notifications/check-stock')
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeLogo: () => api.delete('/settings/logo'),
  addBranch: (name) => api.post('/settings/branches', { name }),
  updateBranch: (oldName, newName) => api.put('/settings/branches', { oldName, newName }),
  deleteBranch: (name) => api.delete(`/settings/branches/${encodeURIComponent(name)}`)
};

// Reports
export const reportsAPI = {
  deliveryReport: (id) => api.get(`/reports/delivery/${id}`, { responseType: 'blob' }),
  residentReport: (id, params = {}) => api.get(`/reports/resident/${id}`, { responseType: 'blob', params }),
  allResidentsReport: (params = {}) => api.get('/reports/all-residents', { responseType: 'blob', params })
};

export default api;
