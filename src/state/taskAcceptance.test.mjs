import assert from 'node:assert/strict';
import test from 'node:test';

import {
  acceptTasksState,
  acceptTaskState,
  getTaskAcceptanceBlockReason,
  getTaskAcceptanceChecks,
} from './taskAcceptance.js';

const order = { id: 'order-001', status: '处理中' };
const evidence = {
  result: '已切换至 NJ 仓发货',
  description: '已核对库存并完成平台回写',
  resolvedSource: true,
  referenceNo: 'NJ-OUT-260721-0188',
  attachment: null,
  submittedBy: '王敏',
  submittedAt: '2026-07-21 10:24:00',
};
const task = {
  id: 'task-001',
  title: '切换发货仓库',
  sourceKind: 'order',
  sourceId: order.id,
  status: '待验收',
  owner: '王敏',
  remainingSLA: '01:42:31',
  completionEvidence: evidence,
  processLogs: [],
};
const state = { orders: [order], inventory: [], tasks: [task] };

test('待验收任务展示四项可核验依据', () => {
  const checks = getTaskAcceptanceChecks(task, state.orders, state.inventory);

  assert.deepEqual(checks.map(({ key, passed }) => ({ key, passed })), [
    { key: 'evidence', passed: true },
    { key: 'resolvedSource', passed: true },
    { key: 'proof', passed: true },
    { key: 'source', passed: true },
  ]);
  assert.equal(getTaskAcceptanceBlockReason(task, state.orders, state.inventory), '');
});

test('缺少员工凭证时禁止主管验收', () => {
  const incompleteTask = {
    ...task,
    completionEvidence: { ...evidence, referenceNo: '', attachment: null },
  };

  assert.equal(
    getTaskAcceptanceBlockReason(incompleteTask, state.orders, state.inventory),
    '缺少关联单号或附件凭证',
  );
});

test('主管确认验收后才完成任务和来源异常', () => {
  const result = acceptTaskState(state, task.id, {
    confirmed: true,
    reviewer: '张晓',
    note: '已核对新运单号和平台回写结果',
  });

  assert.equal(result.ok, true);
  assert.equal(result.task.status, '已完成');
  assert.equal(result.task.acceptance.reviewer, '张晓');
  assert.equal(result.task.acceptance.note, '已核对新运单号和平台回写结果');
  assert.equal(result.state.orders[0].status, '已完成');
  assert.equal(result.task.processLogs.at(-1).action, '验收通过');
});

test('未勾选核对声明或非待验收状态时不能完成', () => {
  const unconfirmed = acceptTaskState(state, task.id, { reviewer: '张晓' });
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error, '请确认已核对处理结果和凭证');

  const processingState = {
    ...state,
    tasks: [{ ...task, status: '处理中' }],
  };
  const processing = acceptTaskState(processingState, task.id, {
    confirmed: true,
    reviewer: '张晓',
  });
  assert.equal(processing.ok, false);
  assert.equal(processing.error, '当前状态无法验收');
});

test('批量验收通过合格任务并跳过缺少凭证的任务', () => {
  const eligibleOrder = { id: 'order-eligible', status: '处理中' };
  const blockedOrder = { id: 'order-blocked', status: '处理中' };
  const eligibleTask = {
    ...task,
    id: 'task-eligible',
    title: 'eligible task',
    sourceId: eligibleOrder.id,
  };
  const blockedTask = {
    ...task,
    id: 'task-blocked',
    title: 'blocked task',
    sourceId: blockedOrder.id,
    completionEvidence: { ...evidence, referenceNo: '', attachment: null },
  };
  const batchState = {
    orders: [eligibleOrder, blockedOrder],
    inventory: [],
    tasks: [eligibleTask, blockedTask],
  };
  const blockedReason = getTaskAcceptanceBlockReason(blockedTask, batchState.orders, []);

  const result = acceptTasksState(
    batchState,
    [eligibleTask.id, blockedTask.id, eligibleTask.id],
    { reviewer: '张晓', note: '批量验收' },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(result.acceptedIds, [eligibleTask.id]);
  assert.deepEqual(result.skipped, [{ id: blockedTask.id, title: blockedTask.title, reason: blockedReason }]);
  assert.equal(result.state.tasks.find(({ id }) => id === eligibleTask.id).status, '已完成');
  assert.equal(result.state.tasks.find(({ id }) => id === blockedTask.id).status, '待验收');
  assert.equal(result.state.orders.find(({ id }) => id === eligibleOrder.id).status, '已完成');
  assert.equal(result.state.orders.find(({ id }) => id === blockedOrder.id).status, '处理中');
  assert.equal(result.state.tasks.find(({ id }) => id === eligibleTask.id).acceptance.reviewer, '张晓');
  assert.equal(result.state.tasks.find(({ id }) => id === eligibleTask.id).processLogs.at(-1).action, '验收通过');
});

test('批量验收在全部任务不合格时不修改状态', () => {
  const blockedTask = {
    ...task,
    id: 'task-blocked-only',
    title: 'blocked only',
    completionEvidence: { ...evidence, resolvedSource: false },
  };
  const blockedState = { ...state, tasks: [blockedTask] };

  const result = acceptTasksState(blockedState, [blockedTask.id], { reviewer: '张晓' });

  assert.equal(result.ok, false);
  assert.deepEqual(result.acceptedIds, []);
  assert.equal(result.skipped.length, 1);
  assert.equal(result.state, blockedState);
});
