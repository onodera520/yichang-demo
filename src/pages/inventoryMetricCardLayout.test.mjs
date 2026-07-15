import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /h-\[160px\].*px-6 py-4/,
  'inventory metric cards should use the approved height and balanced padding',
);

assert.match(
  source,
  /whitespace-nowrap text-\[30px\] font-semibold/,
  'the metric value should be a standalone non-wrapping row',
);

assert.match(
  source,
  /mt-2 flex items-center justify-between text-\[13px\]/,
  'change and detail link should share a full-width row',
);

assert.match(
  source,
  /metric-sparkline-card relative h-\[160px\]/,
  'inventory metric cards should scope hover effects to the sparkline',
);

assert.match(
  source,
  /<MetricSparkline[\s\S]*animationDelay=\{index \* 50\}[\s\S]*label=\{card\.label\}/,
  'inventory cards should use the shared sparkline with 50ms stagger',
);

assert.doesNotMatch(source, /preserveAspectRatio="none"/, 'inventory cards should not stretch endpoint circles');
