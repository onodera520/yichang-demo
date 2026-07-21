import assert from 'node:assert/strict';

const mockData = await import('./mockData.js');
const formatModule = await import('../utils/formatMetricValue.js').catch(() => ({
  formatMetricValue: null,
}));

const metricGroups = [
  { name: 'inventory', metrics: mockData.inventoryMetricStats ?? [], expectedCount: 4 },
  { name: 'analytics', metrics: mockData.analytics.overviewMetrics, expectedCount: 6 },
];

assert.equal(
  'dashboardStats' in mockData,
  false,
  'dashboard current values should be derived from shared live state rather than fixed mock totals',
);

assert.deepEqual(Object.keys(mockData.dashboardMetricHistory), [
  'highRiskOrders',
  'stockoutSoon',
  'logisticsDelay',
  'afterSale',
  'potentialLoss',
]);

for (const points of Object.values(mockData.dashboardMetricHistory)) {
  assert.ok(points.length >= 2, 'dashboard history should contain at least two snapshots');
  points.forEach((value) => assert.equal(Number.isFinite(value), true));
}

assert.equal(
  typeof formatModule.formatMetricValue,
  'function',
  'metric cards should share a formatter for sparkline values',
);

for (const group of metricGroups) {
  assert.equal(group.metrics.length, group.expectedCount, `${group.name} should expose every top metric card`);

  for (const metric of group.metrics) {
    assert.equal(
      metric.trend.at(-1),
      metric.currentValue,
      `${group.name}/${metric.label} endpoint should equal the card current value`,
    );

    const yesterdayValue = metric.trend.at(-2);
    const actualChange = metric.currentValue - yesterdayValue;
    assert.ok(
      Math.abs(actualChange - metric.changeValue) < 1e-9,
      `${group.name}/${metric.label} penultimate point should reproduce the displayed daily change`,
    );

    assert.equal(
      formatModule.formatMetricValue(metric.currentValue, metric.valueFormat),
      String(metric.value),
      `${group.name}/${metric.label} endpoint tooltip should match the card value`,
    );
  }
}

console.log('metric card trend data tests passed');
