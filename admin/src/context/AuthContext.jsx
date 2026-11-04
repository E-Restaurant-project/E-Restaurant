import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH);
    }
  }, [user]);

  // Step 1: Verify admin credentials & trigger 2FA if enabled
  const login = async (email, password) => {
    setLoading(true);
    const res = await apiService.login(email, password);
    setLoading(false);

    if (res.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        email: res.email || email,
        message: res.message
      };
    }

    if (res.success && res.data?.token) {
      setUser(res.data);
      return { success: true, requires2FA: false };
    }

    return { success: false, error: res.error || 'Invalid administrator email or password' };
  };

  // Step 2: Verify 6-digit 2FA code & store authenticated admin JWT
  const verify2FA = async (email, code) => {
    setLoading(true);
    const res = await apiService.verify2FA(email, code);
    setLoading(false);

    if (res.success && res.data?.token) {
      setUser(res.data);
      return { success: true };
    }

    return { success: false, error: res.error || 'Invalid 2FA security code' };
  };

  // Resend 2FA code
  const resend2FA = async (email) => {
    return await apiService.resend2FA(email);
  };

  // Update Admin Profile (name, phone, address, avatar, password)
  const updateProfile = async (profileData) => {
    setLoading(true);
    const res = await apiService.updateProfile(profileData);
    setLoading(false);

    if (res.success && res.data) {
      setUser((prev) => ({
        ...prev,
        ...res.data,
        name: res.data.name || prev?.name,
        email: res.data.email || prev?.email,
        phone: res.data.phone !== undefined ? res.data.phone : prev?.phone,
        address: res.data.address !== undefined ? res.data.address : prev?.address,
        avatar: res.data.avatar !== undefined ? res.data.avatar : prev?.avatar
      }));
      return { success: true, data: res.data };
    }
    return { success: false, error: res.error || res.message || 'Failed to update profile' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(API_CONFIG.STORAGE_KEYS.AUTH);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verify2FA,
        resend2FA,
        updateProfile,
        logout,
        isAdmin,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
