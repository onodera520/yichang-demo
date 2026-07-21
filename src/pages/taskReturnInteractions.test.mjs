import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Tasks.jsx', import.meta.url), 'utf8');

test('task detail derives and renders only the supported return action', () => {
  assert.match(source, /import TaskReturnDialog from '\.\.\/components\/common\/TaskReturnDialog\.jsx'/);
  assert.match(source, /import \{ getTaskReturnAction \} from '\.\.\/state\/taskReturn\.js'/);
  assert.match(source, /const returnAction = getTaskReturnAction\(task\)/);
  assert.match(source, /returnAction \? \(/);
  assert.match(source, /\{returnAction\.label\}/);
  assert.match(source, /onClick=\{onReturn\}/);
});

test('task page opens the reason dialog and delegates transitions to context', () => {
  assert.match(source, /returnTask,/);
  assert.match(source, /reopenTask,/);
  assert.match(source, /const \[returnDialogOpen, setReturnDialogOpen\] = useState\(false\)/);
  assert.match(source, /selectedReturnAction\.type === 'reopen'/);
  assert.match(source, /const submitTaskReturn = \(\{ reason, remark \}\)/);
  assert.match(source, /reopenTask\(selectedTask\.id, \{ reason, remark \}\)/);
  assert.match(source, /returnTask\(selectedTask\.id, \{ reason, remark \}\)/);
  assert.match(source, /<TaskReturnDialog/);
});

test('task return feedback is explicit and page code does not append return logs', () => {
  assert.match(source, /任务已退回处理中/);
  assert.doesNotMatch(source, /任务已撤销分派/);
  assert.match(source, /任务已重新打开/);
  assert.match(source, /showToast\(\{ message: result\.error, type: 'error' \}\)/);
  assert.doesNotMatch(source, /action: '退回任务'/);
  assert.doesNotMatch(source, /action: '撤销分派'/);
  assert.doesNotMatch(source, /action: '重新打开任务'/);
});
