import assert from 'node:assert/strict';
import fs from 'node:fs';

const tasksSource = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const createModalUrl = new URL('../components/common/TaskCreateModal.jsx', import.meta.url);
assert.ok(fs.existsSync(createModalUrl), 'TaskCreateModal should exist');
const createModalSource = fs.readFileSync(createModalUrl, 'utf8');

for (const handler of [
  'onBulkTransfer',
  'onBulkUpgrade',
  'onBulkRemind',
  'onExport',
  'onSort',
  'onRefresh',
  'onCreate',
]) {
  assert.ok(tasksSource.includes(handler), `TaskTable should expose ${handler}`);
}

assert.match(tasksSource, /\.\.\.buttonProps/, 'TableButton should forward standard button props');
assert.match(tasksSource, /<TaskCreateModal\b/, 'Tasks should render the manual task modal');
assert.match(tasksSource, /<ConfirmActionDialog\b/, 'batch upgrade should require confirmation');
assert.match(tasksSource, />批量催办<\//, 'task toolbar should expose batch reminders');
assert.doesNotMatch(tasksSource, /批量关闭/, 'task toolbar should not expose batch close');
assert.doesNotMatch(tasksSource, /onBulkClose/, 'TaskTable should not expose a batch close handler');
assert.match(tasksSource, /buildTasksCsv/, 'export should use the shared CSV builder');
assert.match(tasksSource, /sortTasksByDeadline/, 'deadline sort should use the shared comparator');
assert.match(tasksSource, /calculateDeadlineDistribution/, 'deadline stats should use the shared live distribution calculator');
assert.match(tasksSource, /function DeadlineStats\(\{ tasks, slaClock \}\)/, 'DeadlineStats should receive filtered tasks and the SLA clock');
assert.match(tasksSource, /<DeadlineStats tasks=\{filteredTasks\} slaClock=\{slaClock\}/, 'deadline stats should follow filtered rows instead of pagination');
assert.doesNotMatch(tasksSource, /label: '已超时', value: 3/, 'deadline stats must not keep static values');

for (const field of ['title', 'source', 'sourceType', 'riskLevel', 'owner', 'deadline', 'description']) {
  assert.ok(createModalSource.includes(field), `TaskCreateModal should include ${field}`);
}
assert.match(createModalSource, /aria-modal="true"/, 'TaskCreateModal should be modal for assistive technology');
assert.match(createModalSource, /errors\.title/, 'TaskCreateModal should validate title');
assert.match(createModalSource, /errors\.source/, 'TaskCreateModal should validate source');
assert.match(createModalSource, /errors\.description/, 'TaskCreateModal should validate description');

console.log('task toolbar interaction tests passed');
