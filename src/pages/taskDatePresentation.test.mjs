import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const taskPageSource = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const filterSource = fs.readFileSync(
  new URL('./tasks/taskAdvancedFilters.js', import.meta.url),
  'utf8',
);

test('task table renders compact dates while retaining the canonical timestamp', () => {
  assert.match(taskPageSource, /formatCompactDateTime\(row\.createdAt\)/);
  assert.match(taskPageSource, /title=\{row\.createdAt\}/);
  assert.match(taskPageSource, /whitespace-nowrap/);
});

test('task table defaults to newest creation time before pagination', () => {
  assert.match(taskPageSource, /sortTasksByCreatedAt\(filteredTasks\)/);
});

test('advanced task filtering uses the shared business-date normalizer', () => {
  assert.match(filterSource, /normalizeBusinessDate\(task\.createdAt\)/);
  assert.doesNotMatch(filterSource, /MOCK_TASK_TODAY/);
  assert.doesNotMatch(filterSource, /function normalizeCreatedDate/);
});
