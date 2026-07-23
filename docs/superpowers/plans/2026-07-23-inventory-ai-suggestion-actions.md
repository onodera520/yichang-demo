# Inventory AI Suggestion Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users adopt the AI replenishment quantity inline, save a genuinely adjusted quantity as an alternate accepted decision, and create the task without a redundant rejection action.

**Architecture:** Add a small pure workflow module that builds adoption patches and derives whether the current draft is confirmed. `Inventory.jsx` consumes those rules for button states and handlers while the existing context remains responsible for persisting inventory rows, assigning owners, and creating tasks.

**Tech Stack:** React, Vite, Tailwind CSS, lucide-react, Node.js built-in test runner

## Global Constraints

- Keep the inventory drawer width at `450px` and preserve all unrelated cards, tables, filters, and public components.
- Place the inline `采纳` action inside the existing AI suggestion quantity row without increasing its height.
- Remove the inventory-only `驳回建议` action and do not add an inventory rejection status.
- Preserve stale-data confirmation, high-risk confirmation, duplicate-task blocking, owner assignment, and queue auto-advance behavior.
- Deploy to the existing linked Vercel project `yichang-demo`; do not create a new site.

---

### Task 1: Inventory Suggestion Confirmation Rules

**Files:**
- Create: `src/pages/inventory/inventorySuggestionActions.js`
- Create: `src/pages/inventory/inventorySuggestionActions.test.mjs`

**Interfaces:**
- Produces: `buildDirectInventoryAdoptionPatch(source) -> patch`
- Produces: `buildAdjustedInventoryAdoptionPatch(source, draft) -> patch`
- Produces: `getInventorySuggestionGateReason(source, draftQuantity) -> string`
- Produces: `isDirectInventorySuggestionAdopted(source, draftQuantity) -> boolean`

- [ ] **Step 1: Write failing tests for direct adoption, adjusted adoption, validation, and dirty drafts**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdjustedInventoryAdoptionPatch,
  buildDirectInventoryAdoptionPatch,
  getInventorySuggestionGateReason,
  isDirectInventorySuggestionAdopted,
} from './inventorySuggestionActions.js';

const source = { sku: 'ELE-KYB-01', suggestedReplenishment: 200, status: '待处理' };

test('direct adoption confirms the AI quantity', () => {
  assert.deepEqual(buildDirectInventoryAdoptionPatch(source), {
    adjustedQuantity: 200,
    suggestionDecision: 'adopted',
    adjustReason: '',
    adjustNote: '',
  });
});

test('adjusted adoption records a modified quantity and audit fields', () => {
  assert.deepEqual(buildAdjustedInventoryAdoptionPatch(source, {
    quantity: '240', reason: '覆盖安全库存', note: '活动前补足',
  }), {
    adjustedQuantity: 240,
    suggestionDecision: 'modified',
    adjustReason: '覆盖安全库存',
    adjustNote: '活动前补足',
  });
});

test('a matching adjusted quantity remains a direct adoption', () => {
  assert.equal(buildAdjustedInventoryAdoptionPatch(source, { quantity: 200 }).suggestionDecision, 'adopted');
});

test('task creation requires a confirmed and saved quantity', () => {
  assert.equal(getInventorySuggestionGateReason(source, '200'), '请先采纳 AI 建议或保存调整方案');
  const adopted = { ...source, status: '待分派', adjustedQuantity: 200, suggestionDecision: 'adopted' };
  assert.equal(getInventorySuggestionGateReason(adopted, '240'), '请先保存调整方案');
  assert.equal(getInventorySuggestionGateReason(adopted, '200'), '');
  assert.equal(isDirectInventorySuggestionAdopted(adopted, '200'), true);
});

test('non-positive quantities are rejected', () => {
  assert.throws(() => buildDirectInventoryAdoptionPatch({ suggestedReplenishment: 0 }), /AI建议数量必须大于 0/);
  assert.throws(() => buildAdjustedInventoryAdoptionPatch(source, { quantity: 0 }), /补货数量必须大于 0/);
});
```

- [ ] **Step 2: Run the new test and verify module-not-found failure**

Run: `node --test src/pages/inventory/inventorySuggestionActions.test.mjs`

Expected: FAIL because `inventorySuggestionActions.js` does not exist.

- [ ] **Step 3: Implement the pure workflow module**

```js
function positiveQuantity(value, message) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error(message);
  return quantity;
}

export function buildDirectInventoryAdoptionPatch(source) {
  return {
    adjustedQuantity: positiveQuantity(source?.suggestedReplenishment, 'AI建议数量必须大于 0'),
    suggestionDecision: 'adopted',
    adjustReason: '',
    adjustNote: '',
  };
}

export function buildAdjustedInventoryAdoptionPatch(source, draft = {}) {
  const adjustedQuantity = positiveQuantity(draft.quantity, '补货数量必须大于 0');
  return {
    adjustedQuantity,
    suggestionDecision: adjustedQuantity === Number(source?.suggestedReplenishment) ? 'adopted' : 'modified',
    adjustReason: String(draft.reason || ''),
    adjustNote: String(draft.note || ''),
  };
}

export function getInventorySuggestionGateReason(source, draftQuantity) {
  if (!source?.suggestionDecision) return '请先采纳 AI 建议或保存调整方案';
  if (Number(draftQuantity) !== Number(source.adjustedQuantity)) return '请先保存调整方案';
  return '';
}

