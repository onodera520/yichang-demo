export const TASK_RISK_FILTERS = ['全部', '高', '中', '低', '滞销', '调拨'];

export function matchesTaskRiskFilter(task, filter) {
  return filter === '全部' || task?.riskLevel === filter;
}
