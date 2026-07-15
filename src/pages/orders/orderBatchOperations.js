const terminalStatuses = new Set(['已完成', '已驳回']);

const actionLabels = {
  assign: '批量分派',
  customerService: '批量转客服',
  markProcessing: '标记处理中',
  createTask: '批量生成任务',
  reject: '批量驳回',
};

function getConnection(order, connections) {
  return connections.find((item) => item.platform === order.platform);
}

function duplicateTaskFor(action, order, tasks) {
  return tasks.find((task) => (
    task.sourceKind === 'order' &&
    task.sourceId === order.id &&
    task.status !== '已完成' &&
    (action === 'customerService' ? task.sourceType === '客服协同' : task.sourceType !== '客服协同')
  ));
}

function blockedReason(action, order, context) {
  if (action === 'export') return '';
  if (terminalStatuses.has(order.status)) return `订单状态为${order.status}，不可执行该操作`;
  const connection = getConnection(order, context.connections || []);
  if (connection && connection.status !== '已连接') return `${order.platform} 平台连接异常，数据不可用`;
  if ((action === 'customerService' || action === 'createTask') && duplicateTaskFor(action, order, context.tasks || [])) {
    return action === 'customerService' ? '已存在进行中的客服协同单，不可重复转交' : '已存在进行中的关联任务，不可重复生成';
  }
  if (action === 'markProcessing' && order.status === '处理中') return '订单已处于处理中';
  return '';
}

export function previewBatchOperation(action, orders, context = {}) {
  const details = orders.map((order) => ({
    id: order.id,
    orderNo: order.orderNo,
    reason: blockedReason(action, order, context),
    amount: Number(order.amount || 0),
    riskLevel: order.riskLevel,
    platform: order.platform,
  }));
  const executableRows = details.filter((item) => !item.reason);
  return {
    total: details.length,
    executable: executableRows.length,
    blocked: details.length - executableRows.length,
    amount: executableRows.reduce((sum, item) => sum + item.amount, 0),
    details,
    riskCounts: executableRows.reduce((result, item) => ({ ...result, [item.riskLevel]: (result[item.riskLevel] || 0) + 1 }), {}),
    platforms: [...new Set(executableRows.map((item) => item.platform))],
  };
}

function requireFields(action, form) {
  const required = {
    assign: [['owner', '负责人'], ['reason', '分派原因']],
    customerService: [['queue', '客服队列'], ['reason', '转交原因'], ['priority', '优先级']],
    createTask: [['owner', '负责人'], ['deadline', '截止时间'], ['description', '任务说明']],
    reject: [['reason', '驳回原因']],
  }[action] || [];
  const missing = required.find(([key]) => !String(form[key] || '').trim());
  if (missing) throw new Error(`请填写${missing[1]}`);
}

function makeTask(action, order, form, now, index) {
  const isService = action === 'customerService';
  return {
    id: `task-order-batch-${action}-${order.id}-${now}-${index}`,
    title: isService ? `${order.abnormalType}客服协同` : `${order.abnormalType}处理`,
    source: order.orderNo,
    sourceId: order.id,
    sourceKind: 'order',
    sourceType: isService ? '客服协同' : '来源订单',
    riskLevel: order.riskLevel,
    owner: isService ? form.queue : form.owner,
    status: isService ? '待分派' : '已分派',
    remainingSLA: order.remainingSLA || '04:00:00',
    deadline: isService ? '今天 18:00' : form.deadline,
    createdAt: '刚刚',
    priority: form.priority || order.riskLevel,
    description: isService ? form.reason : form.description,
    processLogs: [{
      time: '刚刚',
      owner: '张晓',
      action: isService ? '转客服' : '批量生成任务',
      detail: isService ? `已转交${form.queue}，原因：${form.reason}` : form.description,
      tone: 'blue',
    }],
  };
}

function applyAction(action, order, form, now, index) {
  if (action === 'assign') {
    return {
      order: { ...order, owner: form.owner, status: order.status === '待分派' ? '待处理' : order.status, assignmentReason: form.reason },
      touchedKeys: ['owner', 'status', 'assignmentReason'],
    };
  }
  if (action === 'markProcessing') {
    return {
      order: { ...order, owner: order.owner === '未分派' ? '张晓' : order.owner, status: '处理中' },
      touchedKeys: ['owner', 'status'],
    };
  }
  if (action === 'reject') {
    return {
      order: { ...order, status: '已驳回', rejectionReason: form.reason, rejectionNote: form.note || '' },
      touchedKeys: ['status', 'rejectionReason', 'rejectionNote'],
    };
  }
  if (action === 'customerService' || action === 'createTask') {
    return { order, touchedKeys: [], task: makeTask(action, order, form, now, index) };
  }
  throw new Error(`不支持的批量操作：${action}`);
}

