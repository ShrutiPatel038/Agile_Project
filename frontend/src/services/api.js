import axios from 'axios';
const rawBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;
// Auth uses the Bearer token from localStorage only. The jwt cookie is shared by every
// localhost port, so sending it would let one role's login leak into another port's tab.
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: false,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;