# Task Return And Reopen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Tasks detail action safely return eligible tasks for rework or reopen completed tasks, with immutable process logs, restored SLA, source synchronization, and destination Tab notices.

**Architecture:** Add a pure task-return state module that owns status rules, validation, audit-log construction, and completed-source rollback. Expose the state transition through `DemoStateContext`, while `Tasks.jsx` and a focused dialog component handle only presentation, confirmation, and Toast feedback. Existing `commitTaskRows` reconciliation remains the single mechanism for Tab badges and task focusing.

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, lucide-react, Node.js built-in test runner.

## Global Constraints

- Only change task collaboration behavior and shared task state required by this feature.
- Process logs are append-only; never delete or rewrite prior entries.
- Return reasons are required, trimmed, and limited to 200 characters.
- `待确认` and `已升级` return to `处理中` without changing owner.
- `已分派` uses `撤销分派`, returns to `待分派`, and sets owner to `未分派`.
- `已完成` uses `重新打开`; it returns to `处理中` when assigned, otherwise `待分派`.
- `处理中`, `待分派`, and `已超时` do not expose a return action.
- Reopening a completed sourced task must fail if its source object no longer exists.
- Reopening restores `previousRemainingSLA`, falling back to `04:00:00` only for legacy completed tasks.
- Reopening an order restores source status to `处理中`; reopening inventory restores status to `待补货` without reversing risk level.
- Do not modify Tab styling or behavior on other pages.

---

### Task 1: Pure Return State Transitions

**Files:**
- Create: `src/state/taskReturn.js`
- Create: `src/state/taskReturn.test.mjs`
- Modify: `src/state/trustLayer.js`
- Modify: `src/state/trustLayer.test.mjs`
- Modify: `src/state/demoFlow.js`
- Modify: `src/state/demoFlow.test.mjs`

**Interfaces:**
- Produces: `getTaskReturnAction(task) -> { type, label, action, targetStatus } | null`
- Produces: `validateTaskReturnReason(reason) -> string | null`
- Produces: `returnTaskState(state, taskId, { reason }) -> { ok, state, task?, error? }`
- Produces: `reopenTaskState(state, taskId, { reason }) -> { ok, state, task?, error? }`
- Preserves: `completeTaskState(state, taskId, completionEvidence) -> state`, now storing `previousRemainingSLA`.

- [ ] **Step 1: Write failing transition and completion-SLA tests**

Add table-driven assertions covering the legal action labels and targets, unsupported statuses, empty and overlong reasons, immutable log append, owner clearing for `已分派`, owner retention for `待确认`/`已升级`, completed source rollback, missing-source rejection, legacy SLA fallback, and inventory risk-level preservation. Extend completion tests with:

