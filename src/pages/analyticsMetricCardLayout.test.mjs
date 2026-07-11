import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const source = readFileSync(new URL('./Analytics.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /h-\[160px\].*px-6 py-4/,
  'analytics metric cards should use the approved height and balanced padding',
);

assert.match(
  source,
  /className="h-10 w-10 object-contain"/,
  'analytics metric icons should use the shared 40px image footprint',
);

assert.match(
  source,
  /whitespace-nowrap text-\[17px\] font-medium leading-6/,
  'analytics metric titles should match the shared typography without truncation',
);

assert.doesNotMatch(
  source,
  /min-w-0 truncate text-\[17px\]/,
  'analytics metric titles should not be clipped in the six-column grid',
);

assert.match(
  source,
  /mt-0\.5 whitespace-nowrap text-\[30px\] font-semibold/,
  'analytics metric values should use a standalone non-wrapping row',
);

assert.match(
  source,
  /className="pointer-events-none absolute bottom-4 left-6 right-6 h-6"/,
  'analytics sparklines should preserve the shared full-width spacing',
);

assert.match(source, /className="h-full w-full"/, 'analytics sparkline SVG should fill its wrapper');
assert.match(source, /const horizontalPadding = 3;/, 'analytics sparklines should reserve endpoint space');
assert.match(
  source,
  /<circle cx=\{coords\.at\(-1\)\[0\]\}/,
  'analytics sparklines should render an endpoint marker',
);

assert.match(
  source,
  /gridTemplateColumns: 'repeat\(6, minmax\(0, 1fr\)\)'/,
  'the existing six-column metric grid should remain unchanged',
);

const iconFiles = [
  'cumulative-anomalies.png',
  'processed-anomalies.png',
  'average-processing-time.png',
  'task-timeout-rate.png',
  'ai-adoption-rate.png',
  'warning-accuracy.png',
];

for (const iconFile of iconFiles) {
  assert.equal(
    existsSync(new URL(`../assets/analytics-icons/${iconFile}`, import.meta.url)),
    true,
    `${iconFile} should exist in the analytics icon asset directory`,
  );
}

const iconBindings = [
  'cumulativeAnomaliesIcon',
  'processedAnomaliesIcon',
  'averageProcessingTimeIcon',
  'taskTimeoutRateIcon',
  'aiAdoptionRateIcon',
  'warningAccuracyIcon',
];

for (const iconBinding of iconBindings) {
  assert.match(source, new RegExp(`icon: ${iconBinding}`), `${iconBinding} should be mapped to a metric card`);
}
