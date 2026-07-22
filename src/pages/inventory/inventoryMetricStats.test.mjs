import assert from 'node:assert/strict';
import * as inventoryMetrics from './dashboardPreset.js';

assert.equal(
  typeof inventoryMetrics.matchesInventoryAvailableDays,
  'function',
  'inventory filters should expose one shared available-days matcher',
);
assert.equal(
  typeof inventoryMetrics.buildInventoryMetricStats,
  'function',
  'inventory metric cards should be derived from inventory rows',
);

if (
  typeof inventoryMetrics.matchesInventoryAvailableDays === 'function' &&
  typeof inventoryMetrics.buildInventoryMetricStats === 'function'
) {
  const { buildInventoryMetricStats, matchesInventoryAvailableDays } = inventoryMetrics;

  assert.equal(matchesInventoryAvailableDays({ availableDays: 7 }, '7'), true);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 7.1 }, '7'), false);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 7 }, '8-14'), false);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 7.1 }, '8-14'), true);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 14 }, '8-14'), true);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 14.1 }, '8-14'), false);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 30 }, '30'), true);
  assert.equal(matchesInventoryAvailableDays({ availableDays: 30.1 }, '30'), false);

  const rows = [
    { sku: 'SKU-001', availableDays: 0, riskLevel: '高' },
    { sku: 'SKU-002', availableDays: 7, riskLevel: '中' },
    { sku: 'SKU-002', availableDays: 7, riskLevel: '中' },
    { sku: 'SKU-003', availableDays: 7.1, riskLevel: '低' },
    { sku: 'SKU-004', availableDays: 14, riskLevel: '调拨' },
    { sku: 'SKU-005', availableDays: 90, riskLevel: '滞销' },
  ];
  const definitions = [
    { key: 'stockout0To7', trend: [1, 1] },
    { key: 'stockout8To14', trend: [1, 1] },
    { key: 'slowMoving', trend: [2, 2] },
    { key: 'transfer', trend: [2, 2] },
  ];
  const metrics = buildInventoryMetricStats(rows, definitions);

  assert.deepEqual(
    Object.fromEntries(metrics.map((metric) => [metric.key, metric.value])),
    { stockout0To7: 2, stockout8To14: 2, slowMoving: 1, transfer: 1 },
    'metric values should count unique SKUs with mutually exclusive stockout windows',
  );
  assert.deepEqual(
    metrics.map((metric) => metric.trend.at(-1)),
    metrics.map((metric) => metric.value),
    'each sparkline should end at the live metric value',
  );
  assert.deepEqual(
    metrics.map((metric) => metric.tone),
    ['#FF3B3B', '#FF3B3B', '#16C7A1', '#16C7A1'],
    'sparkline color should be red when rising and green when falling',
  );
}
