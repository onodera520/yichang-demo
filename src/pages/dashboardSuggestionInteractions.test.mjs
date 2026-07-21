import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');
const panelStart = source.indexOf('function SuggestionPanel');
const panelEnd = source.indexOf('function TrendPanel', panelStart);
const panel = source.slice(panelStart, panelEnd);
const detailStart = source.indexOf('<DetailDrawer\n      open={Boolean(selectedSuggestion)}');
const detailEnd = source.indexOf('<DetailDrawer\n      open={utilityDrawer ===', detailStart);
const suggestionDetail = source.slice(detailStart, detailEnd);

assert.match(panel, /查看全部\(\{suggestions\.length\}\)/);
assert.match(panel, /item\.description/);
assert.doesNotMatch(panel, /生成任务/);
assert.doesNotMatch(panel, /getBlockReason/);
assert.doesNotMatch(panel, /onGenerate/);
assert.doesNotMatch(suggestionDetail, /生成任务/);
assert.doesNotMatch(source, /onViewAll=\{\(\) => navigate\('\/tasks'\)\}/);

console.log('dashboard suggestion interaction tests passed');
