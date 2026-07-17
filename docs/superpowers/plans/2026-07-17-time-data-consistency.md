# Time Data Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep historical closed records while moving active tasks, charts, normal platform sync data, and current AI evidence to a consistent `2026-07-17` demo business period.

**Architecture:** Add a pure `demoTime` module as the single owner of the fixed business clock and date formatting. Mock data stores canonical full timestamps, while pages choose compact table/chart formats so existing 1440×900 layouts remain unchanged. eBay remains an explicit stale-source exception with its June timestamp.

**Tech Stack:** React 18, Vite 6, JavaScript ES modules, Tailwind CSS, Recharts, Node test runner, Playwright/Edge for visual verification, Vercel CLI.

## Global Constraints

- Business baseline is exactly `2026-07-17` and must not depend on the machine clock.
- Page-header refresh timestamps continue to use the real browser clock.
- June records may remain only when their workflow is closed, except stale eBay source timestamps.
- Active task creation time, deadline, process log, and SLA must describe the same current business period.
- Table and chart labels remain compact; canonical full timestamps must not widen existing columns.
- eBay last successful sync stays exactly `2026-06-01 09:18:41` and remains visibly stale.
- No new runtime dependency is allowed.
- Existing dirty worktree changes must not be reverted or staged accidentally.

---

### Task 1: Central Demo Business Clock

**Files:**
- Create: `src/data/demoTime.js`
- Create: `src/data/demoTime.test.mjs`

**Interfaces:**
- Produces: `DEMO_DATE`, `DEMO_NOW`, `STALE_EBAY_SYNC_AT` string constants.
- Produces: `buildRollingDateLabels(days, endDate?) => string[]` using `M.D` labels.
- Produces: `buildBusinessDateTime({ daysAgo, hour, minute, second }) => string` in `YYYY-MM-DD HH:mm:ss` form.
- Produces: `normalizeBusinessDate(value, referenceDate?) => string` returning `YYYY-MM-DD` or `''`.
- Produces: `formatCompactDateTime(value) => string` returning `MM-DD HH:mm` with original-text fallback.

- [ ] **Step 1: Write failing pure-function tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEMO_DATE,
  STALE_EBAY_SYNC_AT,
  buildBusinessDateTime,
  buildRollingDateLabels,
  formatCompactDateTime,
  normalizeBusinessDate,
} from './demoTime.js';

test('uses the approved fixed business date', () => {
  assert.equal(DEMO_DATE, '2026-07-17');
  assert.equal(STALE_EBAY_SYNC_AT, '2026-06-01 09:18:41');
});

test('builds rolling labels across month boundaries', () => {
  assert.deepEqual(buildRollingDateLabels(7), [
    '7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17',
  ]);
  assert.equal(buildRollingDateLabels(30)[0], '6.18');
  assert.equal(buildRollingDateLabels(30).at(-1), '7.17');
});

test('normalizes old display formats without changing their visible fallback', () => {
  assert.equal(normalizeBusinessDate('今天 10:24'), '2026-07-17');
  assert.equal(normalizeBusinessDate('07-16 12:35'), '2026-07-16');
  assert.equal(normalizeBusinessDate('2026-06-01 09:58'), '2026-06-01');
  assert.equal(formatCompactDateTime('2026-07-17 10:24:32'), '07-17 10:24');
  assert.equal(formatCompactDateTime('刚刚'), '刚刚');
});

test('creates deterministic current-period timestamps', () => {
  assert.equal(
    buildBusinessDateTime({ daysAgo: 1, hour: 18, minute: 5, second: 9 }),
    '2026-07-16 18:05:09',
  );
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/data/demoTime.test.mjs`

Expected: FAIL because `src/data/demoTime.js` does not exist.

- [ ] **Step 3: Implement deterministic UTC-safe helpers**

```js
export const DEMO_DATE = '2026-07-17';
export const DEMO_NOW = '2026-07-17 09:41:52';
export const STALE_EBAY_SYNC_AT = '2026-06-01 09:18:41';

const pad = (value) => String(value).padStart(2, '0');
const parseDateOnly = (value) => new Date(`${value}T00:00:00Z`);
const formatDateOnly = (date) => [
  date.getUTCFullYear(),
  pad(date.getUTCMonth() + 1),
  pad(date.getUTCDate()),
].join('-');

export function buildRollingDateLabels(days, endDate = DEMO_DATE) {
  const end = parseDateOnly(endDate);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - index - 1));
    return `${date.getUTCMonth() + 1}.${pad(date.getUTCDate())}`;
  });
}
```

Implement the remaining functions with strict regex parsing and original-text fallback. Never use `Date.now()` in this module.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test src/data/demoTime.test.mjs`

