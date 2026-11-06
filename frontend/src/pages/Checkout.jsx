import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  ShoppingBag,
  CreditCard,
  Banknote,
  CheckCircle,
  Printer,
  ArrowLeft,
  QrCode,
  MapPin,
  AlertCircle,
  RefreshCw,
  Tag
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { useRestaurant } from '../hooks/useRestaurant';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { getImageUrl } from '../config/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const PHNOM_PENH_DISTRICTS = [
  'Khan Boeng Keng Kang (BKK)',
  'Khan Chamkarmon',
  'Khan Daun Penh',
  'Khan Tuol Kouk',
  'Khan Prampir Makara',
  'Khan Sen Sok',
  'Khan Chbar Ampov',
  'Khan Meanchey',
  'Khan Russey Keo',
  'Khan Chroy Changvar'
];

export const Checkout = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const {
    items,
    subtotal,
    deliveryFee,
    discount,
    discountPercent,
    total,
    clearCart,
    promoCode,
    applyPromo,
    removePromo
  } = useCart();
  const { createOrder, storeSettings } = useRestaurant();
  const { customerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isKm = language === 'km';

  // State
  const [orderType, setOrderType] = useState('delivery'); // delivery | pickup
  const [paymentMethod, setPaymentMethod] = useState('khqr'); // khqr | cod (default: khqr)
  const [showKhqrModal, setShowKhqrModal] = useState(false);
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Bakong KHQR states
  const [khqrData, setKhqrData] = useState(null);
  const [khqrLoading, setKhqrLoading] = useState(false);
  const [khqrTimeLeft, setKhqrTimeLeft] = useState(120);
  const [khqrPaid, setKhqrPaid] = useState(false);
  // 'auto' = auto-poll bank & hide button | 'manual' = wait for user click to verify
  const [khqrMode, setKhqrMode] = useState('auto');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  // Promo code input state
  const [inputPromoCode, setInputPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const [formData, setFormData] = useState({
    fullName: customerUser?.name || '',
    phone: customerUser?.phone || '',
    email: customerUser?.email || '',
    district: PHNOM_PENH_DISTRICTS[0],
    address: customerUser?.address || '',
    pickupTime: '12:30',
    notes: ''
  });

  // Auto-fill when customerUser updates
  React.useEffect(() => {
    if (customerUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || customerUser.name || '',
        phone: prev.phone || customerUser.phone || '',
        email: prev.email || customerUser.email || '',
        address: prev.address || customerUser.address || ''
      }));
    }
  }, [customerUser]);

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = t('checkout.validation_required');
    if (!formData.phone.trim()) {
      errs.phone = t('checkout.validation_required');
    } else if (!/^[0-9+ \-\(\)]{8,15}$/.test(formData.phone.trim())) {
      errs.phone = t('checkout.validation_phone');
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = t('checkout.validation_email');
    }
    if (orderType === 'delivery') {
      if (!formData.district) errs.district = t('checkout.validation_required');
      if (!formData.address.trim()) errs.address = t('checkout.validation_required');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Generate dynamic Bakong KHQR
  const handleInitiateKhqr = async () => {
    if (!validate()) return;

    if (items.length === 0) {
      showToast(t('cart.empty_title'), 'error');
      navigate('/menu');
      return;
    }

    const payTotal = orderType === 'delivery' ? total : total - deliveryFee;
    const khrAmount = Math.max(100, Math.round(payTotal * 4100));

    setShowKhqrModal(true);
    setKhqrLoading(true);
    setKhqrTimeLeft(120);
    setKhqrPaid(false);
    setKhqrData(null);

    const billNumber = `PY-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const res = await apiService.generateBakongKHQR({
      amount: khrAmount,
      currency: 'KHR',
      billNumber,
      storeLabel: 'Phum Yeung Restaurant'
    });

    setKhqrLoading(false);
    if (res.success && res.data) {
      setKhqrData(res.data);
    } else {
      showToast(res.error || 'Failed to generate Bakong KHQR', 'error');
    }
  };

  // Real Bakong verification (Strict check — NO BYPASS!)
  const verifyBakongPayment = async (silent = false) => {
    if (!khqrData?.md5 || khqrPaid) return false;
    try {
      const res = await apiService.checkBakongTransaction(khqrData.md5);
      const isPaid =
        res?.isPaid === true ||
        res?.success === true ||
        res?.responseCode === 0 ||
        Boolean(res?.data?.hash);

      if (isPaid) {
        setKhqrPaid(true);
        showToast(isKm ? '🎉 ការទូទាត់ជោគជ័យ! កំពុងបញ្ជូនការកុម្ម៉ង់...' : 'Payment verified successfully! Placing order...', 'success');
        setTimeout(() => {
          executeOrderCreation();
        }, 800);
        return true;
      } else if (!silent) {
        // In manual mode, inform customer that bank hasn't received payment yet — NO BYPASS!
        showToast(
          isKm
            ? '⚠️ មិនទាន់ឃើញការផ្ទេរប្រាក់ពីធនាគារនៅឡើយទេ។ សូមពិនិត្យមើល App ធនាគាររបស់អ្នក រួចព្យាយាមចុចម្តងទៀត!'
            : 'Payment not found in bank yet. Please complete transfer in your banking app and try again!',
          'warning'
        );
      }
      return false;
    } catch (err) {
      if (!silent) {
        showToast(isKm ? 'មិនអាចពិនិត្យស្ថានភាពបានទេ សូមព្យាយាមម្តងទៀត' : 'Could not check payment status. Please try again', 'error');
      }
      return false;
    }
  };

  // Manual Click Handler (Genuinely queries Bakong API)
  const handleVerifyManualPayment = async () => {
    if (isCheckingPayment || khqrPaid) return;
    setIsCheckingPayment(true);
    await verifyBakongPayment(false);
    setIsCheckingPayment(false);
  };

  // Auto-verify Polling: ONLY active when khqrMode === 'auto'
  React.useEffect(() => {
    if (!showKhqrModal || !khqrData?.md5 || khqrPaid || khqrTimeLeft <= 0) return;
    if (khqrMode !== 'auto') return; // Do NOT poll in manual mode to save tokens!

    const initialTimer = setTimeout(() => {
      verifyBakongPayment(true);
    }, 4000);

    const pollInterval = setInterval(() => {
      verifyBakongPayment(true);
    }, 6000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollInterval);
    };
  }, [showKhqrModal, khqrData?.md5, khqrPaid, khqrTimeLeft, khqrMode]);

  // Apply promo code on checkout
  const handleApplyCheckoutPromo = async (e) => {
    if (e) e.preventDefault();
    if (!inputPromoCode.trim()) return;
    setIsApplyingPromo(true);
    const res = await applyPromo(inputPromoCode);
    setIsApplyingPromo(false);
    if (res?.success) {
      showToast(isKm ? `បានបញ្ចូលកូដ ${res.code} បញ្ចុះតម្លៃ ${res.discount}% ជោគជ័យ!` : `Promo code ${res.code} (-${res.discount}%) applied!`, 'success');
      setInputPromoCode('');
    } else {
      showToast(isKm ? 'កូដបញ្ចុះតម្លៃមិនត្រឹមត្រូវទេ' : (res?.error || 'Invalid promo code'), 'error');
    }
  };

  // Countdown Timer (decrements every 1 second until 0)
  React.useEffect(() => {
    if (!showKhqrModal || khqrPaid || khqrTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setKhqrTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showKhqrModal, khqrPaid, khqrTimeLeft]);


  const handlePlaceOrder = (e) => {
    if (e) e.preventDefault();
    if (storeSettings?.isOpen === false) {
      showToast(t('checkout.store_closed_warning'), 'error');
      return;
    }

    if (!validate()) return;

    if (items.length === 0) {
      showToast(t('cart.empty_title'), 'error');
      navigate('/menu');
      return;
    }

    // If KHQR is chosen, generate dynamic KHQR and prompt scan modal first
    if (paymentMethod === 'khqr' && !showKhqrModal) {
      handleInitiateKhqr();
      return;
    }

    executeOrderCreation();
  };

  const executeOrderCreation = () => {
    setSubmitting(true);
    setTimeout(async () => {
      const orderPayload = {
        customer_id: customerUser?._id || customerUser?.id || null,
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        orderType,
        deliveryDistrict: orderType === 'delivery' ? formData.district : null,
        address: orderType === 'delivery' ? `${formData.district}, ${formData.address.trim()}` : 'Central Kitchen Hub Pickup',
        pickupTime: orderType === 'pickup' ? formData.pickupTime : '',
        notes: formData.notes.trim(),
        paymentMethod,
        isPaid: paymentMethod === 'khqr' && khqrPaid,
        items: [...items],
        subtotal,
        deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
        discount,
        total: orderType === 'delivery' ? total : total - deliveryFee
      };

      const newOrder = await createOrder(orderPayload);
      setSubmittedOrder(newOrder || orderPayload);
      clearCart();
      setShowKhqrModal(false);
      setSubmitting(false);
      showToast(t('checkout.order_success_title'), 'success');
    }, 600);
  };

  const dualTotal = formatDualCurrency(total);

  // If order is completed, show confirmation view
  if (submittedOrder && submittedOrder.total !== undefined) {
    const orderTotal = Number(submittedOrder.total || 0);
    const orderSubtotal = Number(submittedOrder.subtotal || 0);
    const orderDeliveryFee = Number(submittedOrder.deliveryFee || 0);
    const orderDiscount = Number(submittedOrder.discount || 0);
    const orderDual = formatDualCurrency(orderTotal);
    const orderItems = Array.isArray(submittedOrder.items) ? submittedOrder.items : [];
    const orderId = submittedOrder.id || submittedOrder.orderId || 'PY-ORD-0000';
    const orderDate = submittedOrder.createdAt
      ? new Date(submittedOrder.createdAt).toLocaleString(isKm ? 'km-KH' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleString(isKm ? 'km-KH' : 'en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

    return (
      <div className="section checkout-confirmation-section">
        {/* Scoped print style to strictly isolate receipt and kill all banners */}
        <style>{`
          @media print {
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            body * {
              visibility: hidden !important;
            }
            .printable-invoice,
            .printable-invoice * {
              visibility: visible !important;
            }
            .printable-invoice {
              position: fixed !important;
              left: 50% !important;
              top: 15px !important;
              transform: translateX(-50%) !important;
              width: 100% !important;
              max-width: 600px !important;
              margin: 0 !important;
              padding: 18px 22px !important;
              border: 1px solid #475569 !important;
              border-radius: 8px !important;
              background: #ffffff !important;
              box-shadow: none !important;
            }
            .announcement-bar,
            .no-print,
            header,
            nav,
            footer,
            .navbar,
            .footer {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              max-height: 0 !important;
              min-height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
              overflow: hidden !important;
            }
          }
        `}</style>
        <div className="container">
          <div className="confirmation-card">
            {/* On-screen Only: Success Status Checkmark */}
            <div className="no-print">
              <div className="confirmation-card__icon">
                <CheckCircle size={44} />
              </div>
              <h2>{t('checkout.order_success_title')}</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>{t('checkout.order_success_desc')}</p>
            </div>

            {/* REAL OFFICIAL PRINTABLE INVOICE / RECEIPT */}
            <div className="printable-invoice">
              {/* Receipt Header */}
              <div className="invoice-header">
                <div className="invoice-brand">
                  <img
                    src="/phum_yeung_logo.jpg"
                    alt="Phum Yeung Restaurant"
                    className="invoice-logo"
                  />
                  <div>
                    <h3 className="invoice-title-km">ភោជនីយដ្ឋាន ភូមិយើង</h3>
                    <div className="invoice-title-en">PHUM YEUNG RESTAURANT</div>
                    <div className="invoice-subtitle">រសជាតិខ្មែរពិតៗ • Authentic Khmer Cuisine</div>
                  </div>
                </div>
                <div className="invoice-meta">
                  <div className="invoice-badge">{isKm ? 'វិក្កយបត្រ / RECEIPT' : 'OFFICIAL RECEIPT'}</div>
                  <div className="invoice-number">
                    <span>{isKm ? 'លេខកូដ:' : 'Order ID:'}</span> <strong>{orderId}</strong>
                  </div>
                  <div className="invoice-date">
                    <span>{isKm ? 'កាលបរិច្ឆេទ:' : 'Date:'}</span> {orderDate}
                  </div>
                </div>
              </div>

              <div className="invoice-divider" />

              {/* Customer & Delivery Information */}
              <div className="invoice-info-grid">
                <div className="invoice-info-col">
                  <div className="invoice-info-row">
                    <span className="info-label">{t('checkout.full_name')}:</span>
                    <strong className="info-val">{submittedOrder.customerName}</strong>
                  </div>
                  <div className="invoice-info-row">
                    <span className="info-label">{t('checkout.phone')}:</span>
                    <strong className="info-val">{submittedOrder.phone}</strong>
                  </div>
                </div>
                <div className="invoice-info-col">
                  <div className="invoice-info-row">
                    <span className="info-label">{t('checkout.order_type')}:</span>
                    <strong className="info-val">{t(`checkout.${submittedOrder.orderType}`)}</strong>
                  </div>
                  <div className="invoice-info-row">
                    <span className="info-label">{t('checkout.payment_method')}:</span>
                    <strong className="info-val">
                      {submittedOrder.paymentMethod === 'khqr' ? 'Bakong KHQR' : 'COD'}
                      {submittedOrder.isPaid ? ' (PAID)' : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {submittedOrder.address && (
                <div className="invoice-info-row invoice-address-row">
                  <span className="info-label">{t('checkout.delivery_address')}:</span>
                  <strong className="info-val">{submittedOrder.address}</strong>
                </div>
              )}

              <div className="invoice-divider" />

              {/* Itemized Table */}
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ textAlign: 'left' }}>{isKm ? 'មុខម្ហូប' : 'Item Description'}</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>{isKm ? 'ចំនួន' : 'Qty'}</th>
                    <th style={{ width: '90px', textAlign: 'right' }}>{isKm ? 'តម្លៃ' : 'Price'}</th>
                    <th style={{ width: '100px', textAlign: 'right' }}>{isKm ? 'សរុប' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((it, idx) => {
                    const itemName = isKm ? (it.name_km || it.nameKm || it.name) : (it.name_en || it.nameEn || it.name);
                    const itemQty = it.quantity || 1;
                    const itemPrice = Number(it.price || 0);
                    const itemTotal = itemPrice * itemQty;
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ textAlign: 'left', fontWeight: 600 }}>{itemName}</td>
                        <td style={{ textAlign: 'center' }}>{itemQty}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(itemPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCurrency(itemTotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="invoice-divider" />

              {/* Summary Totals */}
              <div className="invoice-summary">
                {orderSubtotal > 0 && orderSubtotal !== orderTotal && (
                  <div className="invoice-summary-row">
                    <span>{t('cart.subtotal')}:</span>
                    <span>{formatCurrency(orderSubtotal)}</span>
                  </div>
                )}
                {orderDeliveryFee > 0 && (
                  <div className="invoice-summary-row">
                    <span>{t('cart.delivery_fee')}:</span>
                    <span>{formatCurrency(orderDeliveryFee)}</span>
                  </div>
                )}
                {orderDiscount > 0 && (
                  <div className="invoice-summary-row invoice-discount-row">
                    <span>{isKm ? 'បញ្ចុះតម្លៃ' : 'Discount'}:</span>
                    <span>-{formatCurrency(orderDiscount)}</span>
                  </div>
                )}
                <div className="invoice-summary-row invoice-grand-total">
                  <span>{t('cart.grand_total')}:</span>
                  <span className="total-highlight">
                    {orderDual.usd} ({orderDual.khr})
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="invoice-footer">
                <div className="invoice-footer-thanks">
                  {isKm
                    ? '🙏 សូមអរគុណសម្រាប់ការគាំទ្រភោជនីយដ្ឋាន ភូមិយើង!'
                    : '🙏 Thank you for dining with Phum Yeung Restaurant!'}
                </div>
                <div className="invoice-footer-contact">
                  <span>Tel: 012 345 678 / 098 765 432</span>
                  <span> • </span>
                  <span>Phnom Penh, Cambodia</span>
                </div>
                <div className="invoice-footer-note">
                  {isKm ? 'ទំនិញដែលបានទិញរួច មិនអាចប្តូរប្រាក់វិញបានទេ' : 'Goods sold are non-refundable'}
                </div>
              </div>
            </div>

            {/* Action Buttons (Strictly Screen Only, Hidden when Printing) */}
            <div className="no-print confirmation-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
              <Link to={`/track-order?id=${orderId}`}>
                <Button variant="primary" icon={<Truck size={18} />}>
                  {t('checkout.track_order_btn')}
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.print()}
                icon={<Printer size={18} />}
              >
                {t('checkout.print_receipt')}
              </Button>
              <Link to="/">
                <Button variant="ghost">
                  {t('checkout.back_home')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If cart is empty, redirect
  if (items.length === 0) {
    return (
      <div className="container section empty-state">
        <h2>{t('cart.empty_title')}</h2>
        <p>{t('cart.empty_subtitle')}</p>
        <Link to="/menu" style={{ marginTop: 'var(--space-md)', display: 'inline-block' }}>
          <Button variant="primary">{t('cart.browse_menu')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page section">
      <div className="container">
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <Link to="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
            <ArrowLeft size={16} />
            <span>{t('cart.title')}</span>
          </Link>
          <h1 style={{ color: 'var(--color-primary-dark)', marginTop: '4px' }}>
            {t('checkout.title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('checkout.subtitle')}</p>
        </div>

        {storeSettings?.isOpen === false && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--color-danger)', padding: '14px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={24} />
            <span style={{ fontWeight: 600 }}>{t('checkout.store_closed_warning')}</span>
          </div>
        )}

        <div className="checkout-layout">
          {/* Left: Form */}
          <form onSubmit={handlePlaceOrder}>
            {/* 1. Dining Option Selector (Delivery vs Pickup Only) */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">
                <Truck size={20} />
                <span>{t('checkout.order_type')}</span>
              </h3>

              <div className="order-type-selector" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div
                  className={`order-type-btn ${orderType === 'delivery' ? 'order-type-btn--active' : ''}`}
                  onClick={() => setOrderType('delivery')}
                >
                  <Truck size={26} />
                  <span style={{ fontWeight: 600 }}>{t('checkout.delivery')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Within 20 - 35 mins</span>
                </div>
                <div
                  className={`order-type-btn ${orderType === 'pickup' ? 'order-type-btn--active' : ''}`}
                  onClick={() => setOrderType('pickup')}
                >
                  <ShoppingBag size={26} />
                  <span style={{ fontWeight: 600 }}>{t('checkout.pickup')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>BKK1 Kitchen Hub</span>
                </div>
              </div>
            </div>

            {/* 2. Customer Information */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">
                <span>{t('checkout.customer_info')}</span>
              </h3>

              {!customerUser ? (
                <div style={{ backgroundColor: 'var(--color-bg-alt)', border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 'var(--space-md)', fontSize: '0.88rem' }}>
                  {isKm ? 'មានគណនីរួចហើយមែនទេ? ' : 'Already have an account? '}
                  <Link to="/auth" state={{ from: '/checkout' }} style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                    {isKm ? 'ចូលគណនីដើម្បីបំពេញព័ត៌មានដោយស្វ័យប្រវត្តិ' : 'Sign in to auto-fill your delivery info'}
                  </Link>
                </div>
              ) : (
                <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 'var(--radius-md)', padding: '8px 14px', marginBottom: 'var(--space-md)', fontSize: '0.88rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} />
                  <span>{isKm ? `បំពេញដោយស្វ័យប្រវត្តិតាមគណនី: ${customerUser.name} (${customerUser.email})` : `Auto-filled from account: ${customerUser.name} (${customerUser.email})`}</span>
                </div>
              )}

              <div className="checkout-form-grid">
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label form-label--required">{t('checkout.full_name')}</label>
                  <input
                    type="text"
                    className={`form-input ${errors.fullName ? 'form-input--error' : ''}`}
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder={isKm ? 'ឈ្មោះរបស់អ្នក' : 'Your full name'}
                  />
                  {errors.fullName && <span className="form-error">{errors.fullName}</span>}
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label className="form-label form-label--required">{t('checkout.phone')}</label>
                  <input
                    type="tel"
                    className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="012 345 678"
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">{t('checkout.email')}</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@mail.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>

              {/* Conditional Delivery Address with District */}
              {orderType === 'delivery' && (
                <>
                  <div className="form-group">
                    <label className="form-label form-label--required">{t('checkout.district')}</label>
                    <select
                      className="form-select"
                      value={formData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                    >
                      {PHNOM_PENH_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label--required">{t('checkout.delivery_address')}</label>
                    <textarea
                      rows={2}
                      className={`form-textarea ${errors.address ? 'form-textarea--error' : ''}`}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={isKm ? 'ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ចំណាំទីតាំង (ឧ. ជិតវិមានឯករាជ្យ)...' : 'House/Street/Building, Landmark details...'}
                    />
                    {errors.address && <span className="form-error">{errors.address}</span>}
                  </div>
                </>
              )}

              {orderType === 'pickup' && (
                <div className="form-group">
                  <label className="form-label form-label--required">{t('checkout.pickup_time')}</label>
                  <input
                    type="time"
                    className="form-input"
                    value={formData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Pick up directly at Phum Yeung Kitchen Hub, BKK1, Phnom Penh
                  </span>
                </div>
              )}

              {/* Special delivery notes */}
              <div className="form-group">
                <label className="form-label">{t('checkout.notes')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder={isKm ? 'ចំណាំសម្រាប់ការដឹកជញ្ជូន (ឧ. ដល់ហើយខលមក)...' : 'Call upon arrival, leave at reception...'}
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="checkout-section">
              <h3 className="checkout-section__title">
                <CreditCard size={20} />
                <span>{t('checkout.payment_method')}</span>
              </h3>

              <div className="payment-method-selector" style={{ gridTemplateColumns: '1fr' }}>
                <div
                  className="payment-option payment-option--active"
                  style={{ cursor: 'default' }}
                >
                  <QrCode size={26} color="#e11938" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '0.98rem' }}>{t('checkout.payment_khqr')}</span>
                      <span style={{ backgroundColor: '#e11938', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 800 }}>
                        BAKONG KHQR
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      {isKm ? 'ស្កេនទូទាត់ភ្លាមៗជាមួយ ABA, ACLEDA, Wing និងគ្រប់ធនាគារនៅកម្ពុជា' : 'Scan & pay instantly with ABA, ACLEDA, Wing & all Cambodian bank apps'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={submitting || storeSettings?.isOpen === false}
            >
              {submitting ? t('checkout.submitting') : `${t('checkout.place_order')} • ${dualTotal.usd}`}
            </Button>
          </form>

          {/* Right: Items in Order */}
          <div className="card" style={{ padding: 'var(--space-lg)' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-primary-dark)' }}>
              {t('cart.order_summary')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
              {items.map((item) => (
                <div key={item.cartItemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img
                      src={getImageUrl(item.image)}
                      alt={isKm ? item.name_km : item.name_en}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
                      }}
                      style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{isKm ? item.name_km : item.name_en}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>x {item.quantity}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>

            {/* Promo / Coupon Code Section */}
            <div style={{
              margin: '12px 0',
              padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '10px',
              border: '1px dashed #CBD5E1'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={13} color="#881337" />
                <span>{isKm ? 'កូដបញ្ចុះតម្លៃ (Promo Code)' : 'Promo / Voucher Code'}</span>
              </div>
              {promoCode ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.82rem'
                }}>
                  <span style={{ color: '#065F46', fontWeight: 700 }}>
                    ✓ {promoCode} (-{discountPercent}%)
                  </span>
                  <button
                    type="button"
                    onClick={removePromo}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#DC2626',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      padding: '2px 4px'
                    }}
                  >
                    {isKm ? 'ដកចេញ' : 'Remove'}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={inputPromoCode}
                    onChange={(e) => setInputPromoCode(e.target.value.toUpperCase())}
                    placeholder={isKm ? 'បញ្ចូលកូដ (ឧ. PHUM10)' : 'Enter code (e.g. PHUM10)'}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      fontSize: '0.82rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCheckoutPromo}
                    disabled={isApplyingPromo}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      backgroundColor: '#881337',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isApplyingPromo ? (isKm ? '...' : '...') : (isKm ? 'ប្រើប្រាស់' : 'Apply')}
                  </button>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span>{t('cart.subtotal')}:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span>{t('cart.delivery_fee')}:</span>
                <span>{deliveryFee === 0 ? t('cart.free_delivery') : formatCurrency(deliveryFee)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--color-accent)', fontSize: '0.9rem' }}>
                  <span>{t('cart.discount')}:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed var(--color-border)', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>{t('cart.grand_total')}:</span>
                <span style={{ color: 'var(--color-primary)' }}>{dualTotal.usd}</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {dualTotal.khr}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bakong KHQR Modal */}
      <Modal
        isOpen={showKhqrModal}
        onClose={() => {
          setShowKhqrModal(false);
          setKhqrPaid(false);
        }}
        title="Bakong KHQR"
        maxWidth="410px"
      >
        <div style={{ textAlign: 'center', margin: '-1.25rem -1.25rem 0 -1.25rem' }}>
          {/* Official Red KHQR Header */}
          <div style={{
            background: 'linear-gradient(135deg, #E11938 0%, #B91C1C 100%)',
            padding: '1.25rem 1.25rem 1rem 1.25rem',
            color: '#ffffff',
            borderRadius: '12px 12px 0 0'
          }}>
            {/* Logo + KHQR Badge row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px' }}>
              <img
                src="/phum_yeung_logo.jpg"
                alt="Phum Yeung"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.7)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              />
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 800,
                letterSpacing: '1px'
              }}>
                <span style={{ color: '#ffffff' }}>KHQR</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: 600 }}>BAKONG</span>
              </div>
            </div>
            <h3 style={{ margin: '2px 0', fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
              Phum Yeung Restaurant
            </h3>
            <div style={{ fontSize: '0.82rem', opacity: 0.92, marginTop: '2px' }}>
              Bakong ID: <strong style={{ color: '#ffffff' }}>{khqrData?.bakongAccountID || 'vatana@bkrt'}</strong>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.25rem 1.5rem 1.25rem' }}>
            {khqrLoading ? (
              <div style={{ padding: '50px 20px', color: 'var(--color-text-muted)' }}>
                <RefreshCw size={28} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 12px' }} />
                <p style={{ fontWeight: 600 }}>{t('common.loading')} Bakong KHQR...</p>
              </div>
            ) : khqrData?.qrImage ? (
              <div>
                {/* QR Code Container */}
                <div style={{
                  position: 'relative',
                  background: '#ffffff',
                  padding: '10px',
                  borderRadius: '16px',
                  display: 'inline-block',
                  maxWidth: '230px',
                  width: '100%',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  border: '1px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  <img
                    src={khqrData.qrImage}
                    alt="Bakong KHQR"
                    style={{
                      width: '100%',
                      maxWidth: '210px',
                      height: 'auto',
                      aspectRatio: '1 / 1',
                      display: 'block',
                      margin: '0 auto',
                      filter: khqrTimeLeft <= 0 && !khqrPaid ? 'blur(4px) grayscale(90%)' : 'none',
                      transition: 'filter 0.3s ease'
                    }}
                  />
                  {khqrTimeLeft <= 0 && !khqrPaid && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '16px',
                      textAlign: 'center'
                    }}>
                      <AlertCircle size={38} color="#DC2626" style={{ marginBottom: '6px' }} />
                      <strong style={{ color: '#DC2626', fontSize: '0.98rem', fontWeight: 700 }}>កូដ QR ផុតកំណត់ហើយ</strong>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>QR Code Expired</span>
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div style={{ marginTop: '0.9rem' }}>
                  <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                    {khqrData.amount?.toLocaleString()} ៛
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6B7280', marginTop: '1px' }}>
                    ≈ {dualTotal.usd} USD
                  </div>
                </div>

                {/* Status & Countdown Timer */}
                <div style={{ marginTop: '0.9rem' }}>
                  {khqrPaid ? (
                    <div style={{
                      padding: '10px 16px',
                      backgroundColor: '#ECFDF5',
                      borderRadius: '12px',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <CheckCircle size={20} color="#10B981" />
                      <span>ការទូទាត់ទទួលបានជោគជ័យ! កំពុងបញ្ជូន...</span>
                    </div>
                  ) : khqrTimeLeft <= 0 ? (
                    <div style={{
                      padding: '10px 14px',
                      backgroundColor: '#FEF2F2',
                      borderRadius: '12px',
                      border: '1px solid #FECACA',
                      color: '#991B1B',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      ⚠️ កូដ QR បានផុតកំណត់រយៈពេល ១២០ វិនាទី
                    </div>
                  ) : (
                    <div style={{
                      padding: '7px 14px',
                      backgroundColor: '#F8FAFC',
                      borderRadius: '24px',
                      border: '1px solid #E2E8F0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      color: '#475569'
                    }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        display: 'inline-block',
                        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
                      }} />
                      <span>រង់ចាំការទូទាត់</span>
                      <span style={{ color: '#CBD5E1' }}>•</span>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>{khqrTimeLeft}s</span>
                    </div>
                  )}
                </div>

                {/* Actions / Status indicator */}
                <div style={{ marginTop: '0.75rem' }}>
                  {khqrTimeLeft <= 0 && !khqrPaid ? (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleInitiateKhqr}
                      icon={<RefreshCw size={16} />}
                      style={{ borderRadius: '12px', padding: '10px' }}
                    >
                      🔄 បង្កើតកូដ QR ថ្មី (Generate New QR)
                    </Button>
                  ) : !khqrPaid ? (
                    <div>
                      {/* Cycle/Pill-Shaped Segmented Tab Switch (Like Auth signin/signup) */}
                      <div
                        className="auth-segmented-nav"
                        style={{
                          margin: '0 0 1rem 0',
                          padding: '3px',
                          borderRadius: '24px',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <button
                          type="button"
                          className={`auth-segmented-btn ${khqrMode === 'auto' ? 'auth-segmented-btn--active' : ''}`}
                          onClick={() => setKhqrMode('auto')}
                          style={{
                            borderRadius: '20px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          <span>🔁</span>
                          <span>{isKm ? 'ពិនិត្យស្វ័យប្រវត្តិ (Auto)' : 'Auto Verify'}</span>
                        </button>
                        <button
                          type="button"
                          className={`auth-segmented-btn ${khqrMode === 'manual' ? 'auth-segmented-btn--active' : ''}`}
                          onClick={() => setKhqrMode('manual')}
                          style={{
                            borderRadius: '20px',
                            padding: '8px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700
                          }}
                        >
                          <span>👆</span>
                          <span>{isKm ? 'ចុចដោយដៃ (Manual)' : 'Manual Click'}</span>
                        </button>
                      </div>

                      {/* Mode 1: Auto Verify (NO button shown! Clean animated status) */}
                      {khqrMode === 'auto' ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                          backgroundColor: '#F0FDF4',
                          border: '1.5px solid #86EFAC',
                          borderRadius: '14px',
                          padding: '12px 16px',
                          color: '#15803D',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)'
                        }}>
                          <RefreshCw size={16} style={{ animation: 'spin 2s linear infinite', color: '#16A34A' }} />
                          <span>{isKm ? 'កំពុងរង់ចាំការទូទាត់ពី App ធនាគារដោយស្វ័យប្រវត្តិ...' : 'Auto-checking bank payment...'}</span>
                        </div>
                      ) : (
                        /* Mode 2: Manual Click (Shows button, clicks to verify strictly with bank — NO BYPASS!) */
                        <div>
                          <p style={{
                            fontSize: '0.82rem',
                            color: '#64748B',
                            marginBottom: '0.75rem',
                            lineHeight: 1.5
                          }}>
                            {isKm
                              ? 'សូមស្កេនបាញ់លុយតាម App ធនាគាររបស់អ្នក រួចចុចប៊ូតុងខាងក្រោមដើម្បីផ្ទៀងផ្ទាត់'
                              : 'Please scan & pay with your banking app, then click below to verify'}
                          </p>
                          <Button
                            variant="primary"
                            fullWidth
                            disabled={isCheckingPayment}
                            onClick={handleVerifyManualPayment}
                            icon={<RefreshCw size={16} style={{ animation: isCheckingPayment ? 'spin 1s linear infinite' : 'none' }} />}
                            style={{
                              borderRadius: '12px',
                              backgroundColor: '#16A34A',
                              borderColor: '#16A34A',
                              fontWeight: 700,
                              padding: '13px',
                              fontSize: '0.96rem',
                              boxShadow: '0 3px 10px rgba(22, 163, 74, 0.25)'
                            }}
                          >
                            {isCheckingPayment
                              ? (isKm ? 'កំពុងផ្ទៀងផ្ទាត់ជាមួយធនាគារ...' : 'Verifying with bank...')
                              : (isKm ? '✅ ខ្ញុំបានបាញ់ប្រាក់រួចហើយ (ផ្ទៀងផ្ទាត់)' : '✅ I Have Paid (Verify Payment)')}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Subtle bank support footer */}
                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.73rem',
                  color: '#9CA3AF',
                  textAlign: 'center'
                }}>
                  ស្កេនទូទាត់ជាមួយ ABA, ACLEDA, Bakong និងធនាគារនានា
                </div>
              </div>
            ) : (
              <div style={{ color: '#DC2626', padding: '20px' }}>
                <p>មិនអាចបង្កើតកូដ KHQR បានទេ។ សូមព្យាយាមម្តងទៀត។</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInitiateKhqr}
                  style={{ marginTop: '10px' }}
                >
                  🔄 ព្យាយាមម្តងទៀត
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
