import assert from 'node:assert/strict';
import { tasks } from '../data/mockData.js';

const inconsistentTasks = tasks.filter((task) => {
  const isUnassigned = !task.owner || task.owner === '未分派';
  return isUnassigned !== (task.status === '待分派');
});

assert.deepEqual(
  inconsistentTasks.map(({ id, title, owner, status }) => ({ id, title, owner, status })),
  [],
  '任务负责人和分派状态必须保持一致',
);

assert.equal(
  tasks.some((task) => task.status === '待处理'),
  false,
  '任务状态统一使用“待验收”，不再混用“待处理”',
);

assert.equal(
  tasks.some((task) => task.status === '待确认'),
  false,
  '任务状态不再使用含义模糊的“待确认”',
);

assert.equal(
  tasks
    .filter((task) => task.status === '待分派')
    .some((task) => task.processLogs.some((log) => log.detail?.includes('未分派 已进入处理队列'))),
  false,
  '待分派任务的处理记录不能声称负责人已进入处理队列',
);

console.log('task assignment consistency tests passed');
