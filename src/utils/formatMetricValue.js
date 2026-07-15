export function formatMetricValue(value, valueFormat = 'integer') {
  const numericValue = Number(value);

  switch (valueFormat) {
    case 'currency':
      return `¥${numericValue.toLocaleString('zh-CN')}`;
    case 'minutes-1':
      return `${numericValue.toFixed(1)} 分`;
    case 'percent-1':
      return `${numericValue.toFixed(1)}%`;
    case 'percent-2':
      return `${numericValue.toFixed(2)}%`;
    default:
      return numericValue.toLocaleString('zh-CN');
  }
}
