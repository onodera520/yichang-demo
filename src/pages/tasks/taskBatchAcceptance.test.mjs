import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getBatchAcceptanceSummary,
  reconcileBatchAcceptanceSelection,
} from './taskBatchAcceptance.js';

const orders = [{ id: 'order-ready' }, { id: 'order-blocked' }];
const evidence = {
  result: 'done',
  description: 'completed with proof',
  resolvedSource: true,
  referenceNo: 'REF-001',
};
const readyTask = {
  id: 'task-ready',
  title: 'ready task',
  status: '待验收',
  sourceKind: 'order',
  sourceId: 'order-ready',
  completionEvidence: evidence,
};
const blockedTask = {
  ...readyTask,
  id: 'task-blocked',
  title: 'blocked task',
  sourceId: 'order-blocked',
  completionEvidence: { ...evidence, referenceNo: '', attachment: null },
};

test('批量验收摘要只读取当前可见且已勾选的待验收任务', () => {
  const hiddenSelectedTask = { ...readyTask, id: 'task-hidden' };
  const processingTask = { ...readyTask, id: 'task-processing', status: '处理中' };

  const summary = getBatchAcceptanceSummary(
    [readyTask, blockedTask, processingTask],
    [readyTask.id, blockedTask.id, processingTask.id, hiddenSelectedTask.id],
    orders,
    [],
  );

  assert.deepEqual(summary.selectedTasks.map(({ id }) => id), [readyTask.id, blockedTask.id]);
  assert.deepEqual(summary.eligibleTasks.map(({ id }) => id), [readyTask.id]);
  assert.equal(summary.skippedTasks.length, 1);
  assert.equal(summary.skippedTasks[0].id, blockedTask.id);
  assert.ok(summary.skippedTasks[0].reason);
});

test('批量验收后只移除成功项并保留跳过项与其他选择', () => {
  const selectedIds = ['task-ready', 'task-blocked', 'task-hidden'];

  assert.deepEqual(
    reconcileBatchAcceptanceSelection(selectedIds, ['task-ready']),
    ['task-blocked', 'task-hidden'],
  );
});
