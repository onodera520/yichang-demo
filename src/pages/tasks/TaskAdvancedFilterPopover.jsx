import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  countActiveTaskAdvancedFilters,
  getTaskAdvancedFilterErrors,
  taskAdvancedFilterDefaults,
} from './taskAdvancedFilters.js';

export default function TaskAdvancedFilterPopover({
  filters,
  onApply,
  onOpenChange,
  open,
}) {
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [draft, setDraft] = useState(() => ({
    ...taskAdvancedFilterDefaults,
    ...filters,
  }));

  useEffect(() => {
    if (open) setDraft({ ...taskAdvancedFilterDefaults, ...filters });
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

  const errors = useMemo(() => getTaskAdvancedFilterErrors(draft), [draft]);
  const activeCount = countActiveTaskAdvancedFilters(filters);
  const invalid = Boolean(errors.createdAt || errors.sla);
  const updateDraft = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <div ref={rootRef} className="relative flex flex-col">
      <span aria-hidden="true" className="mb-1.5 block h-5" />
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`relative inline-flex h-10 min-w-[104px] items-center justify-center whitespace-nowrap rounded-[7px] border px-5 text-sm font-semibold transition ${
          open || activeCount
            ? 'border-[#8CB5FF] bg-[#F1F6FF] text-[#2F7BFF]'
            : 'border-[#D7DEE9] bg-white text-[#263246] hover:border-[#AFC8F4]'
        }`}
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        更多筛选
        {activeCount ? (
          <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2F7BFF] px-1 text-xs font-semibold text-white shadow-[0_2px_6px_rgba(47,123,255,0.25)]">
            {activeCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label="任务高级筛选"
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[420px] overflow-hidden rounded-[10px] border border-[#DDE4EE] bg-white shadow-[0_16px_42px_rgba(31,45,61,0.18)]"
          role="dialog"
        >
          <header className="flex items-center justify-between border-b border-[#E6EAF2] px-5 py-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#1D273B]">高级筛选</h2>
              <p className="mt-0.5 text-xs text-[#8A98B3]">
                组合条件将在应用后更新任务列表
              </p>
            </div>
            <button
              aria-label="关闭任务高级筛选"
              className="rounded-[6px] p-1.5 text-[#8A98B3] hover:bg-[#F5F7FB]"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="任务标题"
                onChange={(value) => updateDraft('title', value)}
                placeholder="输入标题关键词"
                value={draft.title}
              />
              <TextField
                label="来源对象编号"
                onChange={(value) => updateDraft('source', value)}
                placeholder="订单号或 SKU"
                value={draft.source}
              />
            </div>

            <DateRangeFields
              error={errors.createdAt}
              fromValue={draft.createdFrom}
              onFromChange={(value) => updateDraft('createdFrom', value)}
              onToChange={(value) => updateDraft('createdTo', value)}
              toValue={draft.createdTo}
            />

            <NumberRangeFields
              error={errors.sla}
              maxValue={draft.slaMaxHours}
              minValue={draft.slaMinHours}
              onMaxChange={(value) => updateDraft('slaMaxHours', value)}
              onMinChange={(value) => updateDraft('slaMinHours', value)}
            />
          </div>

          <footer className="flex items-center justify-between border-t border-[#E6EAF2] px-5 py-3">
            <button
              className="h-9 rounded-[7px] px-3 text-sm font-semibold text-[#5F6B7A] hover:bg-[#F5F7FB]"
              onClick={() => setDraft({ ...taskAdvancedFilterDefaults })}
              type="button"
            >
              重置
            </button>
            <button
              className="h-9 rounded-[7px] bg-[#2F7BFF] px-5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(47,123,255,0.2)] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={invalid}
              onClick={() => {
                onApply({ ...draft });
                onOpenChange(false);
              }}
              type="button"
            >
              应用筛选
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

function TextField({ label, onChange, placeholder, value }) {
  return (
    <label>
      <span className="mb-1.5 block text-[13px] text-[#7889A8]">{label}</span>
      <input
        aria-label={label}
        className="h-10 w-full rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm text-[#263246] outline-none transition placeholder:text-[#B0BACB] focus:border-[#9CC0FF] focus:ring-2 focus:ring-[#E6F0FF]"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function DateRangeFields({
  error,
  fromValue,
  onFromChange,
  onToChange,
  toValue,
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] text-[#7889A8]">创建时间</span>
      <div className="flex items-center gap-2">
        <DateField label="创建时间开始日期" onChange={onFromChange} value={fromValue} />
        <span className="shrink-0 text-[#A0AEC0]">至</span>
        <DateField label="创建时间结束日期" onChange={onToChange} value={toValue} />
      </div>
      {error ? <p className="mt-1.5 text-xs text-[#E5484D]">{error}</p> : null}
    </div>
  );
}

function DateField({ label, onChange, value }) {
  return (
    <input
      aria-label={label}
      className="h-10 min-w-0 flex-1 rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm text-[#263246] outline-none transition focus:border-[#9CC0FF] focus:ring-2 focus:ring-[#E6F0FF]"
      onChange={(event) => onChange(event.target.value)}
      type="date"
      value={value}
    />
  );
}

function NumberRangeFields({
  error,
  maxValue,
  minValue,
  onMaxChange,
  onMinChange,
}) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] text-[#7889A8]">剩余 SLA</span>
      <div className="flex items-center gap-2">
        <NumberField label="最小剩余 SLA" onChange={onMinChange} value={minValue} />
        <span className="shrink-0 text-[#A0AEC0]">至</span>
        <NumberField label="最大剩余 SLA" onChange={onMaxChange} value={maxValue} />
      </div>
      {error ? <p className="mt-1.5 text-xs text-[#E5484D]">{error}</p> : null}
    </div>
  );
}

function NumberField({ label, onChange, value }) {
  return (
    <label className="flex h-10 min-w-0 flex-1 items-center rounded-[7px] border border-[#D7DEE9] bg-white px-3 focus-within:border-[#9CC0FF] focus-within:ring-2 focus-within:ring-[#E6F0FF]">
      <input
        aria-label={label}
        className="min-w-0 flex-1 bg-transparent text-sm text-[#263246] outline-none placeholder:text-[#B0BACB]"
        min="0"
        onChange={(event) => onChange(event.target.value)}
        placeholder="不限"
        step="0.1"
        type="number"
        value={value}
      />
      <span className="ml-1 shrink-0 text-xs text-[#8A98B3]">小时</span>
    </label>
  );
}
