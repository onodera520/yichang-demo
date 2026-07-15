import assert from 'node:assert/strict';
import fs from 'node:fs';

const ordersSource = fs.readFileSync(new URL('../Orders.jsx', import.meta.url), 'utf8');
const popoverUrl = new URL('./OrderAdvancedFilterPopover.jsx', import.meta.url);

assert.ok(fs.existsSync(popoverUrl), '订单页应提供专用高级筛选浮层');
const popoverSource = fs.readFileSync(popoverUrl, 'utf8');

assert.match(ordersSource, /OrderAdvancedFilterPopover/, '更多筛选按钮必须接入高级筛选浮层');
assert.match(popoverSource, /pointerdown/, '点击浮层外部时应关闭');
assert.match(popoverSource, /event\.key === 'Escape'/, '按 Escape 时应关闭');
assert.match(popoverSource, /应用筛选/);
assert.match(popoverSource, /重置/);
assert.match(popoverSource, /aria-expanded=\{open\}/);

console.log('order advanced filter interaction tests passed');
