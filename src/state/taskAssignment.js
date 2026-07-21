export const UNASSIGNED_TASK_OWNER = '未分派';

export function hasAssignedTaskOwner(owner) {
  return Boolean(owner && owner !== UNASSIGNED_TASK_OWNER);
}

export function getTaskInitialStatus(owner) {
  return hasAssignedTaskOwner(owner) ? '已分派' : '待分派';
}

export function getTaskTransitionBlockReason(task, action) {
  if (!['complete', 'upgrade'].includes(action)) return null;
  return hasAssignedTaskOwner(task?.owner) ? null : '请先分派负责人';
}
