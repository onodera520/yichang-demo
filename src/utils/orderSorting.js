import { getRemainingSlaSeconds } from './sla.js';

const RISK_WEIGHTS = {
  高: 3,
  中: 2,
  低: 1,
};

const TERMINAL_ORDER_STATUSES = new Set(['已完成', '已驳回']);

function getPurchaseTimestamp(order) {
  const value = order?.detail?.createdAt;
  if (!value) return null;

  const matched = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/,
  );
  if (matched) {
    const [, year, month, day, hour, minute, second = '0'] = matched;
    const parts = {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: Number(hour),
      minute: Number(minute),
      second: Number(second),
    };
    const timestamp = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const normalized = new Date(timestamp);
    const valid = (
      normalized.getUTCFullYear() === parts.year &&
      normalized.getUTCMonth() === parts.month - 1 &&
      normalized.getUTCDate() === parts.day &&
      normalized.getUTCHours() === parts.hour &&
      normalized.getUTCMinutes() === parts.minute &&
      normalized.getUTCSeconds() === parts.second
    );
    return valid ? timestamp : null;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function comparePurchaseTimeDesc(left, right) {
  const leftTime = getPurchaseTimestamp(left);
  const rightTime = getPurchaseTimestamp(right);
  const leftValid = leftTime != null;
  const rightValid = rightTime != null;

  if (leftValid !== rightValid) return leftValid ? -1 : 1;
  if (!leftValid) return 0;
  return rightTime - leftTime;
}

function getSlaPriority(order, nowMs, anchorMs) {
  const seconds = getRemainingSlaSeconds(order.remainingSLA, nowMs, anchorMs);
  if (seconds == null) return { band: 3, seconds: Number.POSITIVE_INFINITY };
  if (seconds === 0) return { band: 0, seconds };
  if (seconds < 7200) return { band: 1, seconds };
  return { band: 2, seconds };
}

function compareSlaPriority(left, right, nowMs, anchorMs) {
  const leftSla = getSlaPriority(left, nowMs, anchorMs);
  const rightSla = getSlaPriority(right, nowMs, anchorMs);
  return leftSla.band - rightSla.band || leftSla.seconds - rightSla.seconds;
}

function compareUrgentPriority(left, right, nowMs, anchorMs) {
  const leftSla = getSlaPriority(left, nowMs, anchorMs);
  const rightSla = getSlaPriority(right, nowMs, anchorMs);
  return (
    leftSla.band - rightSla.band ||
    compareRisk(left, right, 'desc') ||
    leftSla.seconds - rightSla.seconds
  );
}

function compareRisk(left, right, direction) {
  const leftWeight = RISK_WEIGHTS[left.riskLevel] ?? 0;
  const rightWeight = RISK_WEIGHTS[right.riskLevel] ?? 0;
  return direction === 'asc'
    ? leftWeight - rightWeight
    : rightWeight - leftWeight;
}

function compareAmountDesc(left, right) {
  return Number(right.amount || 0) - Number(left.amount || 0);
}

export function isOperationalOrder(order) {
  return !TERMINAL_ORDER_STATUSES.has(order.status);
}

export function sortOrdersByPurchaseTimeDesc(rows) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => (
      comparePurchaseTimeDesc(left.row, right.row) || left.index - right.index
    ))
    .map(({ row }) => row);
}

export function sortOrdersBySlaAsc(rows, nowMs = 0, anchorMs = 0) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => (
      compareSlaPriority(left.row, right.row, nowMs, anchorMs) || left.index - right.index
    ))
    .map(({ row }) => row);
}

export function sortOrdersByAmountDesc(rows) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareAmountDesc(left.row, right.row) || left.index - right.index)
    .map(({ row }) => row);
}

export function getOperationalPriorityRows(
  rows,
  {
    abnormalType = '全部异常',
    sortMode = 'urgent',
    nowMs = 0,
    anchorMs = 0,
    limit = 10,
  } = {},
) {
  return rows
    .filter((row) => (
      isOperationalOrder(row) &&
      (abnormalType === '全部异常' || row.abnormalType === abnormalType)
    ))
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const compareUrgency = () => (
        compareUrgentPriority(left.row, right.row, nowMs, anchorMs) ||
        compareAmountDesc(left.row, right.row) ||
        comparePurchaseTimeDesc(left.row, right.row) ||
        left.index - right.index
      );

      if (sortMode === 'risk-desc') {
        return (
          compareRisk(left.row, right.row, 'desc') ||
          compareSlaPriority(left.row, right.row, nowMs, anchorMs) ||
          compareAmountDesc(left.row, right.row) ||
          comparePurchaseTimeDesc(left.row, right.row) ||
          left.index - right.index
        );
      }

      if (sortMode === 'risk-asc') {
        return (
          compareRisk(left.row, right.row, 'asc') ||
          compareSlaPriority(left.row, right.row, nowMs, anchorMs) ||
          compareAmountDesc(left.row, right.row) ||
          comparePurchaseTimeDesc(left.row, right.row) ||
          left.index - right.index
        );
      }

      return compareUrgency();
    })
    .slice(0, Math.max(0, limit))
    .map(({ row }) => row);
}
