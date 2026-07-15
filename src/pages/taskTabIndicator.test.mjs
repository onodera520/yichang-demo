import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');

test('task tabs use one centered animated indicator', () => {
  assert.match(source, /getCenteredIndicatorOffset/);
  assert.match(source, /ref=\{tabListRef\}/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-selected=\{activeTab === tab\}/);
  assert.match(source, /role="tab"/);
  assert.match(source, /orders-tab-indicator/);
  assert.match(source, /translate3d\(\$\{tabIndicator\.x\}px, 0, 0\)/);
  assert.match(source, /transition-colors/);

  const indicatorMatches = source.match(/orders-tab-indicator/g) ?? [];
  assert.equal(indicatorMatches.length, 1, 'task tabs should render one shared indicator');
  assert.doesNotMatch(source, /activeTab === tab \? <span/);
});
