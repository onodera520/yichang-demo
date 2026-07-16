import assert from 'node:assert/strict';
import test from 'node:test';

import {
  countActiveTaskAdvancedFilters,
  getTaskAdvancedFilterErrors,
  matchesTaskAdvancedFilters,
  taskAdvancedFilterDefaults,
} from './taskAdvancedFilters.js';

const task = {
  title: '切换至 NJ 仓发货',
  source: 'AMZ-US-240613-0188',
  createdAt: '2026-06-01 10:24',
  status: '处理中',
  remainingSLA: '01:30:00',
};

test('matches trimmed title and source text with AND semantics', () => {
  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    title: ' nj ',
    source: '0188',
  }, 0, 0), true);

  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    title: '补货',
    source: '0188',
  }, 0, 0), false);
});

test('includes both creation date boundaries', () => {
  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    createdFrom: '2026-06-01',
    createdTo: '2026-06-01',
  }, 0, 0), true);

  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    createdFrom: '2026-06-02',
  }, 0, 0), false);
});

test('uses live remaining SLA hours and excludes overdue or completed tasks', () => {
  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    slaMinHours: '1.5',
    slaMaxHours: '1.5',
  }, 0, 0), true);

  assert.equal(matchesTaskAdvancedFilters(task, {
    ...taskAdvancedFilterDefaults,
    slaMaxHours: '1.49',
  }, 0, 0), false);

  assert.equal(matchesTaskAdvancedFilters({
    ...task,
    status: '已超时',
  }, {
    ...taskAdvancedFilterDefaults,
    slaMaxHours: '10',
  }, 0, 0), false);

  assert.equal(matchesTaskAdvancedFilters({
    ...task,
    status: '已完成',
    remainingSLA: '-',
  }, {
    ...taskAdvancedFilterDefaults,
    slaMaxHours: '10',
  }, 0, 0), false);
});

test('validates creation date and SLA ranges', () => {
  assert.deepEqual(getTaskAdvancedFilterErrors({
    ...taskAdvancedFilterDefaults,
    createdFrom: '2026-06-02',
    createdTo: '2026-06-01',
  }), {
    createdAt: '开始日期不能晚于结束日期',
    sla: '',
  });

  assert.deepEqual(getTaskAdvancedFilterErrors({
    ...taskAdvancedFilterDefaults,
    slaMinHours: '5',
    slaMaxHours: '2',
  }), {
    createdAt: '',
    sla: '最小 SLA 不能大于最大 SLA',
  });

  assert.equal(
    getTaskAdvancedFilterErrors({
      ...taskAdvancedFilterDefaults,
      slaMinHours: '-1',
    }).sla,
    'SLA 不能小于 0',
  );
});

test('counts date and SLA ranges as one logical filter each', () => {
  assert.equal(countActiveTaskAdvancedFilters({
    title: '仓发货',
    source: 'AMZ',
    createdFrom: '2026-06-01',
    createdTo: '2026-06-03',
    slaMinHours: '1',
    slaMaxHours: '4',
  }), 4);
});
