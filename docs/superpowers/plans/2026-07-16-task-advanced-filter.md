# Task Advanced Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/tasks` “更多筛选” button open a task-specific advanced filter popover for title, source object, creation date, and remaining SLA.

**Architecture:** Add a pure task-filter module for defaults, validation, counting, and matching. Add a focused `TaskAdvancedFilterPopover` that owns draft form state and dismissal behavior. `Tasks.jsx` owns only applied filters and combines them with the existing tab, search, and quick filters.

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react, Node.js built-in test runner, Vercel.

## Global Constraints

- Only change the task collaboration advanced filter; do not edit the order advanced filter.
- Keep the existing owner, source, risk, and deadline quick filters unchanged.
- The popover is approximately 420px wide and right-aligned beneath “更多筛选”.
- Draft changes do not affect the list until “应用筛选” is clicked.
- Text filters use trimmed, case-insensitive containment.
- Creation date and SLA range boundaries are inclusive.
- An SLA range matches only tasks whose live SLA state is `remaining`; completed and overdue tasks do not match.
- Page reset and task-notice locating clear the applied advanced filters.
- Advanced filter state remains session-only and is not written to `localStorage`.
- Do not modify `mockData.js`.
- Verify at 1440x900 and deploy to `https://yichang-demo.vercel.app`.

---

### Task 1: Pure Task Advanced Filter Rules

**Files:**
- Create: `src/pages/tasks/taskAdvancedFilters.js`
- Create: `src/pages/tasks/taskAdvancedFilters.test.mjs`

**Interfaces:**
- Consumes: task objects with `title`, `source`, `createdAt`, and live SLA presentation from `getTaskSlaPresentation(task, nowMs, anchorMs)`.
- Produces:
  - `taskAdvancedFilterDefaults`
  - `matchesTaskAdvancedFilters(task, filters, nowMs, anchorMs)`
  - `getTaskAdvancedFilterErrors(filters)`
  - `countActiveTaskAdvancedFilters(filters)`

- [ ] **Step 1: Write failing tests**

Create tests that import the four missing exports and assert:

```js
const task = {
  title: '切换至 NJ 仓发货',
  source: 'AMZ-US-240613-0188',
  createdAt: '2026-06-01 10:24',
  status: '处理中',
  remainingSLA: '01:30:00',
};

assert.equal(matchesTaskAdvancedFilters(task, {
  ...taskAdvancedFilterDefaults,
  title: ' nj ',
  source: '0188',
}, 0, 0), true);

assert.equal(matchesTaskAdvancedFilters(task, {
  ...taskAdvancedFilterDefaults,
  createdFrom: '2026-06-01',
  createdTo: '2026-06-01',
}, 0, 0), true);

assert.equal(matchesTaskAdvancedFilters(task, {
  ...taskAdvancedFilterDefaults,
  slaMinHours: '1.5',
  slaMaxHours: '1.5',
}, 0, 0), true);

assert.equal(matchesTaskAdvancedFilters({
  ...task,
  status: '已超时',
}, {
  ...taskAdvancedFilterDefaults,
  slaMaxHours: '10',
}, 0, 0), false);

assert.deepEqual(getTaskAdvancedFilterErrors({
  ...taskAdvancedFilterDefaults,
  createdFrom: '2026-06-02',
  createdTo: '2026-06-01',
}), {
  createdAt: '开始日期不能晚于结束日期',
  sla: '',
});

assert.deepEqual(getTaskAdvancedFilterErrors({
  ...taskAdvancedFilterDefaults,
  slaMinHours: '5',
  slaMaxHours: '2',
}), {
  createdAt: '',
  sla: '最小 SLA 不能大于最大 SLA',
});

assert.equal(countActiveTaskAdvancedFilters({
  title: '仓发货',
  source: 'AMZ',
  createdFrom: '2026-06-01',
  createdTo: '2026-06-03',
  slaMinHours: '1',
  slaMaxHours: '4',
}), 4);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test src/pages/tasks/taskAdvancedFilters.test.mjs
```

Expected: FAIL because `taskAdvancedFilters.js` does not exist.

