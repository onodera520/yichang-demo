import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
  buildAssigneeWorkloadOptions,
  shouldOpenAssigneeMenuUpward,
} from '../../state/assigneeWorkload.js';

const statusStyles = {
  可接单: 'text-[#12B76A]',
  忙碌: 'text-[#F79009]',
  过载: 'text-[#F04438]',
  不可用: 'text-[#8A98B3]',
};

const barStyles = {
  可接单: 'bg-[#2F7BFF]',
  忙碌: 'bg-[#F79009]',
  过载: 'bg-[#F04438]',
  不可用: 'bg-[#C9D3E1]',
};

export default function AssigneeWorkloadSelect({
  value,
  onChange,
  source,
  tasks = [],
  members = [],
  disabled = false,
  ariaLabel = '分派负责人',
  className = '',
  triggerClassName = 'h-9 w-full rounded-[8px] px-3 text-sm',
  menuClassName = 'right-0 w-[292px]',
}) {
  const rootRef = React.useRef(null);
  const triggerRef = React.useRef(null);
  const menuId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [openUpward, setOpenUpward] = React.useState(false);
  const options = React.useMemo(
    () => buildAssigneeWorkloadOptions(source, tasks, members),
    [members, source, tasks],
  );

  React.useEffect(() => {
    if (!open) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  React.useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const selectOwner = (owner) => {
    onChange?.(owner);
    setOpen(false);
  };

  const toggleOpen = () => {
    if (!open && rootRef.current) {
      setOpenUpward(shouldOpenAssigneeMenuUpward(
        rootRef.current.getBoundingClientRect(),
        window.innerHeight,
      ));
    }
    setOpen((current) => !current);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-between gap-2 border bg-white text-[#1D273B] outline-none transition ${triggerClassName} ${
          open ? 'border-[#8DB6FF] bg-[#F2F7FF] text-[#2F7BFF]' : 'border-[#D9E1EE] hover:border-[#9CC0FF]'
        } disabled:cursor-not-allowed disabled:bg-[#F5F7FB] disabled:text-[#8A98B3]`}
        disabled={disabled}
        onClick={toggleOpen}
        type="button"
      >
        <span className="truncate">{value || '未分派'}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          id={menuId}
          aria-label={ariaLabel}
          className={`absolute z-[80] max-h-[286px] overflow-y-auto rounded-[8px] border border-[#E2E8F0] bg-white py-1 shadow-[0_12px_30px_rgba(31,45,61,0.16)] ${
            openUpward ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'
          } ${menuClassName}`}
          role="listbox"
        >
          <button
            aria-selected={value === '未分派'}
            className={`flex h-11 w-full items-center justify-between px-4 text-left text-sm transition ${
              value === '未分派' ? 'bg-[#F2F7FF] text-[#2F7BFF]' : 'text-[#344767] hover:bg-[#F2F7FF]'
            }`}
            onClick={() => selectOwner('未分派')}
            role="option"
            type="button"
          >
            <span>未分派</span>
            {value === '未分派' ? <Check className="h-4 w-4" /> : null}
          </button>

          {options.map((option) => {
            const selected = value === option.name;
            const barWidth = Math.min(100, Math.max(0, option.currentLoadPercent));

            return (
              <button
                key={option.name}
                aria-disabled={option.disabled}
                aria-selected={selected}
                className={`w-full px-4 py-2.5 text-left transition ${
                  selected ? 'bg-[#F2F7FF]' : option.disabled ? 'cursor-not-allowed bg-white opacity-65' : 'hover:bg-[#F2F7FF]'
                }`}
                disabled={option.disabled}
                onClick={() => selectOwner(option.name)}
                role="option"
                title={option.blockReason || `分派后预计负载：${option.projectedLoadPercent}%`}
                type="button"
              >
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className={`font-medium ${selected ? 'text-[#2F7BFF]' : 'text-[#263246]'}`}>{option.name}</span>
                  <span className={`shrink-0 text-xs font-medium ${statusStyles[option.statusLabel]}`}>{option.statusLabel}</span>
                </span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="shrink-0 text-xs text-[#7889A8]">{option.active}/{option.capacity} 条</span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E8EDF5]">
                    <span className={`block h-full rounded-full ${barStyles[option.statusLabel]}`} style={{ width: `${barWidth}%` }} />
                  </span>
                  <span className={`w-9 shrink-0 text-right text-xs font-semibold ${statusStyles[option.statusLabel]}`}>{option.currentLoadPercent}%</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
