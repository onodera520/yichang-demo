import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

test('dashboard uses the shared visible-message selector', () => {
  assert.match(source, /getVisibleSystemMessages/);
  assert.doesNotMatch(source, /message\.id !== 'msg-platform-ebay'/);
});

test('dashboard consumes the one-time full-message route intent', () => {
  assert.match(source, /useLocation/);
  assert.match(source, /location\.state\?\.openUtility !== 'messages'/);
  assert.match(source, /setUtilityDrawer\('messages'\)/);
  assert.match(source, /const \{ openUtility, \.\.\.remainingState \} = location\.state/);
  assert.match(source, /replace: true/);
});
