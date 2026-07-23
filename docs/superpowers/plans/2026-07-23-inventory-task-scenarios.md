# Inventory Task Scenarios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make inventory task creation produce replenishment, clearance, or transfer workflows based on SKU risk type, and expose slow-moving and transfer risks in task filters.

**Architecture:** Add a pure inventory scenario module that owns task labels, validation, task payload semantics, and source status. Inventory UI and `buildInventoryTask` consume this shared contract; `DemoStateContext` persists the scenario-specific source status.

**Tech Stack:** React 18, Vite, Tailwind CSS, Node test runner

## Global Constraints

- Preserve existing assignment, duplicate-task blocking, stale-data confirmation, and source auto-advance behavior.
- Reuse `RiskTag` for `滞销` and `调拨`.
- Do not add a backend or new dependency.

---

### Task 1: Inventory Scenario Contract

**Files:**
- Create: `src/pages/inventory/inventoryTaskScenario.js`
- Create: `src/pages/inventory/inventoryTaskScenario.test.mjs`
- Modify: `src/state/demoFlow.js`
- Modify: `src/state/demoFlow.test.mjs`

**Interfaces:**
- Produces: `resolveInventoryTaskScenario(sku, options)` returning `kind`, `taskLabel`, `sourceStatus`, `quantity`, warehouses, title, description, impact, and log action.
- Consumes: SKU `riskLevel`, `warehouse`, `aiSuggestion`, `suggestedReplenishment`, and optional transfer fields.

- [ ] **Step 1: Write failing tests** for replenishment, zero-quantity clearance, transfer defaults, distinct warehouse validation, and scenario-specific task titles/logs.
- [ ] **Step 2: Run tests to verify RED** with `node --test src/pages/inventory/inventoryTaskScenario.test.mjs src/state/demoFlow.test.mjs`; expect missing resolver or old replenishment assertions to fail.
- [ ] **Step 3: Implement the pure resolver** with `replenishment`, `clearance`, and `transfer` branches. Clearance accepts zero quantity. Transfer requires a positive quantity and different source/destination warehouses.
- [ ] **Step 4: Update `buildInventoryTask`** to consume the resolver and include `taskKind`, `transferFromWarehouse`, and `transferToWarehouse` when applicable.
- [ ] **Step 5: Run targeted tests to verify GREEN** with the command from Step 2.

### Task 2: Inventory Drawer And Source State

**Files:**
- Modify: `src/pages/Inventory.jsx`
- Modify: `src/pages/inventorySuggestionInteractions.test.mjs`
- Modify: `src/state/DemoStateContext.jsx`

**Interfaces:**
- Consumes: `resolveInventoryTaskScenario(sku, options)` from Task 1.
- Produces: scenario-specific drawer controls and passes scenario options to `createInventoryTask`.

- [ ] **Step 1: Write failing interaction assertions** for `创建清库存任务`, `创建调拨任务`, hidden clearance quantity, transfer fields, and scenario source-status persistence.
- [ ] **Step 2: Run tests to verify RED** with `node --test src/pages/inventorySuggestionInteractions.test.mjs`; expect missing labels and controls.
- [ ] **Step 3: Add scenario state and controls** in `Inventory.jsx`: clearance omits quantity input; transfer adds quantity, source warehouse, destination warehouse, reason, owner, and note; button and Toast text come from the scenario.
- [ ] **Step 4: Persist scenario status** in `DemoStateContext.createInventoryTask` using the task's `sourceStatus` instead of hard-coded `待补货`.
- [ ] **Step 5: Run targeted tests to verify GREEN** with the command from Step 2.

### Task 3: Task Risk Filters And Full Verification

**Files:**
- Modify: `src/pages/Tasks.jsx`
- Create: `src/pages/tasks/taskRiskFilters.js`
- Create: `src/pages/tasks/taskRiskFilters.test.mjs`

**Interfaces:**
- Produces: `TASK_RISK_FILTERS = ['全部', '高', '中', '低', '滞销', '调拨']`.
- Consumes: existing `FilterBox` and exact risk-level matching.

- [ ] **Step 1: Write a failing filter-options test** asserting both new risk labels and exact matching behavior.
- [ ] **Step 2: Run test to verify RED** with `node --test src/pages/tasks/taskRiskFilters.test.mjs`; expect the module to be missing.
- [ ] **Step 3: Implement and wire the exported filter options** into `Tasks.jsx` without changing filter state shape.
- [ ] **Step 4: Run the targeted filter test** and expect PASS.
- [ ] **Step 5: Run full verification** with `node --test` and `npm.cmd run build`; expect zero test failures and a successful Vite production build.
