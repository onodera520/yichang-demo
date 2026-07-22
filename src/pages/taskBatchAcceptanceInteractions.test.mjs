import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const tasksSource = await readFile(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const stateSource = await readFile(new URL('../state/DemoStateContext.jsx', import.meta.url), 'utf8');

test('待验收工具栏使用批量验收替换不适用的批量操作', () => {
  assert.match(tasksSource, /batchAcceptanceMode \? \(/);
  assert.match(tasksSource, /批量验收通过/);
  assert.match(tasksSource, /batchAcceptanceMode=\{activeTab === '待验收'\}/);
  assert.match(tasksSource, /onBulkAccept=\{openBatchAcceptance\}/);
});

test('批量验收只使用当前可见选择并按部分成功结果更新选择', () => {
  assert.match(tasksSource, /getBatchAcceptanceSummary\(displayedTasks, selectedIds, orders, inventory\)/);
  assert.match(tasksSource, /acceptTasks\(\s*batchAcceptance\.selectedTasks\.map/);
  assert.match(tasksSource, /reconcileBatchAcceptanceSelection\(current, result\.acceptedIds\)/);
  assert.match(tasksSource, /已验收通过 \$\{result\.acceptedIds\.length\} 条，跳过 \$\{result\.skipped\.length\} 条/);
  assert.doesNotMatch(tasksSource, /prepareTaskAdvance\(\);\s*const result = acceptTasks/);
});

test('共享状态暴露批量验收事务', () => {
  assert.match(stateSource, /acceptTasksState/);
  assert.match(stateSource, /const acceptTasks = \(taskIds, options\)/);
  assert.match(stateSource, /acceptTasks,/);
});
