# Task SLA Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display task SLA values with correct remaining, overdue, and completed semantics.

**Architecture:** Add a pure task SLA presentation helper and use it only on the task collaboration page. Preserve workflow status while deriving live overdue state from the SLA clock; retain compatibility for legacy mock rows explicitly marked overdue.

**Tech Stack:** React 18, Vite 6, Node test runner, Tailwind CSS

## Global Constraints

- Limit production changes to task collaboration behavior and task mock data.
- Do not change SLA presentation on dashboard, orders, or inventory pages.
- Keep the current `/tasks` layout and interactions intact.

---

### Task 1: Task SLA presentation model

**Files:**
- Create: `src/state/taskSla.js`
- Create: `src/state/taskSla.test.mjs`

**Interfaces:**
- Consumes: task fields `status`, `remainingSLA`, optional `overdueDuration`, and clock values `nowMs`, `anchorMs`.
- Produces: `getTaskSlaPresentation(task, nowMs, anchorMs)` returning `{ state, seconds, label }`.

- [ ] **Step 1: Write failing tests** for remaining, live-overdue, legacy-overdue, and completed tasks.
- [ ] **Step 2: Run `node src/state/taskSla.test.mjs`** and confirm failure because the helper does not exist.
- [ ] **Step 3: Implement the minimal pure helper** using existing SLA parsing and formatting utilities.
- [ ] **Step 4: Run `node src/state/taskSla.test.mjs`** and confirm all cases pass.

### Task 2: Task page integration

**Files:**
- Modify: `src/pages/Tasks.jsx`
- Modify: `src/data/mockData.js`
- Test: `src/state/taskSla.test.mjs`

**Interfaces:**
- Consumes: `getTaskSlaPresentation` from Task 1.
- Produces: task table and detail text that display `剩余`, `超时`, or `-` correctly.

- [ ] **Step 1: Add a source-level regression assertion** that direct task-page use of `SlaCountdown` is removed.
- [ ] **Step 2: Run the regression test** and confirm it fails against the current page.
- [ ] **Step 3: Add a task-only SLA display component** backed by `getTaskSlaPresentation`, then use it in the table and detail card.
- [ ] **Step 4: Add `overdueDuration` to generated legacy overdue mock tasks** and ensure deadline filters include derived overdue tasks.
- [ ] **Step 5: Run all task-related tests and confirm they pass.**

### Task 3: End-to-end verification

**Files:**
- Verify: `src/pages/Tasks.jsx`
- Verify: `src/state/taskSla.js`

- [ ] **Step 1: Run `npm run build`** and require exit code 0.
- [ ] **Step 2: Open `/tasks`, select `已超时`, and verify every SLA cell starts with `超时` and uses red text.**
- [ ] **Step 3: Verify the task detail card uses `超时` rather than `剩余时间` for an overdue task.**
- [ ] **Step 4: Check the browser console and require zero errors.**
