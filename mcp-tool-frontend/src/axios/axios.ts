import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosInstance.interceptors.request.use(
  (config) => {
    const jwtToken = localStorage.getItem('token');
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from login/register just means wrong credentials: let the form show
    // the error instead of reloading the login page.
    const isAuthRequest = /\/user\/(login|register)$/.test(error.config?.url ?? '');
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
