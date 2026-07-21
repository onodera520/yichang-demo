import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./TaskReturnDialog.jsx', import.meta.url), 'utf8');

test('task return dialog is accessible and explains the status transition', () => {
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby="task-return-title"/);
  assert.match(source, /task\.status/);
  assert.match(source, /action\.targetStatus/);
  assert.match(source, /event\.key === 'Escape'/);
});

test('task return dialog renders action-specific native radios without a default selection', () => {
  assert.match(source, /getTaskReturnReasonOptions\(action\.type\)/);
  assert.match(source, /type="radio"/);
  assert.match(source, /name="task-return-reason"/);
  assert.match(source, /checked=\{reason === option\}/);
  assert.match(source, /const \[reason, setReason\] = useState\(''\)/);
  assert.match(source, /validateTaskReturnReason\(reason, action\.type\)/);
});

test('task return dialog supports an optional bounded remark and guards submission', () => {
  assert.match(source, /const \[remark, setRemark\] = useState\(''\)/);
  assert.match(source, /maxLength=\{100\}/);
  assert.match(source, /rows=\{2\}/);
  assert.match(source, /validateTaskReturnRemark\(remark\)/);
  assert.match(source, /setSubmitting\(true\)/);
  assert.match(source, /disabled=\{Boolean\(validationError \|\| remarkError\) \|\| submitting\}/);
  assert.match(source, /onSubmit\(\{ reason: reason\.trim\(\), remark: remark\.trim\(\) \}\)/);
  assert.match(source, /\{remark\.length\}\/100/);
});

test('task return dialog resets its form when opened for another task', () => {
  assert.match(source, /\[open, task\?\.id, action\?\.type\]/);
  assert.match(source, /setReason\(''\)/);
  assert.match(source, /setRemark\(''\)/);
});
