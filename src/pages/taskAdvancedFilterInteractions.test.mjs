import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');

test('tasks page renders the reusable advanced filter popover', () => {
  assert.match(source, /import TaskAdvancedFilterPopover/);
  assert.match(source, /<TaskAdvancedFilterPopover/);
  assert.match(source, /filters=\{advancedFilters\}/);
  assert.match(source, /onOpenChange=\{setAdvancedFiltersOpen\}/);
});

test('advanced task filters participate in filtering and pagination reset', () => {
  assert.match(source, /matchesTaskAdvancedFilters\(/);
  assert.match(source, /const \[advancedFilters, setAdvancedFilters\]/);
  assert.match(source, /\[\s*activeTab,\s*advancedFilters,\s*allTaskRows,\s*filters,/);
  assert.match(source, /\[activeTab, advancedFilters, filters, sortDirection, topbarKeyword\]/);
});

test('reset and task-location flows clear applied advanced filters', () => {
  const resets = source.match(/setAdvancedFilters\(taskAdvancedFilterDefaults\)/g) ?? [];

  assert.ok(resets.length >= 4);
  assert.match(source, /setAdvancedFiltersOpen\(false\)/);
  assert.match(source, /const resetFilters = \(\) => \{/);
});
