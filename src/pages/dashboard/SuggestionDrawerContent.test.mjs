import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./SuggestionDrawerContent.jsx', import.meta.url), 'utf8');

assert.match(source, /suggestions\.map/);
assert.match(source, /RiskTag/);
assert.match(source, /type=\{suggestion\.riskLevel\}/);
assert.match(source, /sourceType/);
assert.match(source, /Math\.round\(suggestion\.confidence \* 100\)/);
assert.match(source, /onSuggestionClick\(suggestion\)/);
assert.match(source, /查看详情/);
assert.doesNotMatch(source, /生成任务/);

console.log('suggestion drawer content tests passed');
