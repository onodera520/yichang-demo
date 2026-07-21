import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adoptSourceSuggestion,
  assignSourceOwner,
  getSourceTaskBlockReason,
  isAssignedOwner,
} from './sourceTaskWorkflow.js';

const adoptedOrder = {
  id: 'order-1',
  status: '待分派',
  owner: '王敏',
};

test('待处理订单必须先采纳 AI 建议', () => {
  assert.equal(
    getSourceTaskBlockReason({ ...adoptedOrder, status: '待处理' }, [], 'order'),
    '请先采纳 AI 建议',
  );
});

test('已采纳但未分派的来源不能生成任务', () => {
  assert.equal(
    getSourceTaskBlockReason({ ...adoptedOrder, owner: '未分派' }, [], 'order'),
    '请先分派负责人',
  );
  assert.equal(isAssignedOwner('未分派'), false);
  assert.equal(isAssignedOwner('王敏'), true);
});

test('已采纳且已分派的来源允许生成任务', () => {
  assert.equal(getSourceTaskBlockReason(adoptedOrder, [], 'order'), '');
});

test('存在未完成关联任务时禁止重复生成', () => {
  const tasks = [{ sourceKind: 'order', sourceId: 'order-1', status: '处理中' }];
  assert.equal(
    getSourceTaskBlockReason(adoptedOrder, tasks, 'order'),
    '已存在进行中的关联任务',
  );
  assert.equal(
    getSourceTaskBlockReason(adoptedOrder, [{ ...tasks[0], status: '已完成' }], 'order'),
    '',
  );
});

test('库存必须保存采购修改并分派后才能创建补货任务', () => {
  const sku = { sku: 'SKU-1', status: '待处理', owner: '未分派' };
  assert.equal(getSourceTaskBlockReason(sku, [], 'inventory'), '请先保存修改采购数量');
  assert.equal(
    getSourceTaskBlockReason({ ...sku, status: '待分派' }, [], 'inventory'),
    '请先分派负责人',
  );
  assert.equal(
    getSourceTaskBlockReason({ ...sku, status: '待分派', owner: '赵宁' }, [], 'inventory'),
    '',
  );
});

test('采纳建议后来源进入待分派且仍保持未分派', () => {
  assert.deepEqual(
    adoptSourceSuggestion({ id: 'order-2', status: '待处理', owner: '未分派' }),
    { id: 'order-2', status: '待分派', owner: '未分派' },
  );
  assert.deepEqual(
    adoptSourceSuggestion({ sku: 'SKU-2', status: '待处理', owner: '未分派' }, { adjustedQuantity: 320 }),
    { sku: 'SKU-2', status: '待分派', owner: '未分派', adjustedQuantity: 320 },
  );
});

test('只有待分派来源才能确认具体负责人', () => {
  assert.throws(
    () => assignSourceOwner({ ...adoptedOrder, status: '待处理' }, '王敏'),
    /请先采纳或保存 AI 建议/,
  );
  assert.throws(() => assignSourceOwner(adoptedOrder, '未分派'), /请选择负责人/);
  assert.equal(assignSourceOwner(adoptedOrder, '赵宁').owner, '赵宁');
});
