import assert from 'node:assert/strict';
import {
  buildCompletionPatch,
  calculateAvailableDays,
  calculateDataCompleteness,
  calculateSuggestedReplenishment,
  getCompletionTargetStatus,
  getReplenishmentQuantity,
  getVisibleAiRisks,
  hasTaskSource,
  requiresStaleDataConfirmation,
  reconnectPlatformConnections,
  validateCompletionEvidence,
} from './trustLayer.js';

assert.equal(getReplenishmentQuantity({ suggestedReplenishment: 0 }), 0, 'zero replenishment must stay zero');
assert.equal(getReplenishmentQuantity({}), 300, 'missing replenishment can use the drawer fallback');

const staleRisks = ['平台数据已停止同步，执行前需复核', '供应商交期可能波动'];
assert.deepEqual(getVisibleAiRisks({ risks: staleRisks }, { platform: 'eBay', isStale: true }), staleRisks);
assert.deepEqual(
  getVisibleAiRisks({ risks: staleRisks }, { platform: 'eBay', isStale: false }),
  ['供应商交期可能波动'],
  'reconnected platforms should not keep stale-data warnings',
);
assert.equal(hasTaskSource({ sourceKind: 'order', sourceId: 'order-1' }, [{ id: 'order-1' }], []), true);
assert.equal(hasTaskSource({ sourceKind: 'inventory', sourceId: 'missing' }, [], [{ sku: 'sku-1' }]), false);
assert.equal(hasTaskSource({ id: 'static-task' }, [], []), true, 'static mock tasks do not require a linked source');

assert.equal(
  calculateAvailableDays({
    currentStock: 12,
    dailySales: 18,
    inventoryPlanning: { effectiveTransitStock: 6, safetyStock: 4 },
  }),
  0.8,
  'available days should use effective transit stock and safety stock',
);

assert.equal(
  calculateSuggestedReplenishment({
    currentStock: 12,
    dailySales: 18,
    inventoryPlanning: {
      effectiveTransitStock: 6,
      safetyStock: 4,
      targetDays: 17,
      packSize: 20,
    },
  }),
  300,
  'replenishment should cover the target period and round up to the pack size',
);

assert.equal(
  calculateSuggestedReplenishment({ currentStock: 40, dailySales: 0, inventoryPlanning: {} }),
  0,
  'zero daily sales should not produce an invalid replenishment value',
);

const connections = [
  { platform: 'Amazon', status: '已连接', dataCompleteness: 100 },
  { platform: 'eBay', status: '已断开', isStale: true, dataCompleteness: 74 },
];

assert.equal(calculateDataCompleteness(connections), 87, 'completeness should average included platform weights');
assert.equal(
  requiresStaleDataConfirmation({ platform: 'eBay' }, connections),
  true,
  'stale platform data should require confirmation',
);
assert.equal(
  requiresStaleDataConfirmation({ platform: 'Amazon' }, connections),
  false,
  'connected platform data should not require confirmation',
);

const reconnected = reconnectPlatformConnections(connections, 'eBay', '刚刚');
assert.equal(reconnected.find((item) => item.platform === 'eBay').status, '已连接');
assert.equal(reconnected.find((item) => item.platform === 'eBay').isStale, false);
assert.equal(reconnected.find((item) => item.platform === 'eBay').lastSync, '刚刚');
assert.equal(calculateDataCompleteness(reconnected), 100);
assert.equal(connections.find((item) => item.platform === 'eBay').status, '已断开');

assert.deepEqual(
  validateCompletionEvidence({ result: '', description: '已处理', resolvedSource: true }),
  { result: '请填写处理结果' },
  'result should be required',
);
assert.deepEqual(
  validateCompletionEvidence({ result: '已处理', description: '', resolvedSource: true }),
  { description: '请填写执行说明' },
  'description should be required',
);
assert.deepEqual(
  validateCompletionEvidence({ result: '已处理', description: '已重新分配库存' }),
  { resolvedSource: '请选择是否解决原异常' },
  'source resolution choice should be required',
);
assert.deepEqual(
  validateCompletionEvidence({ result: '已处理', description: '已重新分配库存', resolvedSource: undefined }),
  { resolvedSource: '请选择是否解决原异常' },
  'source resolution should be a real boolean choice',
);

const completionEvidence = {
  result: '已从 NJ 仓重新分配库存',
  description: '8 笔订单已重新分配并同步平台',
  resolvedSource: true,
  referenceNo: 'NJ-OUT-260601-032',
  quantity: '8',
  cost: '304',
  attachment: { name: '出库截图.png', size: 204800 },
};
const completionPatch = buildCompletionPatch(
  { owner: '王敏', remainingSLA: '03:15:00', processLogs: [{ time: '今天 10:24', action: '创建任务' }] },
  completionEvidence,
);

assert.equal(completionPatch.status, '待验收');
assert.equal(completionPatch.remainingSLA, '03:15:00');
assert.equal(completionPatch.previousRemainingSLA, undefined);
assert.deepEqual(completionPatch.completionEvidence, completionEvidence);
assert.equal(completionPatch.processLogs.length, 2);
assert.match(completionPatch.processLogs[1].detail, /NJ-OUT-260601-032/);

assert.equal(completionPatch.processLogs.at(-1).action, '提交验收');
assert.equal(getCompletionTargetStatus({ resolvedSource: true }), '待验收');
assert.equal(getCompletionTargetStatus({ resolvedSource: false }), '处理中');
assert.equal(
  getCompletionTargetStatus({ resolvedSource: false, targetStatus: '已升级' }),
  '已升级',
);
assert.equal(
  getCompletionTargetStatus({ resolvedSource: false, targetStatus: '已完成' }),
  '处理中',
  'an unresolved source must never complete the task',
);

const upgradedPatch = buildCompletionPatch(
  { owner: '王敏', remainingSLA: '01:42:31', processLogs: [] },
  {
    result: '无法切换已升级',
    description: '目标仓库存不足，已升级主管处理',
    resolvedSource: false,
    targetStatus: '已升级',
  },
);
assert.equal(upgradedPatch.status, '已升级');
assert.equal(upgradedPatch.remainingSLA, '01:42:31');
assert.equal(upgradedPatch.previousRemainingSLA, undefined);
assert.equal(upgradedPatch.processLogs.at(-1).action, '升级主管');
assert.equal(upgradedPatch.processLogs.at(-1).tone, 'red');

const unresolvedPatch = buildCompletionPatch(
  { owner: '王敏', remainingSLA: '03:15:00', processLogs: [] },
  { result: '部分完成', description: '剩余事项继续处理', resolvedSource: false },
);
assert.equal(unresolvedPatch.status, '处理中');
assert.equal(unresolvedPatch.remainingSLA, '03:15:00');
assert.equal(unresolvedPatch.processLogs.at(-1).action, '更新处理进度');

console.log('trust layer tests passed');
