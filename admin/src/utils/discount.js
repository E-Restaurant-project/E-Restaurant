/**
 * Discount utility functions for Phum Yeung Restaurant
 * Supports Additive Stacking of Category-level & Product-level (per-dish) discounts.
 * E.g., Category 10% + Dish 10% = 20% total discount.
 */

export const getDiscountBreakdown = (dish, categoryDiscounts = {}) => {
  if (!dish) return { dishDisc: 0, catDisc: 0, total: 0 };

  let dishDisc = 0;
  if (dish.discount_percent !== undefined && dish.discount_percent !== null) {
    const d = Number(dish.discount_percent);
    if (!isNaN(d) && d > 0) dishDisc = d;
  }

  let catDisc = 0;
  if (dish.category && categoryDiscounts) {
    const rawCat = String(dish.category).trim();
    const catKey = rawCat.toLowerCase();
    const c = Number(
      categoryDiscounts[catKey] ||
      categoryDiscounts[rawCat] ||
      categoryDiscounts[catKey.replace(/^cat-/, '')] ||
      categoryDiscounts[`cat-${catKey}`] ||
      0
    );
    if (!isNaN(c) && c > 0) catDisc = c;
  }

  const total = Math.min(90, Math.max(0, Math.round(dishDisc + catDisc)));
  return { dishDisc, catDisc, total };
};

export const getEffectiveDiscount = (dish, categoryDiscounts = {}) => {
  return getDiscountBreakdown(dish, categoryDiscounts).total;
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
