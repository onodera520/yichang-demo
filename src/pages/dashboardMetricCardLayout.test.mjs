import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

assert.doesNotMatch(dashboardSource, /metricMarkerTones/, 'dashboard endpoints should not use a fixed color map');
assert.match(
  dashboardSource,
  /markerColor=\{item\.tone\}/,
  'the endpoint should inherit the direction-based line color',
);

assert.match(
  dashboardSource,
  /h-\[160px\].*px-6 py-4/,
  'the metric card should reserve equal 16px top and bottom whitespace',
);

assert.match(
  dashboardSource,
  /whitespace-nowrap text-\[30px\] font-semibold/,
  'the main value should be a full-width, non-wrapping row',
);

assert.match(
  dashboardSource,
  /mt-2 flex items-center justify-between whitespace-nowrap text-\[13px\]/,
  'yesterday change and detail link should use the full card width',
);

assert.match(
  dashboardSource,
  /flex items-center gap-1\.5 whitespace-nowrap/,
  'long metric changes should stay on one line without entering the chart area',
);

assert.match(
  dashboardSource,
  /metric-sparkline-card relative[^"\n]*h-\[160px\]/,
  'dashboard metric cards should scope hover effects to the sparkline',
);

assert.match(
  dashboardSource,
  /metric-sparkline-card relative flex h-\[160px\] w-full[^"\n]*flex-col items-stretch justify-start/,
  'the clickable card should preserve the original top-aligned article layout',
);

assert.match(
  dashboardSource,
  /<MetricSparkline[\s\S]*animationDelay=\{index \* 50\}[\s\S]*compact[\s\S]*markerColor=\{item\.tone\}/,
  'dashboard cards should use the compact shared sparkline below the text rows',
);

assert.doesNotMatch(dashboardSource, /preserveAspectRatio="none"/, 'dashboard cards should not stretch SVG geometry');
