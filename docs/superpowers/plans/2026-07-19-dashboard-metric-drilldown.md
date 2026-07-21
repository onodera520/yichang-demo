# Dashboard Metric Drilldown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the five dashboard metric cards derive their current values from shared live Mock state and drill into matching, visibly filtered order or inventory results.

**Architecture:** Add one pure dashboard metric module that owns metric predicates, aggregation, historical series composition, and route presets. `Dashboard.jsx` consumes its output; `Orders.jsx` and `Inventory.jsx` decode the same preset keys, apply unresolved-only filters and metric-specific sorting, and expose a removable preset notice so no filter remains hidden.

**Tech Stack:** React 18, React Router, Vite, Tailwind CSS, Node `.test.mjs` tests.

## Global Constraints

- Keep the existing routes, layout, card dimensions, spacing, colors, icon assets, and overall visual style unchanged.
- Use only shared frontend Mock state; do not add a backend, persistence, dependencies, or fabricated independent current totals.
- Dashboard current values must be recomputed from `orders` and `inventory` in `DemoStateContext` and update after existing status changes.
- Historical comparison and sparkline points may use same-definition Mock snapshots, with the live current value appended as the final point.
- Global platform and store selections affect order metrics; platform affects inventory metrics; the topbar keyword must not alter headline metrics.
- Preserve all unrelated dirty-worktree changes and do not deploy, commit, or push feature code unless separately requested.

---

## File Structure

- Create `src/pages/dashboardMetrics.js`: metric keys, route preset definitions, live aggregation, historical trend composition, and shared predicate/sort helpers.
- Create `src/pages/dashboardMetrics.test.mjs`: pure-function tests for all five definitions, global-filter scope, live updates, trends, and route presets.
- Modify `src/data/mockData.js`: replace isolated dashboard current totals with same-definition historical snapshots exported as `dashboardMetricHistory`.
- Modify `src/data/metricCardTrendData.test.mjs`: validate the new history shape instead of treating fixed dashboard totals as current truth.
- Modify `src/pages/Dashboard.jsx`: consume live orders/inventory, render generated metrics, make every card clickable, and navigate with `dashboardPreset`.
- Create `src/pages/dashboardMetricInteractions.test.mjs`: source-level guard for whole-card activation and preset navigation.
- Modify `src/utils/orderSorting.js`: expose stable SLA-ascending and amount-descending sort functions used by preset landings.
- Modify `src/utils/orderSorting.test.mjs`: verify terminal/no-SLA placement and deterministic sorting.
- Modify `src/pages/Orders.jsx`: decode order presets, apply unresolved criteria and sorting, show/remove preset notice, and keep count consistent with dashboard.
- Create `src/pages/orders/dashboardPreset.test.mjs`: test order-preset filtering and sort selection through exported pure helpers.
- Modify `src/pages/Inventory.jsx`: decode stockout preset, apply unresolved and available-days sorting, and show/remove preset notice.
- Create `src/pages/inventory/dashboardPreset.test.mjs`: test inventory-preset filtering and ordering.

### Task 1: Shared Metric Definitions And Live Aggregation

**Files:**
- Create: `src/pages/dashboardMetrics.js`
- Create: `src/pages/dashboardMetrics.test.mjs`
- Modify: `src/data/mockData.js`
- Modify: `src/data/metricCardTrendData.test.mjs`

**Interfaces:**
- Consumes: `orders`, `inventory`, `dashboardMetricHistory`, global `platform`, and global `store`.
- Produces: `DASHBOARD_METRIC_KEYS`, `DASHBOARD_METRIC_PRESETS`, `isUnresolvedOrder(order)`, `isUnresolvedInventory(item)`, `matchesDashboardPreset(item, presetKey)`, and `buildDashboardMetrics(input)`.
- `buildDashboardMetrics({ orders, inventory, history, platform = '', store = '' })` returns five objects with `{ key, label, value, numericValue, change, valueFormat, tone, trend, route, dashboardPreset }`.

- [ ] **Step 1: Write failing aggregation and preset tests**

