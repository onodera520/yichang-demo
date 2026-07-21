import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');
const tableStart = source.indexOf('<table className="w-full table-fixed text-left">');
const tableEnd = source.indexOf('</colgroup>', tableStart);
const colgroup = source.slice(tableStart, tableEnd);
const widths = [...colgroup.matchAll(/width: '(\d+)%'/g)].map((match) => Number(match[1]));

assert.deepEqual(
  widths,
  [8, 10, 12, 7, 7, 8, 8, 8, 8, 10, 8, 6],
  'inventory columns should include owner while preserving the available table width',
);
assert.equal(widths.reduce((total, width) => total + width, 0), 100, 'inventory columns should total 100%');
assert.equal(
  widths.slice(3, 11).reduce((total, width) => total + width, 0),
  64,
  'platform through owner should occupy 64% of the table width',
);

console.log('inventory table spacing tests passed');
