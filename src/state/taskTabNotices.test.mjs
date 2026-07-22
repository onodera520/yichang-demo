import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearTaskTabNotice,
  createTaskTabNotices,
  formatTaskTabNoticeCount,
  prioritizeTasksByIds,
  reconcileTaskTabNotices,
} from './taskTabNotices.js';

const task = (id, status, owner = '王敏') => ({ id, status, owner });

test('new tasks are grouped by their destination status', () => {
  const notices = reconcileTaskTabNotices(
    createTaskTabNotices(),
    [],
    [task('task-1', '已分派'), task('task-2', '已分派'), task('task-3', '待分派', '未分派')],
  );

  assert.deepEqual(notices['已分派'], ['task-1', 'task-2']);
  assert.deepEqual(notices['待分派'], ['task-3']);
});

test('status changes move a unique task notice to the latest destination', () => {
  const assigned = reconcileTaskTabNotices(
    createTaskTabNotices(),
    [task('task-1', '待分派', '未分派')],
    [task('task-1', '已分派')],
  );
  const upgraded = reconcileTaskTabNotices(
    assigned,
    [task('task-1', '已分派')],
    [task('task-1', '已升级')],
  );
  const repeated = reconcileTaskTabNotices(
    upgraded,
    [task('task-1', '已升级')],
    [task('task-1', '已升级', '赵宁')],
  );

  assert.deepEqual(repeated['已分派'], []);
  assert.deepEqual(repeated['已升级'], ['task-1']);
});

test('return flows move stale notices to exactly one destination tab', () => {
  const scenarios = [
    ['已升级', '处理中'],
    ['已分派', '待分派'],
    ['已完成', '处理中'],
  ];

  for (const [fromStatus, toStatus] of scenarios) {
    const initial = reconcileTaskTabNotices(
      createTaskTabNotices(),
      [],
      [task('task-returned', fromStatus)],
    );
    const returned = reconcileTaskTabNotices(
      initial,
      [task('task-returned', fromStatus)],
      [task('task-returned', toStatus)],
    );

    assert.deepEqual(returned[fromStatus], []);
    assert.deepEqual(returned[toStatus], ['task-returned']);
    assert.equal(
      Object.values(returned).flat().filter((id) => id === 'task-returned').length,
      1,
    );
  }
});

test('unchanged tasks do not create notices and removed tasks clear stale notices', () => {
  const unchanged = reconcileTaskTabNotices(
    createTaskTabNotices(),
    [task('task-1', '处理中')],
    [task('task-1', '处理中', '赵宁')],
  );
  assert.deepEqual(unchanged['处理中'], []);

  const pending = reconcileTaskTabNotices(
    createTaskTabNotices(),
    [],
    [task('task-2', '待验收')],
  );
  const removed = reconcileTaskTabNotices(pending, [task('task-2', '待验收')], []);
  assert.deepEqual(removed['待验收'], []);
});

test('clearing one tab preserves notices in other tabs', () => {
  const notices = reconcileTaskTabNotices(
    createTaskTabNotices(),
    [],
    [task('task-1', '已分派'), task('task-2', '已完成')],
  );
  const cleared = clearTaskTabNotice(notices, '已分派');

  assert.deepEqual(cleared['已分派'], []);
  assert.deepEqual(cleared['已完成'], ['task-2']);
  assert.deepEqual(notices['已分派'], ['task-1'], 'clear must not mutate the previous notice state');
});

test('badge counts cap at 99+ and focused tasks are pinned without duplicates', () => {
  assert.equal(formatTaskTabNoticeCount(1), '1');
  assert.equal(formatTaskTabNoticeCount(99), '99');
  assert.equal(formatTaskTabNoticeCount(100), '99+');

  const rows = [task('task-1', '已分派'), task('task-2', '已分派'), task('task-3', '已分派')];
  assert.deepEqual(
    prioritizeTasksByIds(rows, ['task-3', 'task-1', 'task-3']).map((row) => row.id),
    ['task-3', 'task-1', 'task-2'],
  );
});
