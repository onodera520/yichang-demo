import assert from 'node:assert/strict';
import fs from 'node:fs';

const taskPageSource = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const mockDataSource = fs.readFileSync(new URL('../data/mockData.js', import.meta.url), 'utf8');

assert.doesNotMatch(
  taskPageSource,
  /import SlaCountdown/,
  'the task page must use task-specific SLA semantics instead of the shared countdown',
);
assert.match(taskPageSource, /getTaskSlaPresentation/, 'the task page should derive SLA display state');
assert.match(taskPageSource, /超时/, 'the task page should expose overdue wording');
assert.match(mockDataSource, /overdueDuration/, 'legacy overdue mock tasks should store elapsed duration explicitly');

console.log('task SLA display integration tests passed');
