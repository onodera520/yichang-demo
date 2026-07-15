export function groupSelectedOrders(selectedOrders, visibleRows) {
  const visibleIds = new Set(visibleRows.map((order) => order.id));

  return selectedOrders.reduce(
    (groups, order) => {
      if (visibleIds.has(order.id)) groups.currentPage.push(order);
      else groups.otherPages.push(order);
      return groups;
    },
    { currentPage: [], otherPages: [] },
  );
}
