import assert from 'node:assert/strict';
import {
  buildInventoryTask,
  buildOrderTask,
  buildSuggestionTask,
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
assert.equal(buildInventoryTask({ ...sku, suggestedReplenishment: 0 }, { quantity: 0 }).impact.includes('补货 0 件'), true);

const completionEvidence = {
  result: '已从 NJ 仓重新分配库存',
  description: '已同步平台并复核订单状态',
  resolvedSource: true,
  referenceNo: 'NJ-OUT-260601-032',
};

const completedOrderState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...orderTask, status: '处理中' }],
  },
  orderTask.id,
  completionEvidence,
);
assert.equal(completedOrderState.tasks[0].status, '已完成');
assert.deepEqual(completedOrderState.tasks[0].completionEvidence, completionEvidence);
assert.match(completedOrderState.tasks[0].processLogs.at(-1).detail, /NJ-OUT-260601-032/);
assert.equal(completedOrderState.orders[0].status, '已完成');
assert.equal(completedOrderState.inventory[0].status, '待补货');

const completedInventoryState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...inventoryTask, status: '处理中' }],
  },
  inventoryTask.id,
  completionEvidence,
);
assert.equal(completedInventoryState.tasks[0].status, '已完成');
assert.equal(completedInventoryState.inventory[0].status, '已完成');
assert.equal(completedInventoryState.orders[0].status, '处理中');

const unresolvedOrderState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...orderTask, status: '处理中' }],
  },
  orderTask.id,
  { ...completionEvidence, resolvedSource: false },
);
assert.equal(unresolvedOrderState.tasks[0].status, '已完成');
assert.equal(unresolvedOrderState.orders[0].status, '处理中');

const suggestions = [
  {
    id: 'suggestion-001',
    title: '建议切换NJ仓发货',
    taskTitle: '切换至 NJ 仓发货',
    source: 'AMZ-US-240613-0188',
    sourceId: 'order-001',
    sourceKind: 'order',
    sourceType: '来源订单',
    riskLevel: '高',
    owner: '王敏',
    remainingSLA: '01:42:31',
    impact: '影响8笔订单，预计挽回金额 ¥1,260',
    confidence: 0.92,
  },
  {
    id: 'suggestion-002',
    title: '建议补货 120 件至 LA 仓',
    taskTitle: '补货 120 件至 LA 仓',
    source: 'SKU-NJ-2406-018',
    sourceId: 'SKU-NJ-2406-018',
    sourceKind: 'inventory',
    sourceType: '库存风险',
    riskLevel: '高',
    owner: '赵宁',
    remainingSLA: '04:00:00',
    impact: '影响4笔订单，预计挽回金额 ¥2,134',
    confidence: 0.88,
  },
  {
    id: 'suggestion-003',
    title: '建议更换物流渠道',
    taskTitle: '更换物流渠道',
    source: 'TTS-US-240613-0316',
    sourceId: 'order-002',
    sourceKind: 'order',
    sourceType: '物流异常',
    riskLevel: '中',
    owner: '赵宁',
    remainingSLA: '00:46:14',
    impact: '影响6笔订单，减少延误投诉',
    confidence: 0.75,
  },
];

const suggestionTasks = suggestions.map((suggestion) => buildSuggestionTask(suggestion));
assert.deepEqual(
  suggestionTasks.map((task) => task.title),
  ['切换至 NJ 仓发货', '补货 120 件至 LA 仓', '更换物流渠道'],
);
assert.deepEqual(
  suggestionTasks.map((task) => task.source),
  ['AMZ-US-240613-0188', 'SKU-NJ-2406-018', 'TTS-US-240613-0316'],
);
assert.deepEqual(
  suggestionTasks.map((task) => task.sourceKind),
  ['order', 'inventory', 'order'],
);
assert.equal(new Set(suggestionTasks.map((task) => task.impact)).size, 3);
assert.equal(suggestionTasks[0].sourceId, 'order-001');
assert.equal(suggestionTasks[1].sourceId, 'SKU-NJ-2406-018');
assert.equal(suggestionTasks[2].sourceId, 'order-002');
