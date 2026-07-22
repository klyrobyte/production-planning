import axios from 'axios';

// Create a custom axios instance for backend api integration
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
