import assert from 'node:assert/strict';
import {
  buildOrdersCsv,
  confidenceAdvice,
  executeBatchOperation,
  previewBatchOperation,
  undoBatchOperation,
} from './orderBatchOperations.js';

const connections = [
  { platform: 'Amazon', status: '已连接' },
  { platform: 'eBay', status: '已断开' },
];

const orders = [
  { id: 'a', orderNo: 'AMZ-1', platform: 'Amazon', owner: '未分派', status: '待分派', amount: 100, riskLevel: '高', confidence: 0.92, relatedSku: 'SKU-A' },
  { id: 'b', orderNo: 'EBY-1', platform: 'eBay', owner: '王敏', status: '待处理', amount: 80, riskLevel: '中', confidence: 0.81, relatedSku: 'SKU-B' },
  { id: 'c', orderNo: 'AMZ-2', platform: 'Amazon', owner: '赵宁', status: '已完成', amount: 60, riskLevel: '低', confidence: 0.66, relatedSku: 'SKU-C' },
];

const preview = previewBatchOperation('assign', orders, { connections, tasks: [] });
assert.deepEqual(
  { total: preview.total, executable: preview.executable, blocked: preview.blocked, amount: preview.amount },
  { total: 3, executable: 1, blocked: 2, amount: 100 },
);

const exportPreview = previewBatchOperation('export', orders, { connections, tasks: [] });
assert.equal(exportPreview.executable, 3, '导出不应受订单终态或平台连接状态限制');

const assigned = executeBatchOperation('assign', orders, {
  owner: '陈浩',
  reason: '按风险优先级重新分派',
}, { connections, tasks: [], now: 1000 });
assert.equal(assigned.successes.length, 1);
assert.equal(assigned.failures.length, 2);
assert.equal(assigned.orders.find((order) => order.id === 'a').owner, '陈浩');
assert.equal(assigned.orders.find((order) => order.id === 'a').status, '待处理');
assert.match(assigned.failures.find((item) => item.id === 'b').reason, /平台/);
assert.match(assigned.failures.find((item) => item.id === 'c').reason, /已完成/);

const processing = executeBatchOperation('markProcessing', [orders[0]], {}, { connections, tasks: [], now: 2000 });
assert.equal(processing.orders[0].owner, '张晓');
assert.equal(processing.orders[0].status, '处理中');

const service = executeBatchOperation('customerService', [orders[0]], {
  queue: '物流客服',
  reason: '物流轨迹需要人工核实',
  priority: '高',
}, { connections, tasks: [], now: 3000 });
assert.equal(service.tasksToAdd.length, 1);
assert.equal(service.tasksToAdd[0].sourceType, '客服协同');
assert.equal(service.orders[0].owner, '未分派', '转客服不得改变订单负责人');

const duplicateTask = { id: 'existing', sourceKind: 'order', sourceId: 'a', sourceType: '来源订单', status: '待分派' };
const generated = executeBatchOperation('createTask', [orders[0]], {
  owner: '王敏', deadline: '今天 18:00', description: '处理异常',
}, { connections, tasks: [duplicateTask], now: 4000 });
assert.equal(generated.successes.length, 0);
assert.match(generated.failures[0].reason, /重复/);

const csv = buildOrdersCsv(orders);
assert.ok(csv.startsWith('\uFEFF'));
assert.match(csv, /置信度建议说明/);
assert.match(csv, /高可信，可优先参考/);
assert.match(csv, /中等可信，建议核验关键数据/);
assert.match(csv, /低可信，需人工复核/);
assert.equal(confidenceAdvice(0.9), '高可信，可优先参考');
assert.equal(confidenceAdvice(0.7), '中等可信，建议核验关键数据');
assert.equal(confidenceAdvice(0.69), '低可信，需人工复核');

const undo = undoBatchOperation(assigned.record, assigned.orders, []);
assert.equal(undo.successes.length, 1);
assert.equal(undo.orders.find((order) => order.id === 'a').owner, '未分派');
assert.equal(undo.orders.find((order) => order.id === 'a').status, '待分派');

const changedAfterAssign = assigned.orders.map((order) => order.id === 'a' ? { ...order, status: '处理中' } : order);
const conflictedUndo = undoBatchOperation(assigned.record, changedAfterAssign, []);
assert.equal(conflictedUndo.successes.length, 0);
assert.match(conflictedUndo.failures[0].reason, /状态已变化/);

console.log('order batch operation tests passed');