Expected: 4 tests pass.

- [ ] **Step 5: Commit the time module only**

```bash
git add src/data/demoTime.js src/data/demoTime.test.mjs
git commit -m "feat: centralize demo business time"
```

---

### Task 2: Migrate Mock Tasks, Sync Data, and AI Evidence

**Files:**
- Modify: `src/data/mockData.js`
- Modify: `src/data/mockTrustData.test.mjs`
- Create: `src/data/mockTimeConsistency.test.mjs`

**Interfaces:**
- Consumes: Task 1 exports from `src/data/demoTime.js`.
- Produces: task rows with canonical `createdAt` values.
- Produces: connected platform/store timestamps in the current demo period.
- Preserves: stale eBay timestamps and warnings.

- [ ] **Step 1: Write failing cross-data consistency tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { inventory, orders, settings, tasks } from './mockData.js';

const activeStatuses = new Set(['待分派', '已分派', '处理中', '待确认', '已升级', '已超时']);

test('active tasks belong to the current business period', () => {
  const activeTasks = tasks.filter((task) => activeStatuses.has(task.status));
  assert.ok(activeTasks.length > 0);
  assert.equal(activeTasks.every((task) => /^2026-07-(16|17) /.test(task.createdAt)), true);
});

test('June task history contains closed rows only', () => {
  const juneTasks = tasks.filter((task) => task.createdAt.startsWith('2026-06-'));
  assert.ok(juneTasks.length > 0);
  assert.equal(juneTasks.every((task) => task.status === '已完成' || task.status === '已驳回'), true);
});

