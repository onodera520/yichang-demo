# Task Workload Balancing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an explainable task workload recommendation and human-confirmed reassignment flow on `/tasks`.

**Architecture:** Add a pure workload engine that consumes tasks, member profiles, and the existing SLA clock. Keep UI state in `Tasks.jsx`; use the existing context mutation APIs for confirmed transfers so task notices and source state remain consistent.

**Tech Stack:** React, Vite, Tailwind CSS, lucide-react, Node test runner.

## Global Constraints

- Only modify the task collaboration workflow.
- Recommendations are deterministic system recommendations, not real AI predictions.
- Rebalancing never changes task status, SLA, risk, or source object state.
- Every generated plan requires an explicit user confirmation.
- All business data remains in `src/data/mockData.js`.

---

### Task 1: Team Member Profiles And Workload Engine

**Files:**
- Modify: `src/data/mockData.js`
- Create: `src/state/taskWorkload.js`
- Create: `src/state/taskWorkload.test.mjs`

**Interfaces:**
- Produces: `taskTeamMembers`
- Produces: `calculateTaskWeight(task, nowMs, anchorMs)`
- Produces: `calculateMemberWorkloads(tasks, members, nowMs, anchorMs)`

- [ ] **Step 1: Write the failing workload tests**

```js
assert.equal(calculateTaskWeight({ riskLevel: '高', status: '处理中', remainingSLA: '01:00:00' }, 0, 0), 1.85);
assert.equal(calculateTaskWeight({ riskLevel: '低', status: '已完成', remainingSLA: '-' }, 0, 0), 0);
assert.deepEqual(
  calculateMemberWorkloads(tasks, members, 0, 0).map(({ name, level }) => [name, level]),
  [['王敏', 'overloaded'], ['李娜', 'available']],
);
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test src/state/taskWorkload.test.mjs`

Expected: FAIL because `taskWorkload.js` and its exports do not exist.

- [ ] **Step 3: Add member profile mock data**

```js
export const taskTeamMembers = [
  { name: '王敏', capacity: 10, expertise: ['来源订单', '物流异常'], availability: '可接单' },
  { name: '赵宁', capacity: 10, expertise: ['库存风险', '物流异常'], availability: '可接单' },
  { name: '陈浩', capacity: 10, expertise: ['来源订单', '平台同步'], availability: '可接单' },
  { name: '刘畅', capacity: 8, expertise: ['售后异常', '来源订单'], availability: '忙碌' },
  { name: '周扬', capacity: 8, expertise: ['库存风险', '清关异常'], availability: '可接单' },
  { name: '张磊', capacity: 10, expertise: ['平台同步', '物流异常'], availability: '不可用' },
  { name: '李娜', capacity: 10, expertise: ['售后异常', '库存风险'], availability: '可接单' },
];
```

- [ ] **Step 4: Implement the pure workload calculations**

Use the existing `getRemainingSlaSeconds` helper. Return `{ name, active, overdue, highRisk, weightedLoad, loadPercent, level, availability, expertise }` for every member. Preserve input arrays and task objects.

- [ ] **Step 5: Run the workload tests and verify GREEN**

Run: `node --test src/state/taskWorkload.test.mjs`

Expected: PASS.

### Task 2: Assignee Recommendations And Rebalancing Plans

**Files:**
- Modify: `src/state/taskWorkload.js`
- Modify: `src/state/taskWorkload.test.mjs`

**Interfaces:**
- Consumes: `calculateMemberWorkloads`
- Produces: `recommendTaskAssignees(task, tasks, members, nowMs, anchorMs, limit)`
- Produces: `buildTaskRebalancingPlan(tasks, members, nowMs, anchorMs, maxMoves)`
- Produces: `applyTaskRebalancingPlan(tasks, plan)`

- [ ] **Step 1: Write failing recommendation tests**

```js
assert.deepEqual(
  recommendTaskAssignees(task, tasks, members, 0, 0, 3).map(({ name }) => name),
  ['李娜', '赵宁', '陈浩'],
);
assert.equal(recommendTaskAssignees(task, tasks, members, 0, 0, 3).some(({ name }) => name === '张磊'), false);
assert.equal(buildTaskRebalancingPlan(tasks, members, 0, 0, 5).moves.length <= 5, true);
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `node --test src/state/taskWorkload.test.mjs`

Expected: FAIL because recommendation and plan exports do not exist.

- [ ] **Step 3: Implement deterministic recommendation scoring**

For each candidate, calculate projected load after transfer. Sort by projected load, then expertise match, then member name for stable output. Exclude the current owner, `不可用` members, and candidates projected above `100%`.

- [ ] **Step 4: Implement plan generation and immutable application**

Generate at most five moves from overloaded members. Each move must contain `{ taskId, title, fromOwner, toOwner, reason, before, after }`. `applyTaskRebalancingPlan` updates owners and appends a `负载调度` process log without changing status or SLA.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test src/state/taskWorkload.test.mjs`

