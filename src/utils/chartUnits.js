export function formatCountUnit(value) {
  return `${value}件`;
}

export function formatDurationUnit(value) {
  return `${value}分`;
}

export function formatEfficiencyTooltipValue(value, name) {
  return name === '处理时长' ? formatDurationUnit(value) : formatCountUnit(value);
}
