# Inventory Table Column Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand and evenly distribute the inventory table columns from platform through AI suggestion without changing typography, row sizing, content, or interactions.

**Architecture:** Keep the existing fixed-layout table and adjust only its eleven percentage-based `colgroup` widths. Lock the approved distribution in the existing source-level test so future styling changes cannot reintroduce the cramped layout.

**Tech Stack:** React, Vite, Tailwind CSS, Node.js built-in test runner

## Global Constraints

- Only modify the inventory table column distribution and its focused regression test.
- Preserve the existing table typography, row height, alignment, data, filtering, drawer behavior, and action links.
- The eleven column widths must total exactly 100%.
- The platform-through-AI-suggestion group must occupy 60% of the table width.
- Deploy over the existing linked Vercel project `yichang-demo`; do not create a new site.

---

### Task 1: Lock And Implement The Approved Column Distribution

**Files:**
- Modify: `src/pages/inventoryTableSpacing.test.mjs`
- Modify: `src/pages/Inventory.jsx:441-453`

**Interfaces:**
- Consumes: the existing eleven-column fixed table layout in `Inventory.jsx`
- Produces: the ordered percentage widths `[8, 11, 15, 7, 7, 8, 8, 8, 8, 14, 6]`

- [ ] **Step 1: Write the failing regression expectation**

```js
assert.deepEqual(
  widths,
  [8, 11, 15, 7, 7, 8, 8, 8, 8, 14, 6],
  'inventory columns should distribute platform through AI suggestion across the available table width',
);
assert.equal(widths.slice(3, 10).reduce((total, width) => total + width, 0), 60);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test src/pages/inventoryTableSpacing.test.mjs`

Expected: FAIL because the implementation still returns `[9, 11, 19, 6, 6, 7, 7, 7, 7, 13, 8]`.

- [ ] **Step 3: Apply the approved `colgroup` widths**

```jsx
<colgroup>
  <col style={{ width: '8%' }} />
  <col style={{ width: '11%' }} />
  <col style={{ width: '15%' }} />
  <col style={{ width: '7%' }} />
  <col style={{ width: '7%' }} />
  <col style={{ width: '8%' }} />
  <col style={{ width: '8%' }} />
  <col style={{ width: '8%' }} />
  <col style={{ width: '8%' }} />
  <col style={{ width: '14%' }} />
  <col style={{ width: '6%' }} />
</colgroup>
```

- [ ] **Step 4: Run focused and full verification**

Run: `node --test src/pages/inventoryTableSpacing.test.mjs`

Expected: PASS.

Run: `node --test`

Expected: all tests pass.

Run: `npm.cmd run build`

Expected: Vite production build succeeds.

### Task 2: Cover The Existing Production Deployment

**Files:**
- Read: `.vercel/project.json`

**Interfaces:**
- Consumes: the existing Vercel link for project `yichang-demo`
- Produces: a ready production deployment aliased to `https://yichang-demo.vercel.app`

- [ ] **Step 1: Deploy the verified working tree to production**

Run: `vercel.cmd --prod --yes`

Expected: deployment succeeds without creating a new Vercel project.

- [ ] **Step 2: Inspect the deployment**

Run: `vercel.cmd inspect <deployment-url>`

Expected: status is `Ready` and the existing production alias is present.

