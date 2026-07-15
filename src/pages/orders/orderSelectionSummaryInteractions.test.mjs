import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ordersSource = readFileSync(new URL('../Orders.jsx', import.meta.url), 'utf8');
const toolbarSource = readFileSync(new URL('./OrderToolbarActions.jsx', import.meta.url), 'utf8');

assert.match(
  ordersSource,
  /const \[selectedIds, setSelectedIds\] = useState\(\[\]\);/,
  'orders should start with no selected rows',
);
assert.doesNotMatch(ordersSource, /defaultSelected/, 'orders should not keep seeded selections');
assert.match(ordersSource, /groupSelectedOrders\(selectedOrders, visibleRows\)/);
assert.match(ordersSource, /selectionGroups=\{selectionGroups\}/);
assert.match(ordersSource, /onClearSelection=\{clearSelection\}/);

assert.match(toolbarSource, /createPortal/, 'the summary should escape toolbar clipping');
assert.match(toolbarSource, /const SELECTION_OPEN_DELAY = 100/);
assert.match(toolbarSource, /const SELECTION_CLOSE_DELAY = 150/);
assert.match(toolbarSource, /onPointerEnter=\{scheduleOpen\}/);
assert.match(toolbarSource, /onPointerLeave=\{scheduleClose\}/);
assert.match(toolbarSource, /onFocus=\{openImmediately\}/);
assert.match(toolbarSource, /event\.key === 'Escape'/);
assert.match(toolbarSource, /aria-expanded=\{open\}/);
assert.match(toolbarSource, /当前页 \{selectionGroups\.currentPage\.length\}/);
assert.match(toolbarSource, /其他页 \{selectionGroups\.otherPages\.length\}/);
assert.match(toolbarSource, /max-h-\[320px\] overflow-y-auto/);
assert.match(
  toolbarSource,
  /const closeOnScroll = \(event\) => \{[\s\S]*?panelRef\.current\?\.contains\(event\.target\)[\s\S]*?return;[\s\S]*?closeImmediately\(\);[\s\S]*?\};/,
  'scrolling inside the selection summary should not close it',
);
assert.match(toolbarSource, /addEventListener\('scroll', closeOnScroll, true\)/);
assert.match(toolbarSource, /取消全部/);
assert.match(toolbarSource, /onClearSelection\(\)/);
