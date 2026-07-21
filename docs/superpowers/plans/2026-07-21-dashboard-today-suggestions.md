# Dashboard Today Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the dashboard to eight traceable AI suggestions, remove direct task creation, and open all suggestions in an in-page drawer.

**Architecture:** Keep `dashboardSuggestions` as mock business data linked to real order or inventory records. Extract the all-suggestions drawer body into a focused dashboard component, while `Dashboard.jsx` owns drawer state and source navigation. Existing shared source-task workflow remains unchanged.

**Tech Stack:** React, React Router, Tailwind CSS, lucide-react, Node test runner.

## Global Constraints

- Preserve the current dashboard card dimensions, spacing, colors, typography, grid, and scroll behavior.
- Today suggestions must not create tasks directly.
- The displayed total must be calculated from the suggestion array.
- Every suggestion must resolve to an existing order or inventory record.
- No unrelated pages or shared visual styles may change.

---

### Task 1: Expand And Validate Suggestion Data

**Files:**
- Modify: `src/data/mockData.js`
- Create: `src/data/dashboardSuggestions.test.mjs`

**Interfaces:**
- Produces: `dashboardSuggestions`, an array of exactly eight records with `id`, `title`, `description`, `source`, `sourceId`, `sourceKind`, `sourceType`, `riskLevel`, `remainingSLA`, `confidence`, `impact`, `aiEvidence`, and `riskExplanation`.
- Consumes: Existing `orders` and `inventory` exports for source validation.

- [ ] **Step 1: Write the failing data contract test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardSuggestions, inventory, orders } from './mockData.js';

test('dashboard exposes eight unique, traceable suggestions', () => {
  assert.equal(dashboardSuggestions.length, 8);
  assert.equal(new Set(dashboardSuggestions.map((item) => item.id)).size, 8);

  for (const suggestion of dashboardSuggestions) {
    assert.ok(suggestion.description);
    assert.ok(suggestion.impact);
    assert.ok(suggestion.confidence >= 0.7);
    const sourceExists = suggestion.sourceKind === 'inventory'
      ? inventory.some((item) => item.sku === suggestion.sourceId)
      : orders.some((item) => item.id === suggestion.sourceId);
    assert.equal(sourceExists, true, suggestion.id);
  }
});

test('dashboard suggestions cover the approved action set', () => {
  assert.deepEqual(
    dashboardSuggestions.map((item) => item.title),
    [
      '建议切换NJ仓发货',
      '建议补货 120 件至 LA 仓',
      '建议更换物流渠道',
      '建议修正异常地址并联系买家',
      '建议重新同步平台订单',
      '建议调拨滞销库存至高销量仓',
      '建议重新发起支付并通知买家',
      '建议补充清关资料避免退运',
    ],
  );
});
```

- [ ] **Step 2: Run the test and verify the initial failure**

Run: `node --test src/data/dashboardSuggestions.test.mjs`

Expected: FAIL because `dashboardSuggestions.length` is `3` and records do not yet provide `description`.

- [ ] **Step 3: Add five source-linked records and move descriptions into the data**

Update `dashboardSuggestions` so the first three records gain `description`, then append records linked to `order-003`, `order-004`, `HOM-HUM-01`, `order-007`, and `order-006`. Use confidence values at or above `0.70`, unique impact copy, and the exact approved titles from the test.

- [ ] **Step 4: Run data tests**

Run: `node --test src/data/dashboardSuggestions.test.mjs src/data/mockTrustData.test.mjs`

Expected: PASS with eight suggestions and valid sources.

---

### Task 2: Remove Direct Task Creation And Correct The Header Count

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/pages/dashboardSuggestionPanelLayout.test.mjs`
- Create: `src/pages/dashboardSuggestionInteractions.test.mjs`

**Interfaces:**
- `SuggestionPanel({ suggestions, onDetail, onViewAll })` renders dynamic count and source-detail actions only.
- `openSuggestionSource(suggestion)` remains the only navigation path from a suggestion to its source.

- [ ] **Step 1: Write failing panel interaction assertions**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');
const start = source.indexOf('function SuggestionPanel');
const end = source.indexOf('function TrendPanel', start);
const panel = source.slice(start, end);

