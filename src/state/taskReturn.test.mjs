import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getTaskReturnReasonOptions,
  getTaskReturnAction,
  reopenTaskState,
  returnTaskState,
  validateTaskReturnReason,
  validateTaskReturnRemark,
} from './taskReturn.js';

const baseTask = {
  id: 'task-1',
  title: '切换至 NJ 仓发货',
  owner: '王敏',
  remainingSLA: '01:42:31',
  processLogs: [{ time: '今天 10:24', owner: '林晓', action: '创建任务', detail: '来自 AI 建议' }],
};

const baseState = {
  orders: [{ id: 'order-1', status: '已完成' }],
  inventory: [{ sku: 'sku-1', status: '已完成', riskLevel: '低' }],
  tasks: [],
};

test('maps only supported statuses to explicit return actions', () => {
  assert.deepEqual(getTaskReturnAction({ ...baseTask, status: '待确认' }), {
    type: 'return',
    label: '退回',
    action: '退回任务',
    targetStatus: '处理中',
  });
  assert.deepEqual(getTaskReturnAction({ ...baseTask, status: '已升级' }), {
    type: 'return',
    label: '退回处理',
    action: '退回任务',
    targetStatus: '处理中',
  });
  assert.equal(getTaskReturnAction({ ...baseTask, status: '已分派' }), null);
  assert.equal(getTaskReturnAction({ ...baseTask, status: '处理中' }), null);
  assert.equal(getTaskReturnAction({ ...baseTask, status: '待分派' }), null);
  assert.equal(getTaskReturnAction({ ...baseTask, status: '已超时' }), null);
});

test('provides five action-specific reasons for every return action', () => {
  assert.deepEqual(getTaskReturnReasonOptions('return'), [
    '处理信息不完整',
    '缺少必要凭证',
    '处理结果不符合要求',
    '来源数据需要复核',
    '需要重新处理',
  ]);
  assert.deepEqual(getTaskReturnReasonOptions('unassign'), []);
  assert.deepEqual(getTaskReturnReasonOptions('reopen'), [
    '问题未实际解决',
    '处理结果出现反复',
    '来源数据发生变化',
    '完成凭证有误',
    '需要补充后续处理',
  ]);
  assert.deepEqual(getTaskReturnReasonOptions('unknown'), []);
});

test('accepts only a reason from the current action and validates an optional remark', () => {
  assert.equal(validateTaskReturnReason('', 'return'), '请选择原因');
  assert.equal(validateTaskReturnReason('自由输入原因', 'return'), '请选择有效原因');
  assert.equal(validateTaskReturnReason('负责人分配错误', 'return'), '请选择有效原因');
  assert.equal(validateTaskReturnReason('  处理信息不完整  ', 'return'), null);
  assert.equal(validateTaskReturnRemark(), null);
  assert.equal(validateTaskReturnRemark('   '), null);
  assert.equal(validateTaskReturnRemark('a'.repeat(100)), null);
  assert.equal(validateTaskReturnRemark('a'.repeat(101)), '备注不能超过 100 字');
});

test('returns review and upgraded tasks to processing without changing owner or prior logs', () => {
  for (const status of ['待确认', '已升级']) {
    const task = { ...baseTask, status };
    const state = { ...baseState, tasks: [task] };
    const result = returnTaskState(state, task.id, {
      reason: '  处理信息不完整  ',
      remark: '  缺少物流截图  ',
    });

    assert.equal(result.ok, true);
    assert.equal(result.task.status, '处理中');
    assert.equal(result.task.owner, '王敏');
    assert.equal(result.task.processLogs.length, 2);
    assert.deepEqual(result.task.processLogs[0], task.processLogs[0]);
    assert.equal(result.task.processLogs.at(-1).action, '退回任务');
    assert.match(result.task.processLogs.at(-1).detail, new RegExp(`${status} → 处理中`));
    assert.equal(
      result.task.processLogs.at(-1).detail,
      `${status} → 处理中；原因：处理信息不完整；备注：缺少物流截图`,
    );
  }
});

