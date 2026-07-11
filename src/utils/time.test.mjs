import assert from 'node:assert/strict';
import { formatDateTime } from './time.js';

assert.equal(
  formatDateTime(new Date(2026, 6, 8, 9, 4, 5)),
  '2026-07-08 09:04:05',
);
