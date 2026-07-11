import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const pageFiles = [
  './Dashboard.jsx',
  './Orders.jsx',
  './Inventory.jsx',
  './Tasks.jsx',
  './Analytics.jsx',
  './Settings.jsx',
];

for (const pageFile of pageFiles) {
  const source = readFileSync(new URL(pageFile, import.meta.url), 'utf8');
  assert.match(source, /className="[^"]*page-header[^"]*"/, `${pageFile} should use the shared page header position`);
  assert.match(source, /className="page-title"/, `${pageFile} should use the shared page title typography`);
}

const styles = readFileSync(new URL('../styles/index.css', import.meta.url), 'utf8');

assert.match(styles, /\.page-header\s*{[^}]*margin-top:\s*-8px;/s, 'page headers should move upward by 8px');
assert.match(styles, /\.page-title\s*{[^}]*font-size:\s*24px;/s, 'page titles should share a 24px font size');
assert.match(styles, /\.page-title\s*{[^}]*line-height:\s*32px;/s, 'page titles should share a 32px line height');
assert.match(styles, /\.page-title\s*{[^}]*font-weight:\s*600;/s, 'page titles should share the same weight');
