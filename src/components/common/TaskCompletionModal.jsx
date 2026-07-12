import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { applyCompletionTemplate, getCompletionTemplates } from '../../state/completionTemplates.js';
import { validateCompletionEvidence } from '../../state/trustLayer.js';

const initialForm = { result: '', description: '', resolvedSource: '', referenceNo: '', quantity: '', cost: '', attachment: null };

export default function TaskCompletionModal({ open, task, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const formRef = useRef(null);
  const previousActiveElementRef = useRef(null);
  const resultInputRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const completionTemplates = useMemo(() => getCompletionTemplates(task), [task]);

  useEffect(() => {
    if (!open) return;
    previousActiveElementRef.current = document.activeElement;
    setForm(initialForm);
    setErrors({});
    setSelectedTemplateId(null);
    const focusTimer = window.setTimeout(() => resultInputRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const focusableElements = formRef.current?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [open, task?.id]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const selectTemplate = (completionTemplate) => {
    setForm((current) => applyCompletionTemplate(current, completionTemplate));
    setSelectedTemplateId(completionTemplate.id);
    setErrors((current) => ({
      ...current,
      result: undefined,
      description: undefined,
      resolvedSource: undefined,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    const evidence = {
      ...form,
      ...(form.resolvedSource === '' ? {} : { resolvedSource: form.resolvedSource === 'yes' }),
    };
    delete evidence.resolvedSource;
    if (form.resolvedSource !== '') evidence.resolvedSource = form.resolvedSource === 'yes';
    const nextErrors = validateCompletionEvidence(evidence);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit(evidence);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/25 px-4">
      <form
        ref={formRef}
        aria-labelledby="task-completion-title"
        aria-modal="true"
        className="max-h-[86vh] w-full max-w-[560px] overflow-auto rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        onSubmit={submit}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="task-completion-title" className="text-lg font-semibold text-[#111827]">完成任务</h2><p className="mt-1 text-sm text-[#7889A8]">{task?.title}</p></div>
          <button className="p-1 text-[#8A98B3]" onClick={onClose} type="button" aria-label="关闭完成任务弹窗"><X className="h-4 w-4" /></button>
        </div>
        <section className="mt-4" aria-labelledby="quick-completion-title">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 id="quick-completion-title" className="text-sm font-medium text-[#5F6B7A]">快捷处理</h3>
            <span className="text-xs text-[#8A98B3]">一键填充，可继续修改</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {completionTemplates.map((completionTemplate) => {
              const selected = selectedTemplateId === completionTemplate.id;
              return (
                <button
                  key={completionTemplate.id}
                  aria-pressed={selected}
                  className={`min-h-10 min-w-[150px] flex-1 rounded-[7px] border px-3 py-2 text-xs font-medium transition ${
                    selected
                      ? 'border-[#2F7BFF] bg-[#EAF2FF] text-[#2F7BFF] shadow-[inset_0_0_0_1px_rgba(47,123,255,0.08)]'
                      : 'border-[#D7DEE9] bg-white text-[#344767] hover:border-[#9CC0FF] hover:bg-[#F7FAFF]'
                  }`}
                  onClick={() => selectTemplate(completionTemplate)}
                  type="button"
                >
                  {completionTemplate.label}
                </button>
              );
            })}
          </div>
        </section>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Field id="completion-result" label="处理结果" error={errors.result} className="col-span-2">
            <input id="completion-result" ref={resultInputRef} value={form.result} onChange={(event) => update('result', event.target.value)} placeholder="例如：已从 NJ 仓重新分配库存" />
          </Field>
          <Field id="completion-description" label="执行说明" error={errors.description} className="col-span-2">
            <textarea id="completion-description" className="h-20 resize-none py-2" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="填写实际执行过程和结果" />
          </Field>
          <fieldset
            aria-describedby={errors.resolvedSource ? 'completion-resolved-source-error' : undefined}
            aria-invalid={errors.resolvedSource ? 'true' : undefined}
            className="col-span-2 block"
          >
            <legend className="mb-1.5 block text-sm font-medium text-[#5F6B7A]">是否解决原异常</legend>
            <div className="flex h-10 items-center gap-5 rounded-[7px] border border-[#D7DEE9] px-3">
              <label className="flex items-center gap-2 text-sm text-[#344767]"><input checked={form.resolvedSource === 'yes'} name="resolved-source" onChange={() => update('resolvedSource', 'yes')} type="radio" />是</label>
              <label className="flex items-center gap-2 text-sm text-[#344767]"><input checked={form.resolvedSource === 'no'} name="resolved-source" onChange={() => update('resolvedSource', 'no')} type="radio" />否</label>
            </div>
            {errors.resolvedSource ? <span id="completion-resolved-source-error" className="mt-1 block text-xs text-[#D92D20]">{errors.resolvedSource}</span> : null}
          </fieldset>
          <Field id="completion-reference" label="关联单号"><input id="completion-reference" value={form.referenceNo} onChange={(event) => update('referenceNo', event.target.value)} placeholder="选填" /></Field>
          <Field id="completion-quantity" label="执行数量"><input id="completion-quantity" inputMode="numeric" value={form.quantity} onChange={(event) => update('quantity', event.target.value)} placeholder="选填" /></Field>
          <Field id="completion-cost" label="实际成本"><input id="completion-cost" inputMode="decimal" value={form.cost} onChange={(event) => update('cost', event.target.value)} placeholder="选填，单位元" /></Field>
          <Field id="completion-attachment" label="附件">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-[7px] border border-[#D7DEE9] px-3 text-sm text-[#5F6B7A] focus-within:border-[#2F7BFF] focus-within:ring-2 focus-within:ring-[#DCE9FF]">
              <Paperclip className="h-4 w-4" /><span className="truncate">{form.attachment?.name || '选择文件'}</span>
              <input id="completion-attachment" className="sr-only" type="file" onChange={(event) => { const file = event.target.files?.[0]; update('attachment', file ? { name: file.name, size: file.size } : null); }} />
            </label>
          </Field>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button>
          <button className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white" type="submit">提交完成</button>
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, error, className = '', children }) {
  const errorId = `${id}-error`;
  const control = React.cloneElement(children, {
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': error ? 'true' : undefined,
  });
  return (
    <div className={`block ${className}`}>
      <label className="mb-1.5 block text-sm font-medium text-[#5F6B7A]" htmlFor={id}>{label}</label>
      <div className="[&_input:not([type=radio])]:h-10 [&_input:not([type=radio])]:w-full [&_input:not([type=radio])]:rounded-[7px] [&_input:not([type=radio])]:border [&_input:not([type=radio])]:border-[#D7DEE9] [&_input:not([type=radio])]:px-3 [&_input:not([type=radio])]:text-sm [&_textarea]:w-full [&_textarea]:rounded-[7px] [&_textarea]:border [&_textarea]:border-[#D7DEE9] [&_textarea]:px-3 [&_textarea]:text-sm [&_input]:outline-none [&_textarea]:outline-none focus-within:[&_input]:border-[#2F7BFF] focus-within:[&_textarea]:border-[#2F7BFF]">{control}</div>
      {error ? <span id={errorId} className="mt-1 block text-xs text-[#D92D20]">{error}</span> : null}
    </div>
  );
}
