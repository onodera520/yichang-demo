import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import { analytics, inventory } from './mockData.js';

const analyticsSource = fs.readFileSync(new URL('../pages/Analytics.jsx', import.meta.url), 'utf8');
const inventorySource = fs.readFileSync(new URL('../pages/Inventory.jsx', import.meta.url), 'utf8');
const rollingWeek = ['7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17'];

test('seven-day analytics series end on the demo business date', () => {
  assert.deepEqual(analytics.exceptionTrend.map((item) => item.date), rollingWeek);
  assert.deepEqual(analytics.efficiencyAnalysis.map((item) => item.date), rollingWeek);
});

test('inventory detail trends and fallback use the same rolling week', () => {
  inventory.forEach((item) => {
    assert.deepEqual(item.detail.salesTrend.map((point) => point.date), rollingWeek);
  });
  assert.match(inventorySource, /buildRollingDateLabels\(7\)/);
  assert.doesNotMatch(inventorySource, /date: '5\.26'/);
});

test('analytics derives rolling labels centrally and includes July in yearly data', () => {
  assert.match(analyticsSource, /buildRollingDateLabels\(30\)/);
  assert.doesNotMatch(analyticsSource, /function rollingDateLabels/);
  assert.match(analyticsSource, /date: '2026\.07'/);
});
