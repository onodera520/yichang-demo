import assert from 'node:assert/strict';
import test from 'node:test';

import { matchesTaskTab } from './taskListVisibility.js';

test('全部待办页签排除已完成任务', () => {
  assert.equal(matchesTaskTab({ status: '已分派' }, '全部待办'), true);
  assert.equal(matchesTaskTab({ status: '处理中' }, '全部待办'), true);
  assert.equal(matchesTaskTab({ status: '已完成' }, '全部待办'), false);
});

test('已完成页签只显示已完成任务', () => {
  assert.equal(matchesTaskTab({ status: '已完成' }, '已完成'), true);
  assert.equal(matchesTaskTab({ status: '处理中' }, '已完成'), false);
});

test('其他状态页签保持精确匹配', () => {
  assert.equal(matchesTaskTab({ status: '已分派' }, '已分派'), true);
  assert.equal(matchesTaskTab({ status: '处理中' }, '已分派'), false);
});
