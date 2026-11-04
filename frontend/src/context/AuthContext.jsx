import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Admin user state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Customer user state
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.CUSTOMER_AUTH);
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

  useEffect(() => {
    if (customerUser) {
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.CUSTOMER_AUTH, JSON.stringify(customerUser));
    } else {
      localStorage.removeItem(API_CONFIG.STORAGE_KEYS.CUSTOMER_AUTH);
    }
  }, [customerUser]);

  // Admin login
  const login = async (email, password) => {
    setLoading(true);

    // Attempt server JWT login
    const apiRes = await apiService.login(email, password);
    if (apiRes.success && apiRes.data?.token) {
      setUser(apiRes.data);
      setLoading(false);
      return { success: true };
    }

    setLoading(false);
    return { success: false, error: apiRes.error || 'Invalid email or password' };
  };

  const logout = () => {
    setUser(null);
  };

  // Customer register: sends OTP to email
  const customerRegister = async (formData) => {
    setLoading(true);
    const res = await apiService.registerCustomer(formData);
    setLoading(false);
    return res;
  };

  // Customer verify OTP
  const customerVerify = async (email, code) => {
    setLoading(true);
    const res = await apiService.verifyCode(email, code);
    if (res.success && res.data?.token) {
      setCustomerUser(res.data);
    }
    setLoading(false);
    return res;
  };

  // Customer resend OTP
  const customerResend = async (email) => {
    return await apiService.resendCode(email);
  };

  
  // Customer forgot password (request OTP)
  const customerForgotPassword = async (email) => {
    setLoading(true);
    const res = await apiService.forgotPassword(email);
    setLoading(false);
    return res;
  };

  // Customer reset password (verify OTP & set new password)
  const customerResetPassword = async (email, code, newPassword) => {
    setLoading(true);
    const res = await apiService.resetPassword(email, code, newPassword);
    setLoading(false);
    return res;
  };

  
  // Customer Google Login
  const customerGoogleLogin = async (credential) => {
    setLoading(true);
    const res = await apiService.googleLogin(credential);
    if (res.success && res.data?.token) {
      setCustomerUser(res.data);
      setLoading(false);
      return { success: true, data: res.data };
    }
    setLoading(false);
    return { success: false, error: res.error || 'Google sign-in failed' };
  };

  // Customer login
  const customerLogin = async (email, password) => {
    setLoading(true);
    const res = await apiService.customerLogin(email, password);
    if (res.success && res.data?.token) {
      setCustomerUser(res.data);
      setLoading(false);
      return { success: true, data: res.data };
    }
    setLoading(false);
    return {
      success: false,
      error: res.error || 'Invalid email or password',
    };
  };

  // Customer update profile
  const customerUpdateProfile = async (profileData) => {
    setLoading(true);
    const res = await apiService.updateCustomerProfile(profileData);
    if (res.success && res.data) {
      setCustomerUser((prev) => ({ ...prev, ...res.data }));
    }
    setLoading(false);
    return res;
  };

  // Customer logout
  const customerLogout = () => {
    setCustomerUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        // Admin
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        loading,
        login,
        logout,
        // Customer
        customerUser,
        isCustomerLoggedIn: !!customerUser,
        customerRegister,
        customerVerify,
        customerResend,
        customerLogin,
        customerGoogleLogin,
        customerForgotPassword,
        customerResetPassword,
        customerUpdateProfile,
        customerLogout
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
