import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./TaskAcceptanceDialog.jsx', import.meta.url), 'utf8');

assert.match(source, /任务验收/);
assert.match(source, /系统验收检查/);
assert.match(source, /验收备注/);
assert.match(source, /checks\.every/);
assert.match(source, /disabled=\{!allPassed\}/);
assert.match(source, /onSubmit\(\{ confirmed: true, note \}\)/);
assert.match(source, /const onCloseRef = useRef\(onClose\)/);
assert.match(source, /onCloseRef\.current = onClose/);
assert.match(source, /onCloseRef\.current\(\)/);
assert.match(source, /\}, \[open, task\?\.id\]\)/);
assert.doesNotMatch(source, /completionEvidence\.[^}\n]+onChange/);
assert.doesNotMatch(source, /已核对员工处理结果和凭证/);
assert.doesNotMatch(source, /setConfirmed|\[confirmed/);

console.log('task acceptance dialog tests passed');
