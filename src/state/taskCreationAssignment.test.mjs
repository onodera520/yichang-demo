import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildInventoryTask,
  buildManualTask,
  buildOrderTask,
  buildSuggestionTask,
} from './demoFlow.js';

const order = {
  id: 'order-1',
  orderNo: 'AMZ-1',
  abnormalType: '缺货',
  owner: '王敏',
  status: '待分派',
};

const sku = {
  sku: 'SKU-1',
  warehouse: 'LA',
  owner: '赵宁',
  status: '待分派',
};

test('订单和库存任务只生成已分派状态', () => {
  assert.equal(buildOrderTask(order).status, '已分派');
  assert.equal(buildInventoryTask(sku).status, '已分派');
});

test('任务构造层拒绝未分派来源', () => {
  assert.throws(() => buildOrderTask({ ...order, owner: '未分派' }), /请先分派负责人/);
  assert.throws(() => buildInventoryTask({ ...sku, owner: '未分派' }), /请先分派负责人/);
  assert.throws(() => buildSuggestionTask({ title: '建议', owner: '未分派' }), /请先分派负责人/);
});

test('人工创建任务必须选择具体负责人', () => {
  assert.throws(() => buildManualTask({ title: '人工任务', owner: '未分派' }), /请选择负责人/);
  assert.equal(buildManualTask({ title: '人工任务', owner: '王敏' }).status, '已分派');
});