```js
import assert from 'node:assert/strict';
import {
  DASHBOARD_METRIC_PRESETS,
  buildDashboardMetrics,
  isUnresolvedInventory,
  isUnresolvedOrder,
  matchesDashboardPreset,
} from './dashboardMetrics.js';

const orders = [
  { id: 'o1', platform: 'Amazon', store: 'US旗舰店', riskLevel: '高', abnormalType: '物流延误', status: '待处理', amount: 300, remainingSLA: '00:30:00' },
  { id: 'o2', platform: 'Amazon', store: 'US旗舰店', riskLevel: '高', abnormalType: '退款', status: '处理中', amount: 500, remainingSLA: '02:30:00' },
  { id: 'o3', platform: 'eBay', store: 'DE店', riskLevel: '高', abnormalType: '物流延误', status: '已完成', amount: 900, remainingSLA: '-' },
  { id: 'o4', platform: 'Amazon', store: 'US旗舰店', riskLevel: '中', abnormalType: '退款', status: '待处理', amount: 200, remainingSLA: '05:00:00' },
];
const inventory = [
  { sku: 's1', platform: 'Amazon', availableDays: 1, status: '待处理' },
  { sku: 's2', platform: 'Amazon', availableDays: 7, status: '待补货' },
  { sku: 's3', platform: 'Amazon', availableDays: 3, status: '已完成' },
  { sku: 's4', platform: 'eBay', availableDays: 2, status: '待处理' },
];
const history = {
  highRiskOrders: [1, 1],
  stockoutSoon: [1, 1],
  logisticsDelay: [0, 0],
  afterSale: [1, 1],
  potentialLoss: [100, 200],
};

assert.equal(isUnresolvedOrder(orders[0]), true);
assert.equal(isUnresolvedOrder(orders[2]), false);
assert.equal(isUnresolvedInventory(inventory[2]), false);
assert.equal(matchesDashboardPreset(orders[0], 'logisticsDelay'), true);
assert.equal(matchesDashboardPreset(orders[2], 'logisticsDelay'), false);

const metrics = buildDashboardMetrics({ orders, inventory, history });
assert.deepEqual(metrics.map((item) => item.numericValue), [2, 3, 1, 2, 800]);
assert.deepEqual(metrics.map((item) => item.trend.at(-1)), [2, 3, 1, 2, 800]);
assert.equal(metrics[4].value, '¥800');
assert.deepEqual(
  metrics.map(({ route, dashboardPreset }) => ({ route, dashboardPreset })),
  Object.values(DASHBOARD_METRIC_PRESETS).map(({ route, key }) => ({ route, dashboardPreset: key })),
);

const amazonMetrics = buildDashboardMetrics({ orders, inventory, history, platform: 'Amazon', store: 'US旗舰店' });
assert.deepEqual(amazonMetrics.map((item) => item.numericValue), [2, 2, 1, 2, 800]);

const completedOrders = orders.map((order) => order.id === 'o1' ? { ...order, status: '已完成' } : order);
assert.deepEqual(
  buildDashboardMetrics({ orders: completedOrders, inventory, history }).map((item) => item.numericValue),
  [1, 3, 0, 2, 500],
);
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `node .\src\pages\dashboardMetrics.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `dashboardMetrics.js`.

- [ ] **Step 3: Add historical snapshots to Mock data**

Replace the fixed `dashboardStats` export with snapshots that contain no live/current total:

```js
export const dashboardMetricHistory = {
  highRiskOrders: [17, 19, 16, 20, 18, 21, 17, 22, 19, 21, 15],
  stockoutSoon: [28, 30, 31, 29, 33, 31, 30, 34, 32, 31, 25],
  logisticsDelay: [15, 16, 13, 17, 15, 13, 15, 14, 16, 14, 23],
  afterSale: [10, 11, 8, 12, 10, 9, 12, 10, 11, 14, 11],
  potentialLoss: [28400, 29600, 27100, 30900, 28800, 26300, 30100, 29800, 31700, 30500, 34140],
};
```

The last snapshot is yesterday. The pure aggregator appends the current live value and computes `change = current - yesterday`.

- [ ] **Step 4: Implement metric definitions and aggregation**

