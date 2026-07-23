import assert from 'node:assert/strict';
import test from 'node:test';

import { TASK_RISK_FILTERS, matchesTaskRiskFilter } from './taskRiskFilters.js';

test('task risk filters include slow-moving and transfer labels', () => {
  assert.deepEqual(TASK_RISK_FILTERS, ['全部', '高', '中', '低', '滞销', '调拨']);
});

test('task risk matching remains exact for the added labels', () => {
  assert.equal(matchesTaskRiskFilter({ riskLevel: '滞销' }, '滞销'), true);
  assert.equal(matchesTaskRiskFilter({ riskLevel: '调拨' }, '滞销'), false);
  assert.equal(matchesTaskRiskFilter({ riskLevel: '调拨' }, '全部'), true);
});
