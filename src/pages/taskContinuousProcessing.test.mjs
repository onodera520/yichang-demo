import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');

test('task table removes its operation column and shares one eight-column layout', () => {
  assert.doesNotMatch(source, /<th>操作<\/th>/);
  assert.doesNotMatch(source, />查看<\/button>/);
  assert.match(source, /function TaskTableColGroup/);
  assert.equal((source.match(/<TaskTableColGroup\s*\/>/g) ?? []).length, 2);
  assert.match(source, /\['5%', '10%', '21%', '20%', '11%', '11%', '11%', '11%'\]/);
});

test('task detail removes the decorative close icon and renders both empty states', () => {
  assert.doesNotMatch(source, /<X className="h-4\.5 w-4\.5"/);
  assert.match(source, /task-queue-complete\.png/);
  assert.match(source, /alt="任务队列处理完成"/);
  assert.match(source, />当前队列已处理完成</);
  assert.match(source, />暂无符合条件的任务</);
});

test('successful single-task actions prepare auto advance without changing bulk selection', () => {
  assert.match(source, /const prepareTaskAdvance =/);
  assert.match(source, /const remindTask =[\s\S]*?prepareTaskAdvance\(\)/);
  assert.match(source, /const submitAcceptance =[\s\S]*?prepareTaskAdvance\(\)/);
  assert.match(source, /const submitTaskReturn =[\s\S]*?prepareTaskAdvance\(\)/);
  assert.match(source, /const confirmTransfer =[\s\S]*?prepareTaskAdvance\(\)/);
  assert.match(source, /const upgradeTask =[\s\S]*?prepareTaskAdvance\(\)/);
  assert.doesNotMatch(source, /prepareTaskAdvance[\s\S]{0,120}setSelectedIds/);
});
