// Centralized API configuration for Phum Yeung Restaurant
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://phum-yeung-backend.onrender.com/api',
  IS_MOCK: false,
  CURRENCY_RATE: {
    KHR_PER_USD: 4100
  },
  DEFAULT_LANGUAGE: 'km',
  STORAGE_KEYS: {
    LANGUAGE: 'phum_yeung_lang',
    CART: 'phum_yeung_cart',
    AUTH: 'phum_yeung_auth',
    CUSTOMER_AUTH: 'phum_yeung_customer_auth',
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
