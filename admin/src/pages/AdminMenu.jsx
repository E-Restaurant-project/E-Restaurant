import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, Star, Flame, RefreshCw } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { CATEGORIES } from '../data/menu';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CustomSelect } from '../components/common/CustomSelect';
import { DishFormModal } from '../components/admin/DishFormModal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';
import { getImageUrl } from '../config/api';

export const AdminMenu = () => {
  const { t, language, formatCurrency } = useLanguage();
  const { dishes, allCategories, addDish, updateDish, deleteDish, refreshData } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';
  const categoryOptions = allCategories && allCategories.length > 0 ? allCategories : CATEGORIES;

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishToDelete, setDishToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      // Automatically switch filter to the newly created dish's category so the admin sees it right away
      if (dishData.category && dishData.category !== 'all') {
        setSelectedCategory(dishData.category);
      }
      setSearchQuery('');
      await addDish(dishData);
      const catObj = categoryOptions.find(c => c.id === dishData.category);
      const catName = isKm ? catObj?.label_km || dishData.category : catObj?.label_en || dishData.category;
      showToast(
        isKm ? `បានបន្ថែមមុខម្ហូបថ្មីជោគជ័យក្នុងប្រភេទ "${catName}"!` : `Dish added successfully under "${catName}"!`,
        'success'
      );
    }
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_menu')}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
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
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
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

          {/* Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>{t('admin.dish_name_km')}</th>
                  <th>{t('admin.dish_name_en')}</th>
                  <th>{t('admin.dish_category')}</th>
                  <th>{t('admin.dish_price')}</th>
                  <th>Spice</th>
                  <th>Featured</th>
                  <th>{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDishes.map((dish) => (
                  <tr key={dish.id}>
                    <td>
                      <img
                        src={getImageUrl(dish.image)}
                        alt={dish.name_en}
                        className="admin-table__img"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{dish.name_km}</td>
                    <td>{dish.name_en}</td>
                    <td>
                      <span className="badge badge--info">
                        {categoryOptions.find((c) => c.id === dish.category)?.[isKm ? 'label_km' : 'label_en'] || dish.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrency(dish.price)}
                    </td>
                    <td>
                      {dish.spice_level && dish.spice_level !== 'none' ? (
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
                ))}
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

      {/* Modern Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDishToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        dish={dishToDelete}
      />
    </div>
  );
};
