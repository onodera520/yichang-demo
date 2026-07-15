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
assert.equal((footer.match(/className="h-10 flex-1/g) ?? []).length, 3, 'all three drawer actions should be 40px tall');
assert.equal((footer.match(/text-sm/g) ?? []).length, 3, 'all three drawer actions should use 14px text');
assert.doesNotMatch(footer, /\bh-9\b|\btext-xs\b/, 'drawer actions should not keep the compact button sizing');

console.log('inventory drawer layout tests passed');
