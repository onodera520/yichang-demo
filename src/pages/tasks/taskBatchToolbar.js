export function getTaskBatchToolbarActions(activeTab) {
  if (activeTab === '待验收') return ['accept'];
  if (activeTab === '已完成') return [];
  if (activeTab === '已超时') return ['transfer', 'remind', 'upgrade'];
  return ['transfer', 'remind'];
}
