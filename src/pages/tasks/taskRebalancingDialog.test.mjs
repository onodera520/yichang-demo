import assert from 'node:assert/strict';
import fs from 'node:fs';

const dialogSource = fs.readFileSync(
  new URL('./TaskRebalancingDialog.jsx', import.meta.url),
  'utf8',
);
const tasksPageSource = fs.readFileSync(new URL('../Tasks.jsx', import.meta.url), 'utf8');

assert.match(dialogSource, /任务负载优化/);
assert.match(dialogSource, /plan\.moves\.slice\(0, 5\)/);
assert.match(dialogSource, /onRemoveMove\(move\.taskId\)/);
assert.match(dialogSource, /调整前/);
assert.match(dialogSource, /调整后/);
assert.match(dialogSource, /确认执行/);
assert.match(dialogSource, /disabled=\{!visibleMoves\.length\}/);
assert.match(dialogSource, /暂无安全的调度建议/);
assert.match(dialogSource, /max-w-\[760px\]/);

assert.match(tasksPageSource, /calculateMemberWorkloads/);
assert.match(tasksPageSource, /buildTaskRebalancingPlan/);
assert.match(tasksPageSource, /applyTaskRebalancingPlan/);
assert.match(tasksPageSource, /生成调度方案/);
assert.match(tasksPageSource, /过载/);
assert.match(tasksPageSource, /Math\.min\(100, loadPercent\)/);
assert.match(tasksPageSource, /<TaskRebalancingDialog/);

console.log('task rebalancing dialog tests passed');
