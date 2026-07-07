import React from 'react';

const riskStyles = {
  高: 'bg-[#FFE9EA] text-[#FF2D2D]',
  中: 'bg-[#FFF3E6] text-[#FF8A00]',
  低: 'bg-[#E9FAEF] text-[#16B969]',
  滞销: 'bg-[#F3E8FF] text-[#8B5CF6]',
  调拨: 'bg-[#E9F0FF] text-[#2F7BFF]',
};

export default function RiskTag({ type, children, className = '' }) {
  const label = children ?? type;
  const style = riskStyles[type] ?? 'bg-[#F2F6FC] text-[#7889A8]';

  return (
    <span className={`inline-flex h-8 min-w-[52px] items-center justify-center rounded-[8px] px-3 text-sm font-semibold ${style} ${className}`}>
      {label}
    </span>
  );
}
