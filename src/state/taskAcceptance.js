function sourceExists(task, orders = [], inventory = []) {
  if (task?.sourceKind === 'order') {
    return orders.some((order) => order.id === task.sourceId);
  }
  if (task?.sourceKind === 'inventory') {
    return inventory.some((item) => item.sku === task.sourceId);
  }
  return true;
}

function hasEvidenceText(value) {
  return Boolean(String(value ?? '').trim());
}

export function getTaskAcceptanceChecks(task, orders = [], inventory = []) {
  const evidence = task?.completionEvidence;
  return [
    {
      key: 'evidence',
      label: '处理结果和执行说明完整',
      passed: hasEvidenceText(evidence?.result) && hasEvidenceText(evidence?.description),
      error: '员工处理结果或执行说明不完整',
    },
    {
      key: 'resolvedSource',
      label: '员工已标记原异常解决',
      passed: evidence?.resolvedSource === true,
      error: '员工尚未确认原异常已解决',
    },
    {
      key: 'proof',
      label: '已提供关联单号或附件凭证',
      passed: hasEvidenceText(evidence?.referenceNo) || hasEvidenceText(evidence?.attachment?.name),
      error: '缺少关联单号或附件凭证',
    },
    {
      key: 'source',
      label: '来源对象存在且可核验',
      passed: sourceExists(task, orders, inventory),
      error: '来源对象不存在，暂时无法验收',
    },
  ];
}

export function getTaskAcceptanceBlockReason(task, orders = [], inventory = []) {
  if (!task || task.status !== '待验收') return '当前状态无法验收';
  return getTaskAcceptanceChecks(task, orders, inventory).find((check) => !check.passed)?.error ?? '';
}

export function acceptTaskState(
  state,
  taskId,
  { confirmed = false, reviewer = '张晓', note = '' } = {},
) {
  const task = state.tasks.find((item) => item.id === taskId);
  const blockReason = getTaskAcceptanceBlockReason(task, state.orders, state.inventory);
  if (blockReason) return { ok: false, state, error: blockReason };
  if (!confirmed) return { ok: false, state, error: '请确认已核对处理结果和凭证' };

  const normalizedNote = String(note ?? '').trim();
  const checks = getTaskAcceptanceChecks(task, state.orders, state.inventory);
  const acceptedTask = {
    ...task,
    status: '已完成',
    previousRemainingSLA:
      task.remainingSLA && task.remainingSLA !== '-'
        ? task.remainingSLA
        : task.previousRemainingSLA || '04:00:00',
    remainingSLA: '-',
    acceptance: {
      reviewer,
      reviewedAt: '刚刚',
      note: normalizedNote,
      checks: checks.map(({ key, label }) => ({ key, label, passed: true })),
    },
    processLogs: [
      ...(task.processLogs || []),
      {
        time: '刚刚',
        owner: reviewer,
        action: '验收通过',
        detail: normalizedNote || '已核对员工处理结果、执行凭证和来源状态',
        tone: 'green',
      },
    ],
  };

  return {
    ok: true,
    task: acceptedTask,
    state: {
      ...state,
      tasks: state.tasks.map((item) => (item.id === taskId ? acceptedTask : item)),
      orders:
        task.sourceKind === 'order'
          ? state.orders.map((order) => (
              order.id === task.sourceId ? { ...order, status: '已完成' } : order
            ))
          : state.orders,
      inventory:
        task.sourceKind === 'inventory'
          ? state.inventory.map((item) => (
              item.sku === task.sourceId ? { ...item, status: '已完成' } : item
            ))
          : state.inventory,
    },
  };
}

export function acceptTasksState(state, taskIds, { reviewer = '张晓', note = '' } = {}) {
  const uniqueTaskIds = [...new Set((taskIds ?? []).filter(Boolean))];
  let currentState = state;
  const acceptedIds = [];
  const skipped = [];

  uniqueTaskIds.forEach((taskId) => {
    const task = currentState.tasks.find((item) => item.id === taskId);
    const result = acceptTaskState(currentState, taskId, {
      confirmed: true,
      reviewer,
      note,
    });

    if (!result.ok) {
      skipped.push({
        id: taskId,
        title: task?.title || taskId,
        reason: result.error,
      });
      return;
    }

    acceptedIds.push(taskId);
    currentState = result.state;
  });

  return {
    ok: acceptedIds.length > 0,
    state: currentState,
    acceptedIds,
    skipped,
    error: acceptedIds.length > 0 ? '' : '没有符合验收条件的任务',
  };
}
