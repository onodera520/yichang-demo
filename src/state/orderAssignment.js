export const UNASSIGNED_ORDER_OWNER = '未分派';

export function normalizeOrderAssignmentState(order) {
  if (!order || order.owner !== UNASSIGNED_ORDER_OWNER) return order;

  return {
    ...order,
    status: '待分派',
    detail: order.detail
      ? { ...order.detail, owner: UNASSIGNED_ORDER_OWNER }
      : order.detail,
  };
}
