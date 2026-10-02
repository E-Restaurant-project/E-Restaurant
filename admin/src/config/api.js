// Centralized API configuration for Phum Yeung Admin Portal
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://phum-yeung-backend.onrender.com/api',
  CURRENCY_RATE: {
    KHR_PER_USD: 4100
  },
  DEFAULT_LANGUAGE: 'km',
  STORAGE_KEYS: {
    LANGUAGE: 'phum_yeung_admin_lang',
    AUTH: 'phum_yeung_admin_auth',
    MENU: 'phum_yeung_menu',
    ORDERS: 'phum_yeung_orders',
    RESERVATIONS: 'phum_yeung_reservations'
  }
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const backendBase = (import.meta.env.VITE_API_URL || API_CONFIG.BASE_URL).replace(/\/api\/?$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${backendBase}${cleanPath}`;
};
