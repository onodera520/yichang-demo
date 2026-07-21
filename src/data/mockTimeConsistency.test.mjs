import assert from 'node:assert/strict';
import test from 'node:test';

import { inventory, orders, settings, tasks } from './mockData.js';

test('task creation times are canonical, valid, and newest first', () => {
  const parseCanonicalDateTime = (value) => {
    const matched = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);
    if (!matched) return null;

    const [, year, month, day, hour, minute, second] = matched.map(Number);
    const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
    const normalized = new Date(timestamp);
    return (
      normalized.getUTCFullYear() === year
      && normalized.getUTCMonth() === month - 1
      && normalized.getUTCDate() === day
      && normalized.getUTCHours() === hour
      && normalized.getUTCMinutes() === minute
      && normalized.getUTCSeconds() === second
    ) ? timestamp : null;
  };
  const timestamps = tasks.map((task) => parseCanonicalDateTime(task.createdAt));

  assert.equal(timestamps.every((timestamp) => timestamp != null), true);
  assert.equal(
    timestamps.every((timestamp, index) => index === 0 || timestamps[index - 1] >= timestamp),
    true,
  );
  assert.ok(new Set(tasks.map((task) => task.createdAt.slice(0, 10))).size > 10);
});

test('task pagination progresses from newer pages to older pages', () => {
  const pageSize = 9;
  const pageDates = Array.from(
    { length: Math.ceil(tasks.length / pageSize) },
    (_, pageIndex) => tasks
      .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
      .map((task) => task.createdAt),
  );

  assert.equal(pageDates[0][0].startsWith('2026-07-17 '), true);
  assert.equal(pageDates.at(-1).at(-1).startsWith('2026-06-'), true);
  assert.equal(
    pageDates.slice(1).every((page, index) => pageDates[index].at(-1) >= page[0]),
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

test('seed task logs do not drift with machine-relative day labels', () => {
  assert.equal(
    tasks.every((task) => task.processLogs.every(
      (log) => !/^(今天|昨天|明天)/.test(log.time),
    )),
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
