import React from 'react';

const riskStyles = {
  高: 'bg-[#FFEDEE] text-[#D92D20]',
  中: 'bg-[#FFF4E5] text-[#D97706]',
  低: 'bg-[#EAF8F0] text-[#159455]',
  滞销: 'bg-[#F2EAFE] text-[#7C3AED]',
  调拨: 'bg-[#EAF2FF] text-[#2F7BFF]',
};

export default function RiskTag({ type, children, className = '' }) {
  const label = children ?? type;
  const style = riskStyles[type] ?? 'bg-[#F2F6FC] text-[#7889A8]';

  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  );
}
