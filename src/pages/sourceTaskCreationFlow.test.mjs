import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ordersSource = readFileSync(new URL('./Orders.jsx', import.meta.url), 'utf8');
const inventorySource = readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');

test('order task creation stays on the source page and advances the drawer queue', () => {
  assert.doesNotMatch(ordersSource, /navigate\('\/tasks'/);
  assert.match(ordersSource, /createSourceAdvanceIntent/);
  assert.match(ordersSource, /resolveSourceAdvance/);
  assert.match(ordersSource, /setDrawerOrderId\(advance\.itemId\)/);
  assert.match(ordersSource, /setCurrentPage\(advance\.page\)/);
  assert.match(ordersSource, /当前队列已处理完成/);
});

test('inventory task creation stays on the source page and opens the next sku with reset form values', () => {
  assert.doesNotMatch(inventorySource, /navigate\('\/tasks'/);
  assert.match(inventorySource, /createSourceAdvanceIntent/);
  assert.match(inventorySource, /resolveSourceAdvance/);
  assert.match(inventorySource, /openSkuDrawer\(nextSku\)/);
  assert.match(inventorySource, /setCurrentPage\(advance\.page\)/);
  assert.match(inventorySource, /当前队列已处理完成/);
});

test('failed task creation returns before either source queue advances', () => {
  assert.match(ordersSource, /if \(!result\.ok\) \{[\s\S]*?return;[\s\S]*?resolveSourceAdvance/);
  assert.match(inventorySource, /if \(!result\.ok\) \{[\s\S]*?return;[\s\S]*?resolveSourceAdvance/);
});

test('inventory duplicate-task gate explains that the task has already been created', () => {
  assert.match(inventorySource, /const inventoryTaskAlreadyCreated = taskBlockReason === '已存在进行中的关联任务'/);
  assert.match(inventorySource, /inventoryTaskAlreadyCreated \? '任务已创建' : '创建补货任务'/);
});
