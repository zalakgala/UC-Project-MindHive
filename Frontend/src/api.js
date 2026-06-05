import axios from 'axios';

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  // withCredentials: true // Uncomment if you want to also send session cookies
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