```js
const TERMINAL_ORDER_STATUSES = new Set(['已完成', '已驳回']);
const TERMINAL_INVENTORY_STATUSES = new Set(['已完成']);

export const DASHBOARD_METRIC_KEYS = [
  'highRiskOrders',
  'stockoutSoon',
  'logisticsDelay',
  'afterSale',
  'potentialLoss',
];

export const DASHBOARD_METRIC_PRESETS = {
  highRiskOrders: { key: 'highRiskOrders', label: '高风险订单', route: '/orders' },
  stockoutSoon: { key: 'stockoutSoon', label: '即将缺货SKU', route: '/inventory' },
  logisticsDelay: { key: 'logisticsDelay', label: '物流延误', route: '/orders' },
  afterSale: { key: 'afterSale', label: '售后高发', route: '/orders' },
  potentialLoss: { key: 'potentialLoss', label: '潜在亏损', route: '/orders' },
};

const DISPLAY = {
  highRiskOrders: { tone: '#FF4D4F', valueFormat: 'number' },
  stockoutSoon: { tone: '#FF4D4F', valueFormat: 'number' },
  logisticsDelay: { tone: '#20C997', valueFormat: 'number' },
  afterSale: { tone: '#FF1F1F', valueFormat: 'number' },
  potentialLoss: { tone: '#20C997', valueFormat: 'currency' },
};

export function isUnresolvedOrder(order) {
  return !TERMINAL_ORDER_STATUSES.has(order?.status);
}

export function isUnresolvedInventory(item) {
  return !TERMINAL_INVENTORY_STATUSES.has(item?.status);
}

export function matchesDashboardPreset(item, presetKey) {
  if (presetKey === 'stockoutSoon') return isUnresolvedInventory(item) && Number(item.availableDays) <= 7;
  if (!isUnresolvedOrder(item)) return false;
  if (presetKey === 'highRiskOrders' || presetKey === 'potentialLoss') return item.riskLevel === '高';
  if (presetKey === 'logisticsDelay') return item.abnormalType === '物流延误';
  if (presetKey === 'afterSale') return item.abnormalType === '退款';
  return false;
}

export function buildDashboardMetrics({ orders, inventory, history, platform = '', store = '' }) {
  const scopedOrders = orders.filter((item) =>
    (!platform || item.platform === platform) && (!store || item.store === store));
  const scopedInventory = inventory.filter((item) => !platform || item.platform === platform);
  const values = {
    highRiskOrders: scopedOrders.filter((item) => matchesDashboardPreset(item, 'highRiskOrders')).length,
    stockoutSoon: scopedInventory.filter((item) => matchesDashboardPreset(item, 'stockoutSoon')).length,
    logisticsDelay: scopedOrders.filter((item) => matchesDashboardPreset(item, 'logisticsDelay')).length,
    afterSale: scopedOrders.filter((item) => matchesDashboardPreset(item, 'afterSale')).length,
    potentialLoss: scopedOrders
      .filter((item) => matchesDashboardPreset(item, 'potentialLoss'))
      .reduce((total, item) => total + Number(item.amount || 0), 0),
  };

  return DASHBOARD_METRIC_KEYS.map((key) => {
    const preset = DASHBOARD_METRIC_PRESETS[key];
    const snapshots = [...(history[key] ?? [])];
    const yesterday = Number(snapshots.at(-1) ?? values[key]);
    const delta = values[key] - yesterday;
    return {
      key,
      label: preset.label,
      numericValue: values[key],
      value: DISPLAY[key].valueFormat === 'currency'
        ? `¥${values[key].toLocaleString('zh-CN')}`
        : String(values[key]),
      change: delta > 0 ? `+${delta.toLocaleString('zh-CN')}` : delta.toLocaleString('zh-CN'),
      trend: [...snapshots, values[key]],
      tone: DISPLAY[key].tone,
      valueFormat: DISPLAY[key].valueFormat,
      route: preset.route,
      dashboardPreset: key,
    };
  });
}
```

- [ ] **Step 5: Update the legacy trend-data test**

Change the dashboard assertion from `dashboardStats` card objects to `dashboardMetricHistory` arrays:

```js
assert.deepEqual(Object.keys(mockData.dashboardMetricHistory), [
  'highRiskOrders',
  'stockoutSoon',
  'logisticsDelay',
  'afterSale',
  'potentialLoss',
]);
Object.values(mockData.dashboardMetricHistory).forEach((points) => {
  assert.ok(points.length >= 2);
  points.forEach((value) => assert.equal(Number.isFinite(value), true));
});
```

- [ ] **Step 6: Run the focused tests**

Run: `node .\src\pages\dashboardMetrics.test.mjs; node .\src\data\metricCardTrendData.test.mjs`

Expected: both scripts exit `0`.

