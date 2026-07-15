import assert from 'node:assert/strict';
import test from 'node:test';

import {
  advancedFilterDefaults,
  countActiveOrderAdvancedFilters,
  getOrderAdvancedFilterErrors,
  matchesOrderAdvancedFilters,
} from './orderAdvancedFilters.js';

const order = {
  status: '处理中',
  amount: 4860,
  confidence: 0.92,
  relatedSku: 'ELE-HEAD-01',
};

test('matches status and SKU filters exactly', () => {
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, status: '处理中' }), true);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, status: '待处理' }), false);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, relatedSku: 'ELE-HEAD-01' }), true);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, relatedSku: 'CAR-VAC-01' }), false);
});

test('treats amount and confidence ranges as inclusive', () => {
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, amountMin: '4860', amountMax: '4860' }), true);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, amountMin: '4861' }), false);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, confidenceMin: '92', confidenceMax: '92' }), true);
  assert.equal(matchesOrderAdvancedFilters(order, { ...advancedFilterDefaults, confidenceMax: '91' }), false);
});

test('combines all advanced conditions with AND semantics', () => {
  assert.equal(matchesOrderAdvancedFilters(order, {
    status: '处理中',
    amountMin: '4000',
    amountMax: '5000',
    confidenceMin: '90',
    confidenceMax: '95',
    relatedSku: 'ELE-HEAD-01',
  }), true);
  assert.equal(matchesOrderAdvancedFilters(order, {
    status: '处理中',
    amountMin: '4000',
    amountMax: '5000',
    confidenceMin: '93',
    confidenceMax: '95',
    relatedSku: 'ELE-HEAD-01',
  }), false);
});

test('validates reversed, negative, and out-of-bounds ranges', () => {
  assert.deepEqual(getOrderAdvancedFilterErrors({ ...advancedFilterDefaults, amountMin: '500', amountMax: '100' }), {
    amount: '最小金额不能大于最大金额',
    confidence: '',
  });
  assert.equal(getOrderAdvancedFilterErrors({ ...advancedFilterDefaults, amountMin: '-1' }).amount, '金额不能小于 0');
  assert.equal(getOrderAdvancedFilterErrors({ ...advancedFilterDefaults, confidenceMax: '101' }).confidence, '置信度需在 0–100% 之间');
  assert.equal(getOrderAdvancedFilterErrors({ ...advancedFilterDefaults, confidenceMin: '90', confidenceMax: '80' }).confidence, '最小置信度不能大于最大置信度');
});

test('counts amount and confidence ranges as one logical filter each', () => {
  assert.equal(countActiveOrderAdvancedFilters({
    status: '处理中',
    amountMin: '100',
    amountMax: '500',
    confidenceMin: '80',
    confidenceMax: '',
    relatedSku: 'ELE-HEAD-01',
  }), 4);
});
