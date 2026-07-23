import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');
const drawerStart = source.indexOf('<DetailDrawer');
const drawerEnd = source.indexOf('</DetailDrawer>', drawerStart);
const drawer = source.slice(drawerStart, drawerEnd);
const footerStart = drawer.indexOf('footer={');
const footerEnd = drawer.lastIndexOf('      >');
const footer = drawer.slice(footerStart, footerEnd);

assert.ok(drawerStart >= 0, 'inventory should render a detail drawer');
assert.match(drawer, /width=\{450\}/, 'inventory drawer should match the 450px order drawer width');
assert.match(footer, /className="flex h-full items-center gap-3"/, 'drawer footer should center actions with a 12px gap');
assert.equal((footer.match(/className="h-10 flex-1/g) ?? []).length, 2, 'both drawer actions should be 40px tall');
assert.equal((footer.match(/text-sm/g) ?? []).length, 2, 'both drawer actions should use 14px text');
assert.match(footer, /adjustmentOpen \? '收起调整' : '调整方案'/, 'drawer footer should toggle the adjustment form');
assert.match(footer, /创建任务/, 'drawer footer should create the confirmed task');
assert.doesNotMatch(footer, /驳回建议/, 'inventory drawer should not expose a redundant rejection action');
assert.doesNotMatch(footer, /\bh-9\b|\btext-xs\b/, 'drawer actions should not keep the compact button sizing');
assert.match(source, /data-testid="inventory-compact-overview"/, 'product identity and metrics should share a compact overview');
assert.match(source, /data-testid="inventory-ai-action"/, 'AI recommendation and primary decisions should share one action card');
assert.match(source, /data-testid="inventory-evidence-disclosure"/, 'supporting evidence should live behind one disclosure');
assert.match(source, /style=\{\{ height: 88 \}\}/, 'the sales trend should use a shorter stable height');
assert.doesNotMatch(source, /style=\{\{ height: 132 \}\}/, 'the drawer should remove the tall sales chart');
assert.doesNotMatch(source, /style=\{\{ width: `\$\{confidence\}%` \}\}/, 'confidence should not duplicate its value with a progress bar');

console.log('inventory drawer layout tests passed');
