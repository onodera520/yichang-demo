import assert from 'node:assert/strict';
import {
  applyInventoryDashboardPreset,
  getInventoryDashboardPresetMeta,
} from './dashboardPreset.js';

const rows = [
  { sku: 's7', availableDays: 7, status: '待补货' },
  { sku: 's1', availableDays: 1, status: '待处理' },
  { sku: 'done', availableDays: 0.5, status: '已完成' },
  { sku: 's8', availableDays: 8, status: '待处理' },
];

assert.deepEqual(
  applyInventoryDashboardPreset(rows, 'stockoutSoon').map((item) => item.sku),
  ['s1', 's7'],
);
assert.deepEqual(
  rows.map((item) => item.sku),
  ['s7', 's1', 'done', 's8'],
  'inventory preset sorting should not mutate source rows',
);
assert.equal(
  getInventoryDashboardPresetMeta('stockoutSoon').label,
  '7 天内缺货 · 未解决 · 可售天数从少到多',
);
assert.equal(getInventoryDashboardPresetMeta('unknown'), null);

console.log('inventory dashboard preset tests passed');