### Task 2: Dashboard Card Rendering And Navigation

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Create: `src/pages/dashboardMetricInteractions.test.mjs`

**Interfaces:**
- Consumes: `buildDashboardMetrics`, `dashboardMetricHistory`, `orders`, `inventory`, `platform`, and `store`.
- Produces: router navigation shaped as `navigate(item.route, { state: { dashboardPreset: item.dashboardPreset } })`.

- [ ] **Step 1: Write the failing interaction guard**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');
assert.match(source, /buildDashboardMetrics\(\{/);
assert.match(source, /dashboardPreset:\s*item\.dashboardPreset/);
assert.match(source, /<button[\s\S]*?metric-sparkline-card[\s\S]*?onClick=\{onDetail\}/);
assert.doesNotMatch(source, /dashboardStats\.map/);
```

- [ ] **Step 2: Run the test and confirm the old implementation fails**

Run: `node .\src\pages\dashboardMetricInteractions.test.mjs`

Expected: FAIL because `Dashboard.jsx` still maps `dashboardStats` and the outer card is an `article`.

- [ ] **Step 3: Wire live metric generation into the dashboard**

Import `dashboardMetricHistory` and `buildDashboardMetrics`, destructure `inventory` from `useDemoState()`, and derive cards:

```js
const { orders, inventory, tasks, ...demoState } = useDemoState();
const { platform, store, keyword } = useTopbarFilter();
const dashboardMetrics = React.useMemo(
  () => buildDashboardMetrics({
    orders,
    inventory,
    history: dashboardMetricHistory,
    platform,
    store,
  }),
  [inventory, orders, platform, store],
);
```

Do not include `keyword` in the metric dependencies or aggregation input.

- [ ] **Step 4: Replace index-based routing with preset routing**

```js
const handleMetricDetail = (item) => {
  navigate(item.route, {
    state: { dashboardPreset: item.dashboardPreset },
  });
};
```

Render `dashboardMetrics` and pass the metric object:

```jsx
{dashboardMetrics.map((item, index) => (
  <MetricCard
    key={item.key}
    item={item}
    index={index}
    onDetail={() => handleMetricDetail(item)}
  />
))}
```

- [ ] **Step 5: Make the whole card an accessible control**

Replace the outer `article` with one button and turn the nested detail button into presentation text:

```jsx
<button
  type="button"
  className="metric-sparkline-card relative h-[160px] w-full overflow-hidden rounded-[14px] border border-[#E8ECF3] bg-white px-6 py-4 text-left shadow-[0_8px_24px_rgba(28,39,71,0.06)] transition hover:border-[#C9D9F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F7BFF]/35"
  onClick={onDetail}
  aria-label={`查看${item.label}`}
>
  {/* existing card content */}
  <span className="shrink-0 font-medium text-[#2F7BFF]">查看详情</span>
  {/* existing sparkline */}
</button>
```

- [ ] **Step 6: Run interaction and aggregation tests**

Run: `node .\src\pages\dashboardMetricInteractions.test.mjs; node .\src\pages\dashboardMetrics.test.mjs`

Expected: both scripts exit `0`.

### Task 3: Order Preset Filtering And Sorting

**Files:**
- Modify: `src/utils/orderSorting.js`
- Modify: `src/utils/orderSorting.test.mjs`
- Modify: `src/pages/Orders.jsx`
- Create: `src/pages/orders/dashboardPreset.test.mjs`

**Interfaces:**
- Consumes: `dashboardPreset` values `highRiskOrders`, `logisticsDelay`, `afterSale`, and `potentialLoss`.
- Produces: `applyOrderDashboardPreset(rows, presetKey, nowMs, anchorMs)` returning a filtered and sorted copy; `sortOrdersBySlaAsc(rows, nowMs, anchorMs)`; `sortOrdersByAmountDesc(rows)`.

- [ ] **Step 1: Write failing order sort tests**

```js
const rows = [
  { id: 'late', remainingSLA: '04:00:00', amount: 100 },
  { id: 'urgent', remainingSLA: '00:30:00', amount: 200 },
  { id: 'none', remainingSLA: '-', amount: 900 },
];
assert.deepEqual(sortOrdersBySlaAsc(rows, 0, 0).map((row) => row.id), ['urgent', 'late', 'none']);
assert.deepEqual(sortOrdersByAmountDesc(rows).map((row) => row.id), ['none', 'urgent', 'late']);
assert.deepEqual(rows.map((row) => row.id), ['late', 'urgent', 'none']);
```

- [ ] **Step 2: Run the sort test and confirm exports are missing**

Run: `node .\src\utils\orderSorting.test.mjs`

Expected: FAIL because `sortOrdersBySlaAsc` and `sortOrdersByAmountDesc` are not exported.

- [ ] **Step 3: Add stable preset sort functions**

```js
export function sortOrdersBySlaAsc(rows, nowMs = 0, anchorMs = 0) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) =>
      compareSlaPriority(left.row, right.row, nowMs, anchorMs) || left.index - right.index)
    .map(({ row }) => row);
}

