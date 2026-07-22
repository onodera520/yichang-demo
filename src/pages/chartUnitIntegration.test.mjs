import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const analyticsSource = readFileSync(new URL('./Analytics.jsx', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

assert.match(analyticsSource, /<YAxis domain=\{\[0, 1000\]\}[\s\S]*?tickFormatter=\{formatCountUnit\}/);
assert.match(analyticsSource, /<YAxis domain=\{\[0, 1000\]\}[\s\S]*?tick=\{\{[^}]*dx: 8[^}]*\}\}/);
assert.match(analyticsSource, /yAxisId="left"[\s\S]*?tickFormatter=\{formatDurationUnit\}/);
assert.match(analyticsSource, /yAxisId="right"[\s\S]*?tickFormatter=\{formatCountUnit\}/);
assert.match(analyticsSource, /formatter=\{\(value, name\) => formatEfficiencyTooltipValue\(value, name\)\}/);
assert.match(dashboardSource, /ticks=\{\[0, 200, 400, 600, 800\]\}[\s\S]*?tickFormatter=\{formatCountUnit\}/);
assert.match(dashboardSource, /return \[formatCountUnit\(value\), matchedLine\?\.name \?\? name\]/);
