export const DEMO_DATE = '2026-07-17';
export const DEMO_NOW = '2026-07-17 09:41:52';
export const STALE_EBAY_SYNC_AT = '2026-06-01 09:18:41';

const pad = (value) => String(value).padStart(2, '0');

function parseDateOnly(value) {
  const match = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (
    date.getUTCFullYear() !== Number(match[1])
    || date.getUTCMonth() + 1 !== Number(match[2])
    || date.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }
  return date;
}

function formatDateOnly(date) {
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
  ].join('-');
}

function shiftDate(dateValue, days) {
  const date = parseDateOnly(dateValue);
  if (!date) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateOnly(date);
}

export function buildRollingDateLabels(days, endDate = DEMO_DATE) {
  if (!Number.isInteger(days) || days <= 0) {
    throw new TypeError('days must be a positive integer');
  }

  const end = parseDateOnly(endDate);
  if (!end) throw new TypeError('endDate must use YYYY-MM-DD');

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - index - 1));
    return `${date.getUTCMonth() + 1}.${pad(date.getUTCDate())}`;
  });
}

export function buildBusinessDateTime({
  daysAgo = 0,
  hour = 9,
  minute = 41,
  second = 52,
} = {}) {
  if (!Number.isInteger(daysAgo) || daysAgo < 0) {
    throw new TypeError('daysAgo must be a non-negative integer');
  }

  const values = [hour, minute, second];
  const limits = [23, 59, 59];
  if (values.some((value, index) => !Number.isInteger(value) || value < 0 || value > limits[index])) {
    throw new TypeError('time values are outside their valid range');
  }

  const date = shiftDate(DEMO_DATE, -daysAgo);
  return `${date} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}

export function normalizeBusinessDate(value, referenceDate = DEMO_DATE) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) return '';

  const fullDate = rawValue.match(/^(\d{4}-\d{2}-\d{2})(?:\s|$)/)?.[1];
  if (fullDate) return parseDateOnly(fullDate) ? fullDate : '';
  if (rawValue === '刚刚' || rawValue.startsWith('今天')) return referenceDate;
  if (rawValue.startsWith('昨天')) return shiftDate(referenceDate, -1);

  const compactDate = rawValue.match(/^(\d{1,2})[.-](\d{1,2})(?:\s|$)/);
  if (!compactDate) return '';

  const year = String(referenceDate).slice(0, 4);
  const normalized = `${year}-${pad(compactDate[1])}-${pad(compactDate[2])}`;
  return parseDateOnly(normalized) ? normalized : '';
}

export function formatCompactDateTime(value) {
  const rawValue = String(value ?? '').trim();
  const match = rawValue.match(/^\d{4}-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!match) return rawValue;
  return match[3] ? `${match[1]}-${match[2]} ${match[3]}:${match[4]}` : `${match[1]}-${match[2]}`;
}
