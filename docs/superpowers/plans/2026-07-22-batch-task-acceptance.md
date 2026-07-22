# Batch Task Acceptance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add partial-success batch acceptance for visible selected review tasks and remove the redundant confirmation checkbox from single-task acceptance.

**Architecture:** Extend the existing pure acceptance state module with a batch coordinator that delegates every task to `acceptTaskState` and returns accepted/skipped summaries. Add a focused batch confirmation dialog, then wire it to the existing Tasks toolbar using only selected tasks from `displayedTasks` while preserving the current single-task validation and audit flow.

**Tech Stack:** React 18, Vite, Tailwind CSS, Node test runner, existing DemoStateContext and Toast APIs, Vercel CLI.

## Global Constraints

- Modify only the task acceptance flow and its tests.
- Preserve the existing task page dimensions, spacing, typography, table columns and right-side detail layout.
- Show the batch action only on the `待验收` tab.
- Accept eligible tasks and skip ineligible tasks without rolling back successful items.
- Do not require the single-task confirmation checkbox.
- Deploy over the existing Vercel production project only after tests and browser verification pass.

---

### Task 1: Batch acceptance state coordinator

**Files:**
- Modify: `src/state/taskAcceptance.js`
- Modify: `src/state/taskAcceptance.test.mjs`

**Interfaces:**
- Consumes: `acceptTaskState(state, taskId, options)` and `getTaskAcceptanceBlockReason(task, orders, inventory)`.
- Produces: `acceptTasksState(state, taskIds, options) -> { ok, state, acceptedIds, skipped }`, where `skipped` contains `{ id, title, reason }`.

- [ ] **Step 1: Write failing tests**

Add tests proving that a mixed selection completes eligible tasks, skips blocked tasks with reasons, updates linked source records, creates individual audit logs, de-duplicates IDs, and returns no success when every selected task is blocked.

- [ ] **Step 2: Run the focused state tests**

Run: `node --test src/state/taskAcceptance.test.mjs`

Expected: FAIL because `acceptTasksState` does not exist.

- [ ] **Step 3: Implement the pure coordinator**

Normalize task IDs, process them in order against the latest accumulated state, call `acceptTaskState` with `{ confirmed: true, reviewer, note }`, and collect accepted IDs and explicit skip reasons.

- [ ] **Step 4: Re-run the focused state tests**

Run: `node --test src/state/taskAcceptance.test.mjs`

Expected: PASS.

### Task 2: Acceptance dialog interaction updates

**Files:**
- Modify: `src/components/common/TaskAcceptanceDialog.jsx`
- Create: `src/components/common/TaskBatchAcceptanceDialog.jsx`
- Modify: `src/components/common/taskAcceptanceDialog.test.mjs`
- Create: `src/components/common/taskBatchAcceptanceDialog.test.mjs`

**Interfaces:**
- Single dialog continues to call `onSubmit({ confirmed: true, note })` when all system checks pass.
- Batch dialog consumes `open`, `eligibleTasks`, `skippedTasks`, `onClose`, and `onConfirm`.

- [ ] **Step 1: Write failing component contract tests**

Assert that the single dialog no longer renders the confirmation checkbox or stores `confirmed`, and that its submit button is disabled only when system checks fail. Assert that the batch dialog renders selected, eligible and skipped counts, skip reasons, and disables confirmation when `eligibleTasks` is empty.

- [ ] **Step 2: Run focused component tests**

Run: `node --test src/components/common/taskAcceptanceDialog.test.mjs src/components/common/taskBatchAcceptanceDialog.test.mjs`

Expected: FAIL until the dialog contracts are implemented.

- [ ] **Step 3: Implement both dialog changes**

Keep the existing single dialog structure and visual tokens, remove only the redundant checkbox block, and submit explicit confirmation from the button. Build the batch dialog with the same modal shell, a compact three-count summary, a bounded skipped-task list, and buttons labelled `取消` and `确认通过 N 条`.

- [ ] **Step 4: Re-run focused component tests**

Run: `node --test src/components/common/taskAcceptanceDialog.test.mjs src/components/common/taskBatchAcceptanceDialog.test.mjs`

Expected: PASS.

### Task 3: Tasks page and shared state wiring

**Files:**
- Modify: `src/state/DemoStateContext.jsx`
- Modify: `src/pages/Tasks.jsx`
- Modify: `src/pages/taskAcceptanceInteractions.test.mjs`
- Create: `src/pages/taskBatchAcceptanceInteractions.test.mjs`

**Interfaces:**
- Demo state exposes `acceptTasks(taskIds, options)` backed by `acceptTasksState`.
- Tasks page derives `selectedVisibleReviewTasks` from `displayedTasks`, `selectedIds`, and active tab.

- [ ] **Step 1: Write failing integration tests**

Assert that the toolbar renders `批量验收通过` only for `待验收`, the batch candidates come only from visible selected review tasks, eligible/skipped summaries use the existing acceptance checks, successful IDs are removed from selection, skipped IDs remain selected, and no single-task auto-advance intent is prepared.

- [ ] **Step 2: Run focused page tests**

Run: `node --test src/pages/taskAcceptanceInteractions.test.mjs src/pages/taskBatchAcceptanceInteractions.test.mjs`

Expected: FAIL before wiring exists.

- [ ] **Step 3: Wire the batch action**

Add the context action, conditionally render the toolbar button, open the summary dialog from the visible selection, commit partial success, close the dialog, update selection, set the first remaining displayed task, set queue-complete state when appropriate, and show `已验收通过 N 条，跳过 M 条`.

- [ ] **Step 4: Re-run focused page tests**

Run: `node --test src/pages/taskAcceptanceInteractions.test.mjs src/pages/taskBatchAcceptanceInteractions.test.mjs`

Expected: PASS.

### Task 4: Full verification and production deployment

**Files:**
- Verify all modified files and generated build output without committing `dist`.

**Interfaces:**
- Vercel production deployment uses the existing linked project and preserves current routes.

- [ ] **Step 1: Run the full test suite**

Run: `node --test`

Expected: all tests pass.

- [ ] **Step 2: Build production assets**

Run: `npm run build`

Expected: Vite build succeeds.

- [ ] **Step 3: Verify in the browser at 1440x900**

Check single acceptance without the checkbox, mixed batch acceptance counts, partial success, retained skipped selections, remaining-task focus, unchanged layout, and no horizontal overflow.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors and no unrelated source modifications.

- [ ] **Step 5: Deploy over production**

Run: `vercel --prod --yes`.

Expected: deployment succeeds and the production URL serves `/tasks` with the verified behavior.
