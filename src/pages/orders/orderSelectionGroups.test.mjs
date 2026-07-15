import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const moduleUrl = new URL('./orderSelectionGroups.js', import.meta.url);

assert.equal(
  existsSync(fileURLToPath(moduleUrl)),
  true,
  'orders should provide a pure selection grouping helper',
);

const { groupSelectedOrders } = await import(moduleUrl);

const selectedOrders = [
  { id: 'order-a', orderNo: 'AMZ-A' },
  { id: 'order-b', orderNo: 'EBY-B' },
  { id: 'order-c', orderNo: 'SHP-C' },
];

const groups = groupSelectedOrders(selectedOrders, [
  { id: 'order-a' },
  { id: 'order-unselected' },
]);

assert.deepEqual(groups.currentPage.map((order) => order.id), ['order-a']);
assert.deepEqual(groups.otherPages.map((order) => order.id), ['order-b', 'order-c']);
assert.deepEqual(
  groupSelectedOrders([], [{ id: 'order-a' }]),
  { currentPage: [], otherPages: [] },
  'an empty selection should produce two empty source groups',
);
