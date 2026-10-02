import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Search,
  Utensils,
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';

export const AdminCategories = () => {
  const { t, language } = useLanguage();
  const { categories, dishes, addCategory, updateCategory, deleteCategory } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [searchQuery, setSearchQuery] = useState('');
  const [catToDelete, setCatToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    label_km: '',
    label_en: ''
  });
  const [errors, setErrors] = useState({});

  // Compute dish counts per category
  const dishCountMap = useMemo(() => {
    const map = {};
    dishes.forEach((d) => {
      map[d.category] = (map[d.category] || 0) + 1;
    });
    return map;
  }, [dishes]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        (c.label_km && c.label_km.toLowerCase().includes(q)) ||
        (c.label_en && c.label_en.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ id: '', label_km: '', label_en: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      id: cat.id,
      label_km: cat.label_km || '',
      label_en: cat.label_en || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    if (!formData.label_km.trim()) errs.label_km = isKm ? 'សូមបញ្ចូលឈ្មោះជាភាសាខ្មែរ' : 'Khmer name is required';
    if (!formData.label_en.trim()) errs.label_en = isKm ? 'សូមបញ្ចូលឈ្មោះជាភាសាអង់គ្លេស' : 'English name is required';

    const slug = formData.id.trim().toLowerCase();
    if (editingCategory) {
      if (!slug) errs.id = isKm ? 'សូមបញ្ចូលកូដសម្គាល់ ID' : 'Category ID is required';
      else if (slug !== editingCategory.id && categories.some((c) => c.id === slug)) {
        errs.id = isKm ? 'កូដសម្គាល់ ID នេះមានរួចហើយ' : 'Category ID already exists';
      }
    } else if (slug && categories.some((c) => c.id === slug)) {
      errs.id = isKm ? 'កូដសម្គាល់ ID នេះមានរួចហើយ' : 'Category ID already exists';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        id: formData.id.trim().toLowerCase(),
        label_km: formData.label_km.trim(),
        label_en: formData.label_en.trim()
      });
      showToast(isKm ? 'បានកែសម្រួលប្រភេទជោគជ័យ!' : 'Category updated successfully!', 'success');
    } else {
      addCategory({
        id: formData.id.trim().toLowerCase(),
        label_km: formData.label_km.trim(),
        label_en: formData.label_en.trim()
      });
      showToast(isKm ? 'បានបន្ថែមប្រភេទថ្មីជោគជ័យ!' : 'New category created successfully!', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (cat) => {
    setCatToDelete(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (catToDelete) {
      const catName = isKm ? catToDelete.label_km : catToDelete.label_en;
      deleteCategory(catToDelete.id);
      showToast(
        isKm ? `បានលុបប្រភេទ "${catName}" ជោគជ័យ!` : `Category "${catName}" deleted successfully!`,
        'info'
      );
      setIsDeleteModalOpen(false);
      setCatToDelete(null);
    }
  };

  return (
    <div>
      {/* Topbar */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title">{t('admin.nav_categories')}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
            {t('admin.categories_subtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd} icon={<Plus size={16} />}>
          {t('admin.add_category')}
        </Button>
      </div>

      <div className="admin-content">
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="admin-card" style={{ padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isKm ? 'ប្រភេទសរុប' : 'Total Categories'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {categories.length}
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 'var(--space-md) var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isKm ? 'មុខម្ហូបសរុប' : 'Total Food Dishes'}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0369a1' }}>
                {dishes.length}
              </div>
            </div>
          </div>
        </div>

        {/* Categories Table Card */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '400px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-light)'
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder={isKm ? 'ស្វែងរកប្រភេទតាមឈ្មោះ ឬកូដ...' : 'Search categories by name or ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
              />
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {isKm ? `បង្ហាញ ${filteredCategories.length} ប្រភេទ` : `Showing ${filteredCategories.length} categories`}
            </span>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>{t('admin.category_id')}</th>
                  <th>{t('admin.category_name_km')}</th>
                  <th>{t('admin.category_name_en')}</th>
                  <th style={{ textAlign: 'center' }}>{t('admin.category_dish_count')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat, idx) => {
                  const count = dishCountMap[cat.id] || 0;
                  return (
                    <tr key={cat.id}>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{idx + 1}</td>
                      <td>
                        <span className="badge badge--info" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {cat.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary-dark)' }}>{cat.label_km}</td>
                      <td style={{ fontWeight: 500 }}>{cat.label_en}</td>
                      <td style={{ textAlign: 'center' }}>
                        <Badge variant={count > 0 ? 'gold' : 'default'}>
                          <Utensils size={12} style={{ marginRight: '4px' }} />
                          <span>{count} {isKm ? 'មុខ' : 'dishes'}</span>
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-table__actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleOpenEdit(cat)}
                            title={t('common.edit')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => handleDelete(cat)}
                            style={{ color: 'var(--color-danger)' }}
                            title={t('common.delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-2xl) 0', color: 'var(--color-text-muted)' }}>
                      <AlertCircle size={28} style={{ display: 'block', margin: '0 auto var(--space-xs)', color: 'var(--color-text-light)' }} />
                      {isKm ? 'មិនមានប្រភេទមុខម្ហូបត្រូវនឹងការស្វែងរកឡើយ' : 'No food categories match your search.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t('admin.edit_category') : t('admin.add_category')}
        maxWidth="500px"
      >
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Category Name KM */}
            <div className="form-group">
              <label className="form-label form-label--required">{t('admin.category_name_km')}</label>
              <input
                type="text"
                className={`form-input ${errors.label_km ? 'form-input--error' : ''}`}
                value={formData.label_km}
                onChange={(e) => setFormData((prev) => ({ ...prev, label_km: e.target.value }))}
                placeholder="ឧ. ម្ហូបឆាខ្មែរ"
                autoFocus
              />
              {errors.label_km && <span className="form-error">{errors.label_km}</span>}
            </div>

            {/* Category Name EN */}
            <div className="form-group">
              <label className="form-label form-label--required">{t('admin.category_name_en')}</label>
              <input
                type="text"
                className={`form-input ${errors.label_en ? 'form-input--error' : ''}`}
                value={formData.label_en}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    label_en: val,
                    // Auto-suggest ID for new categories if ID is still empty or unmodified
                    id: !editingCategory && (!prev.id || prev.id === prev.label_en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                      ? val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      : prev.id
                  }));
                }}
                placeholder="e.g. Khmer Stir-fries"
              />
              {errors.label_en && <span className="form-error">{errors.label_en}</span>}
            </div>

            {/* Category ID / Slug */}
            <div className="form-group">
              <label className="form-label form-label--required">{t('admin.category_id')}</label>
              <input
                type="text"
                className={`form-input ${errors.id ? 'form-input--error' : ''}`}
                value={formData.id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
                  }))
                }
                placeholder="e.g. stir-fries"
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                {isKm
                  ? 'អក្សរតូច គ្មានដកឃ្លា (ឧ. specials, chicken, desserts)'
                  : 'Lowercase letters and hyphens only (e.g. specials, chicken, desserts)'}
              </span>
              {errors.id && <span className="form-error">{errors.id}</span>}
            </div>
          </div>

          <div className="modal__footer" style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)' }}>
            <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit">
              {t('admin.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modern Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCatToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={isKm ? 'តើអ្នកប្រាកដជាចង់លុបប្រភេទនេះ?' : 'Delete this category?'}
        description={
          catToDelete && (dishCountMap[catToDelete.id] || 0) > 0
            ? isKm
              ? `ប្រភេទនេះមានមុខម្ហូបចំនួន ${dishCountMap[catToDelete.id]} កំពុងប្រើប្រាស់។ ពួកវានឹងត្រូវប្តូរទៅប្រភេទផ្សេងទៀត។`
              : `There are ${dishCountMap[catToDelete.id]} dishes currently in this category. They will be reassigned.`
            : isKm
            ? 'សកម្មភាពនេះនឹងលុបប្រភេទនេះចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។'
            : 'This category will be permanently removed from the system.'
        }
        itemTitle={catToDelete ? (isKm ? catToDelete.label_km : catToDelete.label_en) : ''}
        itemSubtitle={catToDelete ? `ID: ${catToDelete.id}` : ''}
        itemBadge={catToDelete ? `${dishCountMap[catToDelete.id] || 0} ${isKm ? 'មុខម្ហូប' : 'dishes'}` : ''}
      />
    </div>
  );
};
