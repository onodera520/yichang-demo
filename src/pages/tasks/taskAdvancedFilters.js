import { normalizeBusinessDate } from '../../data/demoTime.js';
import { getTaskSlaPresentation } from '../../state/taskSla.js';

export const taskAdvancedFilterDefaults = {
  title: '',
  source: '',
  createdFrom: '',
  createdTo: '',
  slaMinHours: '',
  slaMaxHours: '',
};

function hasValue(value) {
  return value !== '' && value != null;
}

function optionalNumber(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function contains(value, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) return true;
  return String(value ?? '').toLowerCase().includes(normalizedQuery);
}

export function matchesTaskAdvancedFilters(
  task,
  filters = taskAdvancedFilterDefaults,
  nowMs = Date.now(),
  anchorMs = nowMs,
) {
  const createdDate = normalizeBusinessDate(task.createdAt);
  const hasCreatedRange = Boolean(filters.createdFrom || filters.createdTo);
  const minHours = optionalNumber(filters.slaMinHours);
  const maxHours = optionalNumber(filters.slaMaxHours);
  const hasSlaRange = hasValue(filters.slaMinHours) || hasValue(filters.slaMaxHours);
  const sla = hasSlaRange ? getTaskSlaPresentation(task, nowMs, anchorMs) : null;

  return (
    contains(task.title, filters.title)
    && contains(task.source, filters.source)
    && (!hasCreatedRange || Boolean(createdDate))
    && (!filters.createdFrom || createdDate >= filters.createdFrom)
    && (!filters.createdTo || createdDate <= filters.createdTo)
    && (!hasSlaRange || (
      sla.state === 'remaining'
      && (minHours == null || sla.seconds >= minHours * 3600)
      && (maxHours == null || sla.seconds <= maxHours * 3600)
    ))
  );
}

export function getTaskAdvancedFilterErrors(filters = taskAdvancedFilterDefaults) {
  const minHours = optionalNumber(filters.slaMinHours);
  const maxHours = optionalNumber(filters.slaMaxHours);
  let createdAt = '';
  let sla = '';

  if (filters.createdFrom && filters.createdTo && filters.createdFrom > filters.createdTo) {
    createdAt = '开始日期不能晚于结束日期';
  }

  if (
    (hasValue(filters.slaMinHours) && minHours == null)
    || (hasValue(filters.slaMaxHours) && maxHours == null)
  ) {
    sla = '请输入有效 SLA';
  } else if (
    (minHours != null && minHours < 0)
    || (maxHours != null && maxHours < 0)
  ) {
    sla = 'SLA 不能小于 0';
  } else if (minHours != null && maxHours != null && minHours > maxHours) {
    sla = '最小 SLA 不能大于最大 SLA';
  }

  return { createdAt, sla };
}

export function countActiveTaskAdvancedFilters(filters = taskAdvancedFilterDefaults) {
  return [
    Boolean(String(filters.title ?? '').trim()),
    Boolean(String(filters.source ?? '').trim()),
    Boolean(filters.createdFrom || filters.createdTo),
    hasValue(filters.slaMinHours) || hasValue(filters.slaMaxHours),
  ].filter(Boolean).length;
}
