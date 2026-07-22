import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./AssigneeWorkloadSelect.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /barWidth = Math\.min\(100, Math\.max\(0, option\.currentLoadPercent\)\)/,
  'the assignment menu bar must use the same current load shown in team overview',
);
assert.match(
  source,
  /\{option\.currentLoadPercent\}%/,
  'the assignment menu percentage must use the shared current workload',
);
assert.match(
  source,
  /title=\{option\.blockReason \|\| `分派后预计负载：\$\{option\.projectedLoadPercent\}%`\}/,
  'projected load remains available as assignment guidance without replacing the shared current value',
);
