import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sidebarSource = readFileSync(new URL('./Sidebar.jsx', import.meta.url), 'utf8');
const tasksSource = readFileSync(new URL('../pages/Tasks.jsx', import.meta.url), 'utf8');

test('task sidebar item renders the shared assigned-task notice without affecting layout', () => {
  assert.match(sidebarSource, /useDemoState/);
  assert.match(sidebarSource, /taskTabNotices\['已分派'\]/);
  assert.match(sidebarSource, /formatTaskTabNoticeCount/);
  assert.match(sidebarSource, /sidebar-task-notice-badge/);
  assert.match(sidebarSource, /absolute/);
});

test('task sidebar notice links directly to the assigned tab with one-shot route state', () => {
  assert.match(sidebarSource, /noticeTab:\s*'已分派'/);
  assert.match(tasksSource, /location\.state\?\.noticeTab/);
  assert.match(tasksSource, /handleTabClick\(noticeTab\)/);
  assert.match(tasksSource, /navigate\(location\.pathname,\s*\{\s*replace:\s*true/);
});
