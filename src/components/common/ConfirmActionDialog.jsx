import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmActionDialog({
  open,
  title = '确认操作',
  description,
  warnings = [],
  confirmLabel = '确认继续',
  onCancel,
  onConfirm,
}) {
  const confirmButtonRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => confirmButtonRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancelRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/25 px-4" role="presentation">
      <div className="w-full max-w-[420px] rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]" role="dialog" aria-modal="true" aria-labelledby="confirm-action-title">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#FFF4E5] text-[#F79009]">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h2 id="confirm-action-title" className="text-lg font-semibold text-[#111827]">{title}</h2>
          </div>
          <button className="p-1 text-[#8A98B3]" onClick={onCancel} type="button" aria-label="关闭确认框"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#5F6B7A]">{description}</p>
        {warnings.length ? (
          <div className="mt-3 rounded-[8px] bg-[#FFF8EC] px-3 py-2.5 text-xs leading-5 text-[#8A5300]">
            {warnings.map((warning) => <div key={warning}>• {warning}</div>)}
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onCancel} type="button">取消</button>
          <button ref={confirmButtonRef} className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white" onClick={onConfirm} type="button">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