export function isDirectInventorySuggestionAdopted(source, draftQuantity) {
  return source?.suggestionDecision === 'adopted'
    && Number(source.adjustedQuantity) === Number(source.suggestedReplenishment)
    && Number(draftQuantity) === Number(source.suggestedReplenishment);
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test src/pages/inventory/inventorySuggestionActions.test.mjs`

Expected: all five tests pass.

### Task 2: Inventory Drawer Actions And Layout

**Files:**
- Modify: `src/pages/Inventory.jsx`
- Modify: `src/pages/inventoryDrawerLayout.test.mjs`
- Create: `src/pages/inventorySuggestionInteractions.test.mjs`

**Interfaces:**
- Consumes: the four workflow exports from Task 1
- Preserves: `adoptInventorySuggestion`, `assignInventoryOwner`, and `createInventoryTask` context APIs

- [ ] **Step 1: Update source-level tests for the two-button footer and inline adoption action**

```js
assert.equal((footer.match(/className="h-10 flex-1/g) ?? []).length, 2);
assert.match(footer, />\s*调整方案\s*</);
assert.match(footer, />\s*创建任务\s*</);
assert.doesNotMatch(footer, /驳回建议/);
assert.match(drawer, /onAdoptSuggestion=\{handleAdoptSuggestion\}/);
assert.match(source, /已采纳/);
```

- [ ] **Step 2: Run the drawer tests and verify they fail against the three-button footer**

Run: `node --test src/pages/inventoryDrawerLayout.test.mjs src/pages/inventorySuggestionInteractions.test.mjs`

Expected: FAIL because the footer still renders three buttons and no inline adoption handler.

- [ ] **Step 3: Wire the workflow into `Inventory.jsx`**

Implement these exact behavior changes:

```jsx
const suggestionGateReason = selectedSku
  ? getInventorySuggestionGateReason(selectedSku, adjustedQuantity)
  : '';
const taskBlockReason = suggestionGateReason || (
  selectedSku ? getSourceTaskBlockReason(selectedSku, tasks, 'inventory') : ''
);
const directSuggestionAdopted = selectedSku
  ? isDirectInventorySuggestionAdopted(selectedSku, adjustedQuantity)
  : false;
```

```jsx
const handleAdoptSuggestion = () => {
  if (!selectedSku) return;
  try {
    const patch = buildDirectInventoryAdoptionPatch(selectedSku);
    setAdjustedQuantity(String(patch.adjustedQuantity));
    setAdjustReason('覆盖安全库存');
    setAdjustNote('');
    adoptInventorySuggestion(selectedSku.sku, patch);
    showToast({ message: '已采纳 AI 建议，请分派负责人', type: 'success' });
  } catch (error) {
    showToast({ message: error.message, type: 'error' });
  }
};
```

Update `handleModifyPurchase` to call `buildAdjustedInventoryAdoptionPatch`, save all audit fields, and show `已保存调整方案，请分派负责人`. Remove `handleRejectSuggestion`.

- [ ] **Step 4: Render the inline state and two footer buttons**

In the AI quantity row, render the number on the left and this action on the right:

```jsx
<button
  className={directSuggestionAdopted
    ? 'inline-flex items-center gap-1 text-xs font-semibold text-[#12B76A]'
    : 'inline-flex items-center gap-1 text-xs font-semibold text-[#2F7BFF] hover:text-[#175CD3]'}
  disabled={directSuggestionAdopted}
  onClick={onAdoptSuggestion}
  type="button"
>
  {directSuggestionAdopted ? <><Check className="h-3.5 w-3.5" />已采纳</> : '采纳'}
</button>
```

Replace the footer with two equal-height actions: `调整方案` calling `handleModifyPurchase`, and `创建任务` calling `handleCreateTask`. Keep the existing disabled reason and title on `创建任务`.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `node --test src/pages/inventory/inventorySuggestionActions.test.mjs src/pages/inventoryDrawerLayout.test.mjs src/pages/inventorySuggestionInteractions.test.mjs`

Expected: all tests pass.

### Task 3: Full Verification And Production Deployment

**Files:**
- Read: `.vercel/project.json`

**Interfaces:**
- Consumes: the tested Vite working tree and existing Vercel project binding
- Produces: a Ready production deployment on `https://yichang-demo.vercel.app`

- [ ] **Step 1: Run the complete test suite**

Run: `node --test`

Expected: zero failed tests.

- [ ] **Step 2: Build the production bundle**

Run: `npm.cmd run build`

Expected: Vite exits with code 0.

- [ ] **Step 3: Deploy to the existing production project**

Run: `vercel.cmd --prod --yes`

Expected: Vercel deploys `onodera-s-projects/yichang-demo` and aliases the deployment to `https://yichang-demo.vercel.app`.

- [ ] **Step 4: Verify deployment status and route availability**

Run: `vercel.cmd inspect <deployment-url>`

Expected: target `production`, status `Ready`, alias `https://yichang-demo.vercel.app`.

Run: `Invoke-WebRequest -Uri 'https://yichang-demo.vercel.app/inventory' -UseBasicParsing`

Expected: HTTP 200.
