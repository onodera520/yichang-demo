import React from 'react';
import { AlertCircle, CheckCircle2, Database } from 'lucide-react';
import { getVisibleAiRisks } from '../../state/trustLayer.js';

export default function AiEvidencePanel({ evidence, connection, className = '' }) {
  if (!evidence) return null;
  const visibleRisks = getVisibleAiRisks(evidence, connection);

  return (
    <section className={`rounded-[10px] border border-[#DDE7F5] bg-[#F8FAFE] p-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D273B]">
          <Database className="h-4 w-4 text-[#2F7BFF]" />
          AI 判断依据
        </div>
        <span className="whitespace-nowrap text-[11px] text-[#8A98B3]">数据更新：{evidence.updatedAt}</span>
      </div>
      <div className="mt-3 space-y-2">
        {evidence.evidence?.map((item) => (
          <div key={item} className="flex items-start gap-2 text-xs leading-5 text-[#344767]">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#20A36A]" />
            <span>{item}</span>
          </div>
        ))}
      </div>
      {visibleRisks.length ? (
        <div className="mt-3 border-t border-[#E1E8F3] pt-2.5">
          <div className="mb-1.5 text-xs font-semibold text-[#8A5300]">执行风险</div>
          {visibleRisks.map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs leading-5 text-[#7A5A21]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F79009]" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
