import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterSelect({
  label,
  value,
  options = [],
  placeholder = '全部',
  onChange,
  className = '',
}) {
  return (
    <label className={`inline-flex h-9 items-center rounded-[10px] border border-[#E2E8F0] bg-white px-3 ${className}`}>
      {label ? <span className="mr-1.5 text-[13px] text-[#7889A8]">{label}：</span> : null}
      <select
        className="min-w-[86px] appearance-none bg-transparent pr-6 text-[13px] text-[#344767] outline-none"
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const item = typeof option === 'string' ? { label: option, value: option } : option;
          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
      <ChevronDown className="-ml-4 h-3.5 w-3.5 pointer-events-none text-[#8A98B3]" />
    </label>
  );
}
