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

  // Step 1: Verify admin credentials & trigger 2FA
  const login = async (email, password) => {
    setLoading(true);
    const res = await apiService.login(email, password);
    setLoading(false);

    if (res.requires2FA) {
      return {
        success: true,
        requires2FA: true,
        email: res.email || email,
        devCode: res.devCode,
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

  // Get 2FA QR Code & Secret Key for Google Authenticator
  const get2FASetup = async (email) => {
    return await apiService.get2FASetup(email);
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
        get2FASetup,
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
