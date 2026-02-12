import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseAuthReturn {
  token: string | null;
  user: any | null;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export const useAuth = (): UseAuthReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Function to refresh token
  const refreshToken = async () => {
    try {
      if (typeof window !== "undefined") {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, { refreshToken });

        const newToken = response.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        setToken(newToken);
        return newToken;
      }
      throw new Error('localStorage is not available');
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logout();
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('comUserId');
      localStorage.removeItem('role');
      localStorage.removeItem('UserId');
    }
    setToken(null);
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = '/login'; // Redirect to login page
    }
  };

  // Get headers with current token
  const getAuthHeaders = () => {
    if (typeof window !== "undefined") {
      const currentToken = localStorage.getItem('accessToken');
      const currentUser = localStorage.getItem('comUserId');

      return {
        'Content-Type': 'application/json',
        ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
        ...(currentUser
          ? {
              'user': JSON.stringify({
                _id: JSON.parse(currentUser)?.userId,
                company: { _id: JSON.parse(currentUser)?.compId },
              }),
            }
          : {}),
      };
    }
    return { 'Content-Type': 'application/json' };
  };

  // Set up token and user state on client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('comUserId');
      if (storedToken && !isTokenExpired(storedToken)) {
        setToken(storedToken);
      } else {
        logout(); // Token expired or not found
      }
      setUser(storedUser ? JSON.parse(storedUser) : null);
    }
  }, []);

  // Set up axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshToken();
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return { token, user, logout, getAuthHeaders };
};
