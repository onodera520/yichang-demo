import assert from 'node:assert/strict';
import test from 'node:test';

import { inventory, orders, settings, tasks } from './mockData.js';

const activeStatuses = new Set([
  '待分派',
  '已分派',
  '待处理',
  '处理中',
  '待确认',
  '已升级',
  '已超时',
]);

test('active tasks belong to the current business period', () => {
  const activeTasks = tasks.filter((task) => activeStatuses.has(task.status));

  assert.ok(activeTasks.length > 0);
  assert.equal(
    activeTasks.every((task) => /^2026-07-(16|17) /.test(task.createdAt)),
    true,
  );
});

test('June task history contains closed rows only', () => {
  const juneTasks = tasks.filter((task) => task.createdAt.startsWith('2026-06-'));

  assert.ok(juneTasks.length > 0);
  assert.equal(
    juneTasks.every((task) => task.status === '已完成' || task.status === '已驳回'),
    true,
  );
  assert.equal(
    juneTasks.every((task) => task.processLogs.every((log) => !log.time.startsWith('今天'))),
    true,
  );
});

test('current task history also contains recent closed rows', () => {
  assert.equal(
    tasks.some((task) => task.status === '已完成' && /^2026-07-(16|17) /.test(task.createdAt)),
    true,
  );
});

test('normal stores are current while eBay remains stale', () => {
  const ebayConnection = settings.platformConnections.find((item) => item.platform === 'eBay');
  const currentStores = settings.storeSyncStatus.filter(
    (item) => item.platform !== 'eBay' && item.platform !== 'Shopify',
  );
  const ebayStores = settings.storeSyncStatus.filter((item) => item.platform === 'eBay');

  assert.equal(ebayConnection.lastSuccessfulSync, '2026-06-01 09:18:41');
  assert.equal(currentStores.every((item) => item.lastSyncAt.startsWith('2026-07-17 ')), true);
  assert.equal(ebayStores.every((item) => item.lastSyncAt.startsWith('2026-06-01 ')), true);
});

test('AI evidence follows source freshness', () => {
  assert.equal(
    orders
      .filter((item) => item.platform !== 'eBay')
      .every((item) => item.aiEvidence.updatedAt.startsWith('2026-07-17 ')),
    true,
  );
  assert.equal(
    inventory
      .filter((item) => item.platform !== 'eBay')
      .every((item) => item.aiEvidence.updatedAt.startsWith('2026-07-17 ')),
    true,
  );
  assert.equal(
    [...orders, ...inventory]
      .filter((item) => item.platform === 'eBay')
      .every((item) => item.aiEvidence.updatedAt === '2026-06-01 09:18:41'),
    true,
  );
});
