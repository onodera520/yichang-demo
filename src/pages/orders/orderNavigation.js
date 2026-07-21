export function getOrderPageForId(rows, orderId, pageSize) {
  if (!orderId || !Number.isInteger(pageSize) || pageSize <= 0) return null;

  const orderIndex = rows.findIndex((row) => row.id === orderId);
  if (orderIndex < 0) return null;

  return Math.floor(orderIndex / pageSize) + 1;
}
