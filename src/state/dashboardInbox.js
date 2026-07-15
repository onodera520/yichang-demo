import { getTaskSlaPresentation } from './taskSla.js';

function isCompletedTask(task) {
  return task.status === '已完成';
}

function isDueToday(task) {
  return typeof task.deadline === 'string' && task.deadline.includes('今天');
}

function uniqueTasks(groups) {
  const seen = new Set();
  return groups.flat().filter((task) => {
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}

export function getDashboardTodoGroups(tasks, nowMs = Date.now(), anchorMs = nowMs) {
  const activeTasks = tasks.filter((task) => !isCompletedTask(task));
  const overdue = activeTasks.filter(
    (task) => task.status === '已超时' || getTaskSlaPresentation(task, nowMs, anchorMs).state === 'overdue',
  );
  const pendingConfirmation = activeTasks.filter((task) => task.status === '待确认');
  const dueToday = activeTasks.filter(isDueToday);

  return {
    all: uniqueTasks([overdue, pendingConfirmation, dueToday]),
    overdue,
    pendingConfirmation,
    dueToday,
  };
}

export function filterDashboardMessages(messages, readMessageIds, filter = 'all') {
  if (filter !== 'unread') return messages;
  const readIds = readMessageIds instanceof Set ? readMessageIds : new Set(readMessageIds);
  return messages.filter((message) => !readIds.has(message.id));
}

export function mergeReadMessageIds(currentIds, messageIds) {
  return new Set([...(currentIds ?? []), ...(messageIds ?? [])]);
}
