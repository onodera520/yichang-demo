import React from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';

function LoadChange({ before, after }) {
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-[#263246]">
      {before}%
      <ArrowRight className="h-3.5 w-3.5 text-[#8A98B3]" />
      <span className={after >= 85 ? 'text-[#FF4D4F]' : 'text-[#2F7BFF]'}>{after}%</span>
    </span>
  );
}

export default function TaskTransferDialog({
  open,
  task,
  selectedCount = 1,
  owner,
  members = [],
  recommendations = [],
  preview,
  onOwnerChange,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const availableMembers = members.filter((member) => member.availability !== '不可用');
  const isSameOwner = selectedCount === 1 && owner === task?.owner;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/25 px-4" role="presentation">
      <section
        aria-labelledby="task-transfer-title"
        aria-modal="true"
        className="w-[460px] max-w-full rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]"
        role="dialog"
      >
        <div className="flex items-center justify-between">
          <h2 id="task-transfer-title" className="text-[18px] font-semibold text-[#111827]">转交任务</h2>
          <button aria-label="关闭" className="rounded p-1 text-[#8A98B3] hover:bg-[#F5F7FB]" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 rounded-[8px] bg-[#F5F7FB] px-3 py-2 text-sm text-[#5F6B7A]">
          {selectedCount > 1 ? `已选择 ${selectedCount} 条任务` : task?.title}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#263246]">
            <Sparkles className="h-4 w-4 text-[#2F7BFF]" />
            系统推荐
          </div>
          {recommendations.length ? (
            <div className="grid gap-2">
              {recommendations.map((recommendation) => (
                <button
                  key={recommendation.name}
                  className={`flex items-center justify-between rounded-[8px] border px-3 py-2.5 text-left transition-colors ${owner === recommendation.name ? 'border-[#2F7BFF] bg-[#EEF5FF]' : 'border-[#E3E9F3] hover:border-[#AFCBFF]'}`}
                  onClick={() => onOwnerChange(recommendation.name)}
                  type="button"
                >
                  <span className="min-w-0 pr-3">
                    <span className="block text-sm font-semibold text-[#263246]">{recommendation.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#7889A8]">{recommendation.reason}</span>
                  </span>
                  <LoadChange before={recommendation.currentLoadPercent} after={recommendation.projectedLoadPercent} />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-dashed border-[#D7DEE9] px-3 py-3 text-xs text-[#8A98B3]">暂无满足容量条件的推荐人选，可从下方手动选择。</div>
          )}
        </div>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-[#7889A8]">选择负责人</span>
          <select
            className="h-10 w-full rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm font-medium text-[#263246] outline-none focus:border-[#2F7BFF]"
            onChange={(event) => onOwnerChange(event.target.value)}
            value={owner}
          >
            <option value="">请选择负责人</option>
            {availableMembers.map((member) => (
              <option key={member.name} value={member.name}>{member.name} · {member.availability}</option>
            ))}
          </select>
        </label>

        {preview ? (
          <div className="mt-4 rounded-[8px] border border-[#DCE8FF] bg-[#F7FAFF] px-3 py-3">
            <div className="mb-2 text-xs font-semibold text-[#2F7BFF]">转交后</div>
            <div className="grid grid-cols-2 gap-3 text-xs text-[#7889A8]">
              {preview.fromBefore == null ? (
                <div><span className="block">原负责人</span><strong className="mt-1 block text-[#263246]">多个负责人</strong></div>
              ) : (
                <div><span className="block">{preview.fromOwner}</span><span className="mt-1 block"><LoadChange before={preview.fromBefore} after={preview.fromAfter} /></span></div>
              )}
              <div><span className="block">{preview.toOwner}</span><span className="mt-1 block"><LoadChange before={preview.toBefore} after={preview.toAfter} /></span></div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="h-9 rounded-[6px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button>
          <button
            className="h-9 rounded-[6px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#AFCBFF]"
            disabled={!owner || isSameOwner}
            onClick={onConfirm}
            type="button"
          >
            确认转交
          </button>
        </div>
      </section>
    </div>
  );
}
