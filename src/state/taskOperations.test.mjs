import assert from 'node:assert/strict';
import test from 'node:test';
import * as taskOperations from './taskOperations.js';
import {
  buildTaskReminderPatch,
  buildBatchTaskPatch,
  buildTasksCsv,
  calculateTeamTaskOverview,
  resolveExportTasks,
  sortTasksByCreatedAt,
  sortTasksByDeadline,
  updateTasksByIds,
} from './taskOperations.js';

test('催办只追加主管提醒记录，不改变处理中状态和负责人', () => {
  const task = {
    id: 'task-remind',
    status: '处理中',
    owner: '王敏',
    processLogs: [],
  };

  assert.deepEqual(buildTaskReminderPatch(task), {
    ...task,
    processLogs: [{
      time: '刚刚',
      owner: '张晓',
      action: '主管催办',
      detail: '已提醒负责人尽快处理',
      tone: 'orange',
    }],
  });
});

test('已分派任务使用提醒接单文案且保持已分派', () => {
  const task = { id: 'task-assigned', status: '已分派', owner: '赵宁', processLogs: [] };
  const reminded = buildTaskReminderPatch(task);

  assert.equal(reminded.status, '已分派');
  assert.equal(reminded.owner, '赵宁');
  assert.equal(reminded.processLogs.at(-1).action, '提醒接单');
  assert.equal(reminded.processLogs.at(-1).detail, '已提醒负责人尽快接单');
});

assert.equal(
  typeof taskOperations.calculateDeadlineDistribution,
  'function',
  'task operations should expose calculateDeadlineDistribution',
);

const calculateDeadlineDistribution = taskOperations.calculateDeadlineDistribution;

const baseTask = {
  id: 'task-001',
  owner: '未分派',
  status: '待分派',
  remainingSLA: '04:00:00',
  processLogs: [{ time: '今天 10:00', owner: 'AI', action: '创建任务', detail: '来源异常', tone: 'blue' }],
};

const transferred = buildBatchTaskPatch('transfer', { owner: '陈浩' })(baseTask);
assert.equal(transferred.owner, '陈浩');
assert.equal(transferred.status, '已分派');
assert.equal(transferred.processLogs.at(-1).time, '刚刚');
assert.equal(transferred.processLogs.at(-1).action, '转交任务');

assert.equal(
  buildBatchTaskPatch('transfer')(baseTask),
  baseTask,
  '转交任务必须提供具体负责人',
);
assert.equal(
  buildBatchTaskPatch('upgrade')(baseTask),
  baseTask,
  '未分派任务不能直接升级',
);
const assignedTask = { ...baseTask, owner: '王敏', status: '处理中' };
const upgraded = buildBatchTaskPatch('upgrade')(assignedTask);
assert.equal(upgraded.status, '已升级');
assert.equal(upgraded.processLogs.at(-1).action, '升级任务');

assert.equal(
  buildBatchTaskPatch('close')(assignedTask),
  assignedTask,
  '批量关闭不再是受支持的任务操作',
);

const sortableTasks = [
  { id: 'slow', status: '处理中', remainingSLA: '05:00:00' },
  { id: 'fast-a', status: '处理中', remainingSLA: '01:00:00' },
  { id: 'done', status: '已完成', remainingSLA: '00:01:00' },
  { id: 'invalid', status: '处理中', remainingSLA: 'soon' },
  { id: 'invalid-range', status: '处理中', remainingSLA: '01:99:00' },
  { id: 'fast-b', status: '处理中', remainingSLA: '01:00:00' },
  { id: 'closed', status: '处理中', remainingSLA: '-' },
];
const sortableSnapshot = structuredClone(sortableTasks);
assert.deepEqual(
  sortTasksByDeadline(sortableTasks, 'asc', 3_600_000, 0).map((task) => task.id),
  ['fast-a', 'fast-b', 'slow', 'done', 'invalid', 'invalid-range', 'closed'],
);
assert.deepEqual(
  sortTasksByDeadline(sortableTasks, 'desc', 3_600_000, 0).map((task) => task.id),
  ['slow', 'fast-a', 'fast-b', 'done', 'invalid', 'invalid-range', 'closed'],
);
assert.deepEqual(sortableTasks, sortableSnapshot, '排序不得修改输入数组或任务对象');

