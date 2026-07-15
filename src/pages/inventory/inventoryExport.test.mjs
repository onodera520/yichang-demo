import assert from 'node:assert/strict';
import { buildInventoryCsv } from './inventoryExport.js';

const rows = [
  {
    riskLevel: '高',
    sku: 'ELE-TEST-01',
    productName: '桌面支架, "Pro"',
    platform: 'Amazon',
    warehouse: 'LA',
    currentStock: 12,
    inTransitStock: 6,
    dailySales: 18,
    availableDays: 0.8,
    aiSuggestion: '建议补货300件\n覆盖安全库存',
    confidence: 0.86,
    suggestedReplenishment: 300,
  },
];

const csv = buildInventoryCsv(rows);
const expectedHeader = '风险等级,SKU,商品名称,平台,仓库,当前库存,在途库存,日均销量,可售天数,AI建议,置信度,建议补货量';

assert.ok(csv.startsWith(`\uFEFF${expectedHeader}\r\n`), 'CSV should include a UTF-8 BOM and the expected header');
assert.match(csv, /"桌面支架, ""Pro"""/, 'CSV should escape commas and quotes');
assert.match(csv, /"建议补货300件\n覆盖安全库存"/, 'CSV should quote multiline values');
assert.match(csv, /,86%,300$/, 'CSV should format confidence as a percentage');
assert.equal(buildInventoryCsv([]), `\uFEFF${expectedHeader}`, 'empty exports should still produce a valid header');

console.log('inventory export tests passed');
