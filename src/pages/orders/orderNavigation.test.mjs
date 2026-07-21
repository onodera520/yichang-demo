import assert from 'node:assert/strict';
import { getOrderPageForId } from './orderNavigation.js';

const rows = Array.from({ length: 38 }, (_, index) => ({ id: `order-${index + 1}` }));

assert.equal(getOrderPageForId(rows, 'order-1', 15), 1);
assert.equal(getOrderPageForId(rows, 'order-15', 15), 1);
assert.equal(getOrderPageForId(rows, 'order-16', 15), 2);
assert.equal(getOrderPageForId(rows, 'order-31', 15), 3);
assert.equal(getOrderPageForId(rows, 'missing', 15), null);
assert.equal(getOrderPageForId(rows, 'order-1', 0), null);
