export function matchesTaskTab(task, activeTab, isOverdue = false) {
  if (activeTab === '全部待办') return task.status !== '已完成';
  if (activeTab === '已超时') return isOverdue;
  return task.status === activeTab;
}
