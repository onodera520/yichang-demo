import { getTaskSlaPresentation } from './taskSla.js';

const STALE_PLATFORM_MESSAGE_ID = 'msg-platform-ebay';

function toReadIdSet(readMessageIds) {
  return readMessageIds instanceof Set
    ? readMessageIds
    : new Set(readMessageIds ?? []);
}

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
  const readIds = toReadIdSet(readMessageIds);
  return messages.filter((message) => !readIds.has(message.id));
}

export function getVisibleSystemMessages(messages, platformConnections) {
  const ebayConnectionIsStale = (platformConnections ?? []).some(
    (connection) => connection.platform === 'eBay' && connection.isStale,
  );

  return ebayConnectionIsStale
    ? messages
    : messages.filter((message) => message.id !== STALE_PLATFORM_MESSAGE_ID);
}

export function getNotificationPreview(messages, limit = 5) {
  return messages.slice(0, Math.max(0, limit));
}

export function getUnreadMessageCount(messages, readMessageIds) {
  const readIds = toReadIdSet(readMessageIds);
  return messages.reduce(
    (count, message) => count + (readIds.has(message.id) ? 0 : 1),
    0,
  );
}

export function formatNotificationBadgeCount(count) {
  return count > 99 ? '99+' : String(Math.max(0, count));
}

export function mergeReadMessageIds(currentIds, messageIds) {
  return new Set([...(currentIds ?? []), ...(messageIds ?? [])]);
}