- [ ] **Step 3: Implement the pure rules**

Create:

```js
import { getTaskSlaPresentation } from '../../state/taskSla.js';

export const taskAdvancedFilterDefaults = {
  title: '',
  source: '',
  createdFrom: '',
  createdTo: '',
  slaMinHours: '',
  slaMaxHours: '',
};

function hasValue(value) {
  return value !== '' && value != null;
}

function optionalNumber(value) {
  if (!hasValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function contains(value, query) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase();
  if (!normalizedQuery) return true;
  return String(value ?? '').toLowerCase().includes(normalizedQuery);
}

export function matchesTaskAdvancedFilters(task, filters = taskAdvancedFilterDefaults, nowMs = Date.now(), anchorMs = nowMs) {
  const createdDate = String(task.createdAt ?? '').slice(0, 10);
  const minSeconds = optionalNumber(filters.slaMinHours) * 3600;
  const maxSeconds = optionalNumber(filters.slaMaxHours) * 3600;
  const hasSlaRange = hasValue(filters.slaMinHours) || hasValue(filters.slaMaxHours);
  const sla = hasSlaRange ? getTaskSlaPresentation(task, nowMs, anchorMs) : null;

  return (
    contains(task.title, filters.title)
    && contains(task.source, filters.source)
    && (!filters.createdFrom || createdDate >= filters.createdFrom)
    && (!filters.createdTo || createdDate <= filters.createdTo)
    && (!hasSlaRange || (
      sla.state === 'remaining'
      && (optionalNumber(filters.slaMinHours) == null || sla.seconds >= minSeconds)
      && (optionalNumber(filters.slaMaxHours) == null || sla.seconds <= maxSeconds)
    ))
  );
}

export function getTaskAdvancedFilterErrors(filters = taskAdvancedFilterDefaults) {
  const min = optionalNumber(filters.slaMinHours);
  const max = optionalNumber(filters.slaMaxHours);
  let createdAt = '';
  let sla = '';

  if (filters.createdFrom && filters.createdTo && filters.createdFrom > filters.createdTo) {
    createdAt = '开始日期不能晚于结束日期';
  }

  if (
    (hasValue(filters.slaMinHours) && min == null)
    || (hasValue(filters.slaMaxHours) && max == null)
  ) {
    sla = '请输入有效 SLA';
  } else if ((min != null && min < 0) || (max != null && max < 0)) {
    sla = 'SLA 不能小于 0';
  } else if (min != null && max != null && min > max) {
    sla = '最小 SLA 不能大于最大 SLA';
  }

  return { createdAt, sla };
}

export function countActiveTaskAdvancedFilters(filters = taskAdvancedFilterDefaults) {
  return [
    Boolean(String(filters.title ?? '').trim()),
    Boolean(String(filters.source ?? '').trim()),
    Boolean(filters.createdFrom || filters.createdTo),
    hasValue(filters.slaMinHours) || hasValue(filters.slaMaxHours),
  ].filter(Boolean).length;
}
```

Avoid multiplying `null * 3600`: compute optional hour values once and only convert non-null values.

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```powershell
node --test src/pages/tasks/taskAdvancedFilters.test.mjs
```

Expected: all pure-function tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/pages/tasks/taskAdvancedFilters.js src/pages/tasks/taskAdvancedFilters.test.mjs
git commit -m "feat: add task advanced filter rules"
```

---

### Task 2: Task Advanced Filter Popover

**Files:**
- Create: `src/pages/tasks/TaskAdvancedFilterPopover.jsx`
- Create: `src/pages/tasks/taskAdvancedFilterPopover.test.mjs`

**Interfaces:**
- Consumes:

```js
{
  filters,
  onApply,
  onOpenChange,
  open,
}
```

- Produces: a 420px task-only popover with draft state, validation, active-count badge, outside-click dismissal, and Escape dismissal with focus restoration.

- [ ] **Step 1: Write failing component contract tests**

Assert the component file:

```js
assert.match(source, /aria-label="任务高级筛选"/);
assert.match(source, /w-\[420px\]/);
assert.match(source, /任务标题/);
assert.match(source, /来源对象编号/);
assert.match(source, /创建时间/);
assert.match(source, /剩余 SLA/);
assert.match(source, /pointerdown/);
assert.match(source, /event\.key === 'Escape'/);
assert.match(source, /triggerRef\.current\?\.focus\(\)/);
assert.match(source, /应用筛选/);
assert.match(source, /countActiveTaskAdvancedFilters/);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node --test src/pages/tasks/taskAdvancedFilterPopover.test.mjs
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the popover**

