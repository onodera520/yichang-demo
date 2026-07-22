import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ordersSource = readFileSync(new URL('../Orders.jsx', import.meta.url), 'utf8');

test('order list displays and searches concrete abnormal details while tabs keep categories', () => {
  assert.match(ordersSource, /row\.abnormalDetail \?\? row\.abnormalType/);
  assert.match(ordersSource, /row\.abnormalDetail,[\s\S]*?row\.abnormalType/);
  assert.match(ordersSource, /row\.abnormalType === activeTab/);
});

test('order drawer presents both the category and concrete issue', () => {
  assert.match(ordersSource, /<InfoRow label="异常大类" value=\{order\.abnormalType\}/);
  assert.match(ordersSource, /<InfoRow label="具体异常" value=\{order\.abnormalDetail \?\? order\.abnormalType\}/);
});
