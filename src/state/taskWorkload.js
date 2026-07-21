import { getRemainingSlaSeconds } from '../utils/sla.js';

const TERMINAL_STATUSES = new Set(['已完成', '已驳回']);

function roundWeight(value) {
  return Math.round(value * 100) / 100;
}

export function calculateTaskWeight(task, nowMs = Date.now(), anchorMs = nowMs) {
  if (TERMINAL_STATUSES.has(task?.status)) return 0;

  let weight = 1;
  if (task?.riskLevel === '高') weight += 0.35;
  else if (task?.riskLevel === '中') weight += 0.15;

  const remainingSeconds = getRemainingSlaSeconds(task?.remainingSLA, nowMs, anchorMs);
  const overdue = task?.status === '已超时' || remainingSeconds === 0;
  if (overdue) weight += 0.8;
  else if (remainingSeconds != null && remainingSeconds <= 2 * 60 * 60) weight += 0.5;
  else if (remainingSeconds != null && remainingSeconds <= 8 * 60 * 60) weight += 0.25;

  return roundWeight(weight);
}

function getLoadLevel(loadPercent) {
  if (loadPercent >= 85) return 'overloaded';
  if (loadPercent >= 65) return 'busy';
  return 'available';
}

export function calculateMemberWorkloads(
  tasks,
  members,
  nowMs = Date.now(),
  anchorMs = nowMs,
) {
  return members.map((member) => {
    const memberTasks = tasks.filter((task) => (
      task.owner === member.name && !TERMINAL_STATUSES.has(task.status)
    ));
    const weightedLoad = roundWeight(memberTasks.reduce(
      (total, task) => total + calculateTaskWeight(task, nowMs, anchorMs),
      0,
    ));
    const capacity = Number(member.capacity) || 0;
    const loadPercent = capacity > 0
      ? Math.round((weightedLoad / capacity) * 100)
      : weightedLoad > 0 ? 100 : 0;

    return {
      name: member.name,
      active: memberTasks.length,
      overdue: memberTasks.filter((task) => (
        task.status === '已超时'
        || getRemainingSlaSeconds(task.remainingSLA, nowMs, anchorMs) === 0
      )).length,
      highRisk: memberTasks.filter((task) => task.riskLevel === '高').length,
      weightedLoad,
      loadPercent,
      level: getLoadLevel(loadPercent),
      capacity,
      availability: member.availability,
      expertise: [...(member.expertise || [])],
    };
  });
}

function indexWorkloads(workloads) {
  return new Map(workloads.map((workload) => [workload.name, workload]));
}

export function calculateTransferPreview(
  transferTasks,
  tasks,
  members,
  toOwner,
  nowMs = Date.now(),
  anchorMs = nowMs,
) {
  if (!transferTasks?.length || !toOwner) return null;

  const transferIds = new Set(transferTasks.map((task) => task.id));
  const sourceOwners = [...new Set(
    transferTasks.map((task) => task.owner).filter(Boolean),
  )];
  const before = indexWorkloads(calculateMemberWorkloads(
    tasks,
    members,
    nowMs,
    anchorMs,
  ));
  const simulatedTasks = tasks.map((task) => (
    transferIds.has(task.id) ? { ...task, owner: toOwner } : task
  ));
  const after = indexWorkloads(calculateMemberWorkloads(
    simulatedTasks,
    members,
    nowMs,
    anchorMs,
  ));
  const fromOwner = sourceOwners.length === 1 ? sourceOwners[0] : '多个负责人';

  return {
    fromOwner,
    fromBefore: sourceOwners.length === 1 ? (before.get(fromOwner)?.loadPercent ?? 0) : null,
    fromAfter: sourceOwners.length === 1 ? (after.get(fromOwner)?.loadPercent ?? 0) : null,
    toOwner,
    toBefore: before.get(toOwner)?.loadPercent ?? 0,
    toAfter: after.get(toOwner)?.loadPercent ?? 0,
  };
}

