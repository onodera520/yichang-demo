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
  assert.match(source, /task-tab-notice-badge/);
  assert.match(source, /formatTaskTabNoticeCount/);

  const indicatorMatches = source.match(/orders-tab-indicator/g) ?? [];
  assert.equal(indicatorMatches.length, 1, 'task tabs should render one shared indicator');
  assert.doesNotMatch(source, /activeTab === tab \? <span/);
});

test('task tabs label active work clearly and place completed tasks last', () => {
  assert.match(
    source,
    /const tabs = \['全部待办', '已分派', '处理中', '待确认', '已超时', '已升级', '已完成'\]/,
  );
});
