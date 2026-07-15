export function applyOrderTransactionState(state, transaction) {
  const orderMap = new Map((transaction.orders || []).map((order) => [order.id, order]));
  const removeTaskIds = new Set(transaction.taskIdsToRemove || []);
  return {
    orders: state.orders.map((order) => orderMap.get(order.id) || order),
    tasks: [
      ...(transaction.tasksToAdd || []),
      ...state.tasks.filter((task) => !removeTaskIds.has(task.id)),
    ],
  };
}

export function resetOrderRows(rows) {
  return rows.map((order) => ({
    ...order,
    detail: order.detail ? { ...order.detail } : order.detail,
  }));
}
