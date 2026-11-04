// Frontend API Service Layer connecting to Node.js / Express backend
// With resilient fallback to offline/localStorage mode if backend server is not reachable
import { API_CONFIG } from '../config/api';

const API_BASE = API_CONFIG.BASE_URL;

const getAuthHeaders = () => {
  try {
    const customerAuth = JSON.parse(localStorage.getItem('phum_yeung_customer_auth') || '{}');
    if (customerAuth?.token) {
      return { Authorization: `Bearer ${customerAuth.token}` };
    }
    const auth = JSON.parse(localStorage.getItem('phum_yeung_auth') || '{}');
    if (auth?.token) {
      return { Authorization: `Bearer ${auth.token}` };
    }
  } catch {
    // Ignore error
  }
  return {};
};

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...options.headers
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `Request failed with status ${response.status}`,
      };
    }
    return {
      success: data.success !== undefined ? data.success : true,
      responseCode: data.responseCode,
      isPaid: data.isPaid,
      data: data.data !== undefined ? data.data : data,
      message: data.message || data.responseMessage
    };
  } catch (err) {
    return { success: false, error: err.message, isOffline: true };
  }
};

export const apiService = {
  // Categories
  getCategories: async () => request('/categories'),

  // Dishes
  getDishes: async () => request('/dishes'),
  getDish: async (id) => request(`/dishes/${id}`),
  createDish: async (dishData) => request('/dishes', { method: 'POST', body: JSON.stringify(dishData) }),
  updateDish: async (id, dishData) => request(`/dishes/${id}`, { method: 'PUT', body: JSON.stringify(dishData) }),
  deleteDish: async (id) => request(`/dishes/${id}`, { method: 'DELETE' }),
  uploadDishImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_BASE}/dishes/upload`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        },
        body: formData
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Orders (Customer)
  getOrder: async (orderId) => request(`/orders/${orderId}`),
  getMyOrders: async () => request('/orders/my-orders'),
  createOrder: async (orderData) => request('/orders', { method: 'POST', body: JSON.stringify(orderData) }),

  // Promos (Customer read-only)
  getPromos: async () => request('/promos'),
  validatePromo: async (code) => request(`/promos/validate/${code}`),

  // Settings (Customer read-only)
  getSettings: async () => request('/settings'),

  // Customer Auth
  registerCustomer: async (customerData) =>
    request('/auth/customer/register', { method: 'POST', body: JSON.stringify(customerData) }),
  verifyCode: async (email, code) =>
    request('/auth/customer/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resendCode: async (email) =>
    request('/auth/customer/resend', { method: 'POST', body: JSON.stringify({ email }) }),
    forgotPassword: async (email) =>
    request('/auth/customer/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: async (email, code, newPassword) =>
    request('/auth/customer/reset-password', { method: 'POST', body: JSON.stringify({ email, code, newPassword }) }),
  googleLogin: async (data) =>
    request('/auth/customer/google', { method: 'POST', body: JSON.stringify(typeof data === 'string' ? { credential: data } : data) }),
  customerLogin: async (email, password) =>
    request('/auth/customer/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  updateCustomerProfile: async (profileData) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  // Bakong KHQR Payment
  generateBakongKHQR: async (paymentData) =>
    request('/payments/bakong/generate', { method: 'POST', body: JSON.stringify(paymentData) }),
  checkBakongTransaction: async (md5) =>
    request('/payments/bakong/check-md5', { method: 'POST', body: JSON.stringify({ md5 }) }),
  simulatePaymentSuccess: async (md5) =>
    request('/payments/bakong/simulate-success', { method: 'POST', body: JSON.stringify({ md5 }) })
};
