import assert from 'node:assert/strict';
import {
  getOperationalPriorityRows,
  sortOrdersByAmountDesc,
  sortOrdersByPurchaseTimeDesc,
  sortOrdersBySlaAsc,
} from './orderSorting.js';

const purchaseRows = [
  { id: 'older', detail: { createdAt: '2026-06-01 09:00:00' } },
  { id: 'invalid-a', detail: { createdAt: 'not-a-date' } },
  { id: 'newest', detail: { createdAt: '2026-06-03 08:30:00' } },
  { id: 'same-a', detail: { createdAt: '2026-06-02 12:00:00' } },
  { id: 'same-b', detail: { createdAt: '2026-06-02 12:00:00' } },
  { id: 'invalid-range', detail: { createdAt: '2026-13-40 25:90:00' } },
  { id: 'invalid-b' },
];

assert.deepEqual(
  sortOrdersByPurchaseTimeDesc(purchaseRows).map((row) => row.id),
  ['newest', 'same-a', 'same-b', 'older', 'invalid-a', 'invalid-range', 'invalid-b'],
  'purchase-time sorting should be newest first, stable, and place invalid dates last',
);
assert.deepEqual(
  purchaseRows.map((row) => row.id),
  ['older', 'invalid-a', 'newest', 'same-a', 'same-b', 'invalid-range', 'invalid-b'],
  'purchase-time sorting should not mutate the source array',
);

const presetSortRows = [
  { id: 'late', remainingSLA: '04:00:00', amount: 100 },
  { id: 'urgent', remainingSLA: '00:30:00', amount: 200 },
  { id: 'none', remainingSLA: '-', amount: 900 },
];

assert.deepEqual(
  sortOrdersBySlaAsc(presetSortRows, 0, 0).map((row) => row.id),
  ['urgent', 'late', 'none'],
);
assert.deepEqual(
  sortOrdersByAmountDesc(presetSortRows).map((row) => row.id),
  ['none', 'urgent', 'late'],
);
assert.deepEqual(
  presetSortRows.map((row) => row.id),
  ['late', 'urgent', 'none'],
  'dashboard preset sorting should not mutate source rows',
);

const priorityRows = [
  { id: 'completed-overdue', abnormalType: '缺货', riskLevel: '高', remainingSLA: '00:00:00', amount: 9000, status: '已完成', detail: { createdAt: '2026-06-09 10:00:00' } },
  { id: 'rejected-overdue', abnormalType: '缺货', riskLevel: '高', remainingSLA: '00:00:00', amount: 8000, status: '已驳回', detail: { createdAt: '2026-06-09 09:00:00' } },
  { id: 'overdue-high', abnormalType: '缺货', riskLevel: '高', remainingSLA: '00:00:00', amount: 1200, status: '待处理', detail: { createdAt: '2026-06-01 08:00:00' } },
  { id: 'overdue-low', abnormalType: '物流延误', riskLevel: '低', remainingSLA: '00:00:00', amount: 7000, status: '处理中', detail: { createdAt: '2026-06-04 08:00:00' } },
  { id: 'urgent-high', abnormalType: '物流延误', riskLevel: '高', remainingSLA: '01:30:00', amount: 1000, status: '待处理', detail: { createdAt: '2026-06-02 08:00:00' } },
  { id: 'urgent-medium', abnormalType: '物流延误', riskLevel: '中', remainingSLA: '00:20:00', amount: 6000, status: '待分派', detail: { createdAt: '2026-06-05 08:00:00' } },
  { id: 'normal-high', abnormalType: '地址异常', riskLevel: '高', remainingSLA: '05:00:00', amount: 3000, status: '待处理', detail: { createdAt: '2026-06-03 08:00:00' } },
  { id: 'normal-medium-expensive', abnormalType: '地址异常', riskLevel: '中', remainingSLA: '04:00:00', amount: 5000, status: '待处理', detail: { createdAt: '2026-06-06 08:00:00' } },
  { id: 'normal-medium-cheap', abnormalType: '地址异常', riskLevel: '中', remainingSLA: '04:00:00', amount: 2000, status: '待处理', detail: { createdAt: '2026-06-07 08:00:00' } },
  { id: 'no-sla', abnormalType: '支付异常', riskLevel: '高', remainingSLA: '-', amount: 9000, status: '待处理', detail: { createdAt: '2026-06-08 08:00:00' } },
];

const clock = { nowMs: 0, anchorMs: 0 };

assert.deepEqual(
  getOperationalPriorityRows(priorityRows, { ...clock, sortMode: 'urgent' }).map((row) => row.id),
  [
    'overdue-high',
    'overdue-low',
    'urgent-high',
    'urgent-medium',
    'normal-high',
    'normal-medium-expensive',
    'normal-medium-cheap',
    'no-sla',
  ],
  'urgent mode should prioritize SLA bands, then risk, SLA, amount, and purchase time',
);

assert.deepEqual(
  getOperationalPriorityRows(priorityRows, {
    ...clock,
    abnormalType: '物流延误',
    sortMode: 'urgent',
    limit: 2,
  }).map((row) => row.id),
  ['overdue-low', 'urgent-high'],
  'abnormal type filtering should happen before sorting and limiting',
);

assert.deepEqual(
  getOperationalPriorityRows(priorityRows, { ...clock, sortMode: 'risk-desc' }).map((row) => row.id),
  ['overdue-high', 'urgent-high', 'normal-high', 'no-sla', 'urgent-medium', 'normal-medium-expensive', 'normal-medium-cheap', 'overdue-low'],
  'risk-desc mode should use risk as the primary key and SLA urgency within each risk',
);

assert.deepEqual(
  getOperationalPriorityRows(priorityRows, { ...clock, sortMode: 'risk-asc' }).map((row) => row.id),
  ['overdue-low', 'urgent-medium', 'normal-medium-expensive', 'normal-medium-cheap', 'overdue-high', 'urgent-high', 'normal-high', 'no-sla'],
  'risk-asc mode should reverse the risk groups while preserving SLA urgency inside them',
);
