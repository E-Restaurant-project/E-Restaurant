import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { API_CONFIG } from '../config/api';
import { apiService } from '../services/api';

const RestaurantContext = createContext(null);

const DEFAULT_SETTINGS = {
  isOpen: true,
  standardDeliveryFee: 1.50,
  freeDeliveryThreshold: 25.00,
  khrRate: 4100,
  categoryDiscounts: {},
  announcement: {
    active: true,
    text_km: 'ប្រូម៉ូសិនពិសេស៖ បញ្ចុះតម្លៃ ១០% សម្រាប់ការកុម្ម៉ង់ដំបូងដោយប្រើកូដ PHUM10!',
    text_en: 'Special Promo: Enjoy 10% OFF your first delivery order with code PHUM10!'
  }
};

const INITIAL_PROMOS = [
  { id: 'promo-1', code: 'PHUM10', discount: 10, active: true, description: '10% OFF Welcome Promo' },
  { id: 'promo-2', code: 'KHMER20', discount: 20, active: true, description: '20% OFF Super Deal' },
  { id: 'promo-3', code: 'VIP30', discount: 30, active: true, description: '30% OFF Special VIP Deal' },
  { id: 'promo-4', code: 'PCHUMBEN50', discount: 50, active: true, description: '50% OFF Pchum Ben Day' }
];


const normalizeCategoryItem = (c) => {
  if (!c) return null;
  const id = (c.id || c.slug || c.category_id || String(c._id || '')).trim();
  const label_km = (c.label_km || c.name_km || '').trim();
  const label_en = (c.label_en || c.name_en || '').trim();

  return {
    ...c,
    id,
    slug: id,
    category_id: id,
    label_km: label_km || label_en || id,
    name_km: label_km || label_en || id,
    label_en: label_en || label_km || id,
    name_en: label_en || label_km || id,
    order: c.order !== undefined ? Number(c.order) : 0
  };
};

