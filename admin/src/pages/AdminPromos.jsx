import React, { useState, useMemo } from 'react';
import {
  Tag,
  Percent,
  UtensilsCrossed,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Save,
  Sparkles,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { CustomSelect } from '../components/common/CustomSelect';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { getImageUrl } from '../config/api';
import { getEffectiveDiscount, getDiscountedPrice, getDiscountedPriceKHR } from '../utils/discount';

export const AdminPromos = () => {
  const { t, language, formatCurrency } = useLanguage();
  const {
    promoCodes,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    storeSettings,
    updateCategoryDiscount,
    updateDishDiscount,
    dishes,
    allCategories,
    categories: restaurantCategories
  } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  // Active Management Tab: 'category' | 'product' | 'vouchers'
  const [activeTab, setActiveTab] = useState('category');

  // Categories list
  const categoryList = (restaurantCategories || []).filter((c) => c.id !== 'all');

  // Category Discounts state
  const categoryDiscounts = storeSettings?.categoryDiscounts || {};

  // Product Discounts state
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');

  // Promo Code Modal & Form State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('15');
  const [newDesc, setNewDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // 1. Category Discount Instant Handler
  const handleSaveCategoryDiscount = async (catId, discountPct) => {
    try {
      const num = Number(discountPct) || 0;
      await updateCategoryDiscount(catId, num);
      showToast(
        isKm
          ? num > 0
            ? `បានកំណត់បញ្ចុះតម្លៃ ${num}% សម្រាប់ប្រភេទ "${catId}" ជោគជ័យ!`
            : `បានលុបការបញ្ចុះតម្លៃសម្រាប់ប្រភេទ "${catId}" រួចរាល់!`
          : num > 0
            ? `Set ${num}% discount for category "${catId}" successfully!`
            : `Removed discount for category "${catId}"!`,
        'success'
      );
    } catch (err) {
      showToast(isKm ? 'មិនអាចរក្សាទុកបានទេ' : 'Could not save discount', 'error');
    }
  };

  // 2. Product (Dish) Discount Instant Handler
  const handleSaveDishDiscount = async (dishId, discountPct) => {
    try {
      const num = Math.min(90, Math.max(0, Math.round(Number(discountPct) || 0)));
      await updateDishDiscount(dishId, num);
      showToast(
        isKm
          ? num > 0
            ? `បានកំណត់បញ្ចុះតម្លៃ ${num}% សម្រាប់មុខម្ហូបជោគជ័យ!`
            : `បានលុបការបញ្ចុះតម្លៃលើមុខម្ហូបនេះ!`
          : num > 0
            ? `Set ${num}% discount for dish successfully!`
            : `Removed discount for this dish!`,
        'success'
      );
    } catch (err) {
      showToast(isKm ? 'មិនអាចរក្សាទុកបានទេ' : 'Could not save discount', 'error');
    }
  };

  // 3. Promo Voucher Code Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) {
      setError(t('checkout.validation_required'));
      return;
    }
    const discountVal = Number(newDiscount);
    if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
      setError('Please enter a valid discount between 1% and 100%');
      return;
    }

    await addPromoCode({
      code: newCode,
      discount: discountVal,
      description: newDesc,
      active: isActive
    });

    showToast(isKm ? 'បានបង្កើតកូដបញ្ចុះតម្លៃថ្មីជោគជ័យ!' : 'New promo code created successfully!', 'success');
    setIsAddModalOpen(false);
    setNewCode('');
    setNewDesc('');
    setError('');
  };

  const handleToggleActive = (promo) => {
    updatePromoCode(promo.id, { active: !promo.active });
    showToast(
      isKm
        ? `បានប្តូរស្ថានភាពកូដ ${promo.code} ទៅជា ${!promo.active ? 'Active' : 'Inactive'}`
        : `Promo code ${promo.code} set to ${!promo.active ? 'Active' : 'Inactive'}`,
      'info'
    );
  };

  const handleDelete = (promo) => {
    setPromoToDelete(promo);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (promoToDelete) {
      deletePromoCode(promoToDelete.id);
      showToast(isKm ? 'បានលុបកូដជោគជ័យ' : 'Promo code deleted', 'info');
      setIsDeleteModalOpen(false);
      setPromoToDelete(null);
    }
  };

  // Filtered dishes for Product Discount tab
  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (selectedProductCategory !== 'all') {
        const dCat = String(dish.category || '').toLowerCase().trim();
        const tCat = String(selectedProductCategory).toLowerCase().trim();
        if (dCat !== tCat) return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        const matchKm = (dish.name_km || '').toLowerCase().includes(q);
        const matchEn = (dish.name_en || '').toLowerCase().includes(q);
        if (!matchKm && !matchEn) return false;
      }
      return true;
    });
  }, [dishes, selectedProductCategory, productSearch]);

  const activeCategoryCount = Object.keys(categoryDiscounts).filter((k) => Number(categoryDiscounts[k]) > 0).length;
  const activeDishDealsCount = dishes.filter((d) => Number(d.discount_percent) > 0).length;

  return (
    <div>
      {/* Top Header */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent size={24} color="var(--color-primary)" />
            <span>{isKm ? 'ការគ្រប់គ្រងការបញ្ចុះតម្លៃ & ប្រូម៉ូសិន' : 'Discounts & Promotions Hub'}</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isKm
              ? 'គ្រប់គ្រងការបញ្ចុះតម្លៃតាមប្រភេទ Category, តាមមុខម្ហូប Dish, និងកូដ Checkout Vouchers'
              : 'Manage discounts by Category, by individual Product, or Promo Voucher codes'}
          </p>
        </div>

        {activeTab === 'vouchers' && (
          <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} icon={<Plus size={16} />}>
            {t('admin.add_promo')}
          </Button>
        )}
      </div>

      <div className="admin-content">
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: 'var(--space-lg)',
            borderBottom: '2px solid #e2e8f0',
            paddingBottom: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('category')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'category' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: activeTab === 'category' ? 'rgba(168, 30, 44, 0.08)' : 'transparent',
              color: activeTab === 'category' ? 'var(--color-primary)' : '#64748b',
              fontWeight: 700,
              fontSize: '0.92rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Tag size={16} />
            <span>{isKm ? '១. បញ្ចុះតម្លៃតាមប្រភេទ (Category Deals)' : '1. Category Discounts'}</span>
            {activeCategoryCount > 0 && (
              <span
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontWeight: 800
                }}
              >
                {activeCategoryCount} Active
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('product')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'product' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: activeTab === 'product' ? 'rgba(168, 30, 44, 0.08)' : 'transparent',
              color: activeTab === 'product' ? 'var(--color-primary)' : '#64748b',
              fontWeight: 700,
              fontSize: '0.92rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <UtensilsCrossed size={16} />
            <span>{isKm ? '២. បញ្ចុះតម្លៃតាមមុខម្ហូប (Product Deals)' : '2. Product Discounts'}</span>
            {activeDishDealsCount > 0 && (
              <span
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontWeight: 800
                }}
              >
                {activeDishDealsCount} Deals
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vouchers')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              border: 'none',
              borderBottom: activeTab === 'vouchers' ? '3px solid var(--color-primary)' : '3px solid transparent',
              backgroundColor: activeTab === 'vouchers' ? 'rgba(168, 30, 44, 0.08)' : 'transparent',
              color: activeTab === 'vouchers' ? 'var(--color-primary)' : '#64748b',
              fontWeight: 700,
              fontSize: '0.92rem',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Percent size={16} />
            <span>{isKm ? '៣. កូដប្រូម៉ូសិន (Voucher Codes)' : '3. Promo Voucher Codes'}</span>
            <span
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: '0.7rem',
                padding: '2px 7px',
                borderRadius: '9999px',
                fontWeight: 800
              }}
            >
              {promoCodes.length} Codes
            </span>
          </button>
        </div>

        {/* TAB 1: CATEGORY DISCOUNTS */}
        {activeTab === 'category' && (
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                  {isKm ? 'បញ្ចុះតម្លៃទាំងស្រុងតាមប្រភេទម្ហូប (Category Discounts)' : 'Category-Wide Discount Management'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {isKm
                    ? 'ចុចលើភាគរយ (% OFF) ណាមួយ ប្រព័ន្ធនឹងបញ្ចុះតម្លៃភ្លាមៗលើគ្រប់មុខម្ហូបទាំងអស់ក្នុងប្រភេទនោះ!'
                    : 'Click any discount % below to instantly apply discount to all dishes in that category!'}
                </p>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{isKm ? 'ប្រភេទមុខម្ហូប' : 'Category Name'}</th>
                    <th>{isKm ? 'ចំនួនមុខម្ហូប' : 'Dish Count'}</th>
                    <th>{isKm ? 'ការបញ្ចុះតម្លៃបច្ចុប្បន្ន' : 'Current Discount'}</th>
                    <th>{isKm ? 'ជ្រើសរើសភាគរយចុះថ្លៃ (ចុចដើម្បីអនុវត្តភ្លាម)' : 'Click to Set Discount (% OFF)'}</th>
                    <th>{isKm ? 'សកម្មភាព' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryList.map((cat) => {
                    const catKey = String(cat.id).trim().toLowerCase();
                    const currentDiscount = Number(categoryDiscounts[catKey] || categoryDiscounts[cat.id] || 0);
                    const dishCount = dishes.filter(
                      (d) => String(d.category || '').toLowerCase().trim() === catKey
                    ).length;

                    return (
                      <tr key={cat.id}>
                        <td>
                          <div>
                            <strong style={{ fontSize: '0.98rem', color: '#1e293b' }}>
                              {cat.label_km}
                            </strong>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {cat.label_en} ({cat.id})
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--info" style={{ fontWeight: 600 }}>
                            {dishCount} {isKm ? 'មុខម្ហូប' : 'dishes'}
                          </span>
                        </td>
                        <td>
                          {currentDiscount > 0 ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '4px 10px',
                                borderRadius: '9999px',
                                fontWeight: 800,
                                fontSize: '0.85rem'
                              }}
                            >
                              <Flame size={14} /> -{currentDiscount}% OFF
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                              {isKm ? 'គ្មានការបញ្ចុះតម្លៃ (0%)' : 'Regular (0%)'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {[0, 10, 15, 20, 25, 30, 50].map((preset) => {
                              const isSelected = currentDiscount === preset;
                              return (
                                <button
                                  type="button"
                                  key={preset}
                                  onClick={() => handleSaveCategoryDiscount(cat.id, preset)}
                                  title={preset === 0 ? 'Clear discount' : `Apply ${preset}% off`}
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    border: '1.5px solid',
                                    borderColor: isSelected ? '#dc2626' : '#cbd5e1',
                                    backgroundColor: isSelected ? '#dc2626' : '#ffffff',
                                    color: isSelected ? '#ffffff' : '#334155',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none'
                                  }}
                                >
                                  {preset === 0 ? (isKm ? '0% (ធម្មតា)' : '0% (None)') : `-${preset}%`}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          {currentDiscount > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveCategoryDiscount(cat.id, 0)}
                              style={{ color: '#dc2626', fontSize: '0.8rem' }}
                            >
                              {isKm ? 'លុបការបញ្ចុះតម្លៃ' : 'Clear Deal'}
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT (DISH) DISCOUNTS */}
        {activeTab === 'product' && (
          <div className="admin-card">
            <div className="admin-card__header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                  {isKm ? 'បញ្ចុះតម្លៃតាមមុខម្ហូបនីមួយៗ (Product-Level Discounts)' : 'Product-Specific Discounts'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {isKm
                    ? 'ចុចលើភាគរយ (% OFF) ដើម្បីអនុវត្តការបញ្ចុះតម្លៃភ្លាមៗលើមុខម្ហូបនីមួយៗ (មានអាទិភាពលើស Category Deal)'
                    : 'Click any discount % to instantly set discount for that dish (overrides category discount)'}
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '220px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder={isKm ? 'ស្វែងរកមុខម្ហូប...' : 'Search dish...'}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    style={{ paddingLeft: '36px', height: '40px', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ minWidth: '200px' }}>
                  <CustomSelect
                    options={[{ id: 'all', label: isKm ? 'គ្រប់ប្រភេទទាំងអស់' : 'All Categories' }, ...categoryList.map((c) => ({
                      id: c.id,
                      label: isKm ? c.label_km : c.label_en
                    }))]}
                    value={selectedProductCategory}
                    onChange={(val) => setSelectedProductCategory(val)}
                  />
                </div>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>{isKm ? 'ឈ្មោះមុខម្ហូប' : 'Dish Name'}</th>
                    <th>{isKm ? 'តម្លៃដើម' : 'Original Price'}</th>
                    <th>{isKm ? 'បញ្ចុះតម្លៃ (% OFF) - ចុចអនុវត្តភ្លាម' : 'Set Discount (% OFF) - Instant Click'}</th>
                    <th>{isKm ? 'តម្លៃក្រោយបញ្ចុះរួច' : 'Discounted Price'}</th>
                    <th>{isKm ? 'សកម្មភាព' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDishes.map((dish) => {
                    const originalKhr = dish.price_khr || Math.max(100, Math.round(Number(dish.price || 0) * 4100));
                    const currentDishDisc = Number(dish.discount_percent || 0);
                    const catDiscount = Number(categoryDiscounts[String(dish.category).trim().toLowerCase()] || 0);
                    const effectiveDisc = getEffectiveDiscount(dish, categoryDiscounts);

                    const finalPriceKhr = Math.round(originalKhr * (1 - effectiveDisc / 100));
                    const finalPriceUsd = (Number(dish.price || 0) * (1 - effectiveDisc / 100)).toFixed(2);

                    return (
                      <tr key={dish.id}>
                        <td style={{ width: '60px' }}>
                          <img
                            src={getImageUrl(dish.image)}
                            alt={dish.name_en}
                            className="admin-table__img"
                            style={{ width: '46px', height: '46px', borderRadius: '10px' }}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        </td>
                        <td>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>
                              {dish.name_km}
                            </strong>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {dish.name_en}
                            </div>
                            <span className="badge badge--info" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                              {categoryList.find((c) => c.id === dish.category)?.[isKm ? 'label_km' : 'label_en'] || dish.category}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#334155' }}>
                            {originalKhr.toLocaleString()} ៛
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            ≈ ${(dish.price || 0).toFixed(2)}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {[0, 10, 15, 20, 30, 50].map((pct) => {
                              const isSelected = currentDishDisc === pct;
                              return (
                                <button
                                  type="button"
                                  key={pct}
                                  onClick={() => handleSaveDishDiscount(dish.id, pct)}
                                  title={pct === 0 ? 'Clear dish discount' : `Apply ${pct}% off`}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1.5px solid',
                                    borderColor: isSelected ? '#dc2626' : '#cbd5e1',
                                    backgroundColor: isSelected ? '#dc2626' : '#ffffff',
                                    color: isSelected ? '#ffffff' : '#334155',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 6px rgba(220, 38, 38, 0.3)' : 'none'
                                  }}
                                >
                                  {pct === 0 ? '0%' : `-${pct}%`}
                                </button>
                              );
                            })}
                          </div>
                          {catDiscount > 0 && currentDishDisc === 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#d97706', display: 'block', marginTop: '4px', fontWeight: 600 }}>
                              🔥 Inheriting Category Deal: -{catDiscount}%
                            </span>
                          )}
                        </td>
                        <td>
                          {effectiveDisc > 0 ? (
                            <div>
                              <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                                {finalPriceKhr.toLocaleString()} ៛
                                <span style={{ marginLeft: '4px', fontSize: '0.7rem', backgroundColor: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>
                                  -{effectiveDisc}%
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#94a3b8' }}>
                                {originalKhr.toLocaleString()} ៛ (≈ ${finalPriceUsd})
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {originalKhr.toLocaleString()} ៛
                            </span>
                          )}
                        </td>
                        <td>
                          {currentDishDisc > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveDishDiscount(dish.id, 0)}
                              style={{ color: '#dc2626', fontSize: '0.78rem' }}
                            >
                              {isKm ? 'លុប' : 'Clear'}
                            </Button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PROMO VOUCHER CODES */}
        {activeTab === 'vouchers' && (
          <div className="admin-card">
            <div className="admin-card__header">
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                  {t('admin.promos_title')}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {isKm
                    ? 'កូដគូប៉ុងដែលអតិថិជនអាចបញ្ចូលនៅទំព័រ Checkout ដើម្បីទទួលបានការបញ្ចុះតម្លៃបន្ថែម'
                    : 'Voucher promo codes entered by customers during checkout for extra discounts'}
                </p>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Total Codes: <strong>{promoCodes.length}</strong>
              </span>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.promo_code')}</th>
                    <th>{t('admin.promo_discount')}</th>
                    <th>Description</th>
                    <th>{t('admin.status')}</th>
                    <th>Toggle</th>
                    <th>{t('admin.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag size={16} color="var(--color-primary)" />
                          <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)', letterSpacing: '0.05em' }}>
                            {p.code}
                          </strong>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-accent)' }}>
                        {p.discount}% OFF
                      </td>
                      <td>{p.description || 'Special Promotion'}</td>
                      <td>
                        {p.active ? (
                          <Badge variant="success">
                            <CheckCircle2 size={12} />
                            <span>{t('admin.promo_active')}</span>
                          </Badge>
                        ) : (
                          <Badge variant="danger">
                            <XCircle size={12} />
                            <span>{t('admin.promo_inactive')}</span>
                          </Badge>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`btn btn--sm ${p.active ? 'btn--outline' : 'btn--secondary'}`}
                          onClick={() => handleToggleActive(p)}
                          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        >
                          {p.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => handleDelete(p)}
                          style={{ color: 'var(--color-danger)' }}
                          title="Delete code"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Promo Code Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('admin.add_promo')}
        maxWidth="480px"
      >
        <form onSubmit={handleAddSubmit}>
          {error && (
            <div style={{ backgroundColor: '#ffebee', color: 'var(--color-danger)', padding: '8px 12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label form-label--required">{t('admin.promo_code')}</label>
            <input
              type="text"
              className="form-input"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="e.g. PHUM25"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label--required">{t('admin.promo_discount')}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="100"
                className="form-input"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                placeholder="15"
                required
              />
              <span style={{ position: 'absolute', right: '12px', color: 'var(--color-text-muted)' }}>%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. 15% OFF Weekend Special"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
            <input
              type="checkbox"
              id="promo_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="promo_active" style={{ cursor: 'pointer', fontSize: '0.9rem' }}>
              {t('admin.promo_active')}
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('admin.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Promo Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={isKm ? 'តើអ្នកប្រាកដជាចង់លុបកូដប្រូម៉ូសិននេះ?' : 'Delete Promo Code'}
        description={isKm ? 'សកម្មភាពនេះនឹងលុបកូដចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។' : 'This action cannot be undone.'}
        itemTitle={promoToDelete ? promoToDelete.code : ''}
        itemSubtitle={promoToDelete ? (promoToDelete.description || `Discount: ${promoToDelete.discount}%`) : ''}
        itemBadge={promoToDelete ? `-${promoToDelete.discount}% OFF` : ''}
      />
    </div>
  );
};
