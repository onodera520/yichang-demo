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
    <label className={`inline-flex h-10 items-center rounded-[8px] border border-[#D7DEE9] bg-white px-3 shadow-[0_1px_2px_rgba(28,39,71,0.03)] ${className}`}>
      {label ? <span className="mr-1.5 text-[13px] text-[#7889A8]">{label}：</span> : null}
      <select
        className="min-w-[90px] appearance-none bg-transparent pr-6 text-sm font-medium text-[#263246] outline-none"
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
      <ChevronDown className="pointer-events-none -ml-4 h-4 w-4 text-[#1D273B]" />
    </label>
  );
}
