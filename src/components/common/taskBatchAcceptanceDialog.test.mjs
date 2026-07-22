import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./TaskBatchAcceptanceDialog.jsx', import.meta.url), 'utf8');

assert.match(source, /批量验收任务/);
assert.match(source, /已选择/);
assert.match(source, /可验收/);
assert.match(source, /将跳过/);
assert.match(source, /skippedTasks\.map/);
assert.match(source, /task\.reason/);
assert.match(source, /确认通过 \{eligibleTasks\.length\} 条/);
assert.match(source, /disabled=\{eligibleTasks\.length === 0\}/);
assert.match(source, /onConfirm/);
assert.match(source, /aria-modal="true"/);

console.log('task batch acceptance dialog tests passed');