Follow the existing order popover interaction pattern, but render:

```jsx
<TextField label="任务标题" ... />
<TextField label="来源对象编号" ... />
<DateRangeFields
  error={errors.createdAt}
  fromValue={draft.createdFrom}
  toValue={draft.createdTo}
  ...
/>
<NumberRangeFields
  error={errors.sla}
  label="剩余 SLA"
  suffix="小时"
  ...
/>
```

Required behavior:

```jsx
useEffect(() => {
  if (open) setDraft({ ...taskAdvancedFilterDefaults, ...filters });
}, [filters, open]);

useEffect(() => {
  if (!open) return undefined;
  const handleOutsidePointer = (event) => {
    if (!rootRef.current?.contains(event.target)) onOpenChange(false);
  };
  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      onOpenChange(false);
      triggerRef.current?.focus();
    }
  };
  document.addEventListener('pointerdown', handleOutsidePointer);
  document.addEventListener('keydown', handleEscape);
  return () => {
    document.removeEventListener('pointerdown', handleOutsidePointer);
    document.removeEventListener('keydown', handleEscape);
  };
}, [onOpenChange, open]);
```

The trigger button keeps the existing `h-10 min-w-[104px]` dimensions and shows a blue badge only when applied filters are active.

- [ ] **Step 4: Run the component test and verify GREEN**

Run:

```powershell
node --test src/pages/tasks/taskAdvancedFilterPopover.test.mjs
```

