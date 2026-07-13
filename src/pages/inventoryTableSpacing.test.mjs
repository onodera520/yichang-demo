import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');
const tableStart = source.indexOf('<table className="w-full table-fixed text-left">');
const tableEnd = source.indexOf('</colgroup>', tableStart);
const colgroup = source.slice(tableStart, tableEnd);
const widths = [...colgroup.matchAll(/width: '(\d+)%'/g)].map((match) => Number(match[1]));

assert.deepEqual(
  widths,
  [9, 11, 19, 6, 6, 7, 7, 7, 7, 13, 8],
  'inventory columns should reserve space around risk, SKU, product name and AI suggestion',
);
assert.equal(widths.reduce((total, width) => total + width, 0), 100, 'inventory columns should total 100%');

console.log('inventory table spacing tests passed');
