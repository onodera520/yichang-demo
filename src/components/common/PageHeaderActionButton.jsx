import React from 'react';

const variantStyles = {
  secondary:
    'border border-[#D7DEE9] bg-white text-[#1D273B] shadow-[0_3px_10px_rgba(28,39,71,0.04)] hover:border-[#A8C5F7] hover:bg-[#F8FBFF] hover:shadow-[0_7px_16px_rgba(47,123,255,0.12)]',
  primary:
    'border border-transparent bg-[#2F7BFF] text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)] hover:bg-[#286FE8] hover:shadow-[0_10px_22px_rgba(47,123,255,0.3)]',
};

export default function PageHeaderActionButton({
  icon: Icon,
  variant = 'secondary',
  className = '',
  children,
  type = 'button',
  ...buttonProps
}) {
  const variantClassName = variantStyles[variant] ?? variantStyles.secondary;

  return (
    <button
      {...buttonProps}
      type={type}
      className={`inline-flex h-10 min-w-[114px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[9px] px-4 text-sm font-medium transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9EC1FF] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none ${variantClassName} ${className}`}
    >
      {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </button>
  );
}