assert.match(panel, /查看全部\(\{suggestions\.length\}\)/);
assert.match(panel, /item\.description/);
assert.doesNotMatch(panel, /生成任务/);
assert.doesNotMatch(panel, /getBlockReason/);
assert.doesNotMatch(panel, /onGenerate/);
assert.doesNotMatch(source, /onViewAll=\{\(\) => navigate\('\/tasks'\)\}/);
```

- [ ] **Step 2: Run the interaction test and verify it fails**

Run: `node src/pages/dashboardSuggestionInteractions.test.mjs`

Expected: FAIL because the count is hard-coded and direct task creation is still rendered.

- [ ] **Step 3: Simplify the panel without changing its layout classes**

Change the count to `查看全部({suggestions.length})`, render `item.description`, remove `getBlockReason` and `onGenerate` props, and remove the task button. Keep the existing suggestion row, scroll container, impact copy, confidence bar, and detail button class names unchanged.

Remove `generateTask`, `getSuggestionBlockReason`, and the direct task button from the selected-suggestion detail drawer. Set `onViewAll` to open `utilityDrawer === 'suggestions'`.

- [ ] **Step 4: Run dashboard panel tests**

Run: `node src/pages/dashboardSuggestionInteractions.test.mjs && node src/pages/dashboardSuggestionPanelLayout.test.mjs`

Expected: PASS and no fixed `6` or task-generation action remains in `SuggestionPanel`.

---

### Task 3: Add The All-Suggestions Drawer

**Files:**
- Create: `src/pages/dashboard/SuggestionDrawerContent.jsx`
- Create: `src/pages/dashboard/SuggestionDrawerContent.test.mjs`
- Modify: `src/pages/Dashboard.jsx`

**Interfaces:**
- `SuggestionDrawerContent({ suggestions, onSuggestionClick })` renders all suggestion summaries.
- `onSuggestionClick(suggestion)` closes dashboard drawer state and calls the existing source navigation flow.

- [ ] **Step 1: Write the failing drawer component contract test**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./SuggestionDrawerContent.jsx', import.meta.url), 'utf8');

assert.match(source, /suggestions\.map/);
assert.match(source, /RiskTag/);
assert.match(source, /sourceType/);
assert.match(source, /Math\.round\(suggestion\.confidence \* 100\)/);
assert.match(source, /onSuggestionClick\(suggestion\)/);
assert.match(source, /查看详情/);
assert.doesNotMatch(source, /生成任务/);
```

- [ ] **Step 2: Run the drawer test and verify it fails**

Run: `node src/pages/dashboard/SuggestionDrawerContent.test.mjs`

Expected: FAIL with `ENOENT` because the component does not exist.

- [ ] **Step 3: Implement the drawer content**

Create a scrollable list of white suggestion cards using existing dashboard colors and `RiskTag`. Each card renders title, source type and source number, confidence, impact, and a `查看详情` button. Do not add fixed height or width inside the content component; the parent `DetailDrawer` owns sizing.

- [ ] **Step 4: Wire the drawer into the dashboard**

Import `SuggestionDrawerContent`. Add a `DetailDrawer` with `open={utilityDrawer === 'suggestions'}`, title `全部建议（${dashboardSuggestions.length}）`, width `460`, top offset `64`, and the existing `bg-[#F5F7FB]` body background. Its click handler must call `setUtilityDrawer(null)` before `openSuggestionSource(suggestion)`.

- [ ] **Step 5: Run focused tests**

Run: `node src/pages/dashboard/SuggestionDrawerContent.test.mjs && node src/pages/dashboardSuggestionInteractions.test.mjs && node --test src/data/dashboardSuggestions.test.mjs`

Expected: PASS.

---

### Task 4: Regression And Visual Verification

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes the completed dashboard behavior from Tasks 1-3.

- [ ] **Step 1: Run the full test suite**

Run: `node --test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: Vite production build completes successfully.

- [ ] **Step 3: Verify the dashboard at 1440x900**

Open `/dashboard` in the in-app browser at `1440x900`. Confirm the card grid and right column have not shifted, the card shows `查看全部(8)`, suggestion rows have no task button, the all-suggestions drawer lists eight entries, and every entry opens the matching order or inventory detail.

- [ ] **Step 4: Review the scoped diff**

Run: `git diff --check -- src/data/mockData.js src/data/dashboardSuggestions.test.mjs src/pages/Dashboard.jsx src/pages/dashboardSuggestionPanelLayout.test.mjs src/pages/dashboardSuggestionInteractions.test.mjs src/pages/dashboard/SuggestionDrawerContent.jsx src/pages/dashboard/SuggestionDrawerContent.test.mjs`

Expected: no whitespace errors and no unrelated page or shared-style modifications.
