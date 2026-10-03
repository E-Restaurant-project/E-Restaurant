import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_MENU, CATEGORIES } from '../data/menu';
import { INITIAL_ORDERS } from '../data/initialData';
import { API_CONFIG } from '../config/api';
import { apiService } from '../services/api';

const RestaurantContext = createContext(null);

const DEFAULT_SETTINGS = {
  isOpen: true,
  standardDeliveryFee: 1.50,
  freeDeliveryThreshold: 25.00,
  khrRate: 4100,
  announcement: {
    active: true,
    text_km: '🔥 ប្រូម៉ូសិនពិសេស៖ បញ្ចុះតម្លៃ ១០% សម្រាប់ការកុម្ម៉ង់ដំបូងដោយប្រើកូដ PHUM10!',
    text_en: '🔥 Special Promo: Enjoy 10% OFF your first delivery order with code PHUM10!'
  }
};

const INITIAL_PROMOS = [
  { id: 'promo-1', code: 'PHUM10', discount: 10, active: true, description: '10% OFF Welcome Promo' },
  { id: 'promo-2', code: 'KHMER20', discount: 20, active: true, description: '20% OFF Super Deal' },
  { id: 'promo-3', code: 'VIP30', discount: 30, active: false, description: '30% OFF Special VIP Deal' }
];

export const RestaurantProvider = ({ children }) => {
  const [dishes, setDishes] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.MENU);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 20 && !parsed.some(d => d.category === 'khmer_classics')) {
          return parsed;
        }
      }
      localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(INITIAL_MENU));
      return INITIAL_MENU;
    } catch {
      return INITIAL_MENU;
    }
  });

  // 2. Orders State
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
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
      const saved = localStorage.getItem('phum_yeung_categories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some(c => c.id === 'khmer_classics')) {
          return parsed;
        }
      }
      const initial = CATEGORIES.filter(c => c.id !== 'all');
      localStorage.setItem('phum_yeung_categories_v2', JSON.stringify(initial));
      return initial;
    } catch {
      return CATEGORIES.filter(c => c.id !== 'all');
    }
  });

  useEffect(() => {
    localStorage.setItem('phum_yeung_categories_v2', JSON.stringify(categories));
  }, [categories]);

  // Fetch from Node.js API on mount if available
  useEffect(() => {
    let isMounted = true;
    const fetchBackendData = async () => {
      // Dishes
      const dishesRes = await apiService.getDishes();
      if (isMounted && dishesRes.success && Array.isArray(dishesRes.data) && dishesRes.data.length > 0) {
        setDishes((prevDishes) => {
          const backendDishes = dishesRes.data.map(d => ({ ...d, id: d.dishId || d._id }));
          const backendIds = new Set(backendDishes.map(d => d.id || d.dishId));
          const localOnly = prevDishes.filter(
            d => !backendIds.has(d.id) && !backendIds.has(d.dishId) && String(d.id).startsWith('dish-')
          );
          return [...localOnly, ...backendDishes];
        });
      }

      // Orders
      const ordersRes = await apiService.getOrders();
      if (isMounted && ordersRes.success && Array.isArray(ordersRes.data) && ordersRes.data.length > 0) {
        setOrders(ordersRes.data.map(o => ({ ...o, id: o.orderId || o._id })));
      }

      // Settings
      const settingsRes = await apiService.getSettings();
      if (isMounted && settingsRes.success && settingsRes.data) {
        setStoreSettings(settingsRes.data);
      }

      // Promos
      const promosRes = await apiService.getPromos();
      if (isMounted && promosRes.success && Array.isArray(promosRes.data) && promosRes.data.length > 0) {
        setPromoCodes(promosRes.data.map(p => ({ ...p, id: p._id || p.id })));
      }
    };

    fetchBackendData();
    return () => {
      isMounted = false;
    };
  }, []);

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
    apiService.createOrder(newOrder);
    return newOrder;
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
    // Call Node.js API
    apiService.updateOrderStatus(orderId, newStatus);
  };

  const getOrderById = (orderId) => {
    if (!orderId) return null;
    const cleanId = orderId.trim().toUpperCase();
    return orders.find((o) => (o.id && o.id.toUpperCase() === cleanId) || (o.orderId && o.orderId.toUpperCase() === cleanId));
  };

  // Settings Operations
  const updateStoreSettings = async (newSettings) => {
    setStoreSettings((prev) => ({ ...prev, ...newSettings }));
    // Call Node.js API
    apiService.updateSettings(newSettings);
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
    // Call Node.js API
    apiService.createPromo(newPromo);
    return newPromo;
  };

  const updatePromoCode = async (id, updatedFields) => {
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedFields } : p))
    );
    // Call Node.js API
    apiService.updatePromo(id, updatedFields);
  };

  const deletePromoCode = async (id) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
    // Call Node.js API
    apiService.deletePromo(id);
  };

  const validatePromoCode = (code) => {
    if (!code) return { valid: false, error: 'Empty code' };
    const cleanCode = code.trim().toUpperCase();
    const found = promoCodes.find((p) => p.code === cleanCode && p.active);
    if (found) {
      return { valid: true, discount: found.discount, code: found.code };
    }
    return { valid: false, error: 'Invalid or inactive promo code' };
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