export function sortOrdersByAmountDesc(rows) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((left, right) => compareAmountDesc(left.row, right.row) || left.index - right.index)
    .map(({ row }) => row);
}
```

- [ ] **Step 4: Write failing preset tests**

```js
import assert from 'node:assert/strict';
import { applyOrderDashboardPreset, getOrderDashboardPresetMeta } from './dashboardPreset.js';

const rows = [
  { id: 'h1', riskLevel: '高', abnormalType: '缺货', status: '待处理', amount: 100, remainingSLA: '04:00:00' },
  { id: 'h2', riskLevel: '高', abnormalType: '物流延误', status: '处理中', amount: 400, remainingSLA: '00:20:00' },
  { id: 'done', riskLevel: '高', abnormalType: '退款', status: '已完成', amount: 900, remainingSLA: '-' },
  { id: 'refund', riskLevel: '中', abnormalType: '退款', status: '待处理', amount: 200, remainingSLA: '03:00:00' },
];

assert.deepEqual(applyOrderDashboardPreset(rows, 'highRiskOrders', 0, 0).map((row) => row.id), ['h2', 'h1']);
assert.deepEqual(applyOrderDashboardPreset(rows, 'logisticsDelay', 0, 0).map((row) => row.id), ['h2']);
assert.deepEqual(applyOrderDashboardPreset(rows, 'afterSale', 0, 0).map((row) => row.id), ['refund']);
assert.deepEqual(applyOrderDashboardPreset(rows, 'potentialLoss', 0, 0).map((row) => row.id), ['h2', 'h1']);
assert.equal(getOrderDashboardPresetMeta('potentialLoss').label, '高风险未解决 · 影响金额从高到低');
```

- [ ] **Step 5: Create the order preset helper**

Create `src/pages/orders/dashboardPreset.js` alongside its test:

```js
import { matchesDashboardPreset } from '../dashboardMetrics.js';
import { sortOrdersByAmountDesc, sortOrdersBySlaAsc } from '../../utils/orderSorting.js';

const META = {
  highRiskOrders: { label: '高风险未解决 · 剩余 SLA 从短到长', tab: '全部', riskLevel: '高' },
  logisticsDelay: { label: '物流延误 · 未解决', tab: '物流延误', riskLevel: '' },
  afterSale: { label: '退款售后 · 未解决', tab: '退款', riskLevel: '' },
  potentialLoss: { label: '高风险未解决 · 影响金额从高到低', tab: '全部', riskLevel: '高' },
};

export function getOrderDashboardPresetMeta(key) {
  return META[key] ?? null;
}

export function applyOrderDashboardPreset(rows, key, nowMs = 0, anchorMs = 0) {
  const matched = rows.filter((row) => matchesDashboardPreset(row, key));
  return key === 'potentialLoss'
    ? sortOrdersByAmountDesc(matched)
    : sortOrdersBySlaAsc(matched, nowMs, anchorMs);
}
```

- [ ] **Step 6: Integrate the preset into `Orders.jsx`**

Add `dashboardPreset` state, parse it from `location.state`, and keep the visible existing filters aligned:

```js
const [dashboardPreset, setDashboardPreset] = useState('');

