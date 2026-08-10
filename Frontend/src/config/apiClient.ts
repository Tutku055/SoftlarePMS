import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7219/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.headers) {
      config.headers['X-Timezone-Offset'] = new Date().getTimezoneOffset().toString();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Rehydrate store to get latest tokens from localStorage (in case another tab refreshed)
      try {
        useAuthStore.persist.rehydrate();
      } catch (e) {
        console.error('Failed to rehydrate auth store', e);
      }

      const currentStore = useAuthStore.getState();
      const authHeader = originalRequest.headers.Authorization || originalRequest.headers.authorization;
      const failedToken = authHeader ? authHeader.toString().replace('Bearer ', '') : currentStore.accessToken;

      // If the token in the store is already different from the one that failed,
      // it means another tab has already refreshed the token.
      if (currentStore.accessToken && currentStore.accessToken !== failedToken) {
        originalRequest.headers.Authorization = `Bearer ${currentStore.accessToken}`;
        return apiClient(originalRequest);
      }

      // Check if another tab is currently refreshing
      const refreshInProgressVal = localStorage.getItem('auth_refresh_in_progress');
      const isRefreshingOtherTab = refreshInProgressVal && (Date.now() - parseInt(refreshInProgressVal, 10) < 8000); // 8 seconds timeout

      if (isRefreshingOtherTab || isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });

          if (isRefreshingOtherTab && !isRefreshing) {
            const checkInterval = setInterval(() => {
              try {
                useAuthStore.persist.rehydrate();
              } catch (e) {}
              const updatedStore = useAuthStore.getState();
              const refreshActive = localStorage.getItem('auth_refresh_in_progress');

              if (updatedStore.accessToken && updatedStore.accessToken !== failedToken) {
                clearInterval(checkInterval);
                resolve(updatedStore.accessToken);
              } else if (!refreshActive) {
                clearInterval(checkInterval);
                reject(error);
              }
            }, 200);

            setTimeout(() => {
              clearInterval(checkInterval);
              reject(error);
            }, 8000);
          }
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      localStorage.setItem('auth_refresh_in_progress', Date.now().toString());

      const { accessToken, refreshToken } = useAuthStore.getState();

      if (!accessToken || !refreshToken) {
        localStorage.removeItem('auth_refresh_in_progress');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/Auth/refresh`, {
          accessToken,
          refreshToken,
        });

        useAuthStore.getState().login(data.accessToken, data.refreshToken);

        localStorage.removeItem('auth_refresh_in_progress');
        processQueue(null, data.accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('auth_refresh_in_progress');
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
