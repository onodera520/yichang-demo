import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');
const start = source.indexOf('function SuggestionPanel');
const end = source.indexOf('function TrendPanel', start);
const panel = source.slice(start, end);

assert.match(source, /ChevronRight,[\s\S]*Info,/);
assert.match(source, /const suggestionIcons = \[highRiskOrderIcon, stockRiskIcon, logisticsDelayIcon\]/);
assert.match(panel, /overflow-y-scroll/);
assert.match(panel, /\[&::-webkit-scrollbar\]:w-1/);
assert.match(panel, /overflow-hidden rounded-\[14px\]/);
assert.match(panel, /min-h-\[140px\].*border-b/);
assert.match(panel, /mt-2\.5.*item\.description/s);
assert.match(panel, /formatSuggestionImpact\(item\.impact\)/);
assert.match(panel, /shrink-0.*置信度/s);
assert.match(panel, /Info className=/);
assert.match(panel, /ChevronRight className=/);
assert.doesNotMatch(panel, /grid-rows-3/);

console.log('dashboard suggestion panel layout tests passed');