const createdAtTasks = [
  { id: 'older', createdAt: '2026-06-25 09:30:00' },
  { id: 'invalid', createdAt: '2026-06-009 09:056:00' },
  { id: 'newest', createdAt: '刚刚' },
  { id: 'same-a', createdAt: '2026-07-17 12:00:00' },
  { id: 'same-b', createdAt: '2026-07-17 12:00:00' },
  { id: 'newer', createdAt: '2026-07-17 15:30:00' },
  { id: 'missing' },
];
const createdAtSnapshot = structuredClone(createdAtTasks);
assert.deepEqual(
  sortTasksByCreatedAt(createdAtTasks).map((task) => task.id),
  ['newest', 'newer', 'same-a', 'same-b', 'older', 'invalid', 'missing'],
  '创建时间排序应最新优先、同时间稳定，并把非法日期放在末尾',
);
assert.deepEqual(createdAtTasks, createdAtSnapshot, '创建时间排序不得修改输入数组或任务对象');

const allTasks = [{ id: 'task-1' }, { id: 'task-2' }, { id: 'task-3' }];
const filteredTasks = [{ id: 'task-3' }, { id: 'task-1' }];
assert.deepEqual(resolveExportTasks(allTasks, ['task-3', 'task-1'], filteredTasks), [allTasks[0], allTasks[2]]);
assert.equal(resolveExportTasks(allTasks, [], filteredTasks), filteredTasks);

const csv = buildTasksCsv([
  {
    riskLevel: '高',
    title: '处理 "缺货", 并确认',
    source: '订单A\n订单B',
    owner: '王敏',
    status: '处理中',
    remainingSLA: '01:00:00',
    createdAt: '刚刚',
  },
]);
assert.equal(
  csv,
  '\uFEFF风险等级,任务标题,来源异常,负责人,状态,剩余 SLA,创建时间\r\n高,"处理 ""缺货"", 并确认","订单A\n订单B",王敏,处理中,01:00:00,刚刚',
);

const mixedIdTasks = [{ id: 'task-1', status: '待分派' }, { id: 2, status: '待分派' }, { id: 'task-3', status: '待分派' }];
const updatedTasks = updateTasksByIds(mixedIdTasks, ['task-1', 2, 'missing'], { status: '已升级' });
assert.deepEqual(updatedTasks.map((task) => task.status), ['已升级', '已升级', '待分派']);
assert.equal(updatedTasks[2], mixedIdTasks[2], '未命中任务保持原引用');
assert.deepEqual(mixedIdTasks.map((task) => task.status), ['待分派', '待分派', '待分派']);

const distributionTasks = [
  { id: 'status-overdue', status: '已超时', remainingSLA: '10:00:00' },
  { id: 'zero', status: '处理中', remainingSLA: '00:00:00' },
  { id: 'two-hours', status: '处理中', remainingSLA: '02:00:00' },
  { id: 'over-two-hours', status: '处理中', remainingSLA: '02:00:01' },
  { id: 'eight-hours', status: '处理中', remainingSLA: '08:00:00' },
  { id: 'over-eight-hours', status: '处理中', remainingSLA: '08:00:01' },
  { id: 'twenty-four-hours', status: '处理中', remainingSLA: '24:00:00' },
  { id: 'over-twenty-four-hours', status: '处理中', remainingSLA: '24:00:01' },
  { id: 'completed', status: '已完成', remainingSLA: '01:00:00' },
  { id: 'invalid', status: '处理中', remainingSLA: '01:99:00' },
  { id: 'missing', status: '处理中' },
];
const distributionSnapshot = structuredClone(distributionTasks);

