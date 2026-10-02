import React, { useState } from 'react';
import { Tag, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { DeleteConfirmModal } from '../components/admin/DeleteConfirmModal';

export const AdminPromos = () => {
  const { t, language } = useLanguage();
  const { promoCodes, addPromoCode, updatePromoCode, deletePromoCode } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('15');
  const [newDesc, setNewDesc] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  const handleAddSubmit = (e) => {
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

    addPromoCode({
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

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_promos')}</h1>
        <Button variant="primary" size="sm" onClick={() => setIsAddModalOpen(true)} icon={<Plus size={16} />}>
          {t('admin.add_promo')}
        </Button>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
              {t('admin.promos_title')}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Total Promos: <strong>{promoCodes.length}</strong>
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
      </div>

      {/* Add Promo Modal */}
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
              placeholder="e.g. FLASH50, WEEKEND25"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label--required">{t('admin.promo_discount')}</label>
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
          </div>

          <div className="form-group">
            <label className="form-label">Campaign Description</label>
            <input
              type="text"
              className="form-input"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Weekend Flash Sale"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-lg)' }}>
            <input
              type="checkbox"
              id="active_promo_check"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="active_promo_check" style={{ fontWeight: 600, cursor: 'pointer' }}>
              {t('admin.promo_active')} immediately
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              {t('admin.cancel')}
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
          setPromoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title={isKm ? 'តើអ្នកប្រាកដជាចង់លុបកូដបញ្ចុះតម្លៃនេះ?' : 'Delete this promo code?'}
        description={
          isKm
            ? 'សកម្មភាពនេះនឹងលុបកូដបញ្ចុះតម្លៃនេះចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍។'
            : 'This promo code will be permanently removed from the store.'
        }
        itemTitle={promoToDelete ? promoToDelete.code : ''}
        itemSubtitle={promoToDelete ? (promoToDelete.description || `Discount: ${promoToDelete.discount}%`) : ''}
        itemBadge={promoToDelete ? `-${promoToDelete.discount}% OFF` : ''}
      />
    </div>
  );
};
