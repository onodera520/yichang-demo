import assert from 'node:assert/strict';
import {
  filterDashboardMessages,
  formatNotificationBadgeCount,
  getDashboardTodoGroups,
  getNotificationPreview,
  getUnreadMessageCount,
  getVisibleSystemMessages,
  mergeReadMessageIds,
} from './dashboardInbox.js';
import { systemMessages } from '../data/mockData.js';

const anchorMs = 1_000_000;
const nowMs = anchorMs + 5_000;
const tasks = [
  {
    id: 'overdue-today',
    status: '处理中',
    remainingSLA: '00:00:04',
    deadline: '今天 18:00',
  },
  {
    id: 'pending-confirmation',
    status: '待确认',
    remainingSLA: '05:00:00',
    deadline: '明天 10:00',
  },
  {
    id: 'due-today',
    status: '待分派',
    remainingSLA: '08:00:00',
    deadline: '今天 14:30',
  },
  {
    id: 'completed-today',
    status: '已完成',
    remainingSLA: '-',
    deadline: '今天 12:00',
  },
  {
    id: 'explicit-overdue',
    status: '已超时',
    remainingSLA: '00:20:00',
    deadline: '昨天 18:00',
  },
];

const groups = getDashboardTodoGroups(tasks, nowMs, anchorMs);
assert.deepEqual(groups.overdue.map((task) => task.id), ['overdue-today', 'explicit-overdue']);
assert.deepEqual(groups.pendingConfirmation.map((task) => task.id), ['pending-confirmation']);
assert.deepEqual(groups.dueToday.map((task) => task.id), ['overdue-today', 'due-today']);
assert.deepEqual(
  groups.all.map((task) => task.id),
  ['overdue-today', 'explicit-overdue', 'pending-confirmation', 'due-today'],
);
assert.equal(groups.all.filter((task) => task.id === 'overdue-today').length, 1);

const messages = [
  { id: 'message-1' },
  { id: 'message-2' },
  { id: 'message-3' },
];
assert.deepEqual(
  filterDashboardMessages(messages, new Set(['message-2']), 'unread').map((message) => message.id),
  ['message-1', 'message-3'],
);
assert.deepEqual(
  mergeReadMessageIds(new Set(['message-1']), ['message-1', 'message-2']),
  new Set(['message-1', 'message-2']),
);

const platformMessage = { id: 'msg-platform-ebay' };
const ordinaryMessage = { id: 'message-ordinary' };

assert.deepEqual(
  getVisibleSystemMessages(
    [platformMessage, ordinaryMessage],
    [{ platform: 'eBay', isStale: true }],
  ),
  [platformMessage, ordinaryMessage],
);
assert.deepEqual(
  getVisibleSystemMessages(
    [platformMessage, ordinaryMessage],
    [{ platform: 'eBay', isStale: false }],
  ),
  [ordinaryMessage],
);
assert.deepEqual(
  getNotificationPreview(
    Array.from({ length: 7 }, (_, index) => ({ id: `message-${index + 1}` })),
  ).map((message) => message.id),
  ['message-1', 'message-2', 'message-3', 'message-4', 'message-5'],
);
assert.equal(
  getUnreadMessageCount(
    [{ id: 'message-1' }, { id: 'message-2' }, { id: 'message-3' }],
    new Set(['message-2']),
  ),
  2,
);
assert.equal(formatNotificationBadgeCount(0), '0');
assert.equal(formatNotificationBadgeCount(7), '7');
assert.equal(formatNotificationBadgeCount(99), '99');
assert.equal(formatNotificationBadgeCount(100), '99+');

assert.equal(systemMessages.length, 12);
assert.equal(systemMessages.every((message) => message.detail && message.category), true);
assert.deepEqual(
  systemMessages.find((message) => message.id === 'msg-002')?.target,
  { route: '/orders', state: { openOrderId: 'order-001' } },
);
assert.deepEqual(
  systemMessages.find((message) => message.id === 'msg-003')?.target,
  { route: '/inventory', state: { openSku: 'ELE-HEAD-01' } },
);

console.log('dashboard inbox tests passed');
