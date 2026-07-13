import assert from 'node:assert/strict';
import fs from 'node:fs';

const drawer = fs.readFileSync(new URL('./DetailDrawer.jsx', import.meta.url), 'utf8');
const orders = fs.readFileSync(new URL('../../pages/Orders.jsx', import.meta.url), 'utf8');
const inventory = fs.readFileSync(new URL('../../pages/Inventory.jsx', import.meta.url), 'utf8');

assert.match(drawer, /detail-drawer-backdrop/, 'DetailDrawer should render a shared outside-click layer');
assert.match(drawer, /onClick=\{onClose\}/, 'outside-click layer should call onClose');
assert.match(drawer, /pointer-events-auto/, 'open backdrop should receive pointer events');
assert.match(drawer, /pointer-events-none/, 'closed backdrop should not block the page');
assert.match(drawer, /event\.key === 'Escape'/, 'Escape should close an open drawer');
assert.match(drawer, /role="dialog"/, 'drawer should expose dialog semantics');
assert.match(drawer, /aria-label="关闭详情抽屉"/, 'close icon should have an accessible name');

assert.match(orders, /<DetailDrawer[\s\S]*?onClose=\{onClose\}/, 'order drawer should keep using the shared close callback');
assert.match(inventory, /<DetailDrawer[\s\S]*?onClose=\{\(\) => setSelectedSku\(null\)\}/, 'inventory drawer should keep using the shared close callback');

console.log('detail drawer dismiss tests passed');
