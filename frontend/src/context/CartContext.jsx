import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '../config/api';
import { useRestaurant } from './RestaurantContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { validatePromoCode, storeSettings } = useRestaurant();

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [promoCode, setPromoCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  const triggerCartBounce = () => {
    setIsCartBouncing(true);
    setTimeout(() => {
      setIsCartBouncing(false);
    }, 600);
  };

  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
  }, [items]);

  const addToCart = (dish, quantity = 1, spiceLevel = 'mild', notes = '') => {
    triggerCartBounce();
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.dishId === dish.id && item.spiceLevel === spiceLevel && item.notes === notes
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }

      const newItem = {
        cartItemId: `${dish.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        dishId: dish.id,
        name_km: dish.name_km,
        name_en: dish.name_en,
        price: Number(dish.price),
        image: dish.image,
        quantity,
        spiceLevel: spiceLevel || dish.spice_level || 'mild',
        notes: notes || ''
      };
      return [...prev, newItem];
    });
  };

  const removeFromCart = (cartItemId) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = (cartItemId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode('');
    setDiscountPercent(0);
  };

  const applyPromo = (code) => {
    const res = validatePromoCode(code);
    if (res.valid) {
      setPromoCode(res.code);
      setDiscountPercent(res.discount);
      return { success: true, discount: res.discount };
    }
    return { success: false, error: res.error };
  };

  // Calculations based on dynamic store settings
  const feeBase = storeSettings?.standardDeliveryFee ?? 1.50;
  const freeThreshold = storeSettings?.freeDeliveryThreshold ?? 25.00;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = (subtotal * discountPercent) / 100;
  const deliveryFee = items.length === 0 ? 0 : (subtotal >= freeThreshold ? 0 : feeBase);
  const total = Math.max(0, subtotal - discount + deliveryFee);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        isCartBouncing,
        triggerCartBounce,
        subtotal,
        discount,
        discountPercent,
        deliveryFee,
        total,
        promoCode,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyPromo
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