Expected: PASS with stable recommendations and no input mutation.

### Task 3: Recommended Transfer Experience

**Files:**
- Create: `src/pages/tasks/TaskTransferDialog.jsx`
- Create: `src/pages/tasks/taskTransferDialog.test.mjs`
- Modify: `src/pages/Tasks.jsx`

**Interfaces:**
- Consumes: `recommendTaskAssignees`
- Produces: `TaskTransferDialog({ open, task, selectedCount, owner, recommendations, preview, onOwnerChange, onClose, onConfirm })`

- [ ] **Step 1: Write failing dialog structure tests**

Assert that the dialog renders “系统推荐”, recommendation reasons, current and projected load, a full owner selector, and “确认转交”. Assert that unavailable members are disabled or omitted.

- [ ] **Step 2: Run the dialog tests and verify RED**

Run: `node --test src/pages/tasks/taskTransferDialog.test.mjs`

Expected: FAIL because `TaskTransferDialog.jsx` does not exist.

- [ ] **Step 3: Build the reusable transfer dialog**

Use a `460px` dialog, three compact recommendation rows, load swatches, and explicit before/after percentages. Clicking a recommendation calls `onOwnerChange(name)`; the final button still requires user confirmation.

- [ ] **Step 4: Replace the inline `TransferModal`**

Compute recommendations from the currently selected task or the first selected batch task. Keep existing single and batch transfer handlers, but pass recommendation and preview data into the new dialog.

- [ ] **Step 5: Run task interaction tests**

Run: `node --test src/pages/tasks/taskTransferDialog.test.mjs src/pages/taskToolbarInteractions.test.mjs src/state/taskAssignmentConsistency.test.mjs`

Expected: PASS.

### Task 4: Team Overview And Rebalancing Preview

**Files:**
- Create: `src/pages/tasks/TaskRebalancingDialog.jsx`
- Create: `src/pages/tasks/taskRebalancingDialog.test.mjs`
- Modify: `src/pages/Tasks.jsx`

**Interfaces:**
- Consumes: `calculateMemberWorkloads`
- Consumes: `buildTaskRebalancingPlan`
- Produces: `TaskRebalancingDialog({ open, plan, onRemoveMove, onClose, onConfirm })`

- [ ] **Step 1: Write failing overview and plan-dialog tests**

Assert that overloaded members have a visible “过载” label, “生成调度方案” opens the dialog, individual moves can be removed, and an empty plan disables confirmation.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/pages/tasks/taskRebalancingDialog.test.mjs`

Expected: FAIL because the dialog and controls do not exist.

- [ ] **Step 3: Upgrade the compact team overview**

Keep the existing columns, display availability and overload labels without increasing the right panel width, and clamp only the visual bar width with `Math.min(100, loadPercent)`.

- [ ] **Step 4: Implement the plan preview dialog**

Use a maximum width of `760px`, list at most five moves, show before/after load values, and include remove, cancel, and confirm controls. Use an unframed empty state when no safe moves exist.

- [ ] **Step 5: Wire plan confirmation through context mutations**

Apply all remaining moves in one `updateTasksState` call. Append logs, clear the dialog, and show a Toast such as `已重新分派 3 条任务，王敏负载由 92% 降至 68%`.

- [ ] **Step 6: Run task-page tests and verify GREEN**

Run: `node --test src/pages/tasks/taskRebalancingDialog.test.mjs src/state/taskTabNotices.test.mjs src/state/taskOperations.test.mjs`

Expected: PASS, including no new status notice when only owners change.

### Task 5: Full Verification And Production Deployment

**Files:**
- Modify only files required by failures found in this task.

**Interfaces:**
- Consumes all previous task outputs.

- [ ] **Step 1: Run the complete test suite**

Run: `node --test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run: `npm.cmd run build`

Expected: Vite exits with code `0`.

- [ ] **Step 3: Verify at 1440×900**

Check recommendation selection, manual owner selection, overloaded member styling, plan removal, empty plan, confirmation, Toast copy, process logs, and immediate load-bar changes. Confirm there is no overlapping text or modal overflow.

- [ ] **Step 4: Deploy to production**

Run: `vercel.cmd --prod --yes`

Expected: deployment state `READY` and alias `https://yichang-demo.vercel.app`.