export const RestaurantProvider = ({ children }) => {
  const [dishes, setDishes] = useState(() => {
    try {
      localStorage.removeItem('phum_yeung_menu');
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.MENU);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If contains legacy seeded dishes, purge and start fresh
          if (parsed.some(d => d.id === 'cmt1krpbt00180aj7e18d2xp6' || d.dishId === 'cmt1krpbt00180aj7e18d2xp6')) {
            localStorage.removeItem(API_CONFIG.STORAGE_KEYS.MENU);
            return [];
          }
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // 2. Orders State (Pure Database Data)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.ORDERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(o => o.id === 'PY-ORD-1001' || o.customerName?.includes('Chan Sopheap'))) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // 3. Store Settings
  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('phum_yeung_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 4. Promo Codes
  const [promoCodes, setPromoCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('phum_yeung_promos');
      return saved ? JSON.parse(saved) : INITIAL_PROMOS;
    } catch {
      return INITIAL_PROMOS;
    }
  });

  // 5. Food Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('phum_yeung_categories_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If contains legacy seeded categories, purge and start fresh
          if (parsed.length >= 13 && parsed.some(c => c.id === 'specials' || c.slug === 'specials')) {
            localStorage.removeItem('phum_yeung_categories_v3');
            return [];
          }
          return parsed.map(normalizeCategoryItem).filter(Boolean);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('phum_yeung_categories_v3', JSON.stringify(categories));
  }, [categories]);

  // Fetch from Node.js API on mount if available
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      // 1. Dishes from Database
      try {
        const dishesRes = await apiService.getDishes();
        if (isMounted && dishesRes?.success && Array.isArray(dishesRes.data)) {
          const backendDishes = dishesRes.data.map(d => ({ ...d, id: d.dishId || d._id }));
          setDishes(backendDishes);
          try {
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(backendDishes));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[RestaurantContext] Dishes fetch fallback:', err.message);
      }

      // 2. Categories from Database
      try {
        const categoriesRes = await apiService.getCategories();
        if (isMounted && categoriesRes?.success && Array.isArray(categoriesRes.data)) {
          const normalized = categoriesRes.data.map(normalizeCategoryItem).filter(Boolean);
          setCategories(normalized);
          try {
            localStorage.setItem('phum_yeung_categories_v3', JSON.stringify(normalized));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[RestaurantContext] Categories fetch fallback:', err.message);
      }

      // 3. Settings from Database (Delivery Fee, Threshold, Announcement)
      try {
        const settingsRes = await apiService.getSettings();
        if (isMounted && settingsRes?.success && settingsRes.data) {
          setStoreSettings(settingsRes.data);
          try {
            localStorage.setItem('phum_yeung_settings', JSON.stringify(settingsRes.data));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[RestaurantContext] Settings fetch fallback:', err.message);
      }

      // 4. Promos from Database
      try {
        const promosRes = await apiService.getPromos();
        if (isMounted && promosRes?.success && Array.isArray(promosRes.data) && promosRes.data.length > 0) {
          const loadedPromos = promosRes.data.map(p => ({ ...p, id: p._id || p.id, active: true }));
          setPromoCodes(loadedPromos);
          try {
            localStorage.setItem('phum_yeung_promos', JSON.stringify(loadedPromos));
          } catch (_) {}
        }
      } catch (err) {
        console.warn('[RestaurantContext] Promos fetch fallback:', err.message);
      }
    };

    fetchBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time broadcast channel to sync live between Admin and Customer Frontend tabs
  const syncChannel = useMemo(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel('phum_yeung_deals_sync');
    }
    return null;
  }, []);

  useEffect(() => {
    if (!syncChannel) return;
    const handleMsg = (e) => {
      if (e.data?.type === 'SETTINGS_UPDATED' && e.data.storeSettings) {
        setStoreSettings(e.data.storeSettings);
      }
      if (e.data?.type === 'DISHES_UPDATED' && Array.isArray(e.data.dishes)) {
        setDishes(e.data.dishes);
      }
      if (e.data?.type === 'PROMOS_UPDATED' && Array.isArray(e.data.promoCodes)) {
        setPromoCodes(e.data.promoCodes);
      }
    };
    syncChannel.addEventListener('message', handleMsg);
    return () => syncChannel.removeEventListener('message', handleMsg);
  }, [syncChannel]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(dishes));
  }, [dishes]);

  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('phum_yeung_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('phum_yeung_promos', JSON.stringify(promoCodes));
  }, [promoCodes]);

  // Dish Operations (State + API)
  const addDish = async (dishData) => {
    const generatedId = `dish-${Date.now()}`;
    const newDish = {
      ...dishData,
      id: generatedId,
      dishId: generatedId,
      price: Number(dishData.price),
      rating: 5.0,
      reviews_count: 0,
      inStock: true
    };
    setDishes((prev) => [newDish, ...prev]);
    // Call Node.js API
    apiService.createDish(newDish);
    return newDish;
  };

  const updateDish = async (id, updatedFields) => {
    setDishes((prev) =>
      prev.map((dish) =>
        dish.id === id
          ? { ...dish, ...updatedFields, price: Number(updatedFields.price !== undefined ? updatedFields.price : dish.price) }
          : dish
      )
    );
    // Call Node.js API
    apiService.updateDish(id, updatedFields);
  };

  const toggleDishStock = async (id) => {
    const dish = dishes.find((d) => d.id === id);
    if (dish) {
      const newStock = dish.inStock === false ? true : false;
      updateDish(id, { inStock: newStock });
    }
  };

  const deleteDish = async (id) => {
    setDishes((prev) => prev.filter((dish) => dish.id !== id));
    // Call Node.js API
    apiService.deleteDish(id);
  };

  const getDishById = (id) => {
    return dishes.find((d) => d.id === id || d.dishId === id);
  };

  // Order Operations (State + API)
  const createOrder = async (orderData) => {
    const newOrder = {
      id: `PY-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      ...orderData
    };
    newOrder.orderId = newOrder.id;

    setOrders((prev) => [newOrder, ...prev]);
    // Call Node.js API
    try {
      const res = await apiService.createOrder(newOrder);
      if (res && res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[RestaurantContext] createOrder error:', err);
    }
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
  };

  const getOrderById = (orderId) => {
    if (!orderId) return null;
    const cleanId = orderId.trim().toUpperCase();
    return orders.find((o) => (o.id && o.id.toUpperCase() === cleanId) || (o.orderId && o.orderId.toUpperCase() === cleanId));
  };

  // Settings Operations
  const updateStoreSettings = async (newSettings) => {
    setStoreSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Promo Operations
  const addPromoCode = async (promo) => {
    const newPromo = {
      id: `promo-${Date.now()}`,
      code: promo.code.trim().toUpperCase(),
      discount: Number(promo.discount),
      active: promo.active !== false,
      description: promo.description || '',
      createdAt: new Date().toISOString()
    };
    setPromoCodes((prev) => [newPromo, ...prev]);
    return newPromo;
  };

  const updatePromoCode = async (id, updatedFields) => {
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deletePromoCode = async (id) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
  };

  const validatePromoCode = (code) => {
    if (!code) return { valid: false, error: 'Empty code' };
    const cleanCode = code.trim().toUpperCase();
    const found = promoCodes.find((p) => p.code?.trim().toUpperCase() === cleanCode);
    if (found) {
      return { valid: true, discount: Number(found.discount), code: found.code };
    }
    return { valid: false, error: 'Invalid promo code' };
  };

  // 6. Food Categories Methods
  const allCategories = useMemo(() => {
    return [
      { id: 'all', label_km: 'ទាំងអស់', label_en: 'All Dishes' },
      ...categories
    ];
  }, [categories]);

  const addCategory = (catData) => {
    let id = catData.id?.trim().toLowerCase() || '';
    if (!id) {
      id = (catData.label_en || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (!id) {
      id = `cat-${Date.now()}`;
    }
    // Prevent duplicate ID
    if (categories.some((c) => c.id === id)) {
      id = `${id}-${Math.floor(Math.random() * 1000)}`;
    }

    const newCategory = {
      id,
      label_km: catData.label_km?.trim() || catData.label_en?.trim() || id,
      label_en: catData.label_en?.trim() || catData.label_km?.trim() || id
    };

    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (oldId, updatedData) => {
    const newId = updatedData.id?.trim().toLowerCase() || oldId;
    setCategories((prev) =>
      prev.map((c) => (c.id === oldId ? { ...c, ...updatedData, id: newId } : c))
    );

    // If category ID changed, update all dishes under this category
    if (newId !== oldId) {
      setDishes((prev) =>
        prev.map((d) => (d.category === oldId ? { ...d, category: newId } : d))
      );
    }
  };

  const deleteCategory = (catId) => {
    const remaining = categories.filter((c) => c.id !== catId);
    setCategories(remaining);
    // Find fallback category (prefer other-foods, specials, or first available)
    const fallbackId = remaining.find((c) => c.id === 'other-foods')?.id || remaining[0]?.id || 'specials';
    setDishes((prev) =>
      prev.map((d) => (d.category === catId ? { ...d, category: fallbackId } : d))
    );
  };

  // Customers aggregation
  const customers = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const key = (order.phone || order.customerName).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: `cust-${map.size + 1}`,
          name: order.customerName,
          phone: order.phone,
          email: order.email || 'N/A',
          address: order.address || 'Phnom Penh',
          ordersCount: 1,
          totalSpent: Number(order.total) || 0,
          lastOrderDate: order.createdAt,
          orders: [order]
        });
      } else {
        const existing = map.get(key);
        existing.ordersCount += 1;
        existing.totalSpent += Number(order.total) || 0;
        existing.orders.push(order);
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // Export CSV helper
  const exportOrdersToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Order Type', 'Payment Method', 'Items Count', 'Total ($)', 'Status'];
    const rows = orders.map((o) => [
      o.id || o.orderId,
      new Date(o.createdAt).toLocaleString(),
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      o.phone,
      o.orderType,
      o.paymentMethod,
      o.items?.length || 0,
      (Number(o.total) || 0).toFixed(2),
      o.status
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Phum_Yeung_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats
  const todayRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrdersCount = orders.length;
  const activeDishesCount = dishes.length;
  const totalCustomersCount = customers.length;

  return (
    <RestaurantContext.Provider
      value={{
        dishes,
        addDish,
        updateDish,
        toggleDishStock,
        deleteDish,
        getDishById,
        orders,
        createOrder,
        updateOrderStatus,
        getOrderById,
        exportOrdersToCSV,
        storeSettings,
        updateStoreSettings,
        promoCodes,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        validatePromoCode,
        categories,
        allCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        customers,
        stats: {
          todayRevenue,
          totalOrdersCount,
          activeDishesCount,
          totalCustomersCount
        }
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
