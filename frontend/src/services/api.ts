import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Spring Boot Backend API Base URL Configuration:
 * - Web / standard: http://localhost:8080/api
 * - Android Emulator: http://10.0.2.2:8080/api
 * - Physical device: Replace with your local machine's IP (e.g., http://192.168.1.100:8080/api)
 */
const GET_BASE_URL = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }
  return 'http://localhost:8080/api/v1';
};

export const API_BASE_URL = GET_BASE_URL();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

// Add Interceptors for request/response logging & token injection
apiClient.interceptors.request.use(
  (config) => {
    // Console log for debugging Spring Boot requests
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.warn(`[API Warning] Backend endpoint unavailable: ${error.message}`);
    return Promise.reject(error);
  }
);

export default apiClient;
