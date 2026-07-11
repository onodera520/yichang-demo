const nowLabel = '刚刚';

export function buildOrderTask(order) {
  return {
    id: `task-order-${order.id}-${Date.now()}`,
    title: `${order.abnormalType}处理`,
    source: order.orderNo,
    sourceId: order.id,
    sourceKind: 'order',
    sourceType: '来源订单',
    riskLevel: order.riskLevel,
    owner: order.owner || '未分派',
    status: '待分派',
    remainingSLA: order.remainingSLA || '04:00:00',
    deadline: '今天 18:00',
    createdAt: nowLabel,
    description: order.aiSuggestion || `${order.orderNo} 需要运营同学确认并处理异常。`,
    impact: order.impact || `预计影响金额 ¥${Number(order.amount || 0).toLocaleString('zh-CN')}`,
    processLogs: [
      {
        time: nowLabel,
        owner: 'AI',
        action: '生成任务',
        detail: `来自订单异常 ${order.orderNo}`,
        tone: 'blue',
      },
    ],
  };
}

export function buildInventoryTask(sku, options = {}) {
  const quantity = Number(options.quantity || sku.suggestedReplenishment || 120);

  return {
    id: `task-inventory-${sku.sku}-${Date.now()}`,
    title: `补货 ${quantity} 件至 ${sku.warehouse} 仓`,
    source: sku.sku,
    sourceId: sku.sku,
    sourceKind: 'inventory',
    sourceType: '库存风险',
    riskLevel: sku.riskLevel,
    owner: options.owner || '赵宁',
    status: '待分派',
    remainingSLA: '04:00:00',
    deadline: '今天 18:00',
    createdAt: nowLabel,
    description: sku.aiSuggestion || `${sku.productName} 需要创建补货任务。`,
    impact: `建议补货 ${quantity} 件，置信度 ${Math.round((sku.confidence || 0.8) * 100)}%`,
    processLogs: [
      {
        time: nowLabel,
        owner: 'AI',
        action: '创建补货任务',
        detail: `来自库存风险 ${sku.sku}`,
        tone: 'blue',
      },
    ],
  };
}

export function buildSuggestionTask(suggestion, context = {}) {
  const sourceKind = suggestion.sourceKind || context.sourceKind || 'order';
  const sourceId = suggestion.sourceId || context.sourceId || suggestion.source;
  const source = suggestion.source || context.source || sourceId;
  const confidence = suggestion.confidence ?? context.confidence;
  const confidenceText = typeof confidence === 'number' ? `，置信度 ${Math.round(confidence * 100)}%` : '';

  return {
    id: `task-suggestion-${suggestion.id || sourceId}-${Date.now()}`,
    title: suggestion.taskTitle || suggestion.title,
    source,
    sourceId,
    sourceKind,
    sourceType: suggestion.sourceType || context.sourceType || (sourceKind === 'inventory' ? '库存风险' : '来源订单'),
    riskLevel: suggestion.riskLevel || context.riskLevel || '中',
    owner: suggestion.owner || context.owner || '未分派',
    status: suggestion.status || '待分派',
    remainingSLA: suggestion.remainingSLA || context.remainingSLA || '04:00:00',
    deadline: suggestion.deadline || context.deadline || '今天 18:00',
    createdAt: nowLabel,
    description: suggestion.taskDescription || suggestion.description || suggestion.title,
    impact: `${suggestion.impact || context.impact || '待评估影响范围'}${confidenceText}`,
    processLogs: [
      {
        time: nowLabel,
        owner: 'AI',
        action: '生成任务',
        detail: `来自今日建议 - ${suggestion.title}`,
        tone: 'blue',
      },
    ],
  };
}

export function completeTaskState(state, taskId) {
  const targetTask = state.tasks.find((task) => task.id === taskId);
  if (!targetTask) return state;

  const completedTask = {
    ...targetTask,
    status: '已完成',
    remainingSLA: '-',
    processLogs: [
      ...(targetTask.processLogs || []),
      {
        time: nowLabel,
        owner: targetTask.owner || '系统',
        action: '完成任务',
        detail: '任务已完成，对应异常状态已同步',
        tone: 'green',
      },
    ],
  };

  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === taskId ? completedTask : task)),
    orders:
      targetTask.sourceKind === 'order'
        ? state.orders.map((order) => (order.id === targetTask.sourceId ? { ...order, status: '已完成' } : order))
        : state.orders,
    inventory:
      targetTask.sourceKind === 'inventory'
        ? state.inventory.map((item) =>
            item.sku === targetTask.sourceId
              ? { ...item, status: '已完成', riskLevel: item.riskLevel === '高' ? '低' : item.riskLevel }
              : item,
          )
        : state.inventory,
  };
}
