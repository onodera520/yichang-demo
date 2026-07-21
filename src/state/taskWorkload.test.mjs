import assert from 'node:assert/strict';
import {
  applyTaskRebalancingPlan,
  buildTaskRebalancingPlan,
  calculateMemberWorkloads,
  calculateTaskWeight,
  calculateTransferPreview,
  recommendTaskAssignees,
} from './taskWorkload.js';

assert.equal(
  calculateTaskWeight(
    { riskLevel: '高', status: '处理中', remainingSLA: '01:00:00' },
    0,
    0,
  ),
  1.85,
  'high-risk work due within two hours should carry urgency weight',
);
assert.equal(
  calculateTaskWeight(
    { riskLevel: '低', status: '已完成', remainingSLA: '-' },
    0,
    0,
  ),
  0,
  'completed work must not consume team capacity',
);
assert.equal(
  calculateTaskWeight(
    { riskLevel: '中', status: '已超时', remainingSLA: '00:00:00' },
    0,
    0,
  ),
  1.95,
  'overdue work should use the overdue weight without stacking the two-hour weight',
);

const members = [
  { name: '王敏', capacity: 2, expertise: ['来源订单'], availability: '可接单' },
  { name: '李娜', capacity: 10, expertise: ['库存风险'], availability: '可接单' },
];
const tasks = [
  { id: 'urgent', owner: '王敏', riskLevel: '高', status: '处理中', remainingSLA: '01:00:00' },
  { id: 'normal', owner: '王敏', riskLevel: '低', status: '处理中', remainingSLA: '10:00:00' },
  { id: 'available', owner: '李娜', riskLevel: '低', status: '已分派', remainingSLA: '10:00:00' },
  { id: 'done', owner: '王敏', riskLevel: '高', status: '已完成', remainingSLA: '-' },
];
const snapshot = structuredClone({ members, tasks });
const workloads = calculateMemberWorkloads(tasks, members, 0, 0);

assert.deepEqual(
  workloads.map(({ name, level }) => [name, level]),
  [['王敏', 'overloaded'], ['李娜', 'available']],
);
assert.deepEqual(workloads[0], {
  name: '王敏',
  active: 2,
  overdue: 0,
  highRisk: 1,
  weightedLoad: 2.85,
  loadPercent: 143,
  level: 'overloaded',
  capacity: 2,
  availability: '可接单',
  expertise: ['来源订单'],
});
assert.deepEqual({ members, tasks }, snapshot, 'workload calculations must not mutate inputs');

const recommendationMembers = [
  { name: '王敏', capacity: 2, expertise: ['来源订单'], availability: '可接单' },
  { name: '李娜', capacity: 10, expertise: ['库存风险'], availability: '可接单' },
  { name: '赵宁', capacity: 10, expertise: ['物流异常'], availability: '可接单' },
  { name: '张磊', capacity: 10, expertise: ['库存风险'], availability: '不可用' },
];
const recommendationTasks = [
  {
    id: 'move-me',
    title: '补货风险处理',
    sourceType: '库存风险',
    owner: '王敏',
    riskLevel: '高',
    status: '处理中',
    remainingSLA: '01:00:00',
    processLogs: [],
  },
  {
    id: 'wang-normal',
    title: '订单复核',
    sourceType: '来源订单',
    owner: '王敏',
    riskLevel: '低',
    status: '处理中',
    remainingSLA: '10:00:00',
    processLogs: [],
  },
  {
    id: 'li-normal',
    title: '库存复核',
    sourceType: '库存风险',
    owner: '李娜',
    riskLevel: '低',
    status: '处理中',
    remainingSLA: '10:00:00',
    processLogs: [],
  },
];

const recommendations = recommendTaskAssignees(
  recommendationTasks[0],
  recommendationTasks,
  recommendationMembers,
  0,
  0,
  3,
);
assert.deepEqual(recommendations.map(({ name }) => name), ['李娜', '赵宁']);
assert.equal(recommendations.some(({ name }) => name === '王敏'), false);
assert.equal(recommendations.some(({ name }) => name === '张磊'), false);
assert.equal(recommendations[0].expertiseMatch, true);
assert.match(recommendations[0].reason, /擅长库存风险/);
assert.equal(recommendations[0].currentLoadPercent, 10);
assert.equal(recommendations[0].projectedLoadPercent, 29);

assert.deepEqual(
  calculateTransferPreview(
    [recommendationTasks[0]],
    recommendationTasks,
    recommendationMembers,
    '李娜',
    0,
    0,
  ),
  {
    fromOwner: '王敏',
    fromBefore: 143,
    fromAfter: 50,
    toOwner: '李娜',
    toBefore: 10,
    toAfter: 29,
  },
);

const plan = buildTaskRebalancingPlan(
  recommendationTasks,
  recommendationMembers,
  0,
  0,
  5,
);
assert.equal(plan.moves.length, 1);
assert.deepEqual(
  {
    taskId: plan.moves[0].taskId,
    fromOwner: plan.moves[0].fromOwner,
    toOwner: plan.moves[0].toOwner,
    before: plan.moves[0].before,
    after: plan.moves[0].after,
  },
  {
    taskId: 'move-me',
    fromOwner: '王敏',
    toOwner: '李娜',
    before: { from: 143, to: 10 },
    after: { from: 50, to: 29 },
  },
);

const planInputSnapshot = structuredClone(recommendationTasks);
const rebalancedTasks = applyTaskRebalancingPlan(recommendationTasks, plan);
const movedTask = rebalancedTasks.find((task) => task.id === 'move-me');
assert.equal(movedTask.owner, '李娜');
assert.equal(movedTask.status, '处理中');
assert.equal(movedTask.remainingSLA, '01:00:00');
assert.equal(movedTask.processLogs.at(-1).action, '负载调度');
assert.match(movedTask.processLogs.at(-1).detail, /王敏.*李娜/);
assert.deepEqual(recommendationTasks, planInputSnapshot, 'plan application must not mutate tasks');

const noSafePlan = buildTaskRebalancingPlan(
  recommendationTasks,
  recommendationMembers.map((member) => (
    member.name === '王敏' ? member : { ...member, availability: '不可用' }
  )),
  0,
  0,
  5,
);
assert.deepEqual(noSafePlan.moves, []);

console.log('task workload tests passed');
