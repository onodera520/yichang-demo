import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

assert.match(source, /buildDashboardMetrics\(\{/);
assert.match(source, /dashboardPreset:\s*item\.dashboardPreset/);
assert.match(source, /<button[\s\S]*?metric-sparkline-card[\s\S]*?onClick=\{onDetail\}/);
assert.doesNotMatch(source, /dashboardStats\.map/);

console.log('dashboard metric interaction tests passed');
