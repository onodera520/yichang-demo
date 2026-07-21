import { matchesDashboardPreset } from '../dashboardMetrics.js';

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
