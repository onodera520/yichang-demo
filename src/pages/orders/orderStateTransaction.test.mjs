import assert from 'node:assert/strict';
import { applyOrderTransactionState, resetOrderRows } from './orderStateTransaction.js';

const state = {
  orders: [{ id: 'a', status: '待处理' }, { id: 'b', status: '处理中' }],
  tasks: [{ id: 'old-task' }, { id: 'remove-task' }],
};

const next = applyOrderTransactionState(state, {
  orders: [{ id: 'a', status: '已驳回' }],
  tasksToAdd: [{ id: 'new-task' }],
  taskIdsToRemove: ['remove-task'],
});
assert.deepEqual(next.orders, [{ id: 'a', status: '已驳回' }, { id: 'b', status: '处理中' }]);
assert.deepEqual(next.tasks, [{ id: 'new-task' }, { id: 'old-task' }]);
assert.deepEqual(state.orders, [{ id: 'a', status: '待处理' }, { id: 'b', status: '处理中' }]);

const reset = resetOrderRows([{ id: 'a', detail: { owner: '王敏' } }]);
assert.deepEqual(reset, [{ id: 'a', detail: { owner: '王敏' } }]);
assert.notEqual(reset[0], resetOrderRows([{ id: 'a' }])[0]);

const normalized = resetOrderRows([{
  id: 'unassigned-processing',
  owner: '未分派',
  status: '处理中',
  detail: { owner: '未分派' },
}]);
assert.equal(normalized[0].status, '待分派');

console.log('order state transaction tests passed');
