# Inventory Metric Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the four inventory decision metric cards use the approved dashboard metric-card format without changing any other inventory-page area or interaction.

**Architecture:** Keep the implementation local to `Inventory.jsx`. Reshape `InventoryMetricCard` and its local `Sparkline` to match the dashboard card geometry while preserving the existing `card` data contract and `onDetail` callback.

**Tech Stack:** React, Vite, Tailwind CSS, Node.js assertion tests.

## Global Constraints

- Only modify the inventory decision page's four top metric cards.
- Preserve the four-column grid, metric data, filters, table, drawer, route, and detail interactions.
- Do not modify the common `MetricCard` or any other page.
- Do not add dependencies.
- Deploy the verified build to the linked Vercel production project.

---

### Task 1: Lock the Inventory Card Layout Contract

**Files:**
- Create: `src/pages/inventoryMetricCardLayout.test.mjs`
- Inspect: `src/pages/Inventory.jsx`

**Interfaces:**
- Consumes: `InventoryMetricCard({ card, onDetail })` and local `Sparkline({ points, color })` source markup.
- Produces: a source-level regression test for the approved card geometry.

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');

assert.match(source, /h-\[160px\].*px-6 py-4/, 'inventory metric cards should use the approved height and balanced padding');
assert.match(source, /whitespace-nowrap text-\[30px\] font-semibold/, 'the metric value should be a standalone non-wrapping row');
assert.match(source, /mt-2 flex items-center justify-between text-\[13px\]/, 'change and detail link should share a full-width row');
assert.match(source, /absolute bottom-4 left-6 right-6 h-6/, 'the sparkline should preserve 16px bottom spacing');
assert.match(source, /className="h-full w-full"/, 'the sparkline SVG should fill its wrapper');
assert.match(source, /<circle cx=\{coords\.at\(-1\)\[0\]\}/, 'the sparkline should render an endpoint marker');
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node src/pages/inventoryMetricCardLayout.test.mjs`

Expected: FAIL because the current inventory card is `150px` tall and does not use the approved full-width information row or endpoint circle.

### Task 2: Align the Four Inventory Metric Cards

**Files:**
- Modify: `src/pages/Inventory.jsx:150-215`
- Test: `src/pages/inventoryMetricCardLayout.test.mjs`

**Interfaces:**
- Consumes: existing `card.icon`, `card.label`, `card.value`, `card.change`, `card.trend`, `card.tone`, and `onDetail`.
- Produces: the same `InventoryMetricCard` UI and click contract with dashboard-aligned geometry.

- [ ] **Step 1: Update the local Sparkline**

Use a full-width wrapper and reserve endpoint space:

```jsx
const horizontalPadding = 3;
const step = (width - horizontalPadding * 2) / (points.length - 1);
const x = horizontalPadding + index * step;

<div className="pointer-events-none absolute bottom-4 left-6 right-6 h-6">
  <svg aria-hidden="true" className="h-full w-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
    <defs>
      <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.24" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <path d={area} fill={`url(#${id})`} />
    <path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    <circle cx={coords.at(-1)[0]} cy={coords.at(-1)[1]} r="2.5" fill="#fff" stroke={color} strokeWidth="2" />
  </svg>
</div>
```

- [ ] **Step 2: Update InventoryMetricCard markup**

```jsx
<article className="relative h-[160px] overflow-hidden rounded-[14px] border border-[#E8ECF3] bg-white px-6 py-4 shadow-[0_8px_24px_rgba(28,39,71,0.06)]">
  <div className="relative z-10">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
        <img className="h-10 w-10 object-contain" src={card.icon} alt="" aria-hidden="true" />
      </div>
      <div className="min-w-0 truncate text-[17px] font-medium leading-6 text-[#111827]">{card.label}</div>
    </div>
    <div className="mt-0.5 whitespace-nowrap text-[30px] font-semibold leading-none tracking-tight text-black">{card.value}</div>
    <div className="mt-2 flex items-center justify-between text-[13px] leading-5">
      <div className="flex items-center gap-2">
        <span className="text-[#5F6B7A]">较昨日</span>
        <span className={changeClass}>{card.change} {positive ? '↑' : '↓'}</span>
      </div>
      <button className="shrink-0 font-medium text-[#2F7BFF]" onClick={onDetail} type="button">查看详情</button>
    </div>
  </div>
  <Sparkline points={card.trend} color={card.tone} />
</article>
```

- [ ] **Step 3: Run the focused test**

Run: `node src/pages/inventoryMetricCardLayout.test.mjs`

Expected: PASS.

### Task 3: Verify and Deploy

**Files:**
- Verify: `src/pages/Inventory.jsx`
- Verify: `src/pages/inventoryMetricCardLayout.test.mjs`

**Interfaces:**
- Consumes: the completed inventory card implementation.
- Produces: a verified production deployment.

- [ ] **Step 1: Run the regression suite**

```powershell
node src/pages/inventoryMetricCardLayout.test.mjs
node src/pages/dashboardMetricCardLayout.test.mjs
node src/pages/pageHeaderLayout.test.mjs
node src/components/common/filterSelectOptions.test.mjs
node src/pages/dashboardPriorityControls.test.mjs
node src/state/demoFlow.test.mjs
node src/utils/time.test.mjs
```

Expected: every command exits with code 0.

- [ ] **Step 2: Run build and diff validation**

```powershell
npm.cmd run build
git diff --check
```

Expected: Vite build succeeds; `git diff --check` reports no whitespace errors. The existing Vite large-chunk warning is acceptable.

- [ ] **Step 3: Deploy production**

Run: `vercel.cmd deploy --prod --force --yes`

Expected: deployment target is `production`, status is `READY`, and `https://yichang-demo.vercel.app` is updated.

- [ ] **Step 4: Inspect deployment**

Run: `vercel.cmd inspect https://yichang-demo.vercel.app`

Expected: status is `Ready` and the production alias includes `https://yichang-demo.vercel.app`.
