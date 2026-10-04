import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  ChefHat,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const ORDER_STATUS_CONFIG = {
  pending: {
    id: 'pending',
    label_km: 'កំពុងរង់ចាំ',
    label_en: 'Pending',
    icon: Clock,
    color: '#b45309', // amber-700
    bg: '#fef3c7',    // amber-100
    border: '#fde68a',// amber-200
    dot: '#f59e0b',   // amber-500
    badgeClass: 'badge--gold'
  },
  preparing: {
    id: 'preparing',
    label_km: 'កំពុងចម្អិន',
    label_en: 'Cooking',
    icon: ChefHat,
    color: '#1d4ed8', // blue-700
    bg: '#dbeafe',    // blue-100
    border: '#bfdbfe',// blue-200
    dot: '#3b82f6',   // blue-500
    badgeClass: 'badge--warning'
  },
  delivering: {
    id: 'delivering',
    label_km: 'កំពុងដឹកជញ្ជូន',
    label_en: 'Delivering',
    icon: Truck,
    color: '#6d28d9', // purple-700
    bg: '#ede9fe',    // purple-100
    border: '#ddd6fe',// purple-200
    dot: '#8b5cf6',   // purple-500
    badgeClass: 'badge--info',
    pulse: true
  },
  completed: {
    id: 'completed',
    label_km: 'បានប្រគល់ជូន',
    label_en: 'Delivered',
    icon: CheckCircle2,
    color: '#15803d', // emerald-700
    bg: '#dcfce7',    // emerald-100
    border: '#bbf7d0',// emerald-200
    dot: '#22c55e',   // emerald-500
    badgeClass: 'badge--success'
  },
  cancelled: {
    id: 'cancelled',
    label_km: 'បានបោះបង់',
    label_en: 'Cancelled',
    icon: XCircle,
    color: '#b91c1c', // red-700
    bg: '#fee2e2',    // red-100
    border: '#fecaca',// red-200
    dot: '#ef4444',   // red-500
    badgeClass: 'badge--danger'
  }
};

export const OrderStatusDropdown = ({
  status = 'pending',
  onChange,
  disabled = false,
  size = 'sm'
}) => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  const currentConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pending;
  const CurrentIcon = currentConfig.icon;

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (statusKey) => {
    if (statusKey !== status && typeof onChange === 'function') {
      onChange(statusKey);
    }
    setIsOpen(false);
  };

  const statusList = Object.values(ORDER_STATUS_CONFIG);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Pill Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: size === 'sm' ? '6px 12px' : '8px 16px',
          borderRadius: '9999px',
          border: `1.5px solid ${currentConfig.border}`,
          backgroundColor: currentConfig.bg,
          color: currentConfig.color,
          fontSize: size === 'sm' ? '0.82rem' : '0.9rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? `0 0 0 3px ${currentConfig.border}`
            : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          whiteSpace: 'nowrap',
          userSelect: 'none'
        }}
        title={isKm ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to change status'}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {/* Animated Pulse Indicator for Delivering */}
        {currentConfig.pulse ? (
          <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
            <span
              style={{
                position: 'absolute',
                display: 'inline-flex',
                height: '100%',
                width: '100%',
                borderRadius: '50%',
                backgroundColor: currentConfig.dot,
                opacity: 0.75,
                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
              }}
            />
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                height: '8px',
                width: '8px',
                backgroundColor: currentConfig.dot
              }}
            />
          </span>
        ) : (
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: currentConfig.dot,
              flexShrink: 0
            }}
          />
        )}

        <CurrentIcon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} />
        <span>{isKm ? currentConfig.label_km : currentConfig.label_en}</span>

        <ChevronDown
          size={13}
          strokeWidth={2.4}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            opacity: 0.8
          }}
        />
      </button>

      {/* Floating Animated Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1050,
            minWidth: '185px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '6px',
            boxShadow: '0 15px 35px -5px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            animation: 'dropdownPop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          role="listbox"
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--color-text-muted)',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '4px'
            }}
          >
            {isKm ? 'ជ្រើសរើសស្ថានភាពថ្មី' : 'Update Order Status'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {statusList.map((cfg) => {
              const isSelected = cfg.id === status;
              const Icon = cfg.icon;

              return (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => handleSelect(cfg.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: isSelected ? cfg.bg : 'transparent',
                    color: isSelected ? cfg.color : '#334155',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        backgroundColor: cfg.bg,
                        color: cfg.color
                      }}
                    >
                      <Icon size={14} strokeWidth={2.2} />
                    </span>
                    <span>{isKm ? cfg.label_km : cfg.label_en}</span>
                  </div>

                  {isSelected && (
                    <Check size={14} color={cfg.color} strokeWidth={2.8} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
