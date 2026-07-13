import { getRemainingSlaSeconds } from '../utils/sla.js';

const batchActions = {
  transfer: {
    action: '转交任务',
    tone: 'blue',
    detail: (owner) => `已转交给 ${owner || '新负责人'}`,
  },
  upgrade: {
    action: '升级任务',
    tone: 'red',
    detail: () => '已升级主管处理',
  },
  close: {
    action: '关闭任务',
    tone: 'green',
    detail: () => '任务已批量关闭',
  },
};

export function buildBatchTaskPatch(action, payload = {}) {
  const definition = batchActions[action];

  return (task) => {
    if (!definition) return task;

    const owner = payload.owner ?? task.owner;
    const patch = {
      processLogs: [
        ...(task.processLogs || []),
        {
          time: '刚刚',
          owner: owner || '系统',
          action: definition.action,
          detail: definition.detail(owner),
          tone: definition.tone,
        },
      ],
    };

    if (action === 'transfer') {
      patch.owner = owner;
      patch.status = task.status === '待分派' ? '已分派' : task.status;
    }

    if (action === 'upgrade') patch.status = '已升级';

    if (action === 'close') {
      patch.status = '已完成';
      patch.remainingSLA = '-';
    }

    return { ...task, ...patch };
  };
}

function hasValidSlaFormat(value) {
  const match = /^(\d+):(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;

  const [, hours, minutes, seconds] = match;
  return Number(hours) >= 0 && Number(minutes) <= 59 && Number(seconds) <= 59;
}

function isSortableTask(task, nowMs, anchorMs) {
  if (task.status === '已完成' || task.remainingSLA === '-') return null;
  if (!hasValidSlaFormat(task.remainingSLA)) return null;
  return getRemainingSlaSeconds(task.remainingSLA, nowMs, anchorMs);
}

export function calculateDeadlineDistribution(tasks, nowMs = Date.now(), anchorMs = nowMs) {
  const distribution = {
    overdue: 0,
    within2Hours: 0,
    within8Hours: 0,
    within24Hours: 0,
    over24Hours: 0,
  };

  for (const task of tasks) {
    if (task.status === '已完成') continue;
    if (task.status === '已超时') {
      distribution.overdue += 1;
      continue;
    }
    if (!hasValidSlaFormat(task.remainingSLA)) continue;

    const seconds = getRemainingSlaSeconds(task.remainingSLA, nowMs, anchorMs);
    if (seconds === 0) distribution.overdue += 1;
    else if (seconds <= 2 * 60 * 60) distribution.within2Hours += 1;
    else if (seconds <= 8 * 60 * 60) distribution.within8Hours += 1;
    else if (seconds <= 24 * 60 * 60) distribution.within24Hours += 1;
    else distribution.over24Hours += 1;
  }

  return distribution;
}

export function calculateTeamTaskOverview(
  tasks,
  owners,
  capacities,
  nowMs = Date.now(),
  anchorMs = nowMs,
) {
  return owners.map((name) => {
    const ownerTasks = tasks.filter((task) => (task.owner || '未分派') === name && task.status !== '已完成');
    const overdue = ownerTasks.filter((task) => {
      if (task.status === '已超时') return true;
      if (!hasValidSlaFormat(task.remainingSLA)) return false;
      return getRemainingSlaSeconds(task.remainingSLA, nowMs, anchorMs) === 0;
    }).length;
    const capacity = Number(capacities[name]) || 0;
    const loadPercent = capacity > 0
      ? Math.min(100, Math.round((ownerTasks.length / capacity) * 10) * 10)
      : 0;

    return {
      name,
      active: ownerTasks.length,
      overdue,
      highRisk: ownerTasks.filter((task) => task.riskLevel === '高').length,
      loadPercent,
    };
  });
}

export function sortTasksByDeadline(tasks, direction = 'asc', nowMs = Date.now(), anchorMs = nowMs) {
  const multiplier = direction === 'desc' ? -1 : 1;

  return tasks
    .map((task, index) => ({ task, index, deadline: isSortableTask(task, nowMs, anchorMs) }))
    .sort((left, right) => {
      const leftIsLast = left.deadline == null;
      const rightIsLast = right.deadline == null;
      if (leftIsLast || rightIsLast) {
        if (leftIsLast && rightIsLast) return left.index - right.index;
        return leftIsLast ? 1 : -1;
      }

      const difference = left.deadline - right.deadline;
      return difference === 0 ? left.index - right.index : difference * multiplier;
    })
    .map(({ task }) => task);
}

export function resolveExportTasks(allTasks, selectedIds, filteredTasks) {
  if (!selectedIds?.length) return filteredTasks;
  const selected = new Set(selectedIds);
  return allTasks.filter((task) => selected.has(task.id));
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildTasksCsv(tasks) {
  const columns = [
    ['风险等级', 'riskLevel'],
    ['任务标题', 'title'],
    ['来源异常', 'source'],
    ['负责人', 'owner'],
    ['状态', 'status'],
    ['剩余 SLA', 'remainingSLA'],
    ['创建时间', 'createdAt'],
  ];
  const header = columns.map(([label]) => label).join(',');
  const rows = tasks.map((task) => columns.map(([, field]) => escapeCsv(task[field])).join(','));
  return `\uFEFF${[header, ...rows].join('\r\n')}`;
}

export function updateTasksByIds(tasks, taskIds, updater) {
  const ids = new Set(taskIds);
  return tasks.map((task) => {
    if (!ids.has(task.id)) return task;
    return typeof updater === 'function' ? updater(task) : { ...task, ...updater };
  });
}