export function executeBatchOperation(action, orders, form = {}, context = {}) {
  requireFields(action, form);
  const now = context.now ?? Date.now();
  const failures = [];
  const successes = [];
  const items = [];
  const tasksToAdd = [];
  const nextOrders = orders.map((order, index) => {
    const reason = blockedReason(action, order, context);
    if (reason) {
      failures.push({ id: order.id, orderNo: order.orderNo, reason });
      return order;
    }
    const applied = applyAction(action, order, form, now, index);
    if (applied.task) tasksToAdd.push(applied.task);
    successes.push({ id: order.id, orderNo: order.orderNo, reason: '执行成功' });
    items.push({
      id: order.id,
      orderNo: order.orderNo,
      before: order,
      after: applied.order,
      touchedKeys: applied.touchedKeys,
      createdTask: applied.task || null,
    });
    return applied.order;
  });
  const record = {
    id: `order-operation-${action}-${now}`,
    action,
    label: actionLabels[action],
    createdAt: '刚刚',
    form: { ...form },
    items,
    successes,
    failures,
    undone: false,
  };
  return { orders: nextOrders, tasksToAdd, successes, failures, record };
}

function sameTouchedState(current, after, keys) {
  return keys.every((key) => current?.[key] === after?.[key]);
}

function sameCreatedTask(current, created) {
  return current && ['id', 'sourceId', 'sourceType', 'owner', 'status', 'description'].every((key) => current[key] === created[key]);
}

export function undoBatchOperation(record, currentOrders, currentTasks = []) {
  const successes = [];
  const failures = [];
  const taskIdsToRemove = [];
  const restoration = new Map();
  record.items.forEach((item) => {
    const currentOrder = currentOrders.find((order) => order.id === item.id);
    const taskConflict = item.createdTask && !sameCreatedTask(currentTasks.find((task) => task.id === item.createdTask.id), item.createdTask);
    if (!currentOrder || !sameTouchedState(currentOrder, item.after, item.touchedKeys) || taskConflict) {
      failures.push({ id: item.id, orderNo: item.orderNo, reason: '状态已变化，无法撤销' });
      return;
    }
    const restored = { ...currentOrder };
    item.touchedKeys.forEach((key) => {
      if (Object.hasOwn(item.before, key)) restored[key] = item.before[key];
      else delete restored[key];
    });
    restoration.set(item.id, restored);
    if (item.createdTask) taskIdsToRemove.push(item.createdTask.id);
    successes.push({ id: item.id, orderNo: item.orderNo, reason: '已撤销' });
  });
  return {
    orders: currentOrders.map((order) => restoration.get(order.id) || order),
    taskIdsToRemove,
    successes,
    failures,
  };
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function confidenceAdvice(confidence) {
  const value = Number(confidence || 0);
  if (value >= 0.9) return '高可信，可优先参考';
  if (value >= 0.7) return '中等可信，建议核验关键数据';
  return '低可信，需人工复核';
}

export function buildOrdersCsv(orders) {
  const columns = [
    ['订单号', 'orderNo'], ['风险等级', 'riskLevel'], ['异常类型', 'abnormalType'], ['店铺', 'store'],
    ['平台', 'platform'], ['国家/地区', 'country'], ['异常金额', 'amount'], ['剩余SLA', 'remainingSLA'],
    ['负责人', 'owner'], ['状态', 'status'], ['关联SKU', 'relatedSku'], ['AI建议', 'aiSuggestion'],
  ];
  const header = [...columns.map(([label]) => label), '置信度', '置信度建议说明'];
  const lines = orders.map((order) => [
    ...columns.map(([, key]) => order[key]),
    `${Math.round(Number(order.confidence || 0) * 100)}%`,
    confidenceAdvice(order.confidence),
  ].map(csvCell).join(','));
  return `\uFEFF${header.map(csvCell).join(',')}\r\n${lines.join('\r\n')}`;
}
