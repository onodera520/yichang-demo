import { matchesDashboardPreset } from '../dashboardMetrics.js';
import {
  sortOrdersByAmountDesc,
  sortOrdersBySlaAsc,
} from '../../utils/orderSorting.js';

const ORDER_DASHBOARD_PRESETS = {
  highRiskOrders: {
    label: '高风险未解决 · 剩余 SLA 从短到长',
    tab: '全部',
    riskLevel: '高',
  },
  logisticsDelay: {
    label: '物流延误 · 未解决',
    tab: '物流延误',
    riskLevel: '',
  },
  afterSale: {
    label: '退款售后 · 未解决',
    tab: '退款',
    riskLevel: '',
  },
  potentialLoss: {
    label: '高风险未解决 · 影响金额从高到低',
    tab: '全部',
    riskLevel: '高',
  },
};

export function getOrderDashboardPresetMeta(key) {
  return ORDER_DASHBOARD_PRESETS[key] ?? null;
}

export function applyOrderDashboardPreset(rows, key, nowMs = 0, anchorMs = 0) {
  const matchedRows = rows.filter((row) => matchesDashboardPreset(row, key));
  return key === 'potentialLoss'
    ? sortOrdersByAmountDesc(matchedRows)
    : sortOrdersBySlaAsc(matchedRows, nowMs, anchorMs);
}
