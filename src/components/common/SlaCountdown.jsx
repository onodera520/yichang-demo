import React from 'react';
import {
  formatSlaSeconds,
  getRemainingSlaSeconds,
  isSlaOverdue,
  isSlaUrgent,
} from '../../utils/sla.js';

export default function SlaCountdown({
  value,
  nowMs,
  anchorMs,
  className = '',
  normalClassName = 'text-[#1D273B]',
  urgentClassName = 'text-[#FF1F1F]',
  mutedClassName = 'text-[#5F6B7A]',
  showOverdueLabel = true,
}) {
  const remainingSeconds = getRemainingSlaSeconds(value, nowMs, anchorMs);

  if (remainingSeconds == null) {
    return <span className={`${mutedClassName} ${className}`.trim()}>-</span>;
  }

  const overdue = isSlaOverdue(remainingSeconds);
  const urgent = overdue || isSlaUrgent(remainingSeconds);
  const toneClassName = urgent ? urgentClassName : normalClassName;

  return (
    <span className={`${toneClassName} ${className}`.trim()}>
      {formatSlaSeconds(remainingSeconds)}
      {overdue && showOverdueLabel ? <span className="ml-1 font-semibold">已超时</span> : null}
    </span>
  );
}
