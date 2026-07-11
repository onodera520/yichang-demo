const RISK_WEIGHTS = {
  高: 3,
  中: 2,
  低: 1,
};

export function getPriorityAbnormalTypes(rows) {
  return [...new Set(rows.map((row) => row.abnormalType).filter(Boolean))];
}

export function filterAndSortPriorityRows(rows, abnormalType = '全部异常', sortDirection = 'default') {
  const filteredRows = abnormalType === '全部异常'
    ? [...rows]
    : rows.filter((row) => row.abnormalType === abnormalType);

  if (sortDirection === 'default') return filteredRows;

  return filteredRows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => {
      const leftWeight = RISK_WEIGHTS[left.row.riskLevel];
      const rightWeight = RISK_WEIGHTS[right.row.riskLevel];
      const leftKnown = leftWeight !== undefined;
      const rightKnown = rightWeight !== undefined;

      if (leftKnown !== rightKnown) return leftKnown ? -1 : 1;
      if (!leftKnown) return left.index - right.index;

      const weightDifference = sortDirection === 'desc'
        ? rightWeight - leftWeight
        : leftWeight - rightWeight;

      return weightDifference || left.index - right.index;
    })
    .map(({ row }) => row);
}

export function getNextPrioritySort(sortDirection) {
  if (sortDirection === 'default') return 'desc';
  if (sortDirection === 'desc') return 'asc';
  return 'default';
}
