# Dashboard Priority Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Dashboard priority-list anomaly filter and risk-sort buttons interactive without changing the surrounding layout or business flows.

**Architecture:** Keep interaction state inside `PriorityTable`. Put deterministic filtering and sorting in a Dashboard-scoped pure utility so behavior can be tested with Node before JSX integration. Continue consuming the Topbar-filtered `rows` prop and never mutate mock data.

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react, Node `assert` tests.

## Global Constraints

- Only modify the Dashboard priority-list controls and their Dashboard-scoped helper/test files.
- Preserve the card dimensions, table columns, SLA countdown, detail navigation, Topbar filtering, and all other modules.
- Risk order is `高 > 中 > 低`; unknown risk labels remain after known labels and retain their relative order.
- The current worktree contains required pre-existing changes in `Dashboard.jsx`; do not revert or broadly commit them.

---

### Task 1: Priority filtering and sorting rules

**Files:**
- Create: `src/pages/dashboardPriorityControls.js`
- Test: `src/pages/dashboardPriorityControls.test.mjs`

**Interfaces:**
- Produces: `getPriorityAbnormalTypes(rows)`, `filterAndSortPriorityRows(rows, abnormalType, sortDirection)`, `getNextPrioritySort(sortDirection)`.
- Sort directions: `default`, `desc`, `asc`.

- [ ] **Step 1: Write the failing test**

Create test fixtures containing high, medium, low, and unknown risk labels. Assert unique anomaly types, type filtering, descending order, ascending order with unknown labels last, stable default order, and the three-state sort cycle.

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/pages/dashboardPriorityControls.test.mjs`

Expected: FAIL with module-not-found because `dashboardPriorityControls.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement immutable array helpers. Filtering treats `全部异常` as no filter. Sorting decorates rows with original indices so equal or unknown labels remain stable.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/pages/dashboardPriorityControls.test.mjs`

Expected: exit code `0`, no assertion output.

### Task 2: Dashboard control integration

**Files:**
- Modify: `src/pages/Dashboard.jsx:149-205`

**Interfaces:**
- Consumes: the Task 1 helper functions and the existing `rows`, `onDetail`, and `slaClock` props.
- Produces: an anomaly-type dropdown and a three-state risk-sort button within `PriorityTable`.

- [ ] **Step 1: Add local state and derived rows**

Track `selectedType`, `sortDirection`, and `isTypeMenuOpen`. Derive menu options from `rows` and rendered rows through the pure helpers. Reset an unavailable selected type to `全部异常`.

- [ ] **Step 2: Add close behavior**

Use a wrapper ref and a scoped effect so outside pointer events and `Escape` close only this dropdown. Remove listeners during cleanup.

- [ ] **Step 3: Connect the existing buttons**

The first button toggles the anchored menu and keeps its current dimensions. The second advances `default -> desc -> asc -> default`, with a stable icon slot and subtle blue active state. Add `aria-expanded`, `aria-haspopup`, `aria-pressed`, and descriptive titles.

- [ ] **Step 4: Render controlled rows and empty state**

Render the derived rows instead of raw `rows`. When no rows match, render one full-width table row containing `暂无匹配异常`.

- [ ] **Step 5: Build verification**

Run: `npm.cmd run build`

Expected: Vite exits `0`; the existing chunk-size warning is acceptable.

### Task 3: Browser regression and production replacement

**Files:**
- No additional source files.

- [ ] **Step 1: Start local preview and verify interactions**

Open `/dashboard`; verify anomaly-type selection changes rows and button text, outside click and `Escape` close the menu, risk sorting cycles in both directions, order-number detail navigation still works, and card/table dimensions do not shift.

- [ ] **Step 2: Run project regressions**

Run:

```powershell
node src\state\demoFlow.test.mjs
node src\utils\time.test.mjs
node src\pages\dashboardPriorityControls.test.mjs
npm.cmd run build
```

Expected: all commands exit `0`; only the existing Vite chunk-size warning may remain.

- [ ] **Step 3: Deploy the linked production project**

Run: `vercel.cmd --prod --yes`

Expected: deployment is READY and the existing alias `https://yichang-demo.vercel.app` is updated. Do not run `vercel link` or create another project.

- [ ] **Step 4: Verify production**

Request `https://yichang-demo.vercel.app/dashboard` and verify HTTP `200`, then inspect the production deployment status.
