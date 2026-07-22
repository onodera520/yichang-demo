import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function TaskAcceptanceDialog({ checks = [], onClose, onSubmit, open, task }) {
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState('');
  const onCloseRef = useRef(onClose);
  const previousActiveElementRef = useRef(null);
  const allPassed = checks.length > 0 && checks.every((check) => check.passed);
  const evidence = task?.completionEvidence;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    previousActiveElementRef.current = document.activeElement;
    setConfirmed(false);
    setNote('');
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [open, task?.id]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    if (!allPassed || !confirmed) return;
    onSubmit({ confirmed: true, note });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/25 px-4">
      <form
        aria-labelledby="task-acceptance-title"
        aria-modal="true"
        className="w-full max-w-[520px] rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        onSubmit={submit}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="task-acceptance-title" className="text-lg font-semibold text-[#111827]">任务验收</h2>
            <p className="mt-1 text-sm text-[#7889A8]">{task?.title}</p>
          </div>
          <button aria-label="关闭任务验收弹窗" className="p-1 text-[#8A98B3]" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="mt-4 border-y border-[#E6EAF2] py-3">
          <div className="flex items-center justify-between gap-3 text-xs text-[#7889A8]">
            <span>员工提交：{evidence?.submittedBy || task?.owner || '-'}</span>
            <span>{evidence?.submittedAt || '-'}</span>
          </div>
          <div className="mt-2 text-sm font-semibold text-[#263246]">{evidence?.result || '暂无处理结果'}</div>
          <p className="mt-1 text-sm leading-6 text-[#5F6B7A]">{evidence?.description || '暂无执行说明'}</p>
        </section>

        <section className="mt-4" aria-labelledby="acceptance-checks-title">
          <h3 id="acceptance-checks-title" className="text-sm font-semibold text-[#263246]">系统验收检查</h3>
          <div className="mt-2 space-y-2">
            {checks.map((check) => (
              <div key={check.key} className="flex items-center gap-2 text-sm">
                {check.passed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16A66A]" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#FF3B30]" />
                )}
                <span className={check.passed ? 'text-[#344767]' : 'text-[#D92D20]'}>{check.label}</span>
              </div>
            ))}
          </div>
        </section>

        <label className="mt-4 block text-sm font-medium text-[#5F6B7A]" htmlFor="acceptance-note">验收备注</label>
        <textarea
          id="acceptance-note"
          className="mt-1.5 h-20 w-full resize-none rounded-[7px] border border-[#D7DEE9] px-3 py-2 text-sm text-[#344767] outline-none focus:border-[#2F7BFF] focus:ring-2 focus:ring-[#DCE9FF]"
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          placeholder="选填，记录验收判断或后续关注事项"
          value={note}
        />

        <label className="mt-4 flex items-start gap-2 text-sm text-[#344767]">
          <input
            checked={confirmed}
            className="mt-0.5 h-4 w-4 accent-[#2F7BFF]"
            onChange={(event) => setConfirmed(event.target.checked)}
            type="checkbox"
          />
          <span>已核对员工处理结果和凭证，确认原异常已经解决</span>
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button>
          <button
            className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#AFCBFF]"
            disabled={!allPassed || !confirmed}
            type="submit"
          >
            验收通过
          </button>
        </div>
      </form>
    </div>
  );
}
