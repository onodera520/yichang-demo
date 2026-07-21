import assert from 'node:assert/strict';
import {
  DASHBOARD_METRIC_PRESETS,
  buildDashboardMetrics,
  isUnresolvedInventory,
  isUnresolvedOrder,
  matchesDashboardPreset,
} from './dashboardMetrics.js';

const orders = [
  {
    id: 'o1',
    platform: 'Amazon',
    store: 'US旗舰店',
    riskLevel: '高',
    abnormalType: '物流延误',
    status: '待处理',
    amount: 300,
    remainingSLA: '00:30:00',
  },
  {
    id: 'o2',
    platform: 'Amazon',
    store: 'US旗舰店',
    riskLevel: '高',
    abnormalType: '退款',
    status: '处理中',
    amount: 500,
    remainingSLA: '02:30:00',
  },
  {
    id: 'o3',
    platform: 'eBay',
    store: 'DE店',
    riskLevel: '高',
    abnormalType: '物流延误',
    status: '已完成',
    amount: 900,
    remainingSLA: '-',
  },
  {
    id: 'o4',
    platform: 'Amazon',
    store: 'US旗舰店',
    riskLevel: '中',
    abnormalType: '退款',
    status: '待处理',
    amount: 200,
    remainingSLA: '05:00:00',
  },
];

const inventory = [
  { sku: 's1', platform: 'Amazon', availableDays: 1, status: '待处理' },
  { sku: 's2', platform: 'Amazon', availableDays: 7, status: '待补货' },
  { sku: 's3', platform: 'Amazon', availableDays: 3, status: '已完成' },
  { sku: 's4', platform: 'eBay', availableDays: 2, status: '待处理' },
];

const history = {
  highRiskOrders: [1, 1],
  stockoutSoon: [1, 1],
  logisticsDelay: [0, 0],
  afterSale: [1, 1],
  potentialLoss: [100, 200],
};

assert.equal(isUnresolvedOrder(orders[0]), true);
assert.equal(isUnresolvedOrder(orders[2]), false);
assert.equal(isUnresolvedInventory(inventory[2]), false);
assert.equal(matchesDashboardPreset(orders[0], 'logisticsDelay'), true);
assert.equal(matchesDashboardPreset(orders[2], 'logisticsDelay'), false);

const metrics = buildDashboardMetrics({ orders, inventory, history });
assert.deepEqual(metrics.map((item) => item.numericValue), [2, 3, 1, 2, 800]);
assert.deepEqual(metrics.map((item) => item.trend.at(-1)), [2, 3, 1, 2, 800]);
assert.equal(metrics[4].value, '¥800');

const directionalToneMetrics = buildDashboardMetrics({
  orders,
  inventory,
  history: {
    ...history,
    afterSale: [1, 3],
    potentialLoss: [100, 200],
  },
});
assert.equal(directionalToneMetrics[3].changeValue < 0, true);
assert.equal(directionalToneMetrics[3].tone, '#20C997', 'declining metrics should use green');
assert.equal(directionalToneMetrics[4].changeValue > 0, true);
assert.equal(directionalToneMetrics[4].tone, '#FF1F1F', 'rising metrics should use red');

assert.deepEqual(
  metrics.map(({ route, dashboardPreset }) => ({ route, dashboardPreset })),
  Object.values(DASHBOARD_METRIC_PRESETS).map(({ route, key }) => ({
    route,
    dashboardPreset: key,
  })),
);

const amazonMetrics = buildDashboardMetrics({
  orders,
  inventory,
  history,
  platform: 'Amazon',
  store: 'US旗舰店',
});
assert.deepEqual(amazonMetrics.map((item) => item.numericValue), [2, 2, 1, 2, 800]);

const completedOrders = orders.map((order) => (
  order.id === 'o1' ? { ...order, status: '已完成' } : order
));
assert.deepEqual(
  buildDashboardMetrics({ orders: completedOrders, inventory, history })
    .map((item) => item.numericValue),
  [1, 3, 0, 2, 500],
);

console.log('dashboard metric aggregation tests passed');