useEffect(() => {
  const presetKey = location.state?.dashboardPreset;
  const preset = getOrderDashboardPresetMeta(presetKey);
  if (!preset) return;
  setDashboardPreset(presetKey);
  setActiveTab(preset.tab);
  setFilters((current) => ({ ...filterDefaults, riskLevel: preset.riskLevel }));
  setCurrentPage(1);
  setSelectedOrder(null);
}, [location.key, location.state]);
```

Apply all ordinary topbar/page filters first, then preset filtering/sorting:

```js
const sortedRows = useMemo(() => {
  if (dashboardPreset) {
    return applyOrderDashboardPreset(filteredRows, dashboardPreset, slaClock.nowMs, slaClock.anchorMs);
  }
  return sortOrdersByPurchaseTimeDesc(filteredRows);
}, [dashboardPreset, filteredRows, slaClock.anchorMs, slaClock.nowMs]);
```

Ensure `filteredRows` does not exclude preset rows by an incompatible status filter. Preset matching remains the single unresolved-status source of truth.

- [ ] **Step 7: Show a removable preset notice**

Place this compact row immediately above the table without changing the surrounding card structure:

```jsx
{dashboardPreset ? (
  <div className="mb-2 flex h-8 items-center justify-between rounded-[8px] border border-[#CFE0FF] bg-[#F4F8FF] px-3 text-xs text-[#3767A6]">
    <span>来自异常工作台：{getOrderDashboardPresetMeta(dashboardPreset).label}</span>
    <button
      type="button"
      className="font-medium text-[#2F7BFF]"
      onClick={() => { setDashboardPreset(''); setCurrentPage(1); }}
    >
      清除
    </button>
  </div>
) : null}
```

Clearing removes only the preset-only unresolved and sort behavior; the visible tab/risk filters remain as shown and can be reset through the existing reset control.

- [ ] **Step 8: Run order tests**

Run: `node .\src\utils\orderSorting.test.mjs; node .\src\pages\orders\dashboardPreset.test.mjs; node .\src\pages\orders\orderTableViewport.test.mjs`

Expected: all scripts exit `0`.

### Task 4: Inventory Preset Filtering And Sorting

**Files:**
- Modify: `src/pages/Inventory.jsx`
- Create: `src/pages/inventory/dashboardPreset.js`
- Create: `src/pages/inventory/dashboardPreset.test.mjs`

**Interfaces:**
- Consumes: `dashboardPreset = 'stockoutSoon'`.
- Produces: `applyInventoryDashboardPreset(rows, presetKey)` returning unresolved items with `availableDays <= 7`, sorted ascending and stable; `getInventoryDashboardPresetMeta(key)`.

- [ ] **Step 1: Write the failing inventory preset test**

```js
import assert from 'node:assert/strict';
import { applyInventoryDashboardPreset, getInventoryDashboardPresetMeta } from './dashboardPreset.js';

const rows = [
  { sku: 's7', availableDays: 7, status: '待补货' },
  { sku: 's1', availableDays: 1, status: '待处理' },
  { sku: 'done', availableDays: 0.5, status: '已完成' },
  { sku: 's8', availableDays: 8, status: '待处理' },
];

assert.deepEqual(applyInventoryDashboardPreset(rows, 'stockoutSoon').map((item) => item.sku), ['s1', 's7']);
assert.deepEqual(rows.map((item) => item.sku), ['s7', 's1', 'done', 's8']);
assert.equal(getInventoryDashboardPresetMeta('stockoutSoon').label, '7 天内缺货 · 未解决 · 可售天数从少到多');
assert.equal(getInventoryDashboardPresetMeta('unknown'), null);
```

- [ ] **Step 2: Run the test and confirm the helper is missing**

Run: `node .\src\pages\inventory\dashboardPreset.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the inventory preset helper**

```js
import { matchesDashboardPreset } from '../dashboardMetrics.js';

const META = {
  stockoutSoon: {
    label: '7 天内缺货 · 未解决 · 可售天数从少到多',
    availableDays: '7',
  },
};

export function getInventoryDashboardPresetMeta(key) {
  return META[key] ?? null;
}

export function applyInventoryDashboardPreset(rows, key) {
  return rows
    .filter((item) => matchesDashboardPreset(item, key))
    .map((item, index) => ({ item, index }))
    .sort((left, right) =>
      Number(left.item.availableDays) - Number(right.item.availableDays) || left.index - right.index)
    .map(({ item }) => item);
}
```

- [ ] **Step 4: Integrate the preset into `Inventory.jsx`**

Parse the route state and synchronize the existing visible filter:

