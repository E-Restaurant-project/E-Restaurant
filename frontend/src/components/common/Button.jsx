import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // primary | secondary | outline | ghost | danger
  size = 'md',        // sm | md | lg
  fullWidth = false,
  block = false,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon = null,
  ...props
}) => {
  const isFull = fullWidth || block;
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    isFull ? 'btn--full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );
};
