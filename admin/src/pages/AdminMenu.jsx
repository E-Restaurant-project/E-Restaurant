import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Star,
  RefreshCw,
  History,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Activity,
  X
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { isNonSpicyCategory } from '../data/menu';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CustomSelect } from '../components/common/CustomSelect';
import { DishFormModal } from '../components/admin/DishFormModal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { getImageUrl } from '../config/api';
import { apiService } from '../services/api';
import { getEffectiveDiscount } from '../utils/discount';

export const AdminMenu = () => {
  const { t, language } = useLanguage();
  const {
    dishes,
    allCategories,
    addDish,
    updateDish,
    deleteDish,
    toggleDishStock,
    refreshData,
    storeSettings
  } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';
  const categoryOptions = allCategories || [];

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishToDelete, setDishToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Dish Activity Logs Modal
  const [selectedDishForLogs, setSelectedDishForLogs] = useState(null);

  // Global Admin Audit Logs Modal
  const [isAllLogsModalOpen, setIsAllLogsModalOpen] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [loadingAllLogs, setLoadingAllLogs] = useState(false);

  // Auto-sync latest dishes from server on page load
  useEffect(() => {
    if (typeof refreshData === 'function') {
      refreshData();
    }
  }, []);

  const handleRefresh = async () => {
    if (typeof refreshData !== 'function') return;
    setIsRefreshing(true);
    const res = await refreshData();
    setIsRefreshing(false);
    if (res && res.success) {
      showToast(
        isKm ? `បានទាញយកទិន្នន័យចុងក្រោយជោគជ័យ (${res.count} មុខម្ហូប)!` : `Synced latest menu (${res.count} dishes)!`,
        'success'
      );
    } else {
      showToast(isKm ? 'មិនអាចទាក់ទង Server បានទេ' : 'Could not reach server', 'warning');
    }
  };

  const handleOpenAllLogs = async () => {
    setIsAllLogsModalOpen(true);
    setLoadingAllLogs(true);
    try {
      const res = await apiService.getAuditLogs();
      if (res && res.success && Array.isArray(res.data)) {
        setAllLogs(res.data);
      }
    } catch (_) {}
    setLoadingAllLogs(false);
  };

  // Auto-open modal if navigating with ?action=add or ?add=true
  useEffect(() => {
    if (searchParams.get('action') === 'add' || searchParams.get('add') === 'true') {
      setEditingDish(null);
      setIsModalOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      nextParams.delete('add');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Filtered and sorted dishes (newest dishes always at the top)
  const filteredDishes = React.useMemo(() => {
    return dishes
      .filter((dish) => {
        if (selectedCategory !== 'all') {
          const dishCat = String(dish.category || '').trim().toLowerCase();
          const targetCat = String(selectedCategory).trim().toLowerCase();
          if (dishCat !== targetCat) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchKm = (dish.name_km || '').toLowerCase().includes(q);
          const matchEn = (dish.name_en || '').toLowerCase().includes(q);
          if (!matchKm && !matchEn) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const parseTime = (item) => {
          if (item.createdAt) return new Date(item.createdAt).getTime();
          const idStr = String(item.id || item.dishId || '');
          if (idStr.startsWith('dish-')) {
            const num = Number(idStr.replace('dish-', ''));
            if (!isNaN(num) && num > 0) return num;
          }
          return 0;
        };
        return parseTime(b) - parseTime(a);
      });
  }, [dishes, selectedCategory, searchQuery]);

  const handleOpenAdd = () => {
    setEditingDish(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleOpenDelete = (dish) => {
    setDishToDelete(dish);
    setIsDeleteModalOpen(true);
  };

  const handleToggleStock = async (dish) => {
    const targetId = dish.dishId || dish.id || dish._id;
    const willBeSelling = dish.inStock === false;
    await toggleDishStock(targetId);
    showToast(
      isKm
        ? `បានប្តូរស្ថានភាព "${dish.name_km}" ទៅ ${willBeSelling ? 'កំពុងលក់' : 'ឈប់លក់'}!`
        : `Updated "${dish.name_en || dish.name_km}" to ${willBeSelling ? 'In Stock (Selling)' : 'Out of Stock'}!`,
      'info'
    );
  };

  const handleConfirmDelete = async () => {
    if (dishToDelete) {
      const targetId = dishToDelete.dishId || dishToDelete.id || dishToDelete._id;
      await deleteDish(targetId);
      showToast(isKm ? 'បានលុបមុខម្ហូបជោគជ័យ!' : 'Dish deleted successfully!', 'info');
      setIsDeleteModalOpen(false);
      setDishToDelete(null);
    }
  };

  const handleSaveDish = async (dishData) => {
    if (editingDish) {
      await updateDish(editingDish.id, dishData);
      showToast(isKm ? 'បានកែសម្រួលមុខម្ហូបជោគជ័យ!' : 'Dish updated successfully!', 'success');
    } else {
      if (dishData.category && dishData.category !== 'all') {
        setSelectedCategory(dishData.category);
      }
      setSearchQuery('');
      await addDish(dishData);
      const catObj = categoryOptions.find((c) => c.id === dishData.category);
      const catName = isKm ? catObj?.label_km || dishData.category : catObj?.label_en || dishData.category;
      showToast(
        isKm ? `បានបន្ថែមមុខម្ហូបថ្មីជោគជ័យក្នុងប្រភេទ "${catName}"!` : `Dish added successfully under "${catName}"!`,
        'success'
      );
    }
  };

  const formatLogDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString(isKm ? 'km-KH' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return String(dateVal);
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title">{t('admin.nav_menu')}</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {isKm ? 'គ្រប់គ្រងមុខម្ហូប និងកត់ត្រា admin ដែលបានបង្កើត/កែប្រែ' : 'Manage dishes with complete admin audit trail'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAllLogs}
            icon={<History size={16} />}
          >
            {isKm ? 'ប្រវត្តិ Admin ទាំងអស់' : 'All Admin Audit Logs'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
          >
            {isKm ? 'ទាញយកទិន្នន័យថ្មី' : 'Sync Menu'}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={16} />}>
            {t('admin.add_dish')}
          </Button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          {/* Controls Bar */}
          <div className="admin-card__header">
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '260px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-light)'
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('menu.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '46px', fontSize: '0.9rem', borderRadius: '12px' }}
                />
              </div>

              <div style={{ minWidth: '240px' }}>
                <CustomSelect
                  options={categoryOptions.map((cat) => ({
                    id: cat.id,
                    label: isKm ? cat.label_km : cat.label_en
                  }))}
                  value={selectedCategory}
                  onChange={(val) => setSelectedCategory(val)}
                  placeholder={isKm ? 'ជ្រើសរើសប្រភេទ...' : 'Select category...'}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {t('menu.dish_count')} <strong>{filteredDishes.length}</strong>
            </div>
          </div>

          {/* Dishes Table with Selling Status & Admin Audit Info */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>{t('admin.dish_name_km')}</th>
                  <th>{t('admin.dish_category')}</th>
                  <th>{t('admin.dish_price')}</th>
                  <th>{isKm ? 'ស្ថានភាពលក់' : 'Selling Status'}</th>
                  <th>{isKm ? 'Admin បង្កើត / កែប្រែ' : 'Admin Audit Trail'}</th>
                  <th>Spice</th>
                  <th>Featured</th>
                  <th>{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                      {isKm ? 'មិនមានមុខម្ហូបនៅឡើយទេ សូមចុច "បន្ថែមមុខម្ហូប" ដើម្បីបង្កើតថ្មី' : 'No dishes found. Click "Add Dish" to create one.'}
                    </td>
                  </tr>
                ) : (
                  filteredDishes.map((dish) => {
                    const isSelling = dish.inStock !== false;
                    const createdName = dish.createdBy?.name || 'Admin';
                    const updatedName = dish.updatedBy?.name;
                    const logsCount = dish.activityLogs?.length || 0;

                    return (
                      <tr key={dish.id}>
                        <td>
                          <img
                            src={getImageUrl(dish.image)}
                            alt={dish.name_en || dish.name_km}
                            className="admin-table__img"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{dish.name_km}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{dish.name_en}</div>
                        </td>
                        <td>
                          <span className="badge badge--info">
                            {categoryOptions.find((c) => c.id === dish.category)?.[isKm ? 'label_km' : 'label_en'] ||
                              dish.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                          {(() => {
                            const originalKhr =
                              dish.price_khr || Math.max(100, Math.round(Number(dish.price || 0) * 4100));
                            const effectiveDiscount = getEffectiveDiscount(dish, storeSettings?.categoryDiscounts);
                            if (effectiveDiscount > 0) {
                              const discountedKhr = Math.round(originalKhr * (1 - effectiveDiscount / 100));
                              return (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '0.98rem', color: '#dc2626', fontWeight: 800 }}>
                                      {discountedKhr.toLocaleString()} ៛
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '0.68rem',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        fontWeight: 800
                                      }}
                                    >
                                      -{effectiveDiscount}%
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '0.72rem',
                                      textDecoration: 'line-through',
                                      color: '#94a3b8',
                                      fontWeight: 400
                                    }}
                                  >
                                    {originalKhr.toLocaleString()} ៛ (≈ ${(dish.price || 0).toFixed(2)})
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div>
                                <div style={{ fontSize: '0.98rem' }}>{originalKhr.toLocaleString()} ៛</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                  ≈ ${(dish.price || 0).toFixed(2)}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Interactive Selling / Stock Status Toggle */}
                        <td>
                          <button
                            type="button"
                            onClick={() => handleToggleStock(dish)}
                            title={isKm ? 'ចុចដើម្បីប្តូរស្ថានភាពលក់' : 'Click to toggle selling status'}
                            style={{
                              cursor: 'pointer',
                              border: isSelling ? '1px solid #bbf7d0' : '1px solid #fecaca',
                              borderRadius: '20px',
                              padding: '5px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: isSelling ? '#f0fdf4' : '#fef2f2',
                              color: isSelling ? '#15803d' : '#b91c1c',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isSelling ? '#16a34a' : '#dc2626'
                              }}
                            />
                            {isSelling ? (isKm ? 'កំពុងលក់' : 'Selling') : isKm ? 'ឈប់លក់' : 'Out of Stock'}
                          </button>
                        </td>

                        {/* Admin Tracking / Audit Information */}
                        <td>
                          <div style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span
                                style={{
                                  backgroundColor: '#e0f2fe',
                                  color: '#0369a1',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700
                                }}
                              >
                                {isKm ? 'បង្កើត' : 'By'}
                              </span>
                              <strong style={{ color: '#0f172a' }}>{createdName}</strong>
                            </div>

                            {updatedName && updatedName !== createdName && (
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  marginTop: '3px',
                                  color: '#475569'
                                }}
                              >
                                <span
                                  style={{
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '0.68rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {isKm ? 'កែប្រែ' : 'Edit'}
                                </span>
                                <span>{updatedName}</span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedDishForLogs(dish)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary, #b91c1c)',
                                fontSize: '0.74rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '2px 0 0 0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                textDecoration: 'underline'
                              }}
                            >
                              <History size={12} />
                              {isKm ? `ប្រវត្តិកែប្រែ (${logsCount})` : `History (${logsCount})`}
                            </button>
                          </div>
                        </td>

                        <td>
                          {!isNonSpicyCategory(dish) && dish.spice_level && dish.spice_level !== 'none' ? (
                            <span style={{ fontSize: '0.85rem' }}>🌶️ {dish.spice_level}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>None</span>
                          )}
                        </td>
                        <td>
                          {dish.featured ? (
                            <Badge variant="gold">
                              <Star size={12} fill="currentColor" />
                              <span>Yes</span>
                            </Badge>
                          ) : (
                            <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>No</span>
                          )}
                        </td>
                        <td>
                          <div className="admin-table__actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleOpenEdit(dish)}
                              title={t('common.edit')}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => handleOpenDelete(dish)}
                              style={{ color: 'var(--color-danger)' }}
                              title={t('common.delete')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Dish Modal */}
      <DishFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDish}
        dishToEdit={editingDish}
        initialCategory={selectedCategory !== 'all' ? selectedCategory : ''}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDishToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        dish={dishToDelete}
      />

      {/* Single Dish History Timeline Modal */}
      {selectedDishForLogs && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {isKm ? 'ប្រវត្តិកែប្រែមុខម្ហូប' : 'Dish Modification History'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {selectedDishForLogs.name_km} ({selectedDishForLogs.name_en})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDishForLogs(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {/* Creator Card */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <ShieldCheck size={18} color="#0284c7" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {isKm ? 'អ្នកបង្កើតដំបូង' : 'Created By'}:
                  </span>
                  <span style={{ color: '#0284c7', fontWeight: 800 }}>
                    {selectedDishForLogs.createdBy?.name || 'Admin'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} />
                  <span>{formatLogDate(selectedDishForLogs.createdBy?.at || selectedDishForLogs.createdAt)}</span>
                </div>
              </div>

              {/* Activity Timeline */}
              <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                {isKm ? 'សកម្មភាពលម្អិត' : 'Timeline of Changes'}:
              </h4>

              {(!selectedDishForLogs.activityLogs || selectedDishForLogs.activityLogs.length === 0) ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  {isKm ? 'មិនទាន់មានប្រវត្តិកែប្រែបន្ថែមនៅឡើយទេ' : 'No modification history recorded yet.'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedDishForLogs.activityLogs
                    .slice()
                    .reverse()
                    .map((log, index) => (
                      <div
                        key={index}
                        style={{
                          borderLeft: '3px solid var(--color-primary, #b91c1c)',
                          backgroundColor: '#fafafa',
                          padding: '10px 14px',
                          borderRadius: '0 8px 8px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                            {log.adminName || 'Admin'}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{formatLogDate(log.at)}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#334155' }}>
                          {log.details || log.action}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedDishForLogs(null)}>
                {isKm ? 'បិទ' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global All Admin Activity Logs Modal */}
      {isAllLogsModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            padding: '16px'
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {isKm ? 'កំណត់ហេតុសកម្មភាព Admin ទាំងអស់' : 'All Admin Activity Logs'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                  {isKm ? 'តាមដានសកម្មភាព Him Lihour, Vuth Vathana, Lorn Sovannaroth, Ream Rithy' : 'Audit logs for all restaurant administrators'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllLogsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '8px',
                  color: '#64748b'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {loadingAllLogs ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <p>{isKm ? 'កំពុងទាញយកកំណត់ហេតុ...' : 'Loading audit logs...'}</p>
                </div>
              ) : allLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Activity size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p>{isKm ? 'មិនទាន់មានសកម្មភាពត្រូវបានកត់ត្រានៅឡើយទេ' : 'No administrator activity logs found yet.'}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {allLogs.map((log) => (
                    <div
                      key={log._id || log.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        backgroundColor: '#ffffff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              backgroundColor:
                                log.action === 'create_dish'
                                  ? '#dcfce7'
                                  : log.action === 'delete_dish'
                                  ? '#fee2e2'
                                  : '#e0f2fe',
                              color:
                                log.action === 'create_dish'
                                  ? '#15803d'
                                  : log.action === 'delete_dish'
                                  ? '#b91c1c'
                                  : '#0369a1',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}
                          >
                            {log.action?.replace('_', ' ')}
                          </span>
                          <strong style={{ fontSize: '0.88rem', color: '#0f172a' }}>{log.adminName}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatLogDate(log.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
                        {log.details}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', textAlign: 'right' }}>
              <Button variant="outline" size="sm" onClick={() => setIsAllLogsModalOpen(false)}>
                {isKm ? 'បិទ' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
