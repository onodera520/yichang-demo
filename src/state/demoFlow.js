import { buildCompletionPatch, getCompletionTargetStatus } from './trustLayer.js';
import {
  getTaskInitialStatus,
  getTaskTransitionBlockReason,
  hasAssignedTaskOwner,
  UNASSIGNED_TASK_OWNER,
} from './taskAssignment.js';

const nowLabel = '刚刚';

function requireAssignedOwner(owner, message = '请先分派负责人') {
  if (!hasAssignedTaskOwner(owner)) throw new Error(message);
  return owner;
}

function getManualTaskRemainingSla(deadline) {
  const normalizedDeadline = String(deadline || '').replace(/\s/g, '');
  if (normalizedDeadline.includes('今天14:30')) return '02:00:00';
  if (normalizedDeadline.includes('今天18:00')) return '04:00:00';
  if (normalizedDeadline.includes('明天10:00') || normalizedDeadline.includes('24小时内')) return '24:00:00';
  return '04:00:00';
}

export function buildManualTask(payload) {
  const owner = requireAssignedOwner(payload.owner || UNASSIGNED_TASK_OWNER, '请选择负责人');

  return {
    id: `task-manual-${Date.now()}`,
    title: payload.title,
    source: payload.source,
    sourceType: payload.sourceType,
    riskLevel: payload.riskLevel,
    owner,
    status: getTaskInitialStatus(owner),
    remainingSLA: getManualTaskRemainingSla(payload.deadline),
    deadline: payload.deadline,
    description: payload.description,
    createdAt: nowLabel,
    processLogs: [
      {
        time: nowLabel,
        owner: owner === '未分派' ? '系统' : owner,
        action: '人工创建任务',
        detail: '已创建人工任务',
        tone: 'blue',
      },
    ],
  };
}

export function buildOrderTask(order) {
  const owner = requireAssignedOwner(order.owner || UNASSIGNED_TASK_OWNER);

  return {
    id: `task-order-${order.id}-${Date.now()}`,
    title: `${order.abnormalType}处理`,
    source: order.orderNo,
    sourceId: order.id,
    sourceKind: 'order',
    sourceType: '来源订单',
    riskLevel: order.riskLevel,
    owner,
    status: getTaskInitialStatus(owner),
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
  const quantity = Number(options.quantity ?? sku.suggestedReplenishment ?? 120);
  const owner = requireAssignedOwner(options.owner || sku.owner || UNASSIGNED_TASK_OWNER);

  return {
    id: `task-inventory-${sku.sku}-${Date.now()}`,
    title: `补货 ${quantity} 件至 ${sku.warehouse} 仓`,
    source: sku.sku,
    sourceId: sku.sku,
    sourceKind: 'inventory',
    sourceType: '库存风险',
    riskLevel: sku.riskLevel,
    owner,
    status: getTaskInitialStatus(owner),
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
  const owner = requireAssignedOwner(suggestion.owner || context.owner || UNASSIGNED_TASK_OWNER);

  return {
    id: `task-suggestion-${suggestion.id || sourceId}-${Date.now()}`,
    title: suggestion.taskTitle || suggestion.title,
    source,
    sourceId,
    sourceKind,
    sourceType: suggestion.sourceType || context.sourceType || (sourceKind === 'inventory' ? '库存风险' : '来源订单'),
    riskLevel: suggestion.riskLevel || context.riskLevel || '中',
    owner,
    status: getTaskInitialStatus(owner),
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

export function completeTaskState(state, taskId, completionEvidence) {
  const targetTask = state.tasks.find((task) => task.id === taskId);
  if (!targetTask) return state;
  const targetStatus = completionEvidence
    ? getCompletionTargetStatus(completionEvidence)
    : '已完成';
  const transitionAction = targetStatus === '已升级' ? 'upgrade' : 'complete';
  if (getTaskTransitionBlockReason(targetTask, transitionAction)) return state;

  const completedTask = {
    ...targetTask,
    ...(completionEvidence
      ? buildCompletionPatch(targetTask, completionEvidence)
      : {
          status: '已完成',
          previousRemainingSLA:
            targetTask.remainingSLA && targetTask.remainingSLA !== '-'
              ? targetTask.remainingSLA
              : targetTask.previousRemainingSLA || '04:00:00',
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
        }),
  };
  const shouldSyncSource = completedTask.status === '已完成'
    && completionEvidence?.resolvedSource !== false;

  return {
    ...state,
    tasks: state.tasks.map((task) => (task.id === taskId ? completedTask : task)),
    orders:
      targetTask.sourceKind === 'order' && shouldSyncSource
        ? state.orders.map((order) => (order.id === targetTask.sourceId ? { ...order, status: '已完成' } : order))
        : state.orders,
    inventory:
      targetTask.sourceKind === 'inventory' && shouldSyncSource
        ? state.inventory.map((item) =>
            item.sku === targetTask.sourceId
              ? { ...item, status: '已完成', riskLevel: item.riskLevel === '高' ? '低' : item.riskLevel }
              : item,
          )
        : state.inventory,
  };
}
