import assert from 'node:assert/strict';
import test from 'node:test';

import { getTaskBatchToolbarActions } from './taskBatchToolbar.js';

test('已超时保留批量转交、催办和升级', () => {
  assert.deepEqual(getTaskBatchToolbarActions('已超时'), ['transfer', 'remind', 'upgrade']);
});

test('待验收仅显示批量验收', () => {
  assert.deepEqual(getTaskBatchToolbarActions('待验收'), ['accept']);
});

test('已完成不显示流程类批量操作', () => {
  assert.deepEqual(getTaskBatchToolbarActions('已完成'), []);
});

test('其他任务标签保留转交和催办但不显示批量升级', () => {
  for (const tab of ['全部待办', '已分派', '处理中', '已升级']) {
    assert.deepEqual(getTaskBatchToolbarActions(tab), ['transfer', 'remind']);
  }
});
