/**
 * Discount utility functions for Phum Yeung Restaurant
 * Supports both Product-level (per-dish) and Category-level discounts.
 */

export const getEffectiveDiscount = (dish, categoryDiscounts = {}) => {
  if (!dish) return 0;

  // 1. Dish-specific discount takes first priority if configured
  if (dish.discount_percent !== undefined && dish.discount_percent !== null) {
    const dishDisc = Number(dish.discount_percent);
    if (!isNaN(dishDisc) && dishDisc > 0) {
      return Math.min(100, Math.max(0, dishDisc));
    }
  }

  // 2. Category-level discount
  if (dish.category && categoryDiscounts) {
    const catKey = String(dish.category).trim().toLowerCase();
    const catDisc = Number(categoryDiscounts[catKey] || categoryDiscounts[dish.category]);
    if (!isNaN(catDisc) && catDisc > 0) {
      return Math.min(100, Math.max(0, catDisc));
    }
  }

  return 0;
};

export const getDiscountedPrice = (dish, categoryDiscounts = {}) => {
  if (!dish) return 0;
  const originalUsd = Number(dish.price) || 0;
  const discountPct = getEffectiveDiscount(dish, categoryDiscounts);

  if (discountPct <= 0) return originalUsd;

  const discountedUsd = originalUsd * (1 - discountPct / 100);
  return Math.max(0.0244, parseFloat(discountedUsd.toFixed(4)));
};

export const getDiscountedPriceKHR = (dish, categoryDiscounts = {}, khrRate = 4100) => {
  if (!dish) return 0;
  const originalKhr = dish.price_khr !== undefined && dish.price_khr !== null
    ? Number(dish.price_khr)
    : Math.round((Number(dish.price) || 0) * khrRate);

  const discountPct = getEffectiveDiscount(dish, categoryDiscounts);
  if (discountPct <= 0) return Math.max(100, originalKhr);

  const discountedKhr = Math.round(originalKhr * (1 - discountPct / 100));
  return Math.max(100, discountedKhr);
};
