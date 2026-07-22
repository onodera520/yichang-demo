import { calculateMemberWorkloads, calculateTaskWeight } from './taskWorkload.js';

export const MAX_ASSIGNMENT_LOAD_PERCENT = 130;

export function shouldOpenAssigneeMenuUpward(
  triggerRect,
  viewportHeight,
  menuHeight = 286,
  viewportPadding = 12,
) {
  const availableBelow = viewportHeight - triggerRect.bottom - viewportPadding;
  const availableAbove = triggerRect.top - viewportPadding;
  return availableBelow < menuHeight && availableAbove > availableBelow;
}

function getStatusLabel(member) {
  if (member.availability === '不可用') return '不可用';
  if (member.level === 'overloaded') return '过载';
  if (member.level === 'busy' || member.availability === '忙碌') return '忙碌';
  return '可接单';
}

export function buildAssigneeWorkloadOptions(
  source,
  tasks,
  members,
  nowMs = Date.now(),
  anchorMs = nowMs,
) {
  const sourceWeight = calculateTaskWeight(source, nowMs, anchorMs);

  return calculateMemberWorkloads(tasks, members, nowMs, anchorMs).map((member) => {
    const projectedWeightedLoad = member.weightedLoad + sourceWeight;
    const projectedLoadPercent = member.capacity > 0
      ? Math.round((projectedWeightedLoad / member.capacity) * 100)
      : 100;
    const disabled = member.availability === '不可用'
      || member.capacity <= 0
      || projectedLoadPercent > MAX_ASSIGNMENT_LOAD_PERCENT;
    const blockReason = member.availability === '不可用'
      ? '当前不可用'
      : member.capacity <= 0
        ? '暂无可用容量'
        : projectedLoadPercent > MAX_ASSIGNMENT_LOAD_PERCENT
          ? `分派后预计负载 ${projectedLoadPercent}%，超过 ${MAX_ASSIGNMENT_LOAD_PERCENT}% 上限`
          : '';

    return {
      ...member,
      currentLoadPercent: member.loadPercent,
      projectedLoadPercent,
      disabled,
      blockReason,
      statusLabel: getStatusLabel(member),
    };
  });
}
