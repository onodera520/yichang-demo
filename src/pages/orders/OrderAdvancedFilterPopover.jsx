import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import FilterSelect from '../../components/common/FilterSelect.jsx';
import {
  advancedFilterDefaults,
  countActiveOrderAdvancedFilters,
  getOrderAdvancedFilterErrors,
} from './orderAdvancedFilters.js';

export default function OrderAdvancedFilterPopover({
  filters,
  onApply,
  onOpenChange,
  open,
  skuOptions,
  statusOptions,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [draft, setDraft] = useState(() => ({ ...advancedFilterDefaults, ...filters }));

  useEffect(() => {
    if (open) setDraft({ ...advancedFilterDefaults, ...filters });
  }, [filters, open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) onOpenChange(false);
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onOpenChange, open]);

  const errors = useMemo(() => getOrderAdvancedFilterErrors(draft), [draft]);
  const activeCount = countActiveOrderAdvancedFilters(filters);
  const invalid = Boolean(errors.amount || errors.confidence);
  const updateDraft = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <div ref={rootRef} className="relative flex flex-col justify-end">
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`orders-more-filter inline-flex items-center justify-center gap-2${open || activeCount ? ' orders-more-filter-active' : ''}`}
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        更多筛选
        {activeCount ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2F7BFF] px-1 text-xs font-semibold text-white">{activeCount}</span> : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[420px] overflow-hidden rounded-[10px] border border-[#DDE4EE] bg-white shadow-[0_16px_42px_rgba(31,45,61,0.18)]" role="dialog" aria-label="订单高级筛选">
          <div className="flex h-13 items-center justify-between border-b border-[#E6EAF2] px-5 py-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#1D273B]">高级筛选</h2>
              <p className="mt-0.5 text-xs text-[#8A98B3]">组合条件将在应用后更新订单列表</p>
            </div>
            <button className="rounded-[6px] p-1.5 text-[#8A98B3] hover:bg-[#F5F7FB]" onClick={() => onOpenChange(false)} type="button" aria-label="关闭高级筛选">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FilterSelect
                label="处理状态"
                value={draft.status}
                options={statusOptions}
                onChange={(value) => updateDraft('status', value)}
                triggerClassName="h-10 w-full rounded-[7px] px-3 text-sm font-medium"
              />
              <FilterSelect
                label="关联 SKU"
                value={draft.relatedSku}
                options={skuOptions}
                onChange={(value) => updateDraft('relatedSku', value)}
                triggerClassName="h-10 w-full rounded-[7px] px-3 text-sm font-medium"
              />
            </div>

            <RangeFields
              error={errors.amount}
              label="异常金额"
              maxValue={draft.amountMax}
              minValue={draft.amountMin}
              onMaxChange={(value) => updateDraft('amountMax', value)}
              onMinChange={(value) => updateDraft('amountMin', value)}
              prefix="¥"
            />
            <RangeFields
              error={errors.confidence}
              label="AI 置信度"
              max={100}
              maxValue={draft.confidenceMax}
              min={0}
              minValue={draft.confidenceMin}
              onMaxChange={(value) => updateDraft('confidenceMax', value)}
              onMinChange={(value) => updateDraft('confidenceMin', value)}
              suffix="%"
            />
          </div>

          <div className="flex h-15 items-center justify-between border-t border-[#E6EAF2] px-5 py-3">
            <button className="h-9 rounded-[7px] px-3 text-sm font-semibold text-[#5F6B7A] hover:bg-[#F5F7FB]" onClick={() => setDraft(advancedFilterDefaults)} type="button">重置</button>
            <button
              className="h-9 rounded-[7px] bg-[#2F7BFF] px-5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(47,123,255,0.2)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={invalid}
              onClick={() => {
                onApply(draft);
                onOpenChange(false);
              }}
              type="button"
            >
              应用筛选
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RangeFields({ error, label, max, maxValue, min, minValue, onMaxChange, onMinChange, prefix, suffix }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] text-[#7889A8]">{label}</span>
      <div className="flex items-center gap-2">
        <NumberField label={`${label}最小值`} max={max} min={min} onChange={onMinChange} prefix={prefix} suffix={suffix} value={minValue} />
        <span className="shrink-0 text-[#A0AEC0]">–</span>
        <NumberField label={`${label}最大值`} max={max} min={min} onChange={onMaxChange} prefix={prefix} suffix={suffix} value={maxValue} />
      </div>
      {error ? <p className="mt-1.5 text-xs text-[#E5484D]">{error}</p> : null}
    </div>
  );
}

function NumberField({ label, max, min, onChange, prefix, suffix, value }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center rounded-[7px] border border-[#D7DEE9] bg-white px-3 focus-within:border-[#9CC0FF] focus-within:ring-2 focus-within:ring-[#E6F0FF]">
      {prefix ? <span className="mr-1 text-sm text-[#8A98B3]">{prefix}</span> : null}
      <input
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-sm text-[#263246] outline-none placeholder:text-[#B0BACB]"
        max={max}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        placeholder="不限"
        type="number"
        value={value}
      />
      {suffix ? <span className="ml-1 text-sm text-[#8A98B3]">{suffix}</span> : null}
    </label>
  );
}
