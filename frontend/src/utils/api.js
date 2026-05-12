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
  getAll: (params) => api.get('/students', { params }),
  getForAttendance: (params) => api.get('/students/attendance-list', { params }),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

export const attendanceApi = {
  getByFilter: (params) => api.get('/attendance', { params }),
  markBulk: (data) => api.post('/attendance/bulk', data),
};

export const feeApi = {
  getAll: (config) => api.get('/fees', config),
  getPending: (config) => api.get('/fees/pending', config),
  payInstallment: (id, data) => api.put(`/fees/installments/${id}/pay`, data),
  collect: (data) => api.post('/fees', data),
  updateStatus: (id, data) => api.put(`/fees/${id}`, data),
};

export const staffApi = {
  getAll: (params) => api.get('/staff', { params }),
  getById: (id) => api.get(`/staff/${id}`),
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
  getAll: (params) => api.get('/subjects', { params }),
  create: (data) => api.post('/subjects', data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  delete: (id) => api.delete(`/subjects/${id}`),
};

export const ledgerApi = {
  getAll: (config) => api.get('/ledgers', config),
};

export const leaveApi = {
  apply: (data) => api.post('/leaves/apply', data),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
  getAll: () => api.get('/leaves/all'),
  updateStatus: (id, data) => api.put(`/leaves/${id}/status`, data),
  getStaffMonthLeaves: (params) => api.get('/leaves/staff-month', { params }),
};

export const payrollApi = {
  generate: (data) => api.post('/payroll/generate', data),
  getMonthPayroll: (params) => api.get('/payroll/month', { params }),
  getHistory: (staffId) => api.get(`/payroll/history/${staffId}`),
};

export const schoolApi = {
  register: (data) => api.post('/schools/register', data),
  verifyOTP: (data) => api.post('/schools/verify-otp', data),
};

export const classApi = {
  getAll: (params) => api.get('/classes', { params }),
  upsert: (data) => api.post('/classes', data),
  bulkUpdate: (data) => api.post('/classes/bulk', data),
  delete: (id) => api.delete(`/classes/${id}`),
};


export default api;
