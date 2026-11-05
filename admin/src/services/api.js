// Admin Portal API Service Layer connecting to Node.js / Express backend
import { API_CONFIG } from '../config/api';

const API_BASE = API_CONFIG.BASE_URL;

const getAuthHeaders = () => {
  try {
    const auth = JSON.parse(localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH) || '{}');
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
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        error: data.message || `Request failed with status ${response.status}`
      };
    }
    return {
      success: data.success !== undefined ? data.success : true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      requires2FA: data.requires2FA,
      email: data.email,
    };
  } catch (err) {
    return { success: false, error: err.message, isOffline: true };
  }
};

export const apiService = {
  // Admin Auth & Profile
  login: async (email, password) =>
    request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verify2FA: async (email, code) =>
    request('/auth/admin/verify-2fa', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resend2FA: async (email) =>
    request('/auth/admin/resend-2fa', { method: 'POST', body: JSON.stringify({ email }) }),
  getMe: async () => request('/auth/me'),
  updateProfile: async (profileData) =>
    request('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  getAdmins: async () => request('/auth/admins'),

  // Dishes Management
  getDishes: async () => request('/dishes'),
  getDish: async (id) => request(`/dishes/${id}`),
  createDish: async (dishData) => request('/dishes', { method: 'POST', body: JSON.stringify(dishData) }),
  updateDish: async (id, dishData) => request(`/dishes/${id}`, { method: 'PUT', body: JSON.stringify(dishData) }),
  deleteDish: async (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/dishes/${id}${qs ? `?${qs}` : ''}`, { method: 'DELETE' });
  },
  getAuditLogs: async () => request('/dishes/audit-logs'),
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

  // Customers Management (Real DB Customers)
  getCustomers: async () => request('/auth/customers'),

  // Orders Management
  getOrders: async () => request('/orders'),
  getOrder: async (orderId) => request(`/orders/${orderId}`),
  updateOrderStatus: async (orderId, status, adminName) =>
    request(`/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status, adminName }) }),

  // Promos Management
  getPromos: async () => request('/promos'),
  createPromo: async (promoData) => request('/promos', { method: 'POST', body: JSON.stringify(promoData) }),
  updatePromo: async (id, promoData) => request(`/promos/${id}`, { method: 'PUT', body: JSON.stringify(promoData) }),
  deletePromo: async (id) => request(`/promos/${id}`, { method: 'DELETE' }),

  // Categories Management
  getCategories: async () => request('/categories'),
  createCategory: async (categoryData) => request('/categories', { method: 'POST', body: JSON.stringify(categoryData) }),
  updateCategory: async (id, categoryData) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(categoryData) }),
  deleteCategory: async (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Store Settings
  getSettings: async () => request('/settings'),
  updateSettings: async (settingsData) => request('/settings', { method: 'PUT', body: JSON.stringify(settingsData) })
};
