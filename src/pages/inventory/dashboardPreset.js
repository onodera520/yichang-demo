import { matchesDashboardPreset } from '../dashboardMetrics.js';

export function matchesInventoryAvailableDays(item, range) {
  const availableDays = Number(item?.availableDays);
  if (!Number.isFinite(availableDays) || availableDays < 0) return false;

  if (range === '7') return availableDays <= 7;
  if (range === '8-14') return availableDays > 7 && availableDays <= 14;
  if (range === '30') return availableDays <= 30;
  if (range === 'slow') return availableDays >= 90;
  return true;
}

const inventoryMetricPredicates = {
  stockout0To7: (item) => matchesInventoryAvailableDays(item, '7'),
  stockout8To14: (item) => matchesInventoryAvailableDays(item, '8-14'),
  slowMoving: (item) => item?.riskLevel === '滞销',
  transfer: (item) => item?.riskLevel === '调拨',
};

function countUniqueSkus(rows, predicate) {
  return new Set(rows.filter(predicate).map((item) => item.sku)).size;
}

function formatChange(value) {
  return value > 0 ? `+${value}` : String(value);
}

function getTrendTone(changeValue) {
  if (changeValue > 0) return '#FF3B3B';
  if (changeValue < 0) return '#16C7A1';
  return '#8A98B3';
}

export function buildInventoryMetricStats(rows = [], definitions = []) {
  return definitions.map((definition) => {
    const predicate = inventoryMetricPredicates[definition.key] ?? (() => false);
    const currentValue = countUniqueSkus(rows, predicate);
    const history = [...(definition.trend ?? [])].slice(0, -1);
    const yesterdayValue = Number(history.at(-1) ?? currentValue);
    const changeValue = currentValue - yesterdayValue;

    return {
      ...definition,
      value: currentValue,
      currentValue,
      change: formatChange(changeValue),
      changeValue,
      tone: getTrendTone(changeValue),
      trend: [...history, currentValue],
    };
  });
}

const INVENTORY_DASHBOARD_PRESETS = {
  stockoutSoon: {
    label: '7 天内缺货 · 未解决 · 可售天数从少到多',
    availableDays: '7',
  },
};

export function getInventoryDashboardPresetMeta(key) {
  return INVENTORY_DASHBOARD_PRESETS[key] ?? null;
}

export function applyInventoryDashboardPreset(rows, key) {
  return rows
    .filter((item) => matchesDashboardPreset(item, key))
    .map((item, index) => ({ item, index }))
    .sort((left, right) => (
      Number(left.item.availableDays) - Number(right.item.availableDays) ||
      left.index - right.index
    ))
    .map(({ item }) => item);
}
