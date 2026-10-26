import axios from 'axios';
import Constants from 'expo-constants';

const baseURL = (Constants.expoConfig?.extra as any)?.apiBaseUrl || 'http://10.0.2.2:8000';

export const isLocalApiEnabled =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  process.env.EXPO_PUBLIC_ENABLE_LOCAL_API === 'true';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
