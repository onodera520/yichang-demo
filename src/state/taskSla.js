import { formatSlaSeconds, parseSlaToSeconds } from '../utils/sla.js';

function getElapsedSeconds(nowMs, anchorMs) {
  return Math.max(0, Math.floor((nowMs - anchorMs) / 1000));
}

export function getTaskSlaPresentation(task, nowMs, anchorMs) {
  if (task.status === '已完成' || task.remainingSLA === '-') {
    return { state: 'completed', seconds: null, label: '-' };
  }

  const elapsedSeconds = getElapsedSeconds(nowMs, anchorMs);

  if (task.status === '已超时') {
    const initialOverdueSeconds = parseSlaToSeconds(task.overdueDuration ?? task.remainingSLA) ?? 0;
    const seconds = initialOverdueSeconds + elapsedSeconds;
    return { state: 'overdue', seconds, label: `超时 ${formatSlaSeconds(seconds)}` };
  }

  const initialRemainingSeconds = parseSlaToSeconds(task.remainingSLA);
  if (initialRemainingSeconds == null) {
    return { state: 'completed', seconds: null, label: '-' };
  }

  const remainingSeconds = initialRemainingSeconds - elapsedSeconds;
  if (remainingSeconds > 0) {
    return {
      state: 'remaining',
      seconds: remainingSeconds,
      label: `剩余 ${formatSlaSeconds(remainingSeconds)}`,
    };
  }

  const overdueSeconds = Math.abs(remainingSeconds);
  return {
    state: 'overdue',
    seconds: overdueSeconds,
    label: `超时 ${formatSlaSeconds(overdueSeconds)}`,
  };
}

export function isTaskSlaOverdue(task, nowMs, anchorMs) {
  return getTaskSlaPresentation(task, nowMs, anchorMs).state === 'overdue';
}
