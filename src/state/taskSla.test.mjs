import assert from 'node:assert/strict';
import { getTaskSlaPresentation } from './taskSla.js';

assert.deepEqual(
  getTaskSlaPresentation(
    { status: '处理中', remainingSLA: '02:00:00' },
    30 * 60 * 1000,
    0,
  ),
  { state: 'remaining', seconds: 5400, label: '剩余 01:30:00' },
  'an active task before its deadline should count down',
);

assert.deepEqual(
  getTaskSlaPresentation(
    { status: '处理中', remainingSLA: '00:30:00' },
    45 * 60 * 1000,
    0,
  ),
  { state: 'overdue', seconds: 900, label: '超时 00:15:00' },
  'an active task should count up after its SLA expires',
);

assert.deepEqual(
  getTaskSlaPresentation(
    { status: '已超时', remainingSLA: '12:32:12', overdueDuration: '12:32:12' },
    1000,
    0,
  ),
  { state: 'overdue', seconds: 45133, label: '超时 12:32:13' },
  'a legacy overdue task should treat its duration as elapsed overdue time',
);

assert.deepEqual(
  getTaskSlaPresentation(
    { status: '已完成', remainingSLA: '-' },
    1000,
    0,
  ),
  { state: 'completed', seconds: null, label: '-' },
  'a completed task should not expose SLA time',
);

console.log('task SLA presentation tests passed');
