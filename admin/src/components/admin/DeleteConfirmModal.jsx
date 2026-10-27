import React, { useEffect } from 'react';
import { Trash2, X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  dish = null,
  title = null,
  description = null,
  itemTitle = null,
  itemSubtitle = null,
  itemBadge = null,
  isLoading = false
}) => {
  const { language, formatCurrency } = useLanguage();
  const isKm = language === 'km';

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Resolve title and description
  const defaultTitle = isKm ? 'តើអ្នកប្រាកដជាចង់លុបមុខម្ហូបនេះ?' : 'Are you sure you want to delete this dish?';
  const defaultDesc = isKm
    ? 'សកម្មភាពនេះនឹងលុបទិន្នន័យចេញពីប្រព័ន្ធជាអចិន្ត្រៃយ៍ ហើយមិនអាចត្រឡប់វិញបានឡើយ។'
    : 'This action will permanently delete this item from the database and cannot be undone.';

  // If dish object is provided
  const displayTitle = title || defaultTitle;
  const displayDesc = description || defaultDesc;
  const mainName = dish ? (dish.name_km || dish.name_en) : itemTitle;
  const subName = dish ? (dish.name_en !== dish.name_km ? dish.name_en : null) : itemSubtitle;
  const badgeText = dish
    ? (dish.price_khr ? `${dish.price_khr.toLocaleString()} ៛` : formatCurrency(dish.price))
    : itemBadge;

  return (
    <div className="delete-modal-overlay" onClick={isLoading ? undefined : onClose}>
      <div
        className="delete-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          className="delete-modal-close"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Animated Danger Icon */}
        <div className="delete-modal-icon-wrap">
          <div className="delete-modal-icon-pulse" />
          <div className="delete-modal-icon-inner">
            <Trash2 size={30} strokeWidth={2.2} />
          </div>
        </div>

        {/* Modal Title & Warning */}
        <h3 className="delete-modal-title">{displayTitle}</h3>
        <p className="delete-modal-desc">{displayDesc}</p>

        {/* Item Preview Card */}
        {(mainName || dish) && (
          <div className="delete-modal-preview">
            {dish && dish.image ? (
              <img
                src={dish.image}
                alt={mainName || 'Dish preview'}
                className="delete-modal-thumb"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';
                }}
              />
            ) : (
              <div className="delete-modal-thumb-placeholder">
                <AlertCircle size={24} />
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div className="delete-modal-item-name">{mainName}</div>
              {subName && <div className="delete-modal-item-sub">{subName}</div>}
              {badgeText && <div className="delete-modal-item-badge">{badgeText}</div>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-modal-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {isKm ? 'បោះបង់' : 'Cancel'}
          </button>

          <button
            type="button"
            className="delete-modal-btn-danger"
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
          >
            <Trash2 size={16} />
            <span>{isLoading ? (isKm ? 'កំពុងលុប...' : 'Deleting...') : (isKm ? 'យល់ព្រមលុប' : 'Yes, Delete')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
