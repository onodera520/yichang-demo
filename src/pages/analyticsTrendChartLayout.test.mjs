import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./Analytics.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /<XAxis[\s\S]*?dataKey="date"[\s\S]*?padding=\{\{ left: 8, right: 20 \}\}/,
  'the trend X axis should reserve enough horizontal padding for the first and last date labels',
);

assert.match(
  source,
  /function TrendLegend\([\s\S]*?max-w-\[520px\][\s\S]*?justify-between/,
  'the five trend legend items should use a wider, evenly distributed legend row',
);

assert.match(
  source,
  /<Legend content=\{<TrendLegend \/>\}/,
  'the trend chart should render the page-scoped custom legend',
);

console.log('analytics trend chart layout tests passed');
