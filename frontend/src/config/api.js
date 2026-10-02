// Centralized API configuration for Phum Yeung Restaurant
// Easily swap mock localStorage storage with actual REST/GraphQL backend in production

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.phumyeung.com/v1',
  IS_MOCK: true,
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
