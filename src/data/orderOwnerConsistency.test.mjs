import assert from 'node:assert/strict';
import { orders } from './mockData.js';

const contradictoryOrders = orders
  .filter((order) => order.status === '待分派' && order.owner !== '未分派')
  .map((order) => ({ orderNo: order.orderNo, owner: order.owner }));

assert.deepEqual(
  contradictoryOrders,
  [],
  'orders waiting for assignment must not expose a named owner',
);

const contradictoryDetails = orders
  .filter((order) => order.status === '待分派' && order.detail?.owner !== '未分派')
  .map((order) => ({ orderNo: order.orderNo, owner: order.detail?.owner }));

assert.deepEqual(
  contradictoryDetails,
  [],
  'order details should keep the same unassigned owner state as the table',
);

const unassignedWithWrongStatus = orders
  .filter((order) => order.owner === '未分派' && order.status !== '待分派')
  .map((order) => ({ orderNo: order.orderNo, status: order.status }));

assert.deepEqual(
  unassignedWithWrongStatus,
  [],
  'unassigned orders must always stay in the waiting-for-assignment status',
);
