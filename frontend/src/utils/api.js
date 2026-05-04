import axios from 'axios';

const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export const studentApi = {
  getAll: () => api.get('/students'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const attendanceApi = {
  getByFilter: (params) => api.get('/attendance', { params }),
  markBulk: (data) => api.post('/attendance/bulk', data),
};

export const feeApi = {
  getAll: () => api.get('/fees'),
  collect: (data) => api.post('/fees', data),
  updateStatus: (id, data) => api.put(`/fees/${id}`, data),
};

export const staffApi = {
  getAll: () => api.get('/staff'),
  create: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/${id}`),
};

export const statsApi = {
  getDashboard: () => api.get('/stats/dashboard'),
};

export const staffAttendanceApi = {
  get: (params) => api.get('/staff-attendance', { params }),
  markBulk: (data) => api.post('/staff-attendance/bulk', data),
};

export const subjectApi = {
  getAll: () => api.get('/subjects'),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};





export default api;
