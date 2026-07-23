import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveInventoryTaskScenario } from './inventoryTaskScenario.js';

test('high medium and low inventory risks use replenishment tasks', () => {
  const scenario = resolveInventoryTaskScenario({
    sku: 'ELE-HEAD-01',
    productName: '降噪耳机',
    riskLevel: '高',
    warehouse: 'LA',
    suggestedReplenishment: 120,
    confidence: 0.9,
  }, { quantity: 120 });

  assert.equal(scenario.kind, 'replenishment');
  assert.equal(scenario.sourceStatus, '待补货');
  assert.equal(scenario.createButtonLabel, '创建补货任务');
  assert.equal(scenario.title, '补货 120 件至 LA 仓');
  assert.equal(scenario.validationError, '');
});

test('slow-moving inventory creates a clearance task without replenishment quantity', () => {
  const scenario = resolveInventoryTaskScenario({
    sku: 'HOM-HUM-01',
    productName: '桌面加湿器',
    riskLevel: '滞销',
    warehouse: 'US',
    currentStock: 300,
    suggestedReplenishment: 0,
    aiSuggestion: '建议降价 8% 并组合搭售。',
    confidence: 0.87,
  }, { quantity: 0 });

  assert.equal(scenario.kind, 'clearance');
  assert.equal(scenario.sourceStatus, '待清库存');
  assert.equal(scenario.createButtonLabel, '创建清库存任务');
  assert.equal(scenario.title, '清理 HOM-HUM-01 滞销库存');
  assert.match(scenario.impact, /停止补货/);
  assert.equal(scenario.validationError, '');
});

test('transfer inventory resolves an editable route and positive quantity', () => {
  const scenario = resolveInventoryTaskScenario({
    sku: 'ACC-PHONE-02',
    productName: '手机支架',
    riskLevel: '调拨',
    warehouse: 'UK',
    currentStock: 72,
    dailySales: 9.6,
    aiSuggestion: '调拨至 LA 仓，缓解未来 7 天库存缺口。',
    confidence: 0.82,
  }, {
    quantity: 40,
    fromWarehouse: 'UK',
    toWarehouse: 'LA',
  });

  assert.equal(scenario.kind, 'transfer');
  assert.equal(scenario.sourceStatus, '待调拨');
  assert.equal(scenario.createButtonLabel, '创建调拨任务');
  assert.equal(scenario.title, '从 UK 仓调拨 40 件至 LA 仓');
  assert.equal(scenario.fromWarehouse, 'UK');
  assert.equal(scenario.toWarehouse, 'LA');
  assert.equal(scenario.validationError, '');
});

test('transfer route must use distinct warehouses and a positive quantity', () => {
  const sameWarehouse = resolveInventoryTaskScenario({
    sku: 'SKU-TRANSFER',
    riskLevel: '调拨',
    warehouse: 'US',
    currentStock: 30,
  }, { quantity: 0, fromWarehouse: 'US', toWarehouse: 'US' });

  assert.match(sameWarehouse.validationError, /调出仓和调入仓不能相同/);
  assert.match(sameWarehouse.validationError, /调拨数量必须大于 0/);
});
