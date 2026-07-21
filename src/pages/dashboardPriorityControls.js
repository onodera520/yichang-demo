import { isOperationalOrder } from '../utils/orderSorting.js';

export function getPriorityAbnormalTypes(rows) {
  return [
    ...new Set(
      rows
        .filter(isOperationalOrder)
        .map((row) => row.abnormalType)
        .filter(Boolean),
    ),
  ];
}

export function getNextPrioritySort(sortDirection) {
  if (sortDirection === 'urgent') return 'risk-desc';
  if (sortDirection === 'risk-desc') return 'risk-asc';
  return 'urgent';
}
