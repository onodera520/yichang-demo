# Dashboard Message Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the dashboard system-message drawer by adding a visible `去处理` affordance without changing whole-card navigation, and by adding a centered illustrated empty state for the unread tab.

**Architecture:** Keep the behavior inside `MessageDrawerContent` in `Dashboard.jsx` so routing and read-state handling remain unchanged. Add one project-local raster asset generated with ImageGen and a focused source regression test matching the repository's existing Node test style.

**Tech Stack:** React 18, React Router, Tailwind CSS, lucide-react, Node test runner, Vite, Vercel.

---

### Task 1: Lock the drawer behavior with a failing regression test

**Files:**
- Create: `src/pages/dashboardMessageDrawer.test.mjs`
- Inspect: `src/pages/Dashboard.jsx`

- [ ] **Step 1: Write the failing test**

Create a source regression test that reads `Dashboard.jsx` and asserts:

```js
assert.match(source, /onClick=\{\(\) => onMessageClick\(message\)\}/);
assert.match(source, /message\.target[\s\S]*去处理[\s\S]*ChevronRight/);
assert.match(source, /no-unread-messages\.png/);
assert.match(source, /alt="暂无未读消息"/);
assert.match(source, /min-h-0 flex-1[\s\S]*items-center[\s\S]*justify-center/);
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test src/pages/dashboardMessageDrawer.test.mjs`

Expected: FAIL because `去处理`, the generated asset import, and the flex-fill empty state are not implemented yet.

### Task 2: Generate and add the empty-state asset

**Files:**
- Create: `src/assets/empty-states/no-unread-messages.png`

- [ ] **Step 1: Generate a project-bound bitmap with ImageGen**

Generate a compact B2B empty-state illustration with a message tray and checkmark, no text, blue/cool-gray palette, a flat `#F5F7FB` background, generous padding, and no watermark.

- [ ] **Step 2: Inspect and place the selected image**

Inspect the generated image, then copy the selected output into `src/assets/empty-states/no-unread-messages.png` without replacing unrelated assets.

### Task 3: Implement the message action and centered empty state

**Files:**
- Modify: `src/pages/Dashboard.jsx` in the import section and `MessageDrawerContent`
- Test: `src/pages/dashboardMessageDrawer.test.mjs`

- [ ] **Step 1: Import the generated asset**

Add:

```jsx
import noUnreadMessagesImage from '../assets/empty-states/no-unread-messages.png';
```

- [ ] **Step 2: Preserve whole-card navigation and add the visible action**

Keep the existing card-level handler exactly on the outer button:

```jsx
onClick={() => onMessageClick(message)}
```

Replace the arrow-only target affordance with:

```jsx
{message.target ? (
  <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#2F7BFF]">
    去处理
    <ChevronRight className="h-3.5 w-3.5" />
  </span>
) : null}
```

- [ ] **Step 3: Make the unread empty state fill and center in the remaining drawer space**

Change the drawer content to a full-height flex column. Keep the filter toolbar fixed, let the message list fill the remainder, and render the empty state as a centered column containing the generated image and `暂无未读消息`.

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run: `node --test src/pages/dashboardMessageDrawer.test.mjs`

Expected: PASS.

### Task 4: Verify locally

**Files:**
- Verify: all `*.test.mjs` tests and the production build

- [ ] **Step 1: Run the complete Node test suite**

Run: `Get-ChildItem -Recurse -Filter *.test.mjs src | ForEach-Object { $_.FullName } | node --test`

Expected: all tests pass with zero failures.

- [ ] **Step 2: Build the application**

Run: `npm run build`

Expected: exit code 0; the existing bundle-size warning is acceptable.

- [ ] **Step 3: Browser-check the dashboard at 1440x900**

Verify that target messages show `去处理`, clicking elsewhere on a target card still navigates, and the unread-empty view centers the illustration and text in the drawer without affecting Sidebar, Topbar, or page layout.

### Task 5: Overwrite the Vercel production deployment

**Files:**
- Use existing `.vercel/project.json`; do not change GitHub state

- [ ] **Step 1: Deploy the verified build to production**

Use the linked Vercel project to overwrite the production deployment for `yichang-demo.vercel.app`.

- [ ] **Step 2: Verify production routes and deployment state**

Confirm `/dashboard` responds successfully and repeat the drawer checks against `https://yichang-demo.vercel.app/dashboard`.

- [ ] **Step 3: Report the production URL**

Return the existing production URL and verification results. Do not stage, commit, push, or create a GitHub pull request.
