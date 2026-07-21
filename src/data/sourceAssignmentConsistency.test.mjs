import assert from 'node:assert/strict';
import test from 'node:test';

import { inventory, orders, tasks } from './mockData.js';

test('订单异常和库存风险初始负责人统一为未分派', () => {
  assert.equal(orders.every((order) => order.owner === '未分派'), true);
  assert.equal(orders.every((order) => order.status === '待分派'), true);
  assert.equal(inventory.every((item) => item.owner === '未分派'), true);
});

test('任务协同初始数据全部具有具体负责人', () => {
  assert.equal(tasks.every((task) => task.owner && task.owner !== '未分派'), true);
  assert.equal(tasks.every((task) => task.status !== '待分派'), true);
});
