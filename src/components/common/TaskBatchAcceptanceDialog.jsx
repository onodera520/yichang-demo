import React, { useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, ClipboardCheck, X } from 'lucide-react';

export default function TaskBatchAcceptanceDialog({
  eligibleTasks = [],
  onClose,
  onConfirm,
  open,
  selectedCount = 0,
  skippedTasks = [],
}) {
  const confirmButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = window.setTimeout(() => confirmButtonRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
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
      <div
        aria-labelledby="task-batch-acceptance-title"
        aria-modal="true"
        className="w-full max-w-[520px] rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF2FF] text-[#2F7BFF]">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 id="task-batch-acceptance-title" className="text-lg font-semibold text-[#111827]">批量验收任务</h2>
              <p className="mt-0.5 text-xs text-[#7889A8]">系统将通过合格项，并跳过暂不符合条件的任务</p>
            </div>
          </div>
          <button aria-label="关闭批量验收弹窗" className="p-1 text-[#8A98B3]" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 divide-x divide-[#E6EAF2] rounded-[8px] border border-[#E6EAF2] bg-[#F8FAFD] py-3 text-center">
          <div>
            <div className="text-xs text-[#7889A8]">已选择</div>
            <div className="mt-1 text-xl font-semibold text-[#263246]">{selectedCount}</div>
          </div>
          <div>
            <div className="text-xs text-[#7889A8]">可验收</div>
            <div className="mt-1 text-xl font-semibold text-[#16A66A]">{eligibleTasks.length}</div>
          </div>
          <div>
            <div className="text-xs text-[#7889A8]">将跳过</div>
            <div className="mt-1 text-xl font-semibold text-[#F79009]">{skippedTasks.length}</div>
          </div>
        </div>

        {skippedTasks.length ? (
          <section className="mt-4" aria-labelledby="batch-skipped-title">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#344767]">
              <AlertCircle className="h-4 w-4 text-[#F79009]" />
              <h3 id="batch-skipped-title">暂不可验收</h3>
            </div>
            <div className="mt-2 max-h-40 overflow-y-auto border-y border-[#E6EAF2]">
              {skippedTasks.map((task) => (
                <div className="flex items-start justify-between gap-4 border-b border-[#EEF2F7] py-2.5 last:border-b-0" key={task.id}>
                  <span className="min-w-0 truncate text-sm font-medium text-[#263246]">{task.title}</span>
                  <span className="max-w-[245px] text-right text-xs leading-5 text-[#D46B08]">{task.reason}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#16835B]">
            <CheckCircle2 className="h-4 w-4" />
            所选任务均已通过系统验收检查
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button>
          <button
            className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#AFCBFF]"
            disabled={eligibleTasks.length === 0}
            onClick={onConfirm}
            ref={confirmButtonRef}
            type="button"
          >
            确认通过 {eligibleTasks.length} 条
          </button>
        </div>
      </div>
    </div>
  );
}
