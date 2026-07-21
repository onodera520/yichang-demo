import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./DemoStateContext.jsx', import.meta.url), 'utf8');

test('demo state exposes return and reopen actions backed by pure state transitions', () => {
  assert.match(source, /import \{[^}]*reopenTaskState[^}]*returnTaskState[^}]*\} from '\.\/taskReturn\.js'/s);
  assert.match(source, /const returnTask = \(taskId, options\)/);
  assert.match(source, /const reopenTask = \(taskId, options\)/);
  assert.match(source, /returnTask,/);
  assert.match(source, /reopenTask,/);
});

test('successful return transitions commit all state and reconcile task tab notices', () => {
  assert.match(source, /setOrders\(result\.state\.orders\)/);
  assert.match(source, /setInventory\(result\.state\.inventory\)/);
  assert.match(source, /commitTaskRows\(current, result\.state\.tasks\)/);
  assert.match(source, /if \(!result\.ok\) return result/);
});
