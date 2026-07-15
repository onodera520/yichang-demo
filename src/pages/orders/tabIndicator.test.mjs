import assert from 'node:assert/strict';
import test from 'node:test';

import { getCenteredIndicatorOffset } from './tabIndicator.js';

test('centers a fixed-width indicator beneath the active tab', () => {
  assert.equal(getCenteredIndicatorOffset(148, 64, 32), 164);
  assert.equal(getCenteredIndicatorOffset(260, 128, 32), 308);
});
