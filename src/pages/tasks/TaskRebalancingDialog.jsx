import React from 'react';
import { ArrowRight, Trash2, X } from 'lucide-react';

const levelStyles = {
  overloaded: 'bg-[#FFF0F0] text-[#FF3B30]',
  busy: 'bg-[#FFF5E8] text-[#E87900]',
  available: 'bg-[#EAF8F0] text-[#12A66A]',
};

const levelLabels = {
  overloaded: '过载',
  busy: '忙碌',
  available: '可接单',
};

export default function TaskRebalancingDialog({
  open,
  plan,
  onRemoveMove,
  onClose,
  onConfirm,
}) {
  if (!open) return null;
  const visibleMoves = plan.moves.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#111827]/25 px-4" role="presentation">
      <section aria-labelledby="task-rebalancing-title" aria-modal="true" className="w-full max-w-[760px] rounded-[12px] border border-[#E3E9F3] bg-white shadow-[0_20px_60px_rgba(16,24,40,0.22)]" role="dialog">
        <header className="flex items-center justify-between border-b border-[#E8EDF5] px-5 py-4">
          <div>
            <h2 id="task-rebalancing-title" className="text-[18px] font-semibold text-[#111827]">任务负载优化</h2>
            <p className="mt-1 text-xs text-[#7889A8]">系统根据任务紧迫度、成员容量与擅长领域生成建议，执行前可调整。</p>
          </div>
          <button aria-label="关闭" className="rounded p-1 text-[#8A98B3] hover:bg-[#F5F7FB]" onClick={onClose} type="button"><X className="h-4 w-4" /></button>
        </header>

        <div className="max-h-[620px] overflow-y-auto px-5 py-4">
          <div className="mb-4 grid grid-cols-4 gap-2">
            {plan.beforeWorkloads.map((member) => (
              <div key={member.name} className="rounded-[8px] border border-[#E8EDF5] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#263246]">{member.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${member.availability === '不可用' ? 'bg-[#EEF1F6] text-[#8A98B3]' : levelStyles[member.level]}`}>
                    {member.availability === '不可用' ? '不可用' : levelLabels[member.level]}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between text-xs text-[#7889A8]"><span>{member.active} 项任务</span><strong className={member.loadPercent >= 85 ? 'text-[#FF3B30]' : 'text-[#263246]'}>{member.loadPercent}%</strong></div>
              </div>
            ))}
          </div>

          {visibleMoves.length ? (
            <div>
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_96px_96px_36px] gap-3 px-3 text-xs text-[#8A98B3]"><span>调度建议</span><span>调整前</span><span>调整后</span><span /></div>
              <div className="divide-y divide-[#E8EDF5] border-y border-[#E8EDF5]">
                {visibleMoves.map((move) => (
                  <div key={move.taskId} className="grid grid-cols-[minmax(0,1fr)_96px_96px_36px] items-center gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#263246]">{move.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#7889A8]">{move.fromOwner}<ArrowRight className="h-3.5 w-3.5" />{move.toOwner}</div>
                      <div className="mt-1 truncate text-xs text-[#8A98B3]">{move.reason}</div>
                    </div>
                    <span className="text-sm text-[#5F6B7A]">{move.before.from}% / {move.before.to}%</span>
                    <span className="text-sm font-semibold text-[#2F7BFF]">{move.after.from}% / {move.after.to}%</span>
                    <button aria-label={`移除 ${move.title}`} className="flex h-8 w-8 items-center justify-center rounded text-[#8A98B3] hover:bg-[#FFF0F0] hover:text-[#FF3B30]" onClick={() => onRemoveMove(move.taskId)} type="button"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center"><p className="text-sm font-semibold text-[#5F6B7A]">暂无安全的调度建议</p><p className="mt-1 text-xs text-[#8A98B3]">当前没有可在容量范围内转交的任务。</p></div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[#E8EDF5] px-5 py-4">
          <span className="text-xs text-[#7889A8]">本次最多调整 5 条任务，仅变更负责人。</span>
          <div className="flex gap-2"><button className="h-9 rounded-[6px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button><button className="h-9 rounded-[6px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#AFCBFF]" disabled={!visibleMoves.length} onClick={onConfirm} type="button">确认执行</button></div>
        </footer>
      </section>
    </div>
  );
}
