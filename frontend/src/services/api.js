import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE
});

// Interceptor to inject token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optional auto-logout on unauthorized
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Presentations
export const createPresentation = (data) => api.post('/presentations', data);
export const getPresentations = () => api.get('/presentations');
export const getPresentationById = (id) => api.get(`/presentations/${id}`);
export const deletePresentation = (id) => api.delete(`/presentations/${id}`);
export const getPresentationWeakSections = (id) => api.get(`/presentations/${id}/weak-sections`);

// Video Upload
export const uploadVideoFile = (formData, onProgress) => {
  return api.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
};

// Analysis
export const startAnalysis = (presentationId) => api.post('/analysis/start', { presentationId });
export const getAnalysisResult = (id) => api.get(`/analysis/${id}`);
export const getAnalysisStatus = (id) => api.get(`/analysis/${id}/status`);

// Weak Sections
export const getWeakSectionById = (id) => api.get(`/weak-sections/${id}`);

// Practice
export const startPractice = (weakSectionId) => api.post('/practice/start', { weakSectionId });
export const analyzePracticeAttempt = (weakSectionId, data) => api.post(`/practice/${weakSectionId}/analyze`, data);
export const getPracticeComparison = (id) => api.get(`/practice/${id}/comparison`);

// History
export const getHistory = () => api.get('/history');
export const getHistoryComparison = () => api.get('/history/comparison');

export default api;
