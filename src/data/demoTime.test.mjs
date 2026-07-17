import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEMO_DATE,
  DEMO_NOW,
  STALE_EBAY_SYNC_AT,
  buildBusinessDateTime,
  buildRollingDateLabels,
  formatCompactDateTime,
  normalizeBusinessDate,
} from './demoTime.js';

test('uses the approved fixed business date', () => {
  assert.equal(DEMO_DATE, '2026-07-17');
  assert.equal(DEMO_NOW, '2026-07-17 09:41:52');
  assert.equal(STALE_EBAY_SYNC_AT, '2026-06-01 09:18:41');
});

test('builds rolling labels across month boundaries', () => {
  assert.deepEqual(buildRollingDateLabels(7), [
    '7.11',
    '7.12',
    '7.13',
    '7.14',
    '7.15',
    '7.16',
    '7.17',
  ]);
  assert.equal(buildRollingDateLabels(30)[0], '6.18');
  assert.equal(buildRollingDateLabels(30).at(-1), '7.17');
});

test('normalizes supported business date formats', () => {
  assert.equal(normalizeBusinessDate('今天 10:24'), '2026-07-17');
  assert.equal(normalizeBusinessDate('07-16 12:35'), '2026-07-16');
  assert.equal(normalizeBusinessDate('6.01'), '2026-06-01');
  assert.equal(normalizeBusinessDate('2026-06-01 09:58'), '2026-06-01');
  assert.equal(normalizeBusinessDate('刚刚'), '2026-07-17');
  assert.equal(normalizeBusinessDate('未知时间'), '');
});

test('formats compact table dates with an original-text fallback', () => {
  assert.equal(formatCompactDateTime('2026-07-17 10:24:32'), '07-17 10:24');
  assert.equal(formatCompactDateTime('刚刚'), '刚刚');
  assert.equal(formatCompactDateTime(''), '');
});

test('creates deterministic current-period timestamps', () => {
  assert.equal(
    buildBusinessDateTime({ daysAgo: 1, hour: 18, minute: 5, second: 9 }),
    '2026-07-16 18:05:09',
  );
});

test('rejects invalid rolling-day requests', () => {
  assert.throws(() => buildRollingDateLabels(0), /positive integer/);
  assert.throws(() => buildRollingDateLabels(1.5), /positive integer/);
});
