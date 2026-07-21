import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync(new URL('./MetricSparkline.jsx', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../../styles/index.css', import.meta.url), 'utf8');

for (const rechartsPart of ['Area', 'ComposedChart', 'Line', 'ResponsiveContainer', 'Tooltip', 'XAxis', 'YAxis']) {
  assert.match(component, new RegExp(`\\b${rechartsPart}\\b`), `MetricSparkline should use Recharts ${rechartsPart}`);
}

assert.match(component, /const ENTRANCE_DURATION = 650;/, 'line entrance should last 650ms');
assert.match(component, /animationBegin=\{animationDelay\}/, 'each chart should honor its stagger delay');
assert.match(component, /isAnimationActive=\{!reducedMotion\}/, 'reduced motion should disable Recharts animation');
assert.match(component, /prefers-reduced-motion: reduce/, 'component should observe reduced motion preference');
assert.match(component, /data-sparkline-endpoint/, 'component should render a measurable fixed endpoint');
assert.match(component, /data-sparkline-active-dot/, 'component should render the nearest hovered data point');
assert.match(component, /formatValue\(payload\[0\]\.value\)/, 'tooltip should show only the formatted point value');
assert.match(component, /useId\(\)/, 'gradient ids should be unique per card');
assert.match(
  component,
  /compact \? 'bottom-2\.5 h-5' : 'bottom-4 h-6'/,
  'compact sparklines should sit lower and reserve enough clearance for their endpoint halo',
);

assert.match(styles, /\.metric-sparkline-card:hover \.metric-sparkline-line/, 'card hover should enhance the line');
assert.match(styles, /\.metric-sparkline-card:hover \.metric-sparkline-area/, 'card hover should deepen the area');
assert.match(styles, /\.metric-sparkline-card:hover \.metric-sparkline-endpoint/, 'card hover should enhance the endpoint');
assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/, 'sparkline CSS motion should have a reduced-motion fallback');

console.log('metric sparkline tests passed');
