import assert from 'node:assert/strict';
import {
  buildInventoryTask,
  buildOrderTask,
  completeTaskState,
} from './demoFlow.js';

const order = {
  id: 'order-001',
  orderNo: 'AMZ-US-240613-0188',
  riskLevel: '高',
  abnormalType: '缺货',
  amount: 4860,
  owner: '王敏',
  remainingSLA: '01:42:31',
  impact: '影响8笔订单',
};

const sku = {
  sku: 'ELE-HEAD-01',
  productName: '头戴式无线降噪耳机Pro',
  riskLevel: '高',
  warehouse: 'LA',
  suggestedReplenishment: 300,
  confidence: 0.92,
};

const orderTask = buildOrderTask(order);
assert.equal(orderTask.sourceId, 'order-001');
assert.equal(orderTask.sourceKind, 'order');
assert.equal(orderTask.source, 'AMZ-US-240613-0188');
assert.equal(orderTask.status, '待分派');

const inventoryTask = buildInventoryTask(sku, { quantity: 300 });
assert.equal(inventoryTask.sourceId, 'ELE-HEAD-01');
assert.equal(inventoryTask.sourceKind, 'inventory');
assert.equal(inventoryTask.source, 'ELE-HEAD-01');
assert.equal(inventoryTask.status, '待分派');

const completedOrderState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...orderTask, status: '处理中' }],
  },
  orderTask.id,
);
assert.equal(completedOrderState.tasks[0].status, '已完成');
assert.equal(completedOrderState.orders[0].status, '已完成');
assert.equal(completedOrderState.inventory[0].status, '待补货');

const completedInventoryState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...inventoryTask, status: '处理中' }],
  },
  inventoryTask.id,
);
assert.equal(completedInventoryState.tasks[0].status, '已完成');
assert.equal(completedInventoryState.inventory[0].status, '已完成');
assert.equal(completedInventoryState.orders[0].status, '处理中');
