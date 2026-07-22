import assert from 'node:assert/strict';
import test from 'node:test';

import { tasks } from './mockData.js';

test('mock tasks keep overdue as SLA metadata instead of a workflow status', () => {
  assert.equal(tasks.some((task) => task.status === '已超时'), false);
  assert.equal(tasks.some((task) => task.status !== '已完成' && task.overdueDuration), true);
});

test('mock tasks separate employee submission from supervisor acceptance', () => {
  assert.equal(tasks.some((task) => task.status === '待确认'), false);
  assert.equal(tasks.some((task) => task.status === '待验收'), true);
  assert.equal(
    tasks.filter((task) => task.status === '待验收').every((task) => (
      task.completionEvidence?.result
      && task.completionEvidence?.description
      && task.completionEvidence?.resolvedSource === true
      && (task.completionEvidence?.referenceNo || task.completionEvidence?.attachment?.name)
    )),
    true,
  );
  assert.equal(
    tasks.filter((task) => task.status === '已完成').every((task) => (
      task.completionEvidence && task.acceptance?.reviewer
    )),
    true,
  );
});
