import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_EXPANDED_WIDTH,
  getSidebarLayout,
} from './sidebarLayout.js';

const appLayoutSource = readFileSync(new URL('./AppLayout.jsx', import.meta.url), 'utf8');
const sidebarSource = readFileSync(
  new URL('../components/Sidebar.jsx', import.meta.url),
  'utf8',
);

test('sidebar layout uses the reference expanded and collapsed widths', () => {
  assert.equal(SIDEBAR_EXPANDED_WIDTH, 180);
  assert.equal(SIDEBAR_COLLAPSED_WIDTH, 72);
  assert.deepEqual(getSidebarLayout(false), {
    sidebarWidth: 180,
    contentOffset: 180,
  });
  assert.deepEqual(getSidebarLayout(true), {
    sidebarWidth: 72,
    contentOffset: 72,
  });
});

test('app layout owns an in-memory collapsed state that defaults to expanded', () => {
  assert.match(appLayoutSource, /useState\(false\)/);
  assert.match(appLayoutSource, /collapsed=\{isSidebarCollapsed\}/);
  assert.match(appLayoutSource, /onToggle=\{handleSidebarToggle\}/);
  assert.match(appLayoutSource, /marginLeft:\s*layout\.contentOffset/);
  assert.doesNotMatch(appLayoutSource, /localStorage|sessionStorage/);
});

test('collapsed sidebar keeps navigation and toggle controls accessible', () => {
  assert.match(sidebarSource, /export default function Sidebar\(\{ collapsed, onToggle \}\)/);
  assert.match(sidebarSource, /aria-label=\{item\.label\}/);
  assert.match(sidebarSource, /collapsed \? PanelLeftOpen : PanelLeftClose/);
  assert.match(sidebarSource, /aria-label=\{collapsed \? '展开侧边栏' : '收起侧边栏'\}/);
  assert.match(sidebarSource, /motion-reduce:transition-none/);
});
