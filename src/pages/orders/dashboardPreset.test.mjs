import assert from 'node:assert/strict';
import {
  applyOrderDashboardPreset,
  getOrderDashboardPresetMeta,
} from './dashboardPreset.js';

const rows = [
  {
    id: 'h1',
    riskLevel: '高',
    abnormalType: '缺货',
    status: '待处理',
    amount: 100,
    remainingSLA: '04:00:00',
  },
  {
    id: 'h2',
    riskLevel: '高',
    abnormalType: '物流延误',
    status: '处理中',
    amount: 400,
    remainingSLA: '00:20:00',
  },
  {
    id: 'done',
    riskLevel: '高',
    abnormalType: '退款',
    status: '已完成',
    amount: 900,
    remainingSLA: '-',
  },
  {
    id: 'refund',
    riskLevel: '中',
    abnormalType: '退款',
    status: '待处理',
    amount: 200,
    remainingSLA: '03:00:00',
  },
];

assert.deepEqual(
  applyOrderDashboardPreset(rows, 'highRiskOrders', 0, 0).map((row) => row.id),
  ['h2', 'h1'],
);
assert.deepEqual(
  applyOrderDashboardPreset(rows, 'logisticsDelay', 0, 0).map((row) => row.id),
  ['h2'],
);
assert.deepEqual(
  applyOrderDashboardPreset(rows, 'afterSale', 0, 0).map((row) => row.id),
  ['refund'],
);
assert.deepEqual(
  applyOrderDashboardPreset(rows, 'potentialLoss', 0, 0).map((row) => row.id),
  ['h2', 'h1'],
);
assert.equal(
  getOrderDashboardPresetMeta('potentialLoss').label,
  '高风险未解决 · 影响金额从高到低',
);
assert.equal(getOrderDashboardPresetMeta('stockoutSoon'), null);

console.log('order dashboard preset tests passed');
