import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const initialForm = {
  title: '',
  source: '',
  sourceType: '来源订单',
  riskLevel: '中',
  owner: '王敏',
  deadline: '今天 18:00',
  description: '',
};

const sourceTypes = ['来源订单', '库存风险', '物流异常', '平台同步', '售后异常'];
const riskLevels = ['高', '中', '低'];
const owners = ['王敏', '赵宁', '陈浩', '刘畅', '周扬', '张磊', '李娜'];
const deadlines = ['今天 14:30', '今天 18:00', '明天 10:00', '24小时内'];

export default function TaskCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    setForm(initialForm);
    setErrors({});
    const focusTimer = window.setTimeout(() => titleRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab') return;
      const focusable = formRef.current?.querySelectorAll('button, input, select, textarea');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {
      ...(form.title.trim() ? {} : { title: '请填写任务标题' }),
      ...(form.source.trim() ? {} : { source: '请填写来源编号' }),
      ...(form.description.trim() ? {} : { description: '请填写任务描述' }),
    };
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ ...form, title: form.title.trim(), source: form.source.trim(), description: form.description.trim() });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/25 px-4">
      <form
        ref={formRef}
        aria-labelledby="task-create-title"
        aria-modal="true"
        className="max-h-[86vh] w-full max-w-[560px] overflow-auto rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        onSubmit={submit}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="task-create-title" className="text-lg font-semibold text-[#111827]">新建任务</h2>
            <p className="mt-1 text-sm text-[#7889A8]">创建后将自动进入任务列表</p>
          </div>
          <button aria-label="关闭新建任务弹窗" className="p-1 text-[#8A98B3]" onClick={onClose} type="button"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <Field id="task-title" label="任务标题" error={errors.title} className="col-span-2">
            <input id="task-title" ref={titleRef} value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="请输入任务标题" />
          </Field>
          <Field id="task-source" label="来源编号" error={errors.source}>
            <input id="task-source" value={form.source} onChange={(event) => update('source', event.target.value)} placeholder="订单号或 SKU" />
          </Field>
          <Field id="task-source-type" label="来源类型">
            <select id="task-source-type" value={form.sourceType} onChange={(event) => update('sourceType', event.target.value)}>{sourceTypes.map((item) => <option key={item}>{item}</option>)}</select>
          </Field>
          <Field id="task-risk" label="风险等级">
            <select id="task-risk" value={form.riskLevel} onChange={(event) => update('riskLevel', event.target.value)}>{riskLevels.map((item) => <option key={item}>{item}</option>)}</select>
          </Field>
          <Field id="task-owner" label="负责人">
            <select id="task-owner" value={form.owner} onChange={(event) => update('owner', event.target.value)}>{owners.map((item) => <option key={item}>{item}</option>)}</select>
          </Field>
          <Field id="task-deadline" label="截止时间" className="col-span-2">
            <select id="task-deadline" value={form.deadline} onChange={(event) => update('deadline', event.target.value)}>{deadlines.map((item) => <option key={item}>{item}</option>)}</select>
          </Field>
          <Field id="task-description" label="任务描述" error={errors.description} className="col-span-2">
            <textarea id="task-description" className="h-24 resize-none py-2" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="填写任务背景、处理目标和注意事项" />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[7px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button>
          <button className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white" type="submit">创建任务</button>
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
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-[#5F6B7A]" htmlFor={id}>{label}</label>
      <div className="[&_input]:h-10 [&_input]:w-full [&_input]:rounded-[7px] [&_input]:border [&_input]:border-[#D7DEE9] [&_input]:px-3 [&_input]:text-sm [&_select]:h-10 [&_select]:w-full [&_select]:rounded-[7px] [&_select]:border [&_select]:border-[#D7DEE9] [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_textarea]:w-full [&_textarea]:rounded-[7px] [&_textarea]:border [&_textarea]:border-[#D7DEE9] [&_textarea]:px-3 [&_textarea]:text-sm [&_input]:outline-none [&_select]:outline-none [&_textarea]:outline-none focus-within:[&_input]:border-[#2F7BFF] focus-within:[&_select]:border-[#2F7BFF] focus-within:[&_textarea]:border-[#2F7BFF]">{control}</div>
      {error ? <span id={errorId} className="mt-1 block text-xs text-[#D92D20]">{error}</span> : null}
    </div>
  );
}
