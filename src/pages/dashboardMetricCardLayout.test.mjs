import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

assert.match(
  dashboardSource,
  /const metricMarkerTones = \['#FF4D4F', '#FF8A00', '#20C997', '#FF1F1F', '#20C997'\]/,
  'each dashboard metric should have the reference marker color',
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
  /mt-2 flex items-center justify-between text-\[13px\]/,
  'yesterday change and detail link should use the full card width',
);

assert.match(
  dashboardSource,
  /metric-sparkline-card relative h-\[160px\]/,
  'dashboard metric cards should scope hover effects to the sparkline',
);

assert.match(
  dashboardSource,
  /<MetricSparkline[\s\S]*animationDelay=\{index \* 50\}[\s\S]*markerColor=\{markerColor\}/,
  'dashboard cards should use the shared sparkline with 50ms stagger and marker colors',
);

assert.doesNotMatch(dashboardSource, /preserveAspectRatio="none"/, 'dashboard cards should not stretch SVG geometry');
