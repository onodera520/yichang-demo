import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync(new URL('./PageHeaderActionButton.jsx', import.meta.url), 'utf8');

for (const token of [
  'h-10',
  'min-w-[114px]',
  'rounded-[9px]',
  'gap-2',
  'px-4',
  'hover:-translate-y-px',
  'active:translate-y-0',
  'active:scale-[0.98]',
  'focus-visible:ring-2',
  'motion-reduce:transform-none',
  'motion-reduce:transition-none',
]) {
  assert.ok(component.includes(token), `PageHeaderActionButton should include ${token}`);
}

assert.match(component, /primary:/, 'component should define the primary variant');
assert.match(component, /secondary:/, 'component should define the secondary variant');
assert.match(component, /icon: Icon/, 'component should accept a lucide icon component');
assert.match(component, /\.\.\.buttonProps/, 'component should forward standard button props');

const expectedCounts = new Map([
  ['Dashboard.jsx', 1],
  ['Orders.jsx', 1],
  ['Inventory.jsx', 1],
  ['Tasks.jsx', 1],
  ['Analytics.jsx', 2],
  ['Settings.jsx', 1],
]);

for (const [pageFile, expectedCount] of expectedCounts) {
  const source = fs.readFileSync(new URL(`../../pages/${pageFile}`, import.meta.url), 'utf8');
  assert.match(source, /PageHeaderActionButton/, `${pageFile} should import the shared header action`);
  assert.equal(
    (source.match(/<PageHeaderActionButton\b/g) ?? []).length,
    expectedCount,
    `${pageFile} should use the shared component for each page-header action`,
  );
}

const commonIndex = fs.readFileSync(new URL('./index.js', import.meta.url), 'utf8');
assert.match(commonIndex, /PageHeaderActionButton/, 'common index should export PageHeaderActionButton');

console.log('page header action button tests passed');
