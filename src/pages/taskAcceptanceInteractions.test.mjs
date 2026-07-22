import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tasksSource = await readFile(new URL('./Tasks.jsx', import.meta.url), 'utf8');

test('主管任务页只读取员工提交结果并通过验收弹窗处理', () => {
  assert.match(tasksSource, /TaskAcceptanceDialog/);
  assert.match(tasksSource, /员工提交结果/);
  assert.match(tasksSource, /系统验收检查/);
  assert.match(tasksSource, /验收记录/);
  assert.match(tasksSource, /acceptTask\(selectedTask\.id/);
  assert.match(tasksSource, /const primaryBlockReason = actionPolicy\.primaryAction === 'accept'/);
  assert.match(tasksSource, /disabled=\{actionPolicy\.primaryDisabled \|\| Boolean\(primaryBlockReason\)\}/);
});

test('主管任务页不提供员工完成凭证提交入口', () => {
  assert.doesNotMatch(tasksSource, /TaskCompletionModal/);
  assert.doesNotMatch(tasksSource, /completionOpen/);
  assert.doesNotMatch(tasksSource, /submitCompletion/);
  assert.doesNotMatch(tasksSource, /openCompletion/);
});
