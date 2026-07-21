import assert from 'node:assert/strict';
import test from 'node:test';

import { canRemindTask, getTaskDetailActionPolicy } from './taskDetailActions.js';

test('批量催办只接受已分派和处理中任务', () => {
  assert.equal(canRemindTask({ status: '已分派' }), true);
  assert.equal(canRemindTask({ status: '处理中' }), true);
  assert.equal(canRemindTask({ status: '待确认' }), false);
  assert.equal(canRemindTask({ status: '已升级' }), false);
  assert.equal(canRemindTask({ status: '已完成' }), false);
});

test('处理中任务由主管催办，不允许直接完成', () => {
  assert.deepEqual(getTaskDetailActionPolicy({ status: '处理中' }), {
    canChangeOwner: true,
    canTransfer: true,
    transferLabel: '转交',
    canUpgrade: true,
    primaryAction: 'remind',
    primaryLabel: '催办',
    primaryDisabled: false,
  });
});

test('待确认任务锁定负责人，只允许退回或确认完成', () => {
  assert.deepEqual(getTaskDetailActionPolicy({ status: '待确认' }), {
    canChangeOwner: false,
    canTransfer: false,
    transferLabel: '转交',
    canUpgrade: false,
    primaryAction: 'confirm',
    primaryLabel: '确认完成',
    primaryDisabled: false,
  });
});

test('已分派任务只能转交或提醒接单', () => {
  assert.deepEqual(getTaskDetailActionPolicy({ status: '已分派' }), {
    canChangeOwner: true,
    canTransfer: true,
    transferLabel: '转交',
    canUpgrade: false,
    primaryAction: 'remind',
    primaryLabel: '提醒接单',
    primaryDisabled: false,
  });
});

test('已升级任务只能重新分派或退回处理', () => {
  assert.deepEqual(getTaskDetailActionPolicy({ status: '已升级' }), {
    canChangeOwner: false,
    canTransfer: true,
    transferLabel: '重新分派',
    canUpgrade: false,
    primaryAction: null,
    primaryLabel: null,
    primaryDisabled: false,
  });
});

test('已完成任务锁定负责人且只保留重新打开', () => {
  assert.deepEqual(getTaskDetailActionPolicy({ status: '已完成' }), {
    canChangeOwner: false,
    canTransfer: false,
    transferLabel: '转交',
    canUpgrade: false,
    primaryAction: null,
    primaryLabel: null,
    primaryDisabled: false,
  });
});
