import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { useToast } from '../../hooks/useToast';
import { Button } from '../common/Button';

export const OrderSummary = ({ showCheckoutBtn = true }) => {
  const { t, formatCurrency, formatDualCurrency } = useLanguage();
  const {
    subtotal,
    deliveryFee,
    discount,
    discountPercent,
    total,
    promoCode,
    applyPromo,
    items
  } = useCart();
  const { showToast } = useToast();

  const [inputCode, setInputCode] = useState('');

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = await applyPromo(inputCode);
    if (res?.success) {
      showToast(t('cart.promo_applied'), 'success');
      setInputCode('');
    } else {
      showToast(t('cart.promo_invalid'), 'error');
    }
  };

  const dualTotal = formatDualCurrency(total);

  return (
    <div className="order-summary-card">
      <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-primary-dark)' }}>
        {t('cart.order_summary')}
      </h3>

      <div className="order-summary__row">
        <span>{t('cart.subtotal')}</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>

      <div className="order-summary__row">
        <span>{t('cart.delivery_fee')}</span>
        <span>
          {deliveryFee === 0 ? (
            <span style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
              {t('cart.free_delivery')}
            </span>
          ) : (
            formatCurrency(deliveryFee)
          )}
        </span>
      </div>

      {discount > 0 && (
        <div className="order-summary__row" style={{ color: 'var(--color-accent)' }}>
          <span>
            {t('cart.discount')} ({discountPercent}%)
          </span>
          <span>-{formatCurrency(discount)}</span>
        </div>
      )}

      {/* Promo code form */}
      <form onSubmit={handleApplyPromo} style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t('cart.promo_placeholder')}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
          />
          <Button variant="secondary" size="sm" type="submit">
            <Tag size={14} />
            <span>{t('cart.apply_promo')}</span>
          </Button>
        </div>
        {promoCode && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '4px' }}>
            ✓ {promoCode} active
          </div>
        )}
      </form>

      {/* Grand Total */}
      <div className="order-summary__total">
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('cart.grand_total')}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            ({dualTotal.khr} / {dualTotal.usd})
          </div>
        </div>
        <div className="order-summary__total-val">{dualTotal.usd}</div>
      </div>

      {showCheckoutBtn && (
        <Link to="/checkout" style={{ display: 'block', marginTop: 'var(--space-lg)' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={items.length === 0}
          >
            {t('cart.proceed_checkout')}
          </Button>
        </Link>
      )}
    </div>
  );
};
