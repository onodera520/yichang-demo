import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const settingsSource = fs.readFileSync(new URL('./Settings.jsx', import.meta.url), 'utf8');

test('supplemental connected stores use the shared business-time builder', () => {
  assert.match(settingsSource, /buildBusinessDateTime/);
  assert.doesNotMatch(settingsSource, /lastSyncAt: '2026-06-01/);
});

test('unauthorized supplemental Shopify store keeps an empty sync timestamp', () => {
  assert.match(
    settingsSource,
    /storeName: 'Shopify-US'[\s\S]*?syncStatus: '未授权'[\s\S]*?lastSyncAt: '-'/,
  );
});
