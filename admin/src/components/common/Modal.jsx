import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  maxWidth = '580px',
  closeOnOverlay = false, // Safe UX: False by default to prevent losing filled form data on accidental outside click
  closeOnEsc = false      // Safe UX: False by default for form modals
}) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (closeOnEsc) {
          onClose();
        } else {
          // Pulse feedback to signal data safety
          setPulse(true);
          setTimeout(() => setPulse(false), 240);
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose, closeOnEsc]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlay) {
      onClose();
    } else {
      // Gentle spring pulse feedback: reminds user the modal won't close and their filled input is safe!
      setPulse(true);
      setTimeout(() => setPulse(false), 240);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        userSelect: 'none'
      }}
    >
      <div
        className="modal-card"
        style={{
          maxWidth,
          transform: pulse ? 'scale(1.018)' : 'scale(1)',
          boxShadow: pulse
            ? '0 25px 60px -12px rgba(136, 19, 55, 0.35), 0 0 0 3px rgba(136, 19, 55, 0.2)'
            : undefined,
          transition: 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease',
          userSelect: 'text'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};
