import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdjustedInventoryAdoptionPatch,
  buildDirectInventoryAdoptionPatch,
  getInventorySuggestionGateReason,
  isDirectInventorySuggestionAdopted,
} from './inventorySuggestionActions.js';

const source = { sku: 'ELE-KYB-01', suggestedReplenishment: 200, status: '待处理' };

test('direct adoption confirms the AI quantity', () => {
  assert.deepEqual(buildDirectInventoryAdoptionPatch(source), {
    adjustedQuantity: 200,
    suggestionDecision: 'adopted',
    adjustReason: '',
    adjustNote: '',
  });
});

test('adjusted adoption records a modified quantity and audit fields', () => {
  assert.deepEqual(buildAdjustedInventoryAdoptionPatch(source, {
    quantity: '240',
    reason: '覆盖安全库存',
    note: '活动前补足',
  }), {
    adjustedQuantity: 240,
    suggestionDecision: 'modified',
    adjustReason: '覆盖安全库存',
    adjustNote: '活动前补足',
  });
});

test('a matching adjusted quantity remains a direct adoption', () => {
  assert.equal(
    buildAdjustedInventoryAdoptionPatch(source, { quantity: 200 }).suggestionDecision,
    'adopted',
  );
});

test('task creation requires a confirmed and saved quantity', () => {
  assert.equal(
    getInventorySuggestionGateReason(source, '200'),
    '请先采纳 AI 建议或保存调整方案',
  );

  const adopted = {
    ...source,
    status: '待分派',
    adjustedQuantity: 200,
    suggestionDecision: 'adopted',
  };

  assert.equal(getInventorySuggestionGateReason(adopted, '240'), '请先保存调整方案');
  assert.equal(getInventorySuggestionGateReason(adopted, '200'), '');
  assert.equal(isDirectInventorySuggestionAdopted(adopted, '200'), true);
});

test('transfer task creation requires the saved route and quantity', () => {
  const transfer = {
    sku: 'ACC-PHONE-02',
    riskLevel: '调拨',
    warehouse: 'UK',
    currentStock: 72,
    dailySales: 9.6,
    aiSuggestion: '调拨至 LA 仓',
    adjustedQuantity: 40,
    transferFromWarehouse: 'UK',
    transferToWarehouse: 'LA',
    suggestionDecision: 'modified',
  };

  assert.equal(getInventorySuggestionGateReason(transfer, {
    quantity: 40,
    fromWarehouse: 'UK',
    toWarehouse: 'NJ',
  }), '请先保存调整方案');
  assert.equal(getInventorySuggestionGateReason(transfer, {
    quantity: 40,
    fromWarehouse: 'UK',
    toWarehouse: 'LA',
  }), '');
});

test('slow-moving inventory can adopt a zero replenishment quantity', () => {
  assert.deepEqual(buildDirectInventoryAdoptionPatch({
    riskLevel: '滞销',
    suggestedReplenishment: 0,
  }), {
    adjustedQuantity: 0,
    suggestionDecision: 'adopted',
    adjustReason: '',
    adjustNote: '',
  });
});

test('non-positive replenishment quantities are rejected', () => {
  assert.throws(
    () => buildDirectInventoryAdoptionPatch({ riskLevel: '高', suggestedReplenishment: 0 }),
    /补货数量必须大于 0/,
  );
  assert.throws(
    () => buildAdjustedInventoryAdoptionPatch(source, { quantity: 0 }),
    /补货数量必须大于 0/,
  );
});
