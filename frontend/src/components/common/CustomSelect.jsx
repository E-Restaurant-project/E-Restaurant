import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  error = false,
  disabled = false,
  className = '',
  style = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.value === value || opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        listRef.current &&
        !listRef.current.contains(e.target)
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

  // Keyboard navigation & Esc to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = options.findIndex((opt) => (opt.value || opt.id) === value);
        const nextIndex = (currentIndex + 1) % options.length;
        onChange(options[nextIndex]?.value || options[nextIndex]?.id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = options.findIndex((opt) => (opt.value || opt.id) === value);
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        onChange(options[prevIndex]?.value || options[prevIndex]?.id);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, options, value, onChange]);

  // Ultra-Smooth Viscous "Oil-like" Momentum Inertia Scroll Physics
  useEffect(() => {
    const container = listRef.current;
    if (!container || !isOpen) return;

    let currentY = container.scrollTop;
    let targetY = container.scrollTop;
    let animationFrameId = null;
    let isAnimating = false;

    // Scroll automatically to selected option upon open
    const selectedElem = container.querySelector('.custom-select__option--selected');
    if (selectedElem) {
      const topPos = selectedElem.offsetTop - container.offsetTop - 40;
      targetY = Math.max(0, topPos);
      currentY = targetY;
      container.scrollTop = targetY;
    }

    const renderViscousScroll = () => {
      // Viscous damping fluid motion (0.08 damping coefficient for ultra-slow, thick, rich oil glide)
      const diff = targetY - currentY;
      if (Math.abs(diff) > 0.35) {
        currentY += diff * 0.08;
        container.scrollTop = currentY;
        animationFrameId = requestAnimationFrame(renderViscousScroll);
      } else {
        container.scrollTop = targetY;
        currentY = targetY;
        isAnimating = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      }
    };

    const handleWheel = (e) => {
      e.stopPropagation();
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;
      
      e.preventDefault();
      // Controlled slower momentum velocity
      const delta = e.deltaY * 0.65;
      targetY = Math.max(0, Math.min(maxScroll, targetY + delta));

      if (!isAnimating) {
        isAnimating = true;
        animationFrameId = requestAnimationFrame(renderViscousScroll);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    const val = opt.value !== undefined ? opt.value : opt.id;
    onChange(val);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className={`custom-select-wrap ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        ref={triggerRef}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`custom-select-trigger ${error ? 'custom-select-trigger--error' : ''} ${
          isOpen ? 'custom-select-trigger--open' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="custom-select-trigger__label">
          {selectedOption ? selectedOption.label || selectedOption.name : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`custom-select-trigger__arrow ${
            isOpen ? 'custom-select-trigger__arrow--open' : ''
          }`}
        />
      </button>

      {/* Viscous Smooth Dropdown Menu */}
      {isOpen && (
        <div className="custom-select-dropdown">
          <div
            ref={listRef}
            className="custom-select-list custom-scroll-oil"
            role="listbox"
          >
            {options.map((opt) => {
              const optVal = opt.value !== undefined ? opt.value : opt.id;
              const isSelected = optVal === value;
              const label = opt.label || opt.name;

              return (
                <div
                  key={optVal}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  className={`custom-select__option ${
                    isSelected ? 'custom-select__option--selected' : ''
                  }`}
                >
                  <span className="custom-select__option-text">{label}</span>
                  {isSelected && (
                    <Check size={16} className="custom-select__option-check" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
