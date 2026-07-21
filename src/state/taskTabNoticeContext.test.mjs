import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./DemoStateContext.jsx', import.meta.url), 'utf8');

test('demo state exposes session task tab notices and a clear action', () => {
  assert.match(source, /createTaskTabNotices/);
  assert.match(source, /reconcileTaskTabNotices/);
  assert.match(source, /clearTaskTabNotice/);
  assert.match(source, /taskTabNotices/);
});

test('every task mutation commits rows through the notice-aware task state', () => {
  assert.match(source, /const \[taskState, setTaskState\]/);
  assert.match(source, /commitTaskRows/);
  assert.doesNotMatch(source, /const \[tasks, setTasks\]/);
});
