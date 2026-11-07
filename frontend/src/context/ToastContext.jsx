import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3200) => {
    setToasts((prev) => {
      // If the exact same message is already visible, do not re-add or flash
      if (prev.some((t) => t.message === message)) {
        return prev;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const id = Date.now() + Math.random().toString();
      const newToast = { id, message, type, duration };

      timerRef.current = setTimeout(() => {
        removeToast(id);
      }, duration);

      // Enforce at most 1 active toast at any moment so toasts never stack over modals
      return [newToast];
    });
  }, [removeToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={24} strokeWidth={2.4} />;
      case 'error':
        return <AlertCircle size={24} strokeWidth={2.4} />;
      case 'warning':
        return <AlertTriangle size={24} strokeWidth={2.4} />;
      case 'info':
      default:
        return <Info size={24} strokeWidth={2.4} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div className="toast-container-top" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-modern toast-modern--${toast.type}`}
            role="status"
          >
            {/* Glowing Icon Badge */}
            <div className="toast-modern__icon-wrap">
              {getToastIcon(toast.type)}
            </div>

            {/* Message Content */}
            <div className="toast-modern__content">
              <span className="toast-modern__message">{toast.message}</span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              className="toast-modern__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={18} />
            </button>

            {/* Auto-dismiss progress countdown line */}
            <div
              className="toast-modern__progress"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
