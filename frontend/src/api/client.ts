import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally - redirect to login
// Response interceptor: attempt refresh on 401 then retry original request
let isRefreshing = false as boolean;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (err: any) => void; config: any }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('erp_refresh');
      originalRequest._retry = true;

      if (!refreshToken) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const res = await axios.post('/api/auth/refresh', { refreshToken });
        const newToken = res.data.data?.token;
        if (newToken) {
          localStorage.setItem('erp_token', newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        // If refresh didn't return a token, force logout
        processQueue(new Error('No token in refresh response'), null);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh');
        window.location.href = '/login';
        return Promise.reject(error);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
