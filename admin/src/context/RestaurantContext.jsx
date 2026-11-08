import { printOrdersReport } from '../utils/printReport';
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
  { id: 'promo-3', code: 'VIP30', discount: 30, active: false, description: '30% OFF Special VIP Deal' }
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

  // Real Database Customers State
  const [dbCustomers, setDbCustomers] = useState([]);

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
      // Dishes: backend database is the single source of truth
      const dishesRes = await apiService.getDishes();
      if (isMounted && dishesRes.success && Array.isArray(dishesRes.data)) {
        const backendDishes = dishesRes.data.map(d => ({ ...d, id: d.dishId || d._id }));
        backendDishes.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setDishes(backendDishes);
        try {
          localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(backendDishes));
        } catch (_) {}
      }

      // Real Customers from Database
      const custRes = await apiService.getCustomers();
      if (isMounted && custRes.success && Array.isArray(custRes.data)) {
        setDbCustomers(custRes.data);
      }

      // Real Orders from Database
      const ordersRes = await apiService.getOrders();
      if (isMounted && ordersRes.success && Array.isArray(ordersRes.data)) {
        const backendOrders = ordersRes.data.map(o => ({ ...o, id: o.orderId || o._id }));
        setOrders(backendOrders);
        try {
          localStorage.setItem(API_CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(backendOrders));
        } catch (_) {}
      }

      // Categories from Database
      const categoriesRes = await apiService.getCategories();
      if (isMounted && categoriesRes.success && Array.isArray(categoriesRes.data)) {
        const normalized = categoriesRes.data.map(normalizeCategoryItem).filter(Boolean);
        setCategories(normalized);
        try {
          localStorage.setItem('phum_yeung_categories_v3', JSON.stringify(normalized));
        } catch (_) {}
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

  // Real-time broadcast channel to sync live between Admin and Customer Frontend tabs
  const syncChannel = useMemo(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel('phum_yeung_deals_sync');
    }
    return null;
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(dishes));
    syncChannel?.postMessage({ type: 'DISHES_UPDATED', dishes });
  }, [dishes, syncChannel]);

  useEffect(() => {
    localStorage.setItem('phum_yeung_categories_v3', JSON.stringify(categories));
    syncChannel?.postMessage({ type: 'CATEGORIES_UPDATED', categories });
  }, [categories, syncChannel]);

  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('phum_yeung_settings', JSON.stringify(storeSettings));
    syncChannel?.postMessage({ type: 'SETTINGS_UPDATED', storeSettings });
  }, [storeSettings, syncChannel]);

  useEffect(() => {
    localStorage.setItem('phum_yeung_promos', JSON.stringify(promoCodes));
    syncChannel?.postMessage({ type: 'PROMOS_UPDATED', promoCodes });
  }, [promoCodes, syncChannel]);

  // Helper to read active admin from auth storage
  const getCurrentAdmin = () => {
    try {
      const raw = localStorage.getItem(API_CONFIG.STORAGE_KEYS.AUTH);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          adminName: parsed.name || parsed.user?.name || 'Admin',
          adminEmail: parsed.email || parsed.user?.email || '',
          adminId: parsed.id || parsed._id || parsed.user?.id || parsed.user?._id
        };
      }
    } catch (_) {}
    return { adminName: 'Admin', adminEmail: '', adminId: null };
  };

  // Dish Operations (State + API with Admin Audit Tracking)
  const addDish = async (dishData) => {
    const admin = getCurrentAdmin();
    const generatedId = `dish-${Date.now()}`;
    const khrVal = dishData.price_khr !== undefined
      ? Number(dishData.price_khr)
      : (Number(dishData.price) >= 100 ? Number(dishData.price) : Math.round(Number(dishData.price) * 4100));
    const usdVal = Number(dishData.price) >= 100
      ? parseFloat((khrVal / 4100).toFixed(4))
      : Number(dishData.price);

    const now = new Date().toISOString();
    const newDish = {
      ...dishData,
      id: generatedId,
      dishId: generatedId,
      price: usdVal,
      price_khr: khrVal,
      discount_percent: Number(dishData.discount_percent) || 0,
      rating: 5.0,
      reviews_count: 0,
      inStock: dishData.inStock !== false,
      createdBy: {
        name: admin.adminName,
        email: admin.adminEmail,
        at: now
      },
      updatedBy: {
        name: admin.adminName,
        email: admin.adminEmail,
        at: now
      },
      activityLogs: [
        {
          action: 'create',
          adminName: admin.adminName,
          adminEmail: admin.adminEmail,
          details: `Created product "${dishData.name_km || dishData.name_en}"`,
          at: now
        }
      ],
      createdAt: now
    };
    // Optimistically prepend to state so it renders immediately at the top
    setDishes((prev) => [newDish, ...prev.filter(d => d.id !== generatedId)]);

    // Send to Node.js backend with authenticated admin name
    try {
      const res = await apiService.createDish({
        ...newDish,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        adminId: admin.adminId
      });
      if (res && res.success && res.data) {
        const savedDish = {
          ...res.data,
          id: res.data.dishId || res.data._id || generatedId,
          dishId: res.data.dishId || generatedId,
          price: res.data.price !== undefined ? Number(res.data.price) : newDish.price,
          price_khr: res.data.price_khr !== undefined ? Number(res.data.price_khr) : newDish.price_khr,
          createdAt: res.data.createdAt || newDish.createdAt
        };
        setDishes((prev) => [
          savedDish,
          ...prev.filter(d => d.id !== generatedId && d.dishId !== generatedId && d.id !== savedDish.id && d.dishId !== savedDish.dishId)
        ]);
        return savedDish;
      }
    } catch (err) {
      console.warn('[RestaurantContext] addDish API error, dish preserved locally:', err);
    }
    return newDish;
  };

  const updateDish = async (id, updatedFields) => {
    const admin = getCurrentAdmin();
    const now = new Date().toISOString();

    setDishes((prev) => {
      const next = prev.map((dish) => {
        if (dish.id !== id && dish.dishId !== id && dish._id !== id) return dish;
        let khrVal = updatedFields.price_khr;
        let usdVal = updatedFields.price;
        if (khrVal !== undefined && usdVal === undefined) {
          usdVal = parseFloat((Number(khrVal) / 4100).toFixed(4));
        } else if (usdVal !== undefined && khrVal === undefined) {
          const numP = Number(usdVal);
          if (numP >= 100) {
            khrVal = Math.round(numP);
            usdVal = parseFloat((khrVal / 4100).toFixed(4));
          } else {
            khrVal = Math.max(100, Math.round(numP * 4100));
          }
        }
        return {
          ...dish,
          ...updatedFields,
          price: usdVal !== undefined ? Number(usdVal) : dish.price,
          price_khr: khrVal !== undefined ? Number(khrVal) : (dish.price_khr || Math.round(Number(dish.price) * 4100)),
          discount_percent: updatedFields.discount_percent !== undefined
            ? Number(updatedFields.discount_percent)
            : (dish.discount_percent || 0),
          updatedBy: {
            name: admin.adminName,
            email: admin.adminEmail,
            at: now
          }
        };
      });
      try {
        localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    try {
      const res = await apiService.updateDish(id, {
        ...updatedFields,
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        adminId: admin.adminId
      });
      if (res && res.success && res.data) {
        setDishes((prev) => {
          const next = prev.map((d) =>
            d.id === id || d.dishId === id || d._id === id
              ? { ...d, ...res.data, id: res.data.dishId || res.data._id || d.id }
              : d
          );
          try {
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(next));
          } catch (_) {}
          return next;
        });
        return res.data;
      }
    } catch (err) {
      console.warn('[RestaurantContext] updateDish error:', err);
    }
  };

  const toggleDishStock = async (id) => {
    const dish = dishes.find((d) => d.id === id || d.dishId === id);
    if (dish) {
      const newStock = dish.inStock === false ? true : false;
      await updateDish(id, { inStock: newStock });
    }
  };

  const deleteDish = async (id) => {
    const admin = getCurrentAdmin();
    setDishes((prev) => prev.filter((dish) => dish.id !== id && dish.dishId !== id));
    try {
      await apiService.deleteDish(id, {
        adminName: admin.adminName,
        adminEmail: admin.adminEmail,
        adminId: admin.adminId
      });
      await refreshData();
    } catch (err) {
      console.warn('[RestaurantContext] deleteDish error:', err);
    }
  };

  const refreshData = async () => {
    try {
      const dishesRes = await apiService.getDishes();
      if (dishesRes && dishesRes.success && Array.isArray(dishesRes.data) && dishesRes.data.length > 0) {
        const backendDishes = dishesRes.data.map(d => ({ ...d, id: d.dishId || d._id }));
        backendDishes.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });
        setDishes(backendDishes);
        try {
          localStorage.setItem(API_CONFIG.STORAGE_KEYS.MENU, JSON.stringify(backendDishes));
        } catch (_) {}
        return { success: true, count: dishesRes.data.length };
      }
    } catch (e) {
      console.warn('refreshData error:', e);
    }
    return { success: false };
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

  const updateOrderStatus = async (orderId, newStatus, adminName) => {
    // Call Node.js API
    try {
      const res = await apiService.updateOrderStatus(orderId, newStatus, adminName);
      if (res?.success && res.data) {
        const updated = { ...res.data, id: res.data.orderId || res.data._id };
        setOrders((prev) => {
          const next = prev.map((order) =>
            order.id === orderId || order.orderId === orderId || (order._id && order._id === orderId)
              ? { ...order, ...updated }
              : order
          );
          try {
            localStorage.setItem(API_CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(next));
          } catch (_) {}
          return next;
        });
        return updated;
      }
      if (res?.error) {
        throw new Error(res.error);
      }
    } catch (err) {
      console.error('[RestaurantContext] updateOrderStatus error:', err);
      // Still update local state as fallback
      setOrders((prev) => {
        const next = prev.map((order) =>
          order.id === orderId || order.orderId === orderId || (order._id && order._id === orderId)
            ? { ...order, status: newStatus }
            : order
        );
        try {
          localStorage.setItem(API_CONFIG.STORAGE_KEYS.ORDERS, JSON.stringify(next));
        } catch (_) {}
        return next;
      });
      throw err;
    }
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

  // Discount Operations (Category-level & Product-level)
  const updateCategoryDiscount = async (categoryId, discountPercent) => {
    const currentDiscounts = { ...(storeSettings.categoryDiscounts || {}) };
    const num = Number(discountPercent) || 0;
    const catKey = String(categoryId).trim().toLowerCase();
    if (num <= 0) {
      delete currentDiscounts[catKey];
      delete currentDiscounts[categoryId];
    } else {
      currentDiscounts[catKey] = Math.min(100, Math.max(1, Math.round(num)));
    }
    const updatedSettings = {
      ...storeSettings,
      categoryDiscounts: currentDiscounts
    };
    await updateStoreSettings(updatedSettings);
    return updatedSettings;
  };

  const updateDishDiscount = async (dishId, discountPercent) => {
    const num = Math.min(90, Math.max(0, Math.round(Number(discountPercent) || 0)));
    await updateDish(dishId, { discount_percent: num });
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
    try {
      const res = await apiService.updatePromo(id, updatedFields);
      if (res?.success && res.data) {
        setPromoCodes((prev) =>
          prev.map((p) => (p.id === id || p._id === id || p.code === id ? { ...p, ...res.data, id: res.data._id || res.data.id || id } : p))
        );
        return res.data;
      }
    } catch (_) {}
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id || p._id === id || p.code === id ? { ...p, ...updatedFields } : p))
    );
  };

  const deletePromoCode = async (id) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
    // Call Node.js API
    apiService.deletePromo(id);
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

  const addCategory = async (catData) => {
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
    if (categories.some((c) => c.id === id)) {
      id = `${id}-${Math.floor(Math.random() * 1000)}`;
    }

    const newCategory = {
      id,
      label_km: catData.label_km?.trim() || catData.label_en?.trim() || id,
      label_en: catData.label_en?.trim() || catData.label_km?.trim() || id,
      order: categories.length + 1
    };

    setCategories((prev) => [...prev, newCategory]);

    try {
      const res = await apiService.createCategory(newCategory);
      if (res && res.success && res.data) {
        setCategories((prev) => [
          ...prev.filter(c => c.id !== id),
          res.data
        ]);
        return res.data;
      }
    } catch (err) {
      console.warn('[RestaurantContext] addCategory API error:', err);
    }
    return newCategory;
  };

  const updateCategory = async (oldId, updatedData) => {
    const newId = updatedData.id?.trim().toLowerCase() || oldId;
    const updatedCategory = {
      ...updatedData,
      id: newId,
      label_km: updatedData.label_km?.trim(),
      label_en: updatedData.label_en?.trim()
    };

    setCategories((prev) =>
      prev.map((c) => (c.id === oldId ? { ...c, ...updatedCategory } : c))
    );

    if (newId !== oldId) {
      setDishes((prev) =>
        prev.map((d) => (d.category === oldId ? { ...d, category: newId } : d))
      );
    }

    try {
      await apiService.updateCategory(oldId, updatedCategory);
    } catch (err) {
      console.warn('[RestaurantContext] updateCategory API error:', err);
    }
  };

  const deleteCategory = async (catId) => {
    const remaining = categories.filter((c) => c.id !== catId);
    setCategories(remaining);
    const fallbackId = remaining.find((c) => c.id === 'other-foods')?.id || remaining[0]?.id || 'specials';
    setDishes((prev) =>
      prev.map((d) => (d.category === catId ? { ...d, category: fallbackId } : d))
    );

    try {
      await apiService.deleteCategory(catId);
    } catch (err) {
      console.warn('[RestaurantContext] deleteCategory API error:', err);
    }
  };

  // Real Customers from Database (strictly reflects real users from database, no fake guest generation)
  const customers = useMemo(() => {
    return Array.isArray(dbCustomers) ? dbCustomers : [];
  }, [dbCustomers]);

  // Print Orders Report helper (replaces legacy CSV download)
  const handlePrintOrders = (customOrders = null, filterMeta = {}) => {
    printOrdersReport({
      orders: customOrders || orders,
      filterMeta,
      isKm: true
    });
  };
  const exportOrdersToCSV = handlePrintOrders;

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
        printOrdersReport: handlePrintOrders,
        storeSettings,
        updateStoreSettings,
        updateCategoryDiscount,
        updateDishDiscount,
        promoCodes,
        addPromoCode,
        updatePromoCode,
        deletePromoCode,
        validatePromoCode,
        categories,
        allCategories,
        refreshData,
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
