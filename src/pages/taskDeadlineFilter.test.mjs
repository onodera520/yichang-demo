import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');
const functionMatch = source.match(/function matchesLiveDeadlineFilter[\s\S]*?\r?\n}\r?\n\r?\nfunction Checkbox/);

assert.ok(functionMatch, 'matchesLiveDeadlineFilter should remain available for regression coverage');

const functionSource = functionMatch[0].replace(/\r?\n\r?\nfunction Checkbox$/, '');
const matchesLiveDeadlineFilter = new Function(
  'deadlines',
  'getTaskSlaPresentation',
  `return (${functionSource});`,
)(
  ['全部', '今天', '2小时内', '已超时', '24小时内'],
  (task) => (task.remainingSLA === '01:00:00'
    ? { state: 'remaining', seconds: 3600 }
    : { state: 'completed', seconds: null }),
);

const taskWithoutDeadline = { id: 'task-001', remainingSLA: '01:00:00' };

assert.doesNotThrow(
  () => matchesLiveDeadlineFilter(taskWithoutDeadline, '今天', 0, 0),
  'date filtering must not crash when legacy tasks have no deadline label',
);
assert.equal(matchesLiveDeadlineFilter(taskWithoutDeadline, '今天', 0, 0), false);
assert.equal(matchesLiveDeadlineFilter(taskWithoutDeadline, '2小时内', 0, 0), true);

console.log('task deadline filter tests passed');