export function recommendTaskAssignees(
  task,
  tasks,
  members,
  nowMs = Date.now(),
  anchorMs = nowMs,
  limit = 3,
) {
  if (!task || limit <= 0) return [];

  const taskWeight = calculateTaskWeight(task, nowMs, anchorMs);
  const workloads = indexWorkloads(calculateMemberWorkloads(
    tasks,
    members,
    nowMs,
    anchorMs,
  ));

  return members
    .filter((member) => (
      member.name !== task.owner
      && member.availability !== '不可用'
      && Number(member.capacity) > 0
    ))
    .map((member) => {
      const workload = workloads.get(member.name);
      const currentLoadPercent = workload?.loadPercent ?? 0;
      const projectedWeightedLoad = (workload?.weightedLoad ?? 0) + taskWeight;
      const projectedLoadPercent = Math.round(
        (projectedWeightedLoad / Number(member.capacity)) * 100,
      );
      const expertiseMatch = (member.expertise || []).includes(task.sourceType);
      const score = projectedLoadPercent
        - (expertiseMatch ? 15 : 0)
        + (member.availability === '忙碌' ? 10 : 0);
      const reason = expertiseMatch
        ? `擅长${task.sourceType}，预计负载 ${currentLoadPercent}% → ${projectedLoadPercent}%`
        : `当前负载较低，预计负载 ${currentLoadPercent}% → ${projectedLoadPercent}%`;

      return {
        name: member.name,
        availability: member.availability,
        expertiseMatch,
        currentLoadPercent,
        projectedLoadPercent,
        score,
        reason,
      };
    })
    .filter((candidate) => candidate.projectedLoadPercent <= 100)
    .sort((left, right) => (
      left.score - right.score
      || left.projectedLoadPercent - right.projectedLoadPercent
      || left.name.localeCompare(right.name, 'zh-CN')
    ))
    .slice(0, limit);
}

function updateTaskOwner(tasks, taskId, owner) {
  return tasks.map((task) => (task.id === taskId ? { ...task, owner } : task));
}

export function buildTaskRebalancingPlan(
  tasks,
  members,
  nowMs = Date.now(),
  anchorMs = nowMs,
  maxMoves = 5,
) {
  const beforeWorkloads = calculateMemberWorkloads(tasks, members, nowMs, anchorMs);
  let simulatedTasks = tasks.map((task) => ({ ...task }));
  const movedTaskIds = new Set();
  const moves = [];

  while (moves.length < Math.max(0, maxMoves)) {
    const workloads = calculateMemberWorkloads(simulatedTasks, members, nowMs, anchorMs);
    const overloaded = workloads
      .filter((workload) => workload.level === 'overloaded')
      .sort((left, right) => right.loadPercent - left.loadPercent);
    let nextMove = null;

    for (const sourceWorkload of overloaded) {
      const sourceTasks = simulatedTasks
        .filter((task) => (
          task.owner === sourceWorkload.name
          && !TERMINAL_STATUSES.has(task.status)
          && !movedTaskIds.has(task.id)
        ))
        .map((task, index) => ({
          task,
          index,
          weight: calculateTaskWeight(task, nowMs, anchorMs),
        }))
        .sort((left, right) => right.weight - left.weight || left.index - right.index);

      for (const sourceTask of sourceTasks) {
        const recommendation = recommendTaskAssignees(
          sourceTask.task,
          simulatedTasks,
          members,
          nowMs,
          anchorMs,
          1,
        )[0];
        if (!recommendation) continue;

        const workloadMap = indexWorkloads(workloads);
        const fromBefore = workloadMap.get(sourceWorkload.name)?.loadPercent ?? 0;
        const toBefore = workloadMap.get(recommendation.name)?.loadPercent ?? 0;
        const nextTasks = updateTaskOwner(
          simulatedTasks,
          sourceTask.task.id,
          recommendation.name,
        );
        const afterMap = indexWorkloads(calculateMemberWorkloads(
          nextTasks,
          members,
          nowMs,
          anchorMs,
        ));

        nextMove = {
          taskId: sourceTask.task.id,
          title: sourceTask.task.title,
          fromOwner: sourceWorkload.name,
          toOwner: recommendation.name,
          reason: recommendation.reason,
          before: {
            from: fromBefore,
            to: toBefore,
          },
          after: {
            from: afterMap.get(sourceWorkload.name)?.loadPercent ?? 0,
            to: afterMap.get(recommendation.name)?.loadPercent ?? 0,
          },
        };
        simulatedTasks = nextTasks;
        break;
      }

      if (nextMove) break;
    }

    if (!nextMove) break;
    movedTaskIds.add(nextMove.taskId);
    moves.push(nextMove);
  }

  return {
    moves,
    beforeWorkloads,
    afterWorkloads: calculateMemberWorkloads(simulatedTasks, members, nowMs, anchorMs),
  };
}

export function applyTaskRebalancingPlan(tasks, plan) {
  const moves = new Map((plan?.moves || []).map((move) => [move.taskId, move]));

  return tasks.map((task) => {
    const move = moves.get(task.id);
    if (!move) return task;
    return {
      ...task,
      owner: move.toOwner,
      processLogs: [
        ...(task.processLogs || []),
        {
          time: '刚刚',
          owner: '系统',
          action: '负载调度',
          detail: `系统建议从 ${move.fromOwner} 转交至 ${move.toOwner}；${move.reason}`,
          tone: 'blue',
        },
      ],
    };
  });
}
