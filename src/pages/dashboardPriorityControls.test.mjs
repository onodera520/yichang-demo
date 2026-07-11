import assert from 'node:assert/strict';
import {
  filterAndSortPriorityRows,
  getNextPrioritySort,
  getPriorityAbnormalTypes,
} from './dashboardPriorityControls.js';

const rows = [
  { id: 'a', abnormalType: '缺货', riskLevel: '中' },
  { id: 'b', abnormalType: '物流延误', riskLevel: '高' },
  { id: 'c', abnormalType: '缺货', riskLevel: '低' },
  { id: 'd', abnormalType: '地址异常', riskLevel: '观察' },
  { id: 'e', abnormalType: '物流延误', riskLevel: '高' },
];

assert.deepEqual(getPriorityAbnormalTypes(rows), ['缺货', '物流延误', '地址异常']);
assert.deepEqual(
  filterAndSortPriorityRows(rows, '缺货', 'default').map((row) => row.id),
  ['a', 'c'],
);
assert.deepEqual(
  filterAndSortPriorityRows(rows, '全部异常', 'desc').map((row) => row.id),
  ['b', 'e', 'a', 'c', 'd'],
);
assert.deepEqual(
  filterAndSortPriorityRows(rows, '全部异常', 'asc').map((row) => row.id),
  ['c', 'a', 'b', 'e', 'd'],
);
assert.deepEqual(
  filterAndSortPriorityRows(rows, '全部异常', 'default').map((row) => row.id),
  ['a', 'b', 'c', 'd', 'e'],
);

assert.equal(getNextPrioritySort('default'), 'desc');
assert.equal(getNextPrioritySort('desc'), 'asc');
assert.equal(getNextPrioritySort('asc'), 'default');
