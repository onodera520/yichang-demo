function normalizeTaskIds(taskIds) {
  return [...new Set((taskIds ?? []).filter(Boolean))];
}

export function createTaskAdvanceIntent(taskIds, currentTaskId) {
  const orderedIds = normalizeTaskIds(taskIds);
  const currentIndex = orderedIds.indexOf(currentTaskId);

  return {
    currentTaskId,
    nextTaskId: currentIndex >= 0 ? orderedIds[currentIndex + 1] ?? null : null,
    previousTaskId: currentIndex > 0 ? orderedIds[currentIndex - 1] : null,
  };
}

export function resolveTaskAdvance(intent, taskIds, pageSize) {
  const orderedIds = normalizeTaskIds(taskIds);
  if (!orderedIds.length) {
    return { taskId: null, page: 1, isQueueComplete: true };
  }

  const candidates = [intent?.nextTaskId, intent?.currentTaskId, intent?.previousTaskId];
  const taskId = candidates.find((candidate) => orderedIds.includes(candidate)) ?? orderedIds[0];
  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const page = Math.floor(orderedIds.indexOf(taskId) / safePageSize) + 1;

  return { taskId, page, isQueueComplete: false };
}

export function createSourceAdvanceIntent(itemIds, currentItemId) {
  const orderedIds = normalizeTaskIds(itemIds);
  const currentIndex = orderedIds.indexOf(currentItemId);

  return {
    successorIds: currentIndex >= 0 ? orderedIds.slice(currentIndex + 1) : [],
  };
}

export function resolveSourceAdvance(intent, itemIds, pageSize) {
  const orderedIds = normalizeTaskIds(itemIds);
  const itemId = (intent?.successorIds ?? []).find((candidate) => orderedIds.includes(candidate)) ?? null;

  if (!itemId) {
    return { itemId: null, page: 1, isQueueComplete: true };
  }

  const safePageSize = Math.max(1, Number(pageSize) || 1);
  const page = Math.floor(orderedIds.indexOf(itemId) / safePageSize) + 1;
  return { itemId, page, isQueueComplete: false };
}
