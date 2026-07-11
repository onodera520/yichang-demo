import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  getSelectedFilterLabel,
  normalizeFilterOptions,
} from './filterSelectOptions.js';

export default function FilterSelect({
  label,
  value,
  options = [],
  placeholder = '全部',
  placeholderValue = '',
  includePlaceholder = true,
  onChange,
  className = '',
  labelClassName = 'text-[13px] text-[#7889A8]',
  controlClassName = '',
  triggerClassName = 'h-10 min-w-[120px] rounded-[8px] px-3 text-sm font-medium',
  menuClassName = '',
  optionClassName = 'px-3 py-2 text-sm',
  align = 'left',
  open,
  onOpenChange,
  ariaLabel,
}) {
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const menuId = React.useId();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const normalizedOptions = React.useMemo(
    () =>
      normalizeFilterOptions(options, {
        includePlaceholder,
        placeholder,
        placeholderValue,
      }),
    [includePlaceholder, options, placeholder, placeholderValue],
  );
  const selectedLabel = getSelectedFilterLabel(normalizedOptions, value, placeholder);
  const hasActiveValue = value != null && value !== '' && value !== placeholderValue;

  const updateOpen = React.useCallback(
    (nextOpen) => {
      if (!isControlled) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  React.useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) updateOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      updateOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen, updateOpen]);

  return (
    <div className={className}>
      {label ? <span className={labelClassName}>{label}</span> : null}
      <div ref={rootRef} className={`relative ${controlClassName}`}>
        <button
          ref={triggerRef}
          type="button"
          className={`inline-flex items-center justify-between gap-2 border outline-none transition ${triggerClassName} ${
            isOpen || hasActiveValue
              ? 'border-[#9CC0FF] bg-[#F2F7FF] text-[#2F7BFF] shadow-[0_2px_8px_rgba(47,123,255,0.08)]'
              : 'border-[#D7DEE9] bg-white text-[#263246] shadow-[0_1px_2px_rgba(28,39,71,0.03)] hover:border-[#B9C4D4]'
          }`}
          aria-controls={isOpen ? menuId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel ?? label ?? placeholder}
          onClick={() => updateOpen(!isOpen)}
        >
          <span className="min-w-0 truncate whitespace-nowrap">{selectedLabel}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen ? (
          <div
            id={menuId}
            role="listbox"
            aria-label={ariaLabel ?? label ?? placeholder}
            className={`absolute top-[calc(100%+6px)] z-50 max-h-52 min-w-full overflow-y-auto rounded-[8px] border border-[#E2E8F0] bg-white py-1 shadow-[0_10px_28px_rgba(31,45,61,0.14)] ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${menuClassName}`}
          >
            {normalizedOptions.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={`${String(option.value)}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`block w-full whitespace-nowrap text-left transition hover:bg-[#F2F7FF] ${optionClassName} ${
                    isSelected
                      ? 'bg-[#F2F7FF] font-medium text-[#2F7BFF]'
                      : 'text-[#344767]'
                  }`}
                  onClick={() => {
                    onChange?.(option.value);
                    updateOpen(false);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
