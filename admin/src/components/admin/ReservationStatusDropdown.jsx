import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  Utensils,
  XCircle,
  ChevronDown,
  Check
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const RESERVATION_STATUS_CONFIG = {
  pending: {
    id: 'pending',
    label_km: 'កំពុងរង់ចាំ',
    label_en: 'Pending',
    icon: Clock,
    color: '#b45309',
    bg: '#fef3c7',
    border: '#fde68a',
    dot: '#f59e0b'
  },
  confirmed: {
    id: 'confirmed',
    label_km: 'បានបញ្ជាក់',
    label_en: 'Confirmed',
    icon: CheckCircle2,
    color: '#1d4ed8',
    bg: '#dbeafe',
    border: '#bfdbfe',
    dot: '#3b82f6'
  },
  seated: {
    id: 'seated',
    label_km: 'បានមកដល់',
    label_en: 'Seated',
    icon: Utensils,
    color: '#15803d',
    bg: '#dcfce7',
    border: '#bbf7d0',
    dot: '#22c55e'
  },
  cancelled: {
    id: 'cancelled',
    label_km: 'បានបោះបង់',
    label_en: 'Cancelled',
    icon: XCircle,
    color: '#b91c1c',
    bg: '#fee2e2',
    border: '#fecaca',
    dot: '#ef4444'
  }
};

export const ReservationStatusDropdown = ({
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

  const currentConfig = RESERVATION_STATUS_CONFIG[status] || RESERVATION_STATUS_CONFIG.pending;
  const CurrentIcon = currentConfig.icon;

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
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (statusKey) => {
    if (statusKey !== status && typeof onChange === 'function') {
      onChange(statusKey);
    }
    setIsOpen(false);
  };

  const statusList = Object.values(RESERVATION_STATUS_CONFIG);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
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
          boxShadow: isOpen ? `0 0 0 3px ${currentConfig.border}` : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          whiteSpace: 'nowrap'
        }}
        title={isKm ? 'ចុចដើម្បីប្តូរស្ថានភាព' : 'Click to change status'}
      >
        <span
          style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: currentConfig.dot,
            flexShrink: 0
          }}
        />
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

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1050,
            minWidth: '180px',
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
            {isKm ? 'ស្ថានភាពកក់តុ' : 'Booking Status'}
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
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
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
                  {isSelected && <Check size={14} color={cfg.color} strokeWidth={2.8} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
