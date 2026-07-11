import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

assert.match(
  dashboardSource,
  /const metricMarkerTones = \['#FF4D4F', '#FF8A00', '#20C997', '#6D35FF', '#20C997'\]/,
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
  /className="pointer-events-none absolute bottom-4 left-6 right-6 h-6"/,
  'the sparkline should use a stable full-width wrapper with balanced bottom spacing',
);

assert.match(
  dashboardSource,
  /className="h-full w-full"/,
  'the sparkline SVG should fill its wrapper',
);

assert.match(
  dashboardSource,
  /const horizontalPadding = 3;/,
  'the sparkline should reserve horizontal space for endpoint markers',
);
