import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Undo2, X } from 'lucide-react';
import {
  getTaskReturnReasonOptions,
  validateTaskReturnReason,
  validateTaskReturnRemark,
} from '../../state/taskReturn.js';

export default function TaskReturnDialog({ open, task, action, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [remark, setRemark] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const firstOptionRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    setReason('');
    setRemark('');
    setTouched(false);
    setSubmitting(false);
    const focusTimer = window.setTimeout(() => firstOptionRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [open, task?.id, action?.type]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, submitting]);

  if (!open || !task || !action) return null;

  const reasonOptions = getTaskReturnReasonOptions(action.type);
  const validationError = validateTaskReturnReason(reason, action.type);
  const remarkError = validateTaskReturnRemark(remark);
  const isReopen = action.type === 'reopen';
  const DialogIcon = isReopen ? RotateCcw : Undo2;

  const handleSubmit = async () => {
    setTouched(true);
    if (validationError || remarkError || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ reason: reason.trim(), remark: remark.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#111827]/25 px-4" role="presentation">
      <section
        aria-labelledby="task-return-title"
        aria-modal="true"
        className="max-h-[calc(100vh-32px)] w-full max-w-[460px] overflow-y-auto rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${isReopen ? 'bg-[#FFF4E5] text-[#F79009]' : 'bg-[#EAF2FF] text-[#2F7BFF]'}`}>
              <DialogIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 id="task-return-title" className="text-lg font-semibold text-[#111827]">
                {action.label}任务
              </h2>
              <p className="mt-0.5 truncate text-xs text-[#8A98B3]">{task.title}</p>
            </div>
          </div>
          <button
            aria-label="关闭退回确认框"
            className="rounded-[6px] p-1 text-[#8A98B3] transition-colors hover:bg-[#F4F7FB] hover:text-[#344054]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-4 flex items-center justify-between rounded-[8px] bg-[#F5F7FB] px-4 py-3 text-sm">
          <span className="font-medium text-[#5F6B7A]">{task.status}</span>
          <span className="text-[#A1ADC2]">→</span>
          <span className={`font-semibold ${isReopen ? 'text-[#D97706]' : 'text-[#2F7BFF]'}`}>
            {action.targetStatus}
          </span>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-[#263246]">{action.label}原因</legend>
          <div className="mt-2 grid gap-1.5">
            {reasonOptions.map((option, index) => (
              <label
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[7px] border px-3 py-2 text-sm transition ${reason === option ? 'border-[#2F7BFF] bg-[#F2F7FF] text-[#1E64D5]' : 'border-[#E3E9F3] text-[#344054] hover:border-[#B9C9E1] hover:bg-[#FAFBFD]'}`}
                key={option}
              >
                <input
                  ref={index === 0 ? firstOptionRef : undefined}
                  checked={reason === option}
                  className="h-4 w-4 shrink-0 accent-[#2F7BFF]"
                  name="task-return-reason"
                  onChange={() => {
                    setReason(option);
                    setTouched(true);
                  }}
                  type="radio"
                  value={option}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
          <p id="task-return-error" className="mt-1.5 min-h-4 text-xs text-[#FF4D4F]">
            {touched ? validationError : ''}
          </p>
        </fieldset>

        <label className="mt-2 block" htmlFor="task-return-remark">
          <span className="text-sm font-semibold text-[#263246]">
            备注
            <span className="ml-1 font-normal text-[#A1ADC2]">（选填）</span>
          </span>
          <textarea
            aria-describedby={remarkError ? 'task-return-remark-error' : undefined}
            aria-invalid={Boolean(remarkError)}
            className={`mt-2 block w-full resize-none rounded-[8px] border px-3 py-2 text-sm leading-5 text-[#263246] outline-none transition placeholder:text-[#A1ADC2] focus:border-[#2F7BFF] focus:ring-2 focus:ring-[#2F7BFF]/10 ${remarkError ? 'border-[#FF4D4F]' : 'border-[#D7DEE9]'}`}
            id="task-return-remark"
            maxLength={100}
            onChange={(event) => setRemark(event.target.value)}
            placeholder="可补充说明具体情况"
            rows={2}
            value={remark}
          />
        </label>
        <div className="mt-1.5 flex min-h-4 items-start justify-between text-xs">
          <span id="task-return-remark-error" className="text-[#FF4D4F]">{remarkError || ''}</span>
          <span className="text-[#A1ADC2]">{remark.length}/100</span>
        </div>

        <footer className="mt-4 flex justify-end gap-2">
          <button
            className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            取消
          </button>
          <button
            className={`h-9 rounded-[7px] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${isReopen ? 'bg-[#F79009]' : 'bg-[#2F7BFF]'}`}
            disabled={Boolean(validationError || remarkError) || submitting}
            onClick={handleSubmit}
            type="button"
          >
            {submitting ? '提交中...' : `确认${action.label}`}
          </button>
        </footer>
      </section>
    </div>
  );
}
