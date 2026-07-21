import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const componentUrl = new URL('./TaskAdvancedFilterPopover.jsx', import.meta.url);

test('task advanced filter popover renders task-specific fields', () => {
  assert.equal(fs.existsSync(componentUrl), true);
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /aria-label="任务高级筛选"/);
  assert.match(source, /w-\[420px\]/);
  assert.match(source, /min-w-\[104px\]/);
  assert.match(source, /whitespace-nowrap/);
  assert.match(source, /absolute -right-2 -top-2/);
  assert.match(source, /任务标题/);
  assert.match(source, /来源对象编号/);
  assert.match(source, /创建时间/);
  assert.match(source, /剩余 SLA/);
  assert.match(source, /应用筛选/);
  assert.match(source, /重置/);
});

test('popover dismisses safely and restores trigger focus on Escape', () => {
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /pointerdown/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /triggerRef\.current\?\.focus\(\)/);
  assert.match(source, /rootRef\.current\?\.contains\(event\.target\)/);
});

test('popover keeps draft state and shows applied condition count', () => {
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /setDraft\(\{ \.\.\.taskAdvancedFilterDefaults, \.\.\.filters \}\)/);
  assert.match(source, /countActiveTaskAdvancedFilters/);
  assert.match(source, /getTaskAdvancedFilterErrors/);
  assert.match(source, /onApply\(\{ \.\.\.draft \}\)/);
  assert.match(source, /aria-expanded=\{open\}/);
});