test('does not allow assigned tasks to return to unassigned', () => {
  const task = { ...baseTask, status: '已分派' };
  const result = returnTaskState({ ...baseState, tasks: [task] }, task.id, { reason: '负责人分配错误' });

  assert.equal(result.ok, false);
  assert.equal(result.error, '当前状态无法退回');
});

test('rejects invalid reasons and unsupported current statuses without changing state', () => {
  const task = { ...baseTask, status: '处理中' };
  const state = { ...baseState, tasks: [task] };
  const unsupported = returnTaskState(state, task.id, { reason: '处理信息不完整' });
  const emptyReason = returnTaskState({ ...baseState, tasks: [{ ...task, status: '待确认' }] }, task.id, { reason: ' ' });
  const crossActionReason = returnTaskState(
    { ...baseState, tasks: [{ ...task, status: '待确认' }] },
    task.id,
    { reason: '负责人分配错误' },
  );
  const longRemark = returnTaskState(
    { ...baseState, tasks: [{ ...task, status: '待确认' }] },
    task.id,
    { reason: '处理信息不完整', remark: 'a'.repeat(101) },
  );

  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.error, '当前状态无法退回');
  assert.equal(unsupported.state, state);
  assert.equal(emptyReason.ok, false);
  assert.equal(emptyReason.error, '请选择原因');
  assert.equal(crossActionReason.ok, false);
  assert.equal(crossActionReason.error, '请选择有效原因');
  assert.equal(longRemark.ok, false);
  assert.equal(longRemark.error, '备注不能超过 100 字');
});

test('reopens a completed order, restores SLA, clears evidence and rolls source back', () => {
  const task = {
    ...baseTask,
    status: '已完成',
    sourceKind: 'order',
    sourceId: 'order-1',
    remainingSLA: '-',
    previousRemainingSLA: '01:42:31',
    completionEvidence: { result: '已完成仓库切换', resolvedSource: true },
  };
  assert.deepEqual(getTaskReturnAction(task), {
    type: 'reopen',
    label: '重新打开',
    action: '重新打开任务',
    targetStatus: '处理中',
  });

  const result = reopenTaskState({ ...baseState, tasks: [task] }, task.id, { reason: '问题未实际解决' });

  assert.equal(result.ok, true);
  assert.equal(result.task.status, '处理中');
  assert.equal(result.task.remainingSLA, '01:42:31');
  assert.equal('completionEvidence' in result.task, false);
  assert.equal('previousRemainingSLA' in result.task, false);
  assert.equal(result.state.orders[0].status, '处理中');
  assert.equal(result.task.processLogs.at(-1).action, '重新打开任务');
});

test('reopens an assigned inventory task without changing its owner or risk level', () => {
  const task = {
    ...baseTask,
    status: '已完成',
    sourceKind: 'inventory',
    sourceId: 'sku-1',
    remainingSLA: '-',
    completionEvidence: { result: '已完成补货', resolvedSource: true },
  };
  const result = reopenTaskState({ ...baseState, tasks: [task] }, task.id, { reason: '来源数据发生变化' });

  assert.equal(result.ok, true);
  assert.equal(result.task.status, '处理中');
  assert.equal(result.task.owner, '王敏');
  assert.equal(result.task.remainingSLA, '04:00:00');
  assert.equal(result.state.inventory[0].status, '待补货');
  assert.equal(result.state.inventory[0].riskLevel, '低');
});

test('blocks reopening a sourced task when its source object is missing', () => {
  const task = {
    ...baseTask,
    status: '已完成',
    sourceKind: 'order',
    sourceId: 'missing-order',
    remainingSLA: '-',
  };
  const state = { ...baseState, tasks: [task] };
  const result = reopenTaskState(state, task.id, { reason: '需要补充后续处理' });

  assert.equal(result.ok, false);
  assert.equal(result.error, '来源对象不存在，无法重新打开');
  assert.equal(result.state, state);
});
