// Centralized API configuration for Phum Yeung Admin Portal
const resolveApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  return 'https://phum-yeung-backend.onrender.com/api';
};

export const API_CONFIG = {
  BASE_URL: resolveApiBase(),
  CURRENCY_RATE: {
    KHR_PER_USD: 4100
  },
  DEFAULT_LANGUAGE: 'km',
  STORAGE_KEYS: {
    LANGUAGE: 'phum_yeung_admin_lang',
    AUTH: 'phum_yeung_admin_auth',
    MENU: 'phum_yeung_menu_v3',
    ORDERS: 'phum_yeung_orders',
    RESERVATIONS: 'phum_yeung_reservations'
  }
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const backendBase = (import.meta.env.VITE_API_URL || API_CONFIG.BASE_URL).replace(/\/api\/?$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${backendBase}${cleanPath}`;
};
