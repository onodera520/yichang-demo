import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getNextPrioritySort,
  getPriorityAbnormalTypes,
} from './dashboardPriorityControls.js';

const dashboardSource = readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

const rows = [
  { id: 'a', abnormalType: '缺货', status: '待处理' },
  { id: 'b', abnormalType: '物流延误', status: '处理中' },
  { id: 'c', abnormalType: '缺货', status: '已完成' },
  { id: 'd', abnormalType: '地址异常', status: '已驳回' },
  { id: 'e', abnormalType: '支付异常', status: '待分派' },
];

assert.deepEqual(getPriorityAbnormalTypes(rows), ['缺货', '物流延误', '支付异常']);

assert.equal(getNextPrioritySort('urgent'), 'risk-desc');
assert.equal(getNextPrioritySort('risk-desc'), 'risk-asc');
assert.equal(getNextPrioritySort('risk-asc'), 'urgent');

assert.match(
  dashboardSource,
  /getOperationalPriorityRows\(rows,\s*\{[\s\S]*?abnormalType: selectedType,[\s\S]*?sortMode,[\s\S]*?nowMs: slaClock\.nowMs,[\s\S]*?anchorMs: slaClock\.anchorMs,[\s\S]*?limit: 10/,
  'dashboard priority rows should be selected from the full candidate set using live SLA urgency',
);
assert.doesNotMatch(
  dashboardSource,
  /\.filter\([\s\S]*?\)\s*\.slice\(0, 10\),/,
  'dashboard should not truncate candidates before priority filtering and sorting',
);
assert.match(dashboardSource, /紧急优先/);
assert.match(dashboardSource, /风险高到低/);
assert.match(dashboardSource, /风险低到高/);
assert.match(
  dashboardSource,
  /<SlaCountdown value=\{row\.remainingSLA\} \{\.\.\.slaClock\} overdueLabelOnly \/>/,
  'dashboard overdue priority rows should show only the overdue label',
);
assert.match(
  dashboardSource,
  /ariaLabel="异常类型"[\s\S]*?controlClassName="w-\[112px\]"[\s\S]*?triggerClassName="h-8 w-\[112px\][^"]*"/,
  'dashboard abnormal-type filter should be wide enough to show the full selected label',
);
