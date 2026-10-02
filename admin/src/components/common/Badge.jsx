import React from 'react';

export const Badge = ({
  children,
  variant = 'gold', // success | warning | danger | info | gold
  className = '',
  icon = null
}) => {
  return (
    <span className={`badge badge--${variant} ${className}`}>
      {icon && <span className="badge__icon">{icon}</span>}
      {children}
    </span>
  );
};