Expected: all component contract tests PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src/pages/tasks/TaskAdvancedFilterPopover.jsx src/pages/tasks/taskAdvancedFilterPopover.test.mjs
git commit -m "feat: add task advanced filter popover"
```

---

### Task 3: Connect Advanced Filters To Tasks

**Files:**
- Modify: `src/pages/Tasks.jsx`
- Create: `src/pages/taskAdvancedFilterInteractions.test.mjs`
- Modify: `src/pages/taskTabNoticeInteractions.test.mjs`

**Interfaces:**
- Consumes from Task 1:
  - `taskAdvancedFilterDefaults`
  - `matchesTaskAdvancedFilters`
- Consumes from Task 2:
  - `TaskAdvancedFilterPopover`
- Produces: applied filter state integrated with task filtering, reset, pagination, task creation, incoming task navigation, and tab-notice locating.

- [ ] **Step 1: Write failing page integration tests**

Assert:

```js
assert.match(source, /TaskAdvancedFilterPopover/);
assert.match(source, /const \[advancedFilters, setAdvancedFilters\] = useState\(taskAdvancedFilterDefaults\)/);
assert.match(source, /const \[advancedFiltersOpen, setAdvancedFiltersOpen\] = useState\(false\)/);
assert.match(source, /matchesTaskAdvancedFilters\(task, advancedFilters, slaClock\.nowMs, slaClock\.anchorMs\)/);
assert.match(source, /setAdvancedFilters\(taskAdvancedFilterDefaults\)/);
assert.match(source, /setCurrentPage\(1\)/);
assert.match(source, /onApply=\{\(nextFilters\) =>/);
```

Extend the notice-location test to require `setAdvancedFilters(taskAdvancedFilterDefaults)` inside the noticed-tab path.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```powershell
node --test src/pages/taskAdvancedFilterInteractions.test.mjs src/pages/taskTabNoticeInteractions.test.mjs
```

Expected: FAIL because Tasks does not yet integrate advanced filters.

- [ ] **Step 3: Add imports and state**

Add:

```jsx
import TaskAdvancedFilterPopover from './tasks/TaskAdvancedFilterPopover.jsx';
import {
  matchesTaskAdvancedFilters,
  taskAdvancedFilterDefaults,
} from './tasks/taskAdvancedFilters.js';
```

State:

```jsx
const [advancedFilters, setAdvancedFilters] = useState(taskAdvancedFilterDefaults);
const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
```

- [ ] **Step 4: Combine filters**

Add to the existing `filteredTasks` predicate:

```js
&& matchesTaskAdvancedFilters(
  task,
  advancedFilters,
  slaClock.nowMs,
  slaClock.anchorMs,
)
```

Add `advancedFilters` to dependencies and update page reset effect:

```js
useEffect(() => {
  setCurrentPage(1);
}, [activeTab, advancedFilters, filters, topbarKeyword]);
```

- [ ] **Step 5: Replace the inert button**

Replace only the existing “更多筛选” wrapper with:

```jsx
<TaskAdvancedFilterPopover
  filters={advancedFilters}
  onApply={(nextFilters) => {
    setAdvancedFilters(nextFilters);
    setCurrentPage(1);
  }}
  onOpenChange={setAdvancedFiltersOpen}
  open={advancedFiltersOpen}
/>
```

- [ ] **Step 6: Clear advanced filters in all existing reset/locate flows**

Add `setAdvancedFilters(taskAdvancedFilterDefaults)` to:

- incoming `detailTaskId` / `highlightTaskId` route effect;
- noticed-tab location branch;
- `submitManualTask`;
- page-level `resetFilters`.

Page-level reset also closes the popover and returns to page 1:

```js
const resetFilters = () => {
  setFilters(DEFAULT_TASK_FILTERS);
  setAdvancedFilters(taskAdvancedFilterDefaults);
  setAdvancedFiltersOpen(false);
  setFocusedTaskIds([]);
  setActiveTab('全部');
  setCurrentPage(1);
};
```

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

```powershell
node --test src/pages/tasks/taskAdvancedFilters.test.mjs src/pages/tasks/taskAdvancedFilterPopover.test.mjs src/pages/taskAdvancedFilterInteractions.test.mjs src/pages/taskTabNoticeInteractions.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 8: Commit only the task advanced filter changes**

`Tasks.jsx` already contains unrelated user changes. Stage only the advanced-filter hunks plus the new test:

```powershell
git diff -- src/pages/Tasks.jsx
git apply --cached <task-advanced-filter-only.patch>
git add -- src/pages/taskAdvancedFilterInteractions.test.mjs src/pages/taskTabNoticeInteractions.test.mjs
git commit -m "feat: connect task advanced filters"
```

Do not stage other pre-existing `Tasks.jsx` changes.

---

### Task 4: Verification And Production Deployment

**Files:**
- Verify only.

- [ ] **Step 1: Run complete automated verification**

```powershell
node --test
npm.cmd run build
git diff --check
```

Expected:

- all Node tests PASS;
- Vite production build succeeds;
- no whitespace errors.

- [ ] **Step 2: Verify locally at 1440x900**

Check:

1. “更多筛选” opens a right-aligned 420px popover.
2. The popover stays within the left task-list column and does not cover the right detail column.
3. Draft typing does not filter until “应用筛选”.
4. Title and source filters use containment.
5. Creation-date boundaries and remaining-SLA boundaries are inclusive.
6. Invalid date/SLA ranges disable apply and show errors.
7. Applied condition count appears on the button.
8. Outside click and Escape close without applying; Escape returns focus.
9. Page reset clears quick and advanced filters.
10. Clicking a tab notice clears advanced filters before locating tasks.
11. The order page is unchanged.
12. Browser console has no errors.

- [ ] **Step 3: Deploy production**

```powershell
npx.cmd vercel --prod --yes
```

Expected: production deployment becomes Ready and aliases to `https://yichang-demo.vercel.app`.

- [ ] **Step 4: Inspect production**

```powershell
npx.cmd vercel inspect <deployment-url>
```

Expected: target `production`, status `Ready`, alias includes `https://yichang-demo.vercel.app`.
