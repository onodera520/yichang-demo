import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../styles/index.css', import.meta.url), 'utf8');

test('clicking a noticed tab clears filters and focuses without batch-selecting tasks', () => {
  assert.match(source, /taskTabNotices/);
  assert.match(source, /clearTaskTabNotice/);
  assert.match(source, /const \[focusedTaskIds, setFocusedTaskIds\]/);
  assert.match(source, /const handleTabClick = \(tab\)/);
  assert.match(source, /setFilters\(DEFAULT_TASK_FILTERS\)/);
  assert.match(source, /setAdvancedFilters\(taskAdvancedFilterDefaults\)/);
  assert.match(source, /setKeyword\(''\)/);
  assert.match(source, /setSelectedTaskId\(noticeIds\[0\]\)/);
  assert.match(source, /setSelectedIds\(\[\]\)/);
  assert.match(source, /已定位 \$\{noticeIds\.length\} 条新流转任务/);
});

test('focused task rows are pinned before pagination and receive a transient class', () => {
  assert.match(source, /prioritizeTasksByIds/);
  assert.match(source, /focusedTaskIds=\{focusedTaskIds\}/);
  assert.match(source, /task-row-arrival/);
  assert.match(styles, /\.task-row-arrival/);
  assert.match(styles, /@keyframes task-row-arrival/);
});

test('badge and row motion respect reduced-motion preferences', () => {
  assert.match(styles, /\.task-tab-notice-badge/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.task-row-arrival/);
});
