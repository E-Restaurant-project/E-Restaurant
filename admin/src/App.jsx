import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin } from './pages/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminMenu } from './pages/AdminMenu';
import { AdminCategories } from './pages/AdminCategories';
import { AdminOrders } from './pages/AdminOrders';
import { AdminPromos } from './pages/AdminPromos';
import { AdminCustomers } from './pages/AdminCustomers';
import { AdminSettings } from './pages/AdminSettings';
import { AdminProfile } from './pages/AdminProfile';

export function App() {
  return (
    <Routes>
      {/* Login Route */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Routes */}
      <Route element={<AdminLayout />}>
        {/* Direct routes */}
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
        <Route path="/menu" element={<AdminMenu />} />
        <Route path="/categories" element={<AdminCategories />} />
        <Route path="/orders" element={<AdminOrders />} />
        <Route path="/promos" element={<AdminPromos />} />
        <Route path="/customers" element={<AdminCustomers />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="/profile" element={<AdminProfile />} />

        {/* /admin prefix routes for full compatibility */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/menu" element={<AdminMenu />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/promos" element={<AdminPromos />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
