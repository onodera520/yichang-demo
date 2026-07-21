import assert from 'node:assert/strict';
import test from 'node:test';

import { tasks } from './mockData.js';

test('mock tasks keep overdue as SLA metadata instead of a workflow status', () => {
  assert.equal(tasks.some((task) => task.status === '已超时'), false);
  assert.equal(tasks.some((task) => task.status !== '已完成' && task.overdueDuration), true);
});
