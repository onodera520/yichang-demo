export const TASK_NOTICE_STATUSES = [
  '待分派',
  '已分派',
  '处理中',
  '待确认',
  '已完成',
  '已超时',
  '已升级',
];

export function createTaskTabNotices() {
  return Object.fromEntries(TASK_NOTICE_STATUSES.map((status) => [status, []]));
}

function cloneTaskTabNotices(notices) {
  const next = createTaskTabNotices();
  for (const status of TASK_NOTICE_STATUSES) {
    next[status] = [...new Set(notices?.[status] ?? [])];
  }
  return next;
}

function removeTaskNotice(notices, taskId) {
  for (const status of TASK_NOTICE_STATUSES) {
    notices[status] = notices[status].filter((id) => id !== taskId);
  }
}

export function reconcileTaskTabNotices(notices, previousTasks, nextTasks) {
  const nextNotices = cloneTaskTabNotices(notices);
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));
  const nextById = new Map(nextTasks.map((task) => [task.id, task]));

  for (const previousTask of previousTasks) {
    const nextTask = nextById.get(previousTask.id);
    if (!nextTask || nextTask.status !== previousTask.status) {
      removeTaskNotice(nextNotices, previousTask.id);
    }
  }

  for (const nextTask of nextTasks) {
    const previousTask = previousById.get(nextTask.id);
    if (previousTask && previousTask.status === nextTask.status) continue;

    removeTaskNotice(nextNotices, nextTask.id);
    if (TASK_NOTICE_STATUSES.includes(nextTask.status)) {
      nextNotices[nextTask.status].push(nextTask.id);
    }
  }

  return nextNotices;
}

export function clearTaskTabNotice(notices, status) {
  const nextNotices = cloneTaskTabNotices(notices);
  if (TASK_NOTICE_STATUSES.includes(status)) nextNotices[status] = [];
  return nextNotices;
}

export function formatTaskTabNoticeCount(count) {
  const normalizedCount = Math.max(0, Number(count) || 0);
  return normalizedCount > 99 ? '99+' : String(normalizedCount);
}

export function prioritizeTasksByIds(tasks, taskIds) {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const prioritizedIds = [...new Set(taskIds)].filter((id) => taskById.has(id));
  const prioritizedIdSet = new Set(prioritizedIds);

  return [
    ...prioritizedIds.map((id) => taskById.get(id)),
    ...tasks.filter((task) => !prioritizedIdSet.has(task.id)),
  ];
}
