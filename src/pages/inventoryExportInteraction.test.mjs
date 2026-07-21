import assert from 'node:assert/strict';
import fs from 'node:fs';

const inventorySource = fs.readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');

assert.match(inventorySource, /\bDownload\b/, 'inventory should use the lucide Download icon');
assert.match(inventorySource, /buildInventoryCsv\(sortedRows\)/, 'export should include every filtered and sorted row across all pages');
assert.doesNotMatch(inventorySource, /buildInventoryCsv\(visibleRows\)/, 'export must not be limited to the current page');
assert.match(inventorySource, /text\/csv;charset=utf-8/, 'export should create a UTF-8 CSV blob');
assert.match(inventorySource, /URL\.createObjectURL/, 'export should create a browser download URL');
assert.match(inventorySource, /URL\.revokeObjectURL/, 'export should release the browser download URL');
assert.match(inventorySource, /当前没有可导出的库存数据/, 'empty results should show an informational toast');
assert.match(inventorySource, /已导出 \$\{sortedRows\.length\} 条库存风险数据/, 'successful exports should report the exported row count');
assert.match(inventorySource, /onClick=\{exportInventory\}/, 'the export button should invoke the export handler');
assert.match(inventorySource, />\s*导出清单\s*</, 'the former filter button should be labeled as export');

console.log('inventory export interaction tests passed');
