import { hasAssignedTaskOwner } from './taskAssignment.js';

const RETURN_ACTIONS = {
  待确认: {
    type: 'return',
    label: '退回',
    action: '退回任务',
    targetStatus: '处理中',
  },
  已升级: {
    type: 'return',
    label: '退回处理',
    action: '退回任务',
    targetStatus: '处理中',
  },
};

const TASK_RETURN_REASON_OPTIONS = {
  return: [
    '处理信息不完整',
    '缺少必要凭证',
    '处理结果不符合要求',
    '来源数据需要复核',
    '需要重新处理',
  ],
  reopen: [
    '问题未实际解决',
    '处理结果出现反复',
    '来源数据发生变化',
    '完成凭证有误',
    '需要补充后续处理',
  ],
};

function createResult(state, task) {
  return { ok: true, state, task };
}

function createError(state, error) {
  return { ok: false, state, error };
}

function findTask(state, taskId) {
  return state.tasks.find((task) => task.id === taskId);
}

function appendReturnLog(task, config, reason, remark) {
  const remarkSuffix = remark ? `；备注：${remark}` : '';
  return [
    ...(task.processLogs || []),
    {
      time: '刚刚',
      owner: hasAssignedTaskOwner(task.owner) ? task.owner : '系统',
      action: config.action,
      detail: `${task.status} → ${config.targetStatus}；原因：${reason}${remarkSuffix}`,
      tone: config.type === 'reopen' ? 'orange' : 'blue',
    },
  ];
}

function sourceExists(state, task) {
  if (task.sourceKind === 'order') {
    return state.orders.some((order) => order.id === task.sourceId);
  }
  if (task.sourceKind === 'inventory') {
    return state.inventory.some((item) => item.sku === task.sourceId);
  }
  return true;
}

export function getTaskReturnAction(task) {
  if (!task) return null;
  if (task.status === '已完成') {
    return {
      type: 'reopen',
      label: '重新打开',
      action: '重新打开任务',
      targetStatus: hasAssignedTaskOwner(task.owner) ? '处理中' : '待分派',
    };
  }
  return RETURN_ACTIONS[task.status] ? { ...RETURN_ACTIONS[task.status] } : null;
}

export function getTaskReturnReasonOptions(actionType) {
  return [...(TASK_RETURN_REASON_OPTIONS[actionType] || [])];
}

export function validateTaskReturnReason(reason, actionType) {
  const normalizedReason = String(reason ?? '').trim();
  if (!normalizedReason) return '请选择原因';
  if (!getTaskReturnReasonOptions(actionType).includes(normalizedReason)) return '请选择有效原因';
  return null;
}

export function validateTaskReturnRemark(remark) {
  const normalizedRemark = String(remark ?? '').trim();
  if (normalizedRemark.length > 100) return '备注不能超过 100 字';
  return null;
}

export function returnTaskState(state, taskId, { reason, remark } = {}) {
  const task = findTask(state, taskId);
  const config = getTaskReturnAction(task);
  if (!task || !config || config.type === 'reopen') {
    return createError(state, '当前状态无法退回');
  }
  const validationError = validateTaskReturnReason(reason, config.type);
  if (validationError) return createError(state, validationError);
  const remarkError = validateTaskReturnRemark(remark);
  if (remarkError) return createError(state, remarkError);

  const normalizedReason = String(reason).trim();
  const normalizedRemark = String(remark ?? '').trim();
  const returnedTask = {
    ...task,
    status: config.targetStatus,
    owner: task.owner,
    processLogs: appendReturnLog(task, config, normalizedReason, normalizedRemark),
  };
  const nextState = {
    ...state,
    tasks: state.tasks.map((item) => (item.id === taskId ? returnedTask : item)),
  };

  return createResult(nextState, returnedTask);
}

export function reopenTaskState(state, taskId, { reason, remark } = {}) {
  const task = findTask(state, taskId);
  const config = getTaskReturnAction(task);
  if (!task || !config || config.type !== 'reopen') {
    return createError(state, '当前状态无法退回');
  }
  const validationError = validateTaskReturnReason(reason, config.type);
  if (validationError) return createError(state, validationError);
  const remarkError = validateTaskReturnRemark(remark);
  if (remarkError) return createError(state, remarkError);
  if (!sourceExists(state, task)) {
    return createError(state, '来源对象不存在，无法重新打开');
  }

  const normalizedReason = String(reason).trim();
  const normalizedRemark = String(remark ?? '').trim();
  const {
    completionEvidence,
    previousRemainingSLA,
    ...taskWithoutCompletion
  } = task;
  const reopenedTask = {
    ...taskWithoutCompletion,
    status: config.targetStatus,
    remainingSLA: previousRemainingSLA || '04:00:00',
    processLogs: appendReturnLog(task, config, normalizedReason, normalizedRemark),
  };
  const shouldRollbackSource = completionEvidence?.resolvedSource !== false;
  const nextState = {
    ...state,
    tasks: state.tasks.map((item) => (item.id === taskId ? reopenedTask : item)),
    orders:
      task.sourceKind === 'order' && shouldRollbackSource
        ? state.orders.map((order) => (
            order.id === task.sourceId && order.status === '已完成'
              ? { ...order, status: '处理中' }
              : order
          ))
        : state.orders,
    inventory:
      task.sourceKind === 'inventory' && shouldRollbackSource
        ? state.inventory.map((item) => (
            item.sku === task.sourceId && item.status === '已完成'
              ? { ...item, status: '待补货' }
              : item
          ))
        : state.inventory,
  };

  return createResult(nextState, reopenedTask);
}
