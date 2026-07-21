import assert from 'node:assert/strict';
import {
  buildInventoryTask,
  buildManualTask,
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
  owner: '赵宁',
};

const orderTask = buildOrderTask(order);
assert.equal(orderTask.sourceId, 'order-001');
assert.equal(orderTask.sourceKind, 'order');
assert.equal(orderTask.source, 'AMZ-US-240613-0188');
assert.equal(orderTask.status, '已分派');

assert.throws(() => buildOrderTask({ ...order, owner: '未分派' }), /请先分派负责人/);

const inventoryTask = buildInventoryTask(sku, { quantity: 300 });
assert.equal(inventoryTask.sourceId, 'ELE-HEAD-01');
assert.equal(inventoryTask.sourceKind, 'inventory');
assert.equal(inventoryTask.source, 'ELE-HEAD-01');
assert.equal(inventoryTask.owner, '赵宁');
assert.equal(inventoryTask.status, '已分派');
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
assert.equal(completedOrderState.tasks[0].previousRemainingSLA, '01:42:31');
assert.equal(completedOrderState.tasks[0].remainingSLA, '-');
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
assert.equal(unresolvedOrderState.tasks[0].status, '处理中');
assert.equal(unresolvedOrderState.tasks[0].remainingSLA, '01:42:31');
assert.equal(unresolvedOrderState.orders[0].status, '处理中');

const upgradedOrderState = completeTaskState(
  {
    orders: [{ ...order, status: '处理中' }],
    inventory: [{ ...sku, status: '待补货' }],
    tasks: [{ ...orderTask, status: '处理中' }],
  },
  orderTask.id,
  {
    ...completionEvidence,
    result: '无法切换已升级',
    resolvedSource: false,
    targetStatus: '已升级',
  },
);
assert.equal(upgradedOrderState.tasks[0].status, '已升级');
assert.equal(upgradedOrderState.tasks[0].remainingSLA, '01:42:31');
assert.equal(upgradedOrderState.tasks[0].processLogs.at(-1).action, '升级主管');
assert.equal(upgradedOrderState.orders[0].status, '处理中');

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
assert.deepEqual(suggestionTasks.map((task) => task.status), ['已分派', '已分派', '已分派']);
assert.throws(() => buildSuggestionTask({ title: '待分派建议', owner: '未分派' }), /请先分派负责人/);

const manualTask = buildManualTask({
  title: '人工核验物流异常',
  source: 'TTS-US-240613-0316',
  sourceType: '物流异常',
  riskLevel: '中',
  owner: '王敏',
  deadline: '今天 14:30',
  description: '联系承运商核验轨迹。',
});
assert.match(manualTask.id, /^task-manual-\d+$/);
assert.equal(manualTask.status, '已分派');
assert.equal(manualTask.remainingSLA, '02:00:00');
assert.equal(manualTask.createdAt, '刚刚');
assert.equal(manualTask.sourceKind, undefined);
assert.equal(manualTask.sourceId, undefined);
assert.equal(manualTask.processLogs[0].action, '人工创建任务');

const unassignedCompletionState = {
  orders: [{ ...order, status: '处理中' }],
  inventory: [{ ...sku, status: '待补货' }],
  tasks: [{ ...orderTask, id: 'legacy-unassigned', owner: '未分派', status: '待分派' }],
};
assert.equal(
  completeTaskState(unassignedCompletionState, 'legacy-unassigned', completionEvidence),
  unassignedCompletionState,
  '未分派任务不能直接完成',
);
assert.equal(
  buildManualTask({ title: '晚间跟进', owner: '王敏', deadline: '今天 18:00' }).remainingSLA,
  '04:00:00',
);
assert.equal(
  buildManualTask({ title: '明日跟进', owner: '王敏', deadline: '明天 10:00' }).remainingSLA,
  '24:00:00',
);
assert.equal(
  buildManualTask({ title: '时限跟进', owner: '王敏', deadline: '24小时内' }).remainingSLA,
  '24:00:00',
);