```js
assert.equal(completedOrderState.tasks[0].previousRemainingSLA, '01:42:31');
assert.equal(completedOrderState.tasks[0].remainingSLA, '-');
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run:

```powershell
node --test src/state/taskReturn.test.mjs src/state/trustLayer.test.mjs src/state/demoFlow.test.mjs
```

Expected: FAIL because `taskReturn.js` does not exist and completion patches do not persist `previousRemainingSLA`.

- [ ] **Step 3: Implement minimal pure state logic**

Implement explicit action mapping and result objects. The transition must append a log shaped as:

```js
{
  time: '刚刚',
  owner: task.owner === '未分派' ? '系统' : task.owner,
  action: config.action,
  detail: `${task.status} → ${config.targetStatus}；原因：${reason.trim()}`,
  tone: config.type === 'reopen' ? 'orange' : 'blue',
}
```

For completed tasks, remove `completionEvidence` from the reopened task, restore SLA from `previousRemainingSLA || '04:00:00'`, and update only the matching source status. In `buildCompletionPatch` and the no-evidence completion branch, save the task's non-dash SLA before setting it to `-`.

- [ ] **Step 4: Run focused tests and verify they pass**

Run the command from Step 2.

Expected: all task return, trust-layer, and demo-flow tests PASS.

### Task 2: Context API And Notice Reconciliation

**Files:**
- Modify: `src/state/DemoStateContext.jsx`
- Create: `src/state/taskReturnContext.test.mjs`
- Modify: `src/state/taskTabNotices.test.mjs`

**Interfaces:**
- Consumes: `returnTaskState` and `reopenTaskState` from Task 1.
- Produces: `returnTask(taskId, { reason }) -> { ok, task?, error? }`
- Produces: `reopenTask(taskId, { reason }) -> { ok, task?, error? }`

- [ ] **Step 1: Write failing context-contract and notice tests**

Assert that the provider imports and exposes both APIs, applies returned orders/inventory/tasks, and routes task rows through `commitTaskRows`. Extend notice tests to verify `已升级 -> 处理中`, `已分派 -> 待分派`, and `已完成 -> 处理中` remove stale badge IDs and add exactly one destination badge.

- [ ] **Step 2: Run focused tests and verify they fail**

```powershell
node --test src/state/taskReturnContext.test.mjs src/state/taskTabNotices.test.mjs
```

Expected: FAIL because the context APIs are not exposed.

- [ ] **Step 3: Add context methods**

Create one internal context helper that selects `returnTaskState` or `reopenTaskState`, commits successful state through existing setters, and returns `{ ok, task, error }` to the page. Failed transitions must not call any setter. Ensure `commitTaskRows` remains responsible for badge migration.

- [ ] **Step 4: Run focused tests and verify they pass**

Run the command from Step 2.

Expected: all context and notice tests PASS.

### Task 3: Return Reason Dialog

**Files:**
- Create: `src/components/common/TaskReturnDialog.jsx`
- Create: `src/components/common/taskReturnDialog.test.mjs`

**Interfaces:**
- Consumes props: `{ open, task, action, onClose, onSubmit }`.
- Calls: `onSubmit({ reason })` only when the trimmed reason is non-empty and at most 200 characters.

- [ ] **Step 1: Write failing component source-contract tests**

Assert the component includes `role="dialog"`, an accessible title, a textarea with `maxLength={200}`, current and target status text, Escape handling, disabled confirmation while invalid/submitting, and reset behavior whenever the dialog opens for a new task.

- [ ] **Step 2: Run test and verify it fails**

```powershell
node --test src/components/common/taskReturnDialog.test.mjs
```

Expected: FAIL because `TaskReturnDialog.jsx` does not exist.

- [ ] **Step 3: Implement the dialog**

Build a centered white modal matching existing common dialogs: 440px maximum width, 12px radius, status transition summary, 4-row textarea, `0/200` counter, inline required error, cancel and blue confirm buttons. Use a small orange treatment only for `重新打开`; use blue for return and unassignment actions.

- [ ] **Step 4: Run test and verify it passes**

Run the command from Step 2.

Expected: PASS.

### Task 4: Tasks Page Integration

**Files:**
- Modify: `src/pages/Tasks.jsx`
- Create: `src/pages/taskReturnInteractions.test.mjs`

**Interfaces:**
- Consumes: `getTaskReturnAction`, `returnTask`, `reopenTask`, and `TaskReturnDialog`.
- Preserves: existing Tab indicator, badge positioning, filters, table selection, completion modal, transfer modal, and other pages.

- [ ] **Step 1: Write failing page integration tests**

Assert that `DetailPanel` derives the return action from task status, hides it when unsupported, renders `退回` / `撤销分派` / `重新打开` as appropriate, opens `TaskReturnDialog`, calls the matching context method, closes only on success, and shows success/error Toast text. Assert the detail action does not mutate `processLogs` locally.

- [ ] **Step 2: Run test and verify it fails**

```powershell
node --test src/pages/taskReturnInteractions.test.mjs
```

Expected: FAIL because the current `退回` button has no handler or state mapping.

- [ ] **Step 3: Integrate the feature**

Replace the inert button with a dynamic action button. Add `returnDialogOpen` state, open it only for supported actions, call `reopenTask` for action type `reopen` and `returnTask` otherwise, then show one of:

```text
任务已退回处理中
任务已撤销分派
任务已重新打开
当前状态无法退回
来源对象不存在，无法重新打开
```

Keep `selectedTaskId` unchanged so the updated detail remains visible. Let existing `taskTabNotices` move the task to its destination Tab; do not add page-local notice mutation.

- [ ] **Step 4: Run page and full state tests**

```powershell
node --test src/pages/taskReturnInteractions.test.mjs src/state/taskReturn.test.mjs src/state/taskReturnContext.test.mjs src/state/taskTabNotices.test.mjs
```

Expected: PASS.

### Task 5: Full Verification And Production Deployment

**Files:**
- Verify only; no planned code changes.

**Interfaces:**
- Consumes the completed feature and existing Vercel project link.
- Produces a verified production deployment at `https://yichang-demo.vercel.app`.

- [ ] **Step 1: Run the complete automated suite**

```powershell
node --test
npm.cmd run build
```

Expected: every test PASS and Vite build exits 0.

- [ ] **Step 2: Verify locally at 1440x900**

Start the existing Vite server if needed and verify: `已升级` return, `已分派` unassignment, completed reopen, required reason, immutable logs, destination badges, destination focusing, and no browser console errors. Confirm unsupported statuses do not show the return action and the right panel does not overflow.

- [ ] **Step 3: Review the scoped diff**

```powershell
git diff --check
git diff -- src/state/taskReturn.js src/state/taskReturn.test.mjs src/state/trustLayer.js src/state/trustLayer.test.mjs src/state/demoFlow.js src/state/demoFlow.test.mjs src/state/DemoStateContext.jsx src/state/taskReturnContext.test.mjs src/state/taskTabNotices.test.mjs src/components/common/TaskReturnDialog.jsx src/components/common/taskReturnDialog.test.mjs src/pages/Tasks.jsx src/pages/taskReturnInteractions.test.mjs
```

Expected: no whitespace errors and no unrelated page edits.

- [ ] **Step 4: Deploy production and verify online**

Run the repository's established Vercel production deployment command, then open `https://yichang-demo.vercel.app/tasks` and repeat the key return/reopen flows. Confirm the deployed URL loads the new dialog, state transition, Tab badge, and audit log without console errors.

