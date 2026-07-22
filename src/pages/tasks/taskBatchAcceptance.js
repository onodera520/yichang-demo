import { getTaskAcceptanceBlockReason } from '../../state/taskAcceptance.js';

export function getBatchAcceptanceSummary(
  displayedTasks,
  selectedIds,
  orders = [],
  inventory = [],
) {
  const selectedIdSet = new Set(selectedIds ?? []);
  const selectedTasks = (displayedTasks ?? []).filter(
    (task) => task.status === '待验收' && selectedIdSet.has(task.id),
  );
  const eligibleTasks = [];
  const skippedTasks = [];

  selectedTasks.forEach((task) => {
    const reason = getTaskAcceptanceBlockReason(task, orders, inventory);
    if (reason) {
      skippedTasks.push({ id: task.id, title: task.title, reason });
      return;
    }
    eligibleTasks.push(task);
  });

  return { selectedTasks, eligibleTasks, skippedTasks };
}

export function reconcileBatchAcceptanceSelection(selectedIds, acceptedIds) {
  const acceptedIdSet = new Set(acceptedIds ?? []);
  return (selectedIds ?? []).filter((id) => !acceptedIdSet.has(id));
}