```js
const [dashboardPreset, setDashboardPreset] = useState('');

useEffect(() => {
  const presetKey = location.state?.dashboardPreset;
  const preset = getInventoryDashboardPresetMeta(presetKey);
  if (!preset) return;
  setDashboardPreset(presetKey);
  setFilters((current) => ({ ...current, availableDays: preset.availableDays }));
  setCurrentPage(1);
  setSelectedSku(null);
}, [location.key, location.state]);
```

Split ordinary filtering from preset sorting so pagination uses the final array:

```js
const sortedRows = useMemo(
  () => dashboardPreset
    ? applyInventoryDashboardPreset(filteredRows, dashboardPreset)
    : filteredRows,
  [dashboardPreset, filteredRows],
);
const pageCount = Math.max(1, Math.ceil(sortedRows.length / INVENTORY_PAGE_SIZE));
const visibleRows = sortedRows.slice((safePage - 1) * INVENTORY_PAGE_SIZE, safePage * INVENTORY_PAGE_SIZE);
```

Use `sortedRows.length` in list totals and export so displayed count, pagination, and CSV match the same result set.

- [ ] **Step 5: Show the removable preset notice**

Use the same compact visual treatment as orders:

```jsx
{dashboardPreset ? (
  <div className="mb-2 flex h-8 items-center justify-between rounded-[8px] border border-[#CFE0FF] bg-[#F4F8FF] px-3 text-xs text-[#3767A6]">
    <span>来自异常工作台：{getInventoryDashboardPresetMeta(dashboardPreset).label}</span>
    <button type="button" className="font-medium text-[#2F7BFF]" onClick={() => { setDashboardPreset(''); setCurrentPage(1); }}>
      清除
    </button>
  </div>
) : null}
```

- [ ] **Step 6: Run inventory tests**

Run: `node .\src\pages\inventory\dashboardPreset.test.mjs; node .\src\pages\inventoryExportInteraction.test.mjs; node .\src\pages\inventoryTableSpacing.test.mjs`

Expected: all scripts exit `0`.

### Task 5: Cross-Page Consistency And Regression Verification

**Files:**
- Modify only if a failing regression identifies a feature-scoped issue in files listed above.

**Interfaces:**
- Consumes: completed implementations from Tasks 1-4.
- Produces: verified dashboard-to-list behavior with no known regression.

- [ ] **Step 1: Run all Node tests**

Run:

```powershell
Get-ChildItem -Path .\src -Recurse -Filter *.test.mjs | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Expected: every test exits `0`.

- [ ] **Step 2: Build production assets**

Run: `npm.cmd run build`

Expected: Vite exits `0` and writes `dist` without compile errors.

- [ ] **Step 3: Check patch whitespace**

Run: `git diff --check`

Expected: no output and exit `0`.

- [ ] **Step 4: Verify the five drilldowns at 1440×900**

Start the existing Vite server or `npm.cmd run dev -- --host 127.0.0.1`, then verify:

1. Every metric card is clickable across its full surface and keyboard-activatable.
2. High-risk orders land on unresolved high-risk rows ordered by shortest remaining SLA.
3. Stockout-soon lands on unresolved SKUs with `availableDays <= 7`, ordered ascending.
4. Logistics delay lands on unresolved logistics rows.
5. After-sale lands on unresolved refund rows.
6. Potential loss lands on unresolved high-risk rows ordered by descending amount.
7. Each landing shows a removable preset notice and no drawer opens automatically.
8. Dashboard card counts equal the matching landing result counts under the same topbar platform/store selections.
9. Completing a linked order or inventory task changes the corresponding dashboard total without refreshing the app.
10. No horizontal overflow, layout shift, console error, or change to the established visual style appears.

- [ ] **Step 5: Review only feature-scoped changes**

Run: `git diff -- src/pages/Dashboard.jsx src/pages/dashboardMetrics.js src/pages/dashboardMetrics.test.mjs src/pages/dashboardMetricInteractions.test.mjs src/pages/Orders.jsx src/pages/orders/dashboardPreset.js src/pages/orders/dashboardPreset.test.mjs src/pages/Inventory.jsx src/pages/inventory/dashboardPreset.js src/pages/inventory/dashboardPreset.test.mjs src/utils/orderSorting.js src/utils/orderSorting.test.mjs src/data/mockData.js src/data/metricCardTrendData.test.mjs`

Expected: the diff contains only live metric aggregation, drilldown presets, explicit preset notices, and their tests; no unrelated cleanup.