test('normal sources are current while eBay remains stale', () => {
  const ebay = settings.platformConnections.find((item) => item.platform === 'eBay');
  assert.equal(ebay.lastSuccessfulSync, '2026-06-01 09:18:41');
  assert.equal(settings.storeSyncStatus
    .filter((item) => item.platform !== 'eBay' && item.platform !== 'Shopify')
    .every((item) => item.lastSyncAt.startsWith('2026-07-17 ')), true);
  assert.equal(orders.filter((item) => item.platform !== 'eBay')
    .every((item) => item.aiEvidence.updatedAt.startsWith('2026-07-17 ')), true);
  assert.equal(inventory.filter((item) => item.platform === 'eBay')
    .every((item) => item.aiEvidence.updatedAt === '2026-06-01 09:18:41'), true);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test src/data/mockTimeConsistency.test.mjs`

Expected: FAIL on active June tasks and normal-source June timestamps.

- [ ] **Step 3: Import the centralized constants and builders**

```js
import {
  DEMO_NOW,
  STALE_EBAY_SYNC_AT,
  buildBusinessDateTime,
  buildRollingDateLabels,
} from './demoTime.js';
```

- [ ] **Step 4: Migrate task dates by workflow state**

For seed and generated tasks:

```js
const isClosedTaskStatus = (status) => status === '已完成' || status === '已驳回';

function taskCreatedAt(status, index) {
  if (isClosedTaskStatus(status) && index % 4 === 0) {
    return `2026-06-${String((index % 18) + 1).padStart(2, '0')} 09:20:00`;
  }
  return buildBusinessDateTime({
    daysAgo: index % 3 === 0 ? 1 : 0,
    hour: 7 + (index % 9),
    minute: (index * 6) % 60,
    second: 0,
  });
}
```

Keep process-log display text compact (`今天`, `昨天`, `刚刚`) while making task `createdAt` canonical. Preserve `remainingSLA: '-'` for closed tasks.

- [ ] **Step 5: Migrate settings and AI evidence with the stale exception**

Use `DEMO_NOW` or deterministic current-period offsets for Amazon, TikTok Shop, Shopee, and current suggestions. Use `STALE_EBAY_SYNC_AT` for all eBay `lastSuccessfulSync` and `aiEvidence.updatedAt` values. Shopify unauthorized rows remain `-`.

- [ ] **Step 6: Run mock-data tests and verify GREEN**

Run: `node --test src/data/mockTimeConsistency.test.mjs src/data/mockTrustData.test.mjs src/data/orderOwnerConsistency.test.mjs`

Expected: all tests pass.

- [ ] **Step 7: Commit mock-data migration only**

```bash
git add src/data/mockData.js src/data/mockTrustData.test.mjs src/data/mockTimeConsistency.test.mjs
git commit -m "feat: align mock data with current business period"
```

---

### Task 3: Compact Task Date Rendering and Canonical Filtering

**Files:**
- Modify: `src/pages/Tasks.jsx`
- Modify: `src/pages/tasks/taskAdvancedFilters.js`
- Modify: `src/pages/tasks/taskAdvancedFilters.test.mjs`
- Create: `src/pages/taskDatePresentation.test.mjs`

**Interfaces:**
- Consumes: `formatCompactDateTime()` and `normalizeBusinessDate()` from Task 1.
- Produces: compact task-table date labels with full timestamp in the native `title` attribute.
- Preserves: existing table width, pagination, selection, Tab notices, and advanced-filter behavior.

- [ ] **Step 1: Write failing rendering and filtering tests**

```js
test('task table renders compact dates while retaining the canonical timestamp', () => {
  assert.match(source, /formatCompactDateTime\(row\.createdAt\)/);
  assert.match(source, /title=\{row\.createdAt\}/);
});

test('advanced task filtering uses the shared business-date normalizer', () => {
  assert.match(filterSource, /normalizeBusinessDate\(task\.createdAt\)/);
  assert.doesNotMatch(filterSource, /MOCK_TASK_TODAY/);
});
```

Extend the pure filter test with canonical current dates and historical closed dates.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/pages/taskDatePresentation.test.mjs src/pages/tasks/taskAdvancedFilters.test.mjs`

Expected: FAIL because Tasks renders raw `createdAt` and the filter contains a local hard-coded date.

- [ ] **Step 3: Replace local date parsing and compact the table cell**

```jsx
<td className="text-[#7889A8]">
  <span className="whitespace-nowrap" title={row.createdAt}>
    {formatCompactDateTime(row.createdAt)}
  </span>
</td>
```

In `taskAdvancedFilters.js`, remove `MOCK_TASK_TODAY` and `normalizeCreatedDate`; import and call `normalizeBusinessDate(task.createdAt)`.

- [ ] **Step 4: Run task tests and verify GREEN**

Run: `node --test src/pages/taskDatePresentation.test.mjs src/pages/tasks/taskAdvancedFilters.test.mjs src/pages/taskAdvancedFilterInteractions.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit task presentation changes only**

```bash
git add src/pages/Tasks.jsx src/pages/tasks/taskAdvancedFilters.js src/pages/tasks/taskAdvancedFilters.test.mjs src/pages/taskDatePresentation.test.mjs
git commit -m "fix: align task dates with demo business time"
```

---

### Task 4: Roll Dashboard, Inventory, and Analytics Charts Forward

**Files:**
- Modify: `src/data/mockData.js`
- Modify: `src/pages/Analytics.jsx`
- Modify: `src/pages/Inventory.jsx`
- Create: `src/data/chartDateConsistency.test.mjs`
- Modify: `src/pages/analyticsMetricCardLayout.test.mjs` only if an existing source assertion needs the new import.

**Interfaces:**
- Consumes: `buildRollingDateLabels()` from Task 1.
- Produces: all near-7-day series ending `7.17`, near-30-day series spanning `6.18` to `7.17`, and yearly efficiency data ending `2026.07`.
- Preserves: existing chart values, colors, legends, dimensions, and Recharts configuration.

- [ ] **Step 1: Write failing chart-date tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { analytics, inventory } from './mockData.js';

test('shared seven-day charts end on the demo date', () => {
  assert.deepEqual(analytics.exceptionTrend.map((item) => item.date), [
    '7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17',
  ]);
  assert.deepEqual(analytics.efficiencyAnalysis.map((item) => item.date), [
    '7.11', '7.12', '7.13', '7.14', '7.15', '7.16', '7.17',
  ]);
  assert.equal(inventory.every((item) => item.salesTrend.at(-1).date === '7.17'), true);
});

test('analytics page derives rolling 30-day and yearly endpoints centrally', () => {
  assert.match(analyticsSource, /buildRollingDateLabels\(30\)/);
  assert.match(analyticsSource, /date: '2026\.07'/);
  assert.doesNotMatch(analyticsSource, /function rollingDateLabels/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/data/chartDateConsistency.test.mjs`

Expected: FAIL with current `5.26` to `6.01` labels.

- [ ] **Step 3: Reuse the centralized seven-day labels in mock data**

```js
const sevenDayLabels = buildRollingDateLabels(7);

function withSevenDayLabels(rows) {
  return rows.map((row, index) => ({ ...row, date: sevenDayLabels[index] }));
}
```

Apply the labels to Dashboard/Analytics exception and efficiency series and all inventory sales trends without changing numeric values.

- [ ] **Step 4: Replace Analytics local date generation**

Delete `dayLabel()` and `rollingDateLabels()`. Import `buildRollingDateLabels`, set `const last30DayLabels = buildRollingDateLabels(30)`, and append:

```js
{ date: '2026.07', averageMinutes: 30, processedCount: 18420 },
```

The July processed count is month-to-date and must not be compared as a full-month total in visible copy.

- [ ] **Step 5: Run chart and page tests and verify GREEN**

Run: `node --test src/data/chartDateConsistency.test.mjs src/pages/dashboardMetricCardLayout.test.mjs src/pages/inventoryMetricCardLayout.test.mjs src/pages/analyticsMetricCardLayout.test.mjs`

Expected: all tests pass.

- [ ] **Step 6: Commit chart-date changes only**

```bash
git add src/data/mockData.js src/pages/Analytics.jsx src/pages/Inventory.jsx src/data/chartDateConsistency.test.mjs src/pages/analyticsMetricCardLayout.test.mjs
git commit -m "fix: roll reporting charts to current demo period"
```

---

### Task 5: Settings Supplemental Stores and Full Consistency Gate

**Files:**
- Modify: `src/pages/Settings.jsx`
- Create: `src/pages/settingsSyncTime.test.mjs`
- Modify: existing tests only when their assertions intentionally encode the old June normal-platform timestamp.

**Interfaces:**
- Consumes: `buildBusinessDateTime()` and `STALE_EBAY_SYNC_AT` from Task 1.
- Produces: supplemental Settings store rows with current-period normal sync timestamps.
- Preserves: eBay stale sync timestamp, Shopify authorization state, pagination, and Settings card layout.

- [ ] **Step 1: Write a failing Settings source test**

```js
test('supplemental normal stores use the centralized current business time', () => {
  assert.match(source, /buildBusinessDateTime/);
  assert.doesNotMatch(source, /2026-06-01 09:08:25/);
  assert.doesNotMatch(source, /2026-06-01 09:02:36/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/pages/settingsSyncTime.test.mjs`

Expected: FAIL because supplemental rows are hard-coded to June 1.

- [ ] **Step 3: Build supplemental timestamps from the central clock**

```js
const connectedStores = [
  ...settings.storeSyncStatus,
  { storeName: 'Shopee-SG', platform: 'Shopee', region: '新加坡', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 8, second: 25 }) },
  { storeName: 'Shopee-MY', platform: 'Shopee', region: '马来西亚', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 5, second: 48 }) },
  { storeName: 'Amazon-JP', platform: 'Amazon', region: '日本', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 2, second: 36 }) },
  { storeName: 'TikTok Shop-TH', platform: 'TikTok Shop', region: '泰国', syncStatus: '延迟', lastSyncAt: buildBusinessDateTime({ hour: 8, minute: 58, second: 12 }) },
  { storeName: 'Shopify-US', platform: 'Shopify', region: '美国', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 8, minute: 55, second: 9 }) },
];
```

- [ ] **Step 4: Run all tests and production build**

Run: `node --test`

Expected: zero failures.

Run: `npm.cmd run build`

Expected: Vite exits 0. Existing chunk-size warning is acceptable.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Commit Settings consistency changes only**

```bash
git add src/pages/Settings.jsx src/pages/settingsSyncTime.test.mjs
git commit -m "fix: align settings sync timestamps"
```

---

### Task 6: Visual Verification and Production Deployment

**Files:**
- No production file changes expected.
- Temporary verification scripts and screenshots must be removed before deployment.

**Interfaces:**
- Consumes: completed Tasks 1-5.
- Produces: verified production deployment at `https://yichang-demo.vercel.app`.

- [ ] **Step 1: Verify 1440×900 local rendering**

Start Vite on an available port and use Edge/Playwright to inspect:

- `/tasks`: active rows show compact `07-16`/`07-17`, closed June rows remain, no date wraps or table overflow.
- `/analytics`: near-7-day charts end at `7.17`; near-30-day controls still work; yearly data contains `2026.07`.
- `/settings`: normal stores show July 17; eBay still shows June 1 and stale messaging.
- `/dashboard` and `/inventory`: 7-day chart axes end at `7.17`.

Capture bounding boxes and console/page errors. Required result: no page errors, no console errors, no incoherent overlap.

- [ ] **Step 2: Remove temporary artifacts**

Delete only verification files created in the workspace and confirm they do not appear in `git status --short`.

- [ ] **Step 3: Run the final fresh verification gate**

Run: `node --test`

Expected: zero failures.

Run: `npm.cmd run build`

Expected: exit 0.

- [ ] **Step 4: Cover-deploy to Vercel production**

Run: `npx.cmd vercel --prod --yes`

Expected: deployment completes and aliases `https://yichang-demo.vercel.app`.

- [ ] **Step 5: Inspect production and check the public route**

Run: `npx.cmd vercel inspect <deployment-url>`

Expected: `target production`, `status Ready`.

Request `https://yichang-demo.vercel.app/tasks` and `https://yichang-demo.vercel.app/analytics`.

Expected: HTTP 200 with the React root present.