assert.deepEqual(calculateDeadlineDistribution(distributionTasks, 0, 0), {
  overdue: 2,
  within2Hours: 1,
  within8Hours: 2,
  within24Hours: 2,
  over24Hours: 1,
});
assert.deepEqual(distributionTasks, distributionSnapshot, 'distribution calculation must not mutate tasks');

assert.equal(
  calculateDeadlineDistribution([{ status: '处理中', remainingSLA: '00:00:01' }], 1_000, 0).overdue,
  1,
  'a live SLA reaching zero should move into overdue',
);

const overdueTask = { id: 'overdue-task', owner: '王敏', status: '处理中', remainingSLA: '00:00:00', processLogs: [] };
assert.equal(calculateDeadlineDistribution([overdueTask], 0, 0).overdue, 1);
assert.equal(
  calculateDeadlineDistribution([{ status: '待分派', remainingSLA: '04:00:00' }], 0, 0).within8Hours,
  1,
  'a newly created four-hour task should enter the 2-8 hour bucket',
);

const teamTasks = [
  { id: 'wang-active', owner: '王敏', status: '处理中', riskLevel: '高', remainingSLA: '04:00:00' },
  { id: 'wang-overdue', owner: '王敏', status: '已超时', riskLevel: '高', remainingSLA: '08:00:00' },
  { id: 'wang-completed', owner: '王敏', status: '已完成', riskLevel: '高', remainingSLA: '-' },
  { id: 'zhao-live-overdue', owner: '赵宁', status: '已分派', riskLevel: '中', remainingSLA: '00:00:01' },
  { id: 'unassigned', owner: '未分派', status: '待分派', riskLevel: '高', remainingSLA: '02:00:00' },
];
const teamSnapshot = structuredClone(teamTasks);
const teamOverview = calculateTeamTaskOverview(
  teamTasks,
  ['王敏', '赵宁', '未分派'],
  { 王敏: 10, 赵宁: 10, 未分派: 0 },
  1_000,
  0,
);

assert.deepEqual(teamOverview, [
  { name: '王敏', active: 2, overdue: 1, highRisk: 2, loadPercent: 20 },
  { name: '赵宁', active: 1, overdue: 1, highRisk: 0, loadPercent: 10 },
  { name: '未分派', active: 1, overdue: 0, highRisk: 1, loadPercent: 0 },
]);
assert.deepEqual(teamTasks, teamSnapshot, 'team overview calculation must not mutate tasks');

const transferredTeamTasks = teamTasks.map((task) => (
  task.id === 'wang-active' ? { ...task, owner: '赵宁' } : task
));
assert.deepEqual(
  calculateTeamTaskOverview(
    transferredTeamTasks,
    ['王敏', '赵宁'],
    { 王敏: 10, 赵宁: 10 },
    0,
    0,
  ).map(({ name, active }) => [name, active]),
  [['王敏', 1], ['赵宁', 2]],
  'transferring a task should immediately move it between owners',
);

const completedTeamTasks = teamTasks.map((task) => (
  task.id === 'wang-overdue' ? { ...task, status: '已完成', remainingSLA: '-' } : task
));
assert.deepEqual(
  calculateTeamTaskOverview(completedTeamTasks, ['王敏'], { 王敏: 10 }, 0, 0)[0],
  { name: '王敏', active: 1, overdue: 0, highRisk: 1, loadPercent: 10 },
  'completing a task should reduce all applicable team metrics',
);

assert.equal(
  calculateTeamTaskOverview(
    Array.from({ length: 9 }, (_, index) => ({ id: index, owner: '刘畅', status: '处理中', riskLevel: '低', remainingSLA: '03:00:00' })),
    ['刘畅'],
    { 刘畅: 8 },
    0,
    0,
  )[0].loadPercent,
  100,
  'load percentage should be capped at 100',
);

console.log('task operations tests passed');
