import assert from 'node:assert/strict';
import {
  formatCountUnit,
  formatDurationUnit,
  formatEfficiencyTooltipValue,
} from './chartUnits.js';

assert.equal(formatCountUnit(1000), '1000件');
assert.equal(formatCountUnit(0), '0件');
assert.equal(formatDurationUnit(37.2), '37.2分');
assert.equal(formatEfficiencyTooltipValue(45, '处理时长'), '45分');
assert.equal(formatEfficiencyTooltipValue(4500, '处理量'), '4500件');
