import assert from 'node:assert/strict';
import fs from 'node:fs';

const dialogSource = fs.readFileSync(
  new URL('./TaskTransferDialog.jsx', import.meta.url),
  'utf8',
);
const tasksPageSource = fs.readFileSync(new URL('../Tasks.jsx', import.meta.url), 'utf8');

assert.match(dialogSource, /系统推荐/);
assert.match(dialogSource, /recommendations\.map/);
assert.match(dialogSource, /recommendation\.reason/);
assert.match(dialogSource, /转交后/);
assert.match(dialogSource, /选择负责人/);
assert.match(dialogSource, /确认转交/);
assert.match(dialogSource, /availability !== '不可用'/);
assert.match(dialogSource, /w-\[460px\]/);
assert.match(tasksPageSource, /import TaskTransferDialog/);
assert.match(tasksPageSource, /calculateTransferPreview/);
assert.match(tasksPageSource, /recommendTaskAssignees/);
assert.match(tasksPageSource, /setTransferOwner\(recommendedOwner \|\| ''\)/);
assert.doesNotMatch(tasksPageSource, /recommendedOwner \|\| taskTeamMembers\.find/);
assert.doesNotMatch(tasksPageSource, /function TransferModal/);

console.log('task transfer dialog tests passed');
