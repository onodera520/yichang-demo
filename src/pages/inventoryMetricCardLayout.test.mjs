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
  /className="pointer-events-none absolute bottom-4 left-6 right-6 h-6"/,
  'the sparkline should preserve balanced bottom spacing',
);

assert.match(source, /className="h-full w-full"/, 'the sparkline SVG should fill its wrapper');

assert.match(
  source,
  /<circle cx=\{coords\.at\(-1\)\[0\]\}/,
  'the sparkline should render an endpoint marker',
);

assert.match(
  source,
  /const horizontalPadding = 3;/,
  'the sparkline should reserve horizontal space for its endpoint marker',
);
