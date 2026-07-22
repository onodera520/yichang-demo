import assert from 'node:assert/strict';
import {
  buildAssigneeWorkloadOptions,
  shouldOpenAssigneeMenuUpward,
} from './assigneeWorkload.js';
import { calculateMemberWorkloads } from './taskWorkload.js';

const members = [
  { name: '王敏', capacity: 2, availability: '可接单' },
  { name: '赵宁', capacity: 10, availability: '可接单' },
  { name: '张磊', capacity: 10, availability: '不可用' },
];

const tasks = [
  { id: 'task-1', owner: '王敏', riskLevel: '高', status: '处理中', remainingSLA: '01:00:00' },
  { id: 'task-2', owner: '赵宁', riskLevel: '低', status: '已分派', remainingSLA: '10:00:00' },
  { id: 'task-3', owner: '赵宁', riskLevel: '低', status: '已完成', remainingSLA: '-' },
];

const source = {
  riskLevel: '高',
  remainingSLA: '01:00:00',
};

const snapshot = structuredClone({ members, tasks, source });
const options = buildAssigneeWorkloadOptions(source, tasks, members, 0, 0);
const teamOverviewRows = calculateMemberWorkloads(tasks, members, 0, 0);

assert.deepEqual(
  options.map(({ name, currentLoadPercent }) => [name, currentLoadPercent]),
  teamOverviewRows.map(({ name, loadPercent }) => [name, loadPercent]),
  'assignment options and team overview must expose the same current workload',
);

assert.deepEqual(
  options.map(({ name, active, capacity }) => [name, active, capacity]),
  [
    ['王敏', 1, 2],
    ['赵宁', 1, 10],
    ['张磊', 0, 10],
  ],
  'active count excludes completed work and keeps the configured member order',
);

assert.equal(options[0].projectedLoadPercent, 185);
assert.equal(options[0].disabled, true);
assert.equal(options[0].statusLabel, '过载');

assert.equal(options[1].currentLoadPercent, 10);
assert.equal(options[1].projectedLoadPercent, 29);
assert.equal(options[1].disabled, false);
assert.equal(options[1].statusLabel, '可接单');

assert.equal(options[2].disabled, true);
assert.equal(options[2].statusLabel, '不可用');
assert.deepEqual({ members, tasks, source }, snapshot, 'building options must not mutate inputs');

const loadBoundaryMember = [{ name: '陈浩', capacity: 10, availability: '可接单' }];
const activeLowRiskTasks = (count) => Array.from({ length: count }, (_, index) => ({
  id: `boundary-${index}`,
  owner: '陈浩',
  riskLevel: '低',
  status: '处理中',
  remainingSLA: '10:00:00',
}));
const lowRiskSource = { riskLevel: '低', remainingSLA: '10:00:00' };
const atLoadLimit = buildAssigneeWorkloadOptions(
  lowRiskSource,
  activeLowRiskTasks(12),
  loadBoundaryMember,
  0,
  0,
)[0];
const aboveLoadLimit = buildAssigneeWorkloadOptions(
  lowRiskSource,
  activeLowRiskTasks(13),
  loadBoundaryMember,
  0,
  0,
)[0];

assert.equal(atLoadLimit.projectedLoadPercent, 130);
assert.equal(atLoadLimit.disabled, false, '130% projected load remains assignable');
assert.equal(atLoadLimit.currentLoadPercent, 120);
assert.equal(atLoadLimit.statusLabel, '过载');
assert.equal(aboveLoadLimit.projectedLoadPercent, 140);
assert.equal(aboveLoadLimit.disabled, true, 'load above 130% is blocked');
assert.equal(aboveLoadLimit.currentLoadPercent, 130);
assert.equal(aboveLoadLimit.statusLabel, '过载');

const beforeAssignment = buildAssigneeWorkloadOptions(
  lowRiskSource,
  [],
  loadBoundaryMember,
  0,
  0,
)[0];
const afterAssignment = buildAssigneeWorkloadOptions(
  lowRiskSource,
  activeLowRiskTasks(1),
  loadBoundaryMember,
  0,
  0,
)[0];

assert.equal(beforeAssignment.currentLoadPercent, 0);
assert.equal(afterAssignment.currentLoadPercent, 10, 'shared task changes recalculate the visible load immediately');

assert.equal(
  shouldOpenAssigneeMenuUpward({ top: 657, bottom: 693 }, 900),
  true,
  'a trigger near the fixed drawer footer should open upward',
);
assert.equal(
  shouldOpenAssigneeMenuUpward({ top: 280, bottom: 316 }, 900),
  false,
  'a trigger with enough room below should keep the reference downward placement',
);
