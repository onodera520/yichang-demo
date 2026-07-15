import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ORDER_TABLE_SETTINGS_VERSION,
  normalizeOrderTableSettings,
} from './orderTableSettings.js';

const defaults = {
  columns: ['riskLevel', 'abnormalType', 'orderNo'],
  hidden: [],
  density: 'standard',
};

test('discards legacy column order so the reference default is restored', () => {
  const legacySettings = {
    columns: ['abnormalType', 'riskLevel', 'orderNo'],
    hidden: [],
    density: 'standard',
  };

  assert.deepEqual(normalizeOrderTableSettings(legacySettings, defaults), defaults);
});

test('keeps column reordering for settings saved with the current version', () => {
  const currentSettings = {
    version: ORDER_TABLE_SETTINGS_VERSION,
    columns: ['abnormalType', 'riskLevel', 'orderNo'],
    hidden: ['orderNo'],
    density: 'compact',
  };

  assert.deepEqual(normalizeOrderTableSettings(currentSettings, defaults), {
    columns: ['abnormalType', 'riskLevel', 'orderNo'],
    hidden: ['orderNo'],
    density: 'compact',
  });
});
