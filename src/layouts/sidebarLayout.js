export const SIDEBAR_EXPANDED_WIDTH = 180;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

export function getSidebarLayout(collapsed) {
  const width = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  return {
    sidebarWidth: width,
    contentOffset: width,
  };
}
