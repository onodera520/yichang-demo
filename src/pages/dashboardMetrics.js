const TERMINAL_ORDER_STATUSES = new Set(['已完成', '已驳回']);
const TERMINAL_INVENTORY_STATUSES = new Set(['已完成']);

export const DASHBOARD_METRIC_KEYS = [
  'highRiskOrders',
  'stockoutSoon',
  'logisticsDelay',
  'afterSale',
  'potentialLoss',
];

export const DASHBOARD_METRIC_PRESETS = {
  highRiskOrders: { key: 'highRiskOrders', label: '高风险订单', route: '/orders' },
  stockoutSoon: { key: 'stockoutSoon', label: '即将缺货SKU', route: '/inventory' },
  logisticsDelay: { key: 'logisticsDelay', label: '物流延误', route: '/orders' },
  afterSale: { key: 'afterSale', label: '售后高发', route: '/orders' },
  potentialLoss: { key: 'potentialLoss', label: '潜在亏损', route: '/orders' },
};

const METRIC_DISPLAY = {
  highRiskOrders: { valueFormat: 'integer' },
  stockoutSoon: { valueFormat: 'integer' },
  logisticsDelay: { valueFormat: 'integer' },
  afterSale: { valueFormat: 'integer' },
  potentialLoss: { valueFormat: 'currency' },
};

function getTrendTone(changeValue) {
  if (changeValue > 0) return '#FF1F1F';
  if (changeValue < 0) return '#20C997';
  return '#8A98B3';
}

export function isUnresolvedOrder(order) {
  return !TERMINAL_ORDER_STATUSES.has(order?.status);
}

export function isUnresolvedInventory(item) {
  return !TERMINAL_INVENTORY_STATUSES.has(item?.status);
}

export function matchesDashboardPreset(item, presetKey) {
  if (presetKey === 'stockoutSoon') {
    return isUnresolvedInventory(item) && Number(item?.availableDays) <= 7;
  }

  if (!isUnresolvedOrder(item)) return false;
  if (presetKey === 'highRiskOrders' || presetKey === 'potentialLoss') {
    return item?.riskLevel === '高';
  }
  if (presetKey === 'logisticsDelay') return item?.abnormalType === '物流延误';
  if (presetKey === 'afterSale') return item?.abnormalType === '退款';
  return false;
}

function formatValue(value, valueFormat) {
  return valueFormat === 'currency'
    ? `¥${value.toLocaleString('zh-CN')}`
    : String(value);
}

function formatChange(value) {
  if (value > 0) return `+${value.toLocaleString('zh-CN')}`;
  return value.toLocaleString('zh-CN');
}

export function buildDashboardMetrics({
  orders = [],
  inventory = [],
  history = {},
  platform = '',
  store = '',
}) {
  const scopedOrders = orders.filter((item) => (
    (!platform || item.platform === platform) &&
    (!store || item.store === store)
  ));
  const scopedInventory = inventory.filter((item) => !platform || item.platform === platform);
  const values = {
    highRiskOrders: scopedOrders.filter((item) => matchesDashboardPreset(item, 'highRiskOrders')).length,
    stockoutSoon: scopedInventory.filter((item) => matchesDashboardPreset(item, 'stockoutSoon')).length,
    logisticsDelay: scopedOrders.filter((item) => matchesDashboardPreset(item, 'logisticsDelay')).length,
    afterSale: scopedOrders.filter((item) => matchesDashboardPreset(item, 'afterSale')).length,
    potentialLoss: scopedOrders
      .filter((item) => matchesDashboardPreset(item, 'potentialLoss'))
      .reduce((total, item) => total + Number(item.amount || 0), 0),
  };

  return DASHBOARD_METRIC_KEYS.map((key) => {
    const preset = DASHBOARD_METRIC_PRESETS[key];
    const display = METRIC_DISPLAY[key];
    const snapshots = [...(history[key] ?? [])];
    const currentValue = values[key];
    const yesterdayValue = Number(snapshots.at(-1) ?? currentValue);
    const changeValue = currentValue - yesterdayValue;

    return {
      key,
      label: preset.label,
      value: formatValue(currentValue, display.valueFormat),
      numericValue: currentValue,
      currentValue,
      change: formatChange(changeValue),
      changeValue,
      valueFormat: display.valueFormat,
      tone: getTrendTone(changeValue),
      trend: [...snapshots, currentValue],
      route: preset.route,
      dashboardPreset: key,
    };
  });
}
