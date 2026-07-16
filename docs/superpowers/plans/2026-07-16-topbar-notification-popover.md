# Topbar Notification Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global topbar notification popover that shares messages and read state with the Dashboard system-message drawer, and only navigates through an explicit “去处理” button.

**Architecture:** Extract message visibility, preview, unread-count, and badge-formatting rules into pure functions in `dashboardInbox.js`. Add a focused `NotificationPopover` presentation component, let `Topbar` own popover visibility and routing, and let `Dashboard` consume a one-time route state to open its existing full message drawer.

**Tech Stack:** React 18, React Router 6, Tailwind CSS, lucide-react, Node.js built-in test runner, Vite, Vercel.

## Global Constraints

- Topbar and Dashboard must read the same `systemMessages` source and the same `readMessageIds` state.
- Opening the popover must not mark messages as read.
- Clicking a message body only expands or collapses details and marks that message as read.
- Navigation is allowed only through the explicit “去处理” button.
- The popover shows the latest 5 visible messages and is approximately 380px wide.
- The badge shows the real unread count, hides at 0, and displays `99+` above 99.
- “查看全部消息” navigates to `/dashboard` and automatically opens the existing system-message drawer.
- Read state remains session-only and must not be written to `localStorage`.
- Do not add a new notification page, browser push, sound, or a second message dataset.
- Verify at 1440x900 and deploy to `https://yichang-demo.vercel.app`.

---

### Task 1: Shared Message Selection And Count Rules

**Files:**
- Modify: `src/state/dashboardInbox.js`
- Modify: `src/state/dashboardInbox.test.mjs`

**Interfaces:**
- Consumes: message objects shaped as `{ id, content, detail, category, time, target? }`, platform connections shaped as `{ platform, isStale? }`, and `Set<string> | string[]` read IDs.
- Produces:
  - `getVisibleSystemMessages(messages, platformConnections): Message[]`
  - `getNotificationPreview(messages, limit = 5): Message[]`
  - `getUnreadMessageCount(messages, readMessageIds): number`
  - `formatNotificationBadgeCount(count): string`

- [ ] **Step 1: Write failing pure-function tests**

Append these imports and assertions to `src/state/dashboardInbox.test.mjs`:

```js
import {
  filterDashboardMessages,
  formatNotificationBadgeCount,
  getDashboardTodoGroups,
  getNotificationPreview,
  getUnreadMessageCount,
  getVisibleSystemMessages,
  mergeReadMessageIds,
} from './dashboardInbox.js';

const platformMessage = { id: 'msg-platform-ebay' };
const ordinaryMessage = { id: 'message-ordinary' };

assert.deepEqual(
  getVisibleSystemMessages(
    [platformMessage, ordinaryMessage],
    [{ platform: 'eBay', isStale: true }],
  ),
  [platformMessage, ordinaryMessage],
);
assert.deepEqual(
  getVisibleSystemMessages(
    [platformMessage, ordinaryMessage],
    [{ platform: 'eBay', isStale: false }],
  ),
  [ordinaryMessage],
);
assert.deepEqual(
  getNotificationPreview(
    Array.from({ length: 7 }, (_, index) => ({ id: `message-${index + 1}` })),
  ).map((message) => message.id),
  ['message-1', 'message-2', 'message-3', 'message-4', 'message-5'],
);
assert.equal(
  getUnreadMessageCount(
    [{ id: 'message-1' }, { id: 'message-2' }, { id: 'message-3' }],
    new Set(['message-2']),
  ),
  2,
);
assert.equal(formatNotificationBadgeCount(0), '0');
assert.equal(formatNotificationBadgeCount(7), '7');
assert.equal(formatNotificationBadgeCount(99), '99');
assert.equal(formatNotificationBadgeCount(100), '99+');
```

- [ ] **Step 2: Run the state test and verify RED**

Run:

```powershell
node --test src/state/dashboardInbox.test.mjs
```

Expected: FAIL because the four new exports do not exist.

- [ ] **Step 3: Implement the shared pure functions**

Add to `src/state/dashboardInbox.js`:

```js
const STALE_PLATFORM_MESSAGE_ID = 'msg-platform-ebay';

function toReadIdSet(readMessageIds) {
  return readMessageIds instanceof Set
    ? readMessageIds
    : new Set(readMessageIds ?? []);
}

export function getVisibleSystemMessages(messages, platformConnections) {
  const ebayConnectionIsStale = platformConnections.some(
    (connection) => connection.platform === 'eBay' && connection.isStale,
  );

  return ebayConnectionIsStale
    ? messages
    : messages.filter((message) => message.id !== STALE_PLATFORM_MESSAGE_ID);
}

export function getNotificationPreview(messages, limit = 5) {
  return messages.slice(0, Math.max(0, limit));
}

export function getUnreadMessageCount(messages, readMessageIds) {
  const readIds = toReadIdSet(readMessageIds);
  return messages.reduce(
    (count, message) => count + (readIds.has(message.id) ? 0 : 1),
    0,
  );
}

export function formatNotificationBadgeCount(count) {
  return count > 99 ? '99+' : String(Math.max(0, count));
}
```

Update `filterDashboardMessages` to reuse `toReadIdSet`:

```js
export function filterDashboardMessages(messages, readMessageIds, filter = 'all') {
  if (filter !== 'unread') return messages;
  const readIds = toReadIdSet(readMessageIds);
  return messages.filter((message) => !readIds.has(message.id));
}
```

- [ ] **Step 4: Run the state test and verify GREEN**

Run:

```powershell
node --test src/state/dashboardInbox.test.mjs
```

Expected: PASS and print `dashboard inbox tests passed`.

- [ ] **Step 5: Commit the shared message rules**

```powershell
git add -- src/state/dashboardInbox.js src/state/dashboardInbox.test.mjs
git commit -m "feat: share notification message rules"
```

---

### Task 2: Notification Popover Presentation Component

**Files:**
- Create: `src/components/common/NotificationPopover.jsx`
- Create: `src/components/common/notificationPopover.test.mjs`

**Interfaces:**
- Consumes:

```js
{
  messages: Message[],
  readMessageIds: Set<string>,
  onMarkRead: (messageId: string) => void,
  onMarkAllRead: () => void,
  onNavigateTarget: (message: Message) => void,
  onViewAll: () => void,
}
```

- Produces: a 380px non-modal popover with local expanded-message state and no internal routing or duplicated message state.

- [ ] **Step 1: Write the failing component contract test**

Create `src/components/common/notificationPopover.test.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(
  new URL('./NotificationPopover.jsx', import.meta.url),
  'utf8',
);

test('notification popover renders the compact message-center structure', () => {
  assert.match(source, /aria-label="消息通知"/);
  assert.match(source, /w-\[380px\]/);
  assert.match(source, /消息通知/);
  assert.match(source, /全部已读/);
  assert.match(source, /查看全部消息/);
  assert.match(source, /暂无消息/);
});

test('message body marks read and expands without navigating', () => {
  assert.match(source, /setExpandedMessageId/);
  assert.match(source, /onMarkRead\(message\.id\)/);
  assert.match(source, /expandedMessageId === message\.id/);
  assert.doesNotMatch(source, /onNavigateTarget\(message\).*setExpandedMessageId/s);
});

test('business navigation is exposed through an explicit action button', () => {
  assert.match(source, /message\.target \? \(/);
  assert.match(source, />\s*去处理\s*</);
  assert.match(source, /onNavigateTarget\(message\)/);
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run:

```powershell
node --test src/components/common/notificationPopover.test.mjs
```

Expected: FAIL because `NotificationPopover.jsx` does not exist.

- [ ] **Step 3: Implement `NotificationPopover`**

Create `src/components/common/NotificationPopover.jsx`:

```jsx
import React, { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { getUnreadMessageCount } from '../../state/dashboardInbox.js';

export default function NotificationPopover({
  messages,
  readMessageIds,
  onMarkRead,
  onMarkAllRead,
  onNavigateTarget,
  onViewAll,
}) {
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const unreadCount = getUnreadMessageCount(messages, readMessageIds);

  const toggleMessage = (message) => {
    onMarkRead(message.id);
    setExpandedMessageId((current) => (
      current === message.id ? null : message.id
    ));
  };

  return (
    <section
      aria-label="消息通知"
      className="absolute right-0 top-[44px] z-50 w-[380px] overflow-hidden rounded-[10px] border border-[#E3E9F3] bg-white shadow-[0_16px_40px_rgba(16,24,40,0.18)]"
      role="dialog"
    >
      <header className="flex h-14 items-center justify-between border-b border-[#E9EDF4] px-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1D273B]">消息通知</h2>
          <p className="mt-0.5 text-xs text-[#8A98B3]">{unreadCount} 条未读</p>
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs font-medium text-[#2F7BFF] disabled:text-[#AAB4C5]"
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          全部已读
        </button>
      </header>

      <div className="max-h-[520px] overflow-y-auto p-2">
        {messages.map((message) => {
          const unread = !readMessageIds.has(message.id);
          const expanded = expandedMessageId === message.id;

          return (
            <article
              className={`mb-1 rounded-[8px] border ${
                unread
                  ? 'border-[#CFE0FF] bg-[#F5F9FF]'
                  : 'border-transparent bg-white'
              }`}
              key={message.id}
            >
              <button
                aria-expanded={expanded}
                className="flex w-full items-start gap-3 px-3 py-3 text-left"
                onClick={() => toggleMessage(message)}
                type="button"
              >
                <span
                  aria-label={unread ? '未读' : '已读'}
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    unread ? 'bg-[#2F7BFF]' : 'bg-[#D7DEE9]'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-[#1D273B]">
                    {message.content}
                  </span>
                  <span className="mt-1 block text-xs text-[#8A98B3]">
                    {message.category} · {message.time}
                  </span>
                  {expanded ? (
                    <span className="mt-2 block text-xs leading-5 text-[#5F6B7A]">
                      {message.detail}
                    </span>
                  ) : null}
                </span>
              </button>

              {message.target ? (
                <div className="flex justify-end px-3 pb-3">
                  <button
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2F7BFF]"
                    onClick={() => onNavigateTarget(message)}
                    type="button"
                  >
                    去处理
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}

        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8A98B3]">暂无消息</div>
        ) : null}
      </div>

      <button
        className="h-11 w-full border-t border-[#E9EDF4] text-sm font-medium text-[#2F7BFF] hover:bg-[#F7FAFF]"
        onClick={onViewAll}
        type="button"
      >
        查看全部消息
      </button>
    </section>
  );
}
```

- [ ] **Step 4: Run the component test and verify GREEN**

Run:

```powershell
node --test src/components/common/notificationPopover.test.mjs
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the popover component**

```powershell
git add -- src/components/common/NotificationPopover.jsx src/components/common/notificationPopover.test.mjs
git commit -m "feat: add notification popover"
```

---

### Task 3: Connect The Popover To Topbar

**Files:**
- Modify: `src/components/Topbar.jsx`
- Create: `src/components/topbarNotificationInteractions.test.mjs`

**Interfaces:**
- Consumes from Task 1:
  - `getVisibleSystemMessages`
  - `getNotificationPreview`
  - `getUnreadMessageCount`
  - `formatNotificationBadgeCount`
- Consumes from context:
  - `platformConnections`
  - `readMessageIds`
  - `markMessageRead(messageId)`
  - `markAllMessagesRead(messageIds)`
- Produces:
  - Real unread badge.
  - Toggleable popover.
  - Explicit target navigation.
  - Route state `{ openUtility: 'messages' }` for full-message handoff.

- [ ] **Step 1: Write the failing Topbar interaction contract test**

Create `src/components/topbarNotificationInteractions.test.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Topbar.jsx', import.meta.url), 'utf8');

test('topbar badge uses shared visible messages and real unread count', () => {
  assert.match(source, /getVisibleSystemMessages/);
  assert.match(source, /getNotificationPreview/);
  assert.match(source, /getUnreadMessageCount/);
  assert.match(source, /formatNotificationBadgeCount/);
  assert.doesNotMatch(source, />\s*7\s*</);
});

test('bell toggles a notification popover and supports dismiss interactions', () => {
  assert.match(source, /const \[notificationOpen, setNotificationOpen\] = useState\(false\)/);
  assert.match(source, /NotificationPopover/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /notificationRootRef\.current\?\.contains\(event\.target\)/);
  assert.match(source, /bellButtonRef\.current\?\.focus\(\)/);
});

test('message body and explicit navigation use separate callbacks', () => {
  assert.match(source, /markMessageRead\(message\.id\)/);
  assert.match(source, /navigate\(message\.target\.route, \{ state: message\.target\.state \}\)/);
  assert.match(source, /navigate\('\/dashboard', \{ state: \{ openUtility: 'messages' \} \}\)/);
});
```

- [ ] **Step 2: Run the Topbar test and verify RED**

Run:

```powershell
node --test src/components/topbarNotificationInteractions.test.mjs
```

Expected: FAIL because Topbar still renders the hard-coded `7` and no popover.

- [ ] **Step 3: Add Topbar state, shared data, and routing**

Update imports in `src/components/Topbar.jsx`:

```jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationPopover from './common/NotificationPopover.jsx';
import { systemMessages } from '../data/mockData.js';
import {
  formatNotificationBadgeCount,
  getNotificationPreview,
  getUnreadMessageCount,
  getVisibleSystemMessages,
} from '../state/dashboardInbox.js';
```

Replace the current context destructuring and add popover state:

```jsx
const {
  inventory,
  markAllMessagesRead,
  markMessageRead,
  orders,
  platformConnections,
  readMessageIds,
} = useDemoState();
const navigate = useNavigate();
const [notificationOpen, setNotificationOpen] = useState(false);
const notificationRootRef = useRef(null);
const bellButtonRef = useRef(null);
```

Add shared message derivation:

```jsx
const visibleMessages = useMemo(
  () => getVisibleSystemMessages(systemMessages, platformConnections),
  [platformConnections],
);
const previewMessages = useMemo(
  () => getNotificationPreview(visibleMessages),
  [visibleMessages],
);
const unreadCount = getUnreadMessageCount(visibleMessages, readMessageIds);
```

Add dismissal and navigation handlers:

```jsx
useEffect(() => {
  if (!notificationOpen) return undefined;

  const handlePointerDown = (event) => {
    if (!notificationRootRef.current?.contains(event.target)) {
      setNotificationOpen(false);
    }
  };
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setNotificationOpen(false);
      bellButtonRef.current?.focus();
    }
  };

  document.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [notificationOpen]);

const navigateToMessageTarget = (message) => {
  markMessageRead(message.id);
  setNotificationOpen(false);
  navigate(message.target.route, { state: message.target.state });
};

const viewAllMessages = () => {
  setNotificationOpen(false);
  navigate('/dashboard', { state: { openUtility: 'messages' } });
};
```

Replace the current bell button with:

```jsx
<div className="relative" ref={notificationRootRef}>
  <button
    aria-expanded={notificationOpen}
    aria-haspopup="dialog"
    aria-label={`消息通知，${unreadCount} 条未读`}
    className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#5F6B7A] hover:bg-[#F3F7FD]"
    onClick={() => setNotificationOpen((open) => !open)}
    ref={bellButtonRef}
    type="button"
  >
    <Bell className="h-5 w-5" />
    {unreadCount > 0 ? (
      <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2D2D] px-1 text-[10px] font-semibold leading-none text-white">
        {formatNotificationBadgeCount(unreadCount)}
      </span>
    ) : null}
  </button>

  {notificationOpen ? (
    <NotificationPopover
      messages={previewMessages}
      onMarkAllRead={() => markAllMessagesRead(visibleMessages.map((message) => message.id))}
      onMarkRead={markMessageRead}
      onNavigateTarget={navigateToMessageTarget}
      onViewAll={viewAllMessages}
      readMessageIds={readMessageIds}
    />
  ) : null}
</div>
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
node --test src/state/dashboardInbox.test.mjs src/components/common/notificationPopover.test.mjs src/components/topbarNotificationInteractions.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 5: Commit Topbar integration**

```powershell
git add -- src/components/Topbar.jsx src/components/topbarNotificationInteractions.test.mjs
git commit -m "feat: connect notifications to topbar"
```

---

### Task 4: Dashboard Full-Message Handoff, Verification, And Deployment

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Create: `src/pages/dashboardMessageRoute.test.mjs`
- Verify: `src/state/DemoStateContext.jsx`

**Interfaces:**
- Consumes route state `{ openUtility: 'messages' }`.
- Produces a one-time Dashboard effect that opens the existing message drawer and then removes only `openUtility` from route state.
- Reuses `getVisibleSystemMessages(systemMessages, platformConnections)`.

- [ ] **Step 1: Write the failing Dashboard route test**

Create `src/pages/dashboardMessageRoute.test.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Dashboard.jsx', import.meta.url), 'utf8');

test('dashboard uses the shared visible-message selector', () => {
  assert.match(source, /getVisibleSystemMessages/);
  assert.doesNotMatch(source, /message\.id !== 'msg-platform-ebay'/);
});

test('dashboard consumes the one-time full-message route intent', () => {
  assert.match(source, /useLocation/);
  assert.match(source, /location\.state\?\.openUtility !== 'messages'/);
  assert.match(source, /setUtilityDrawer\('messages'\)/);
  assert.match(source, /const \{ openUtility, \.\.\.remainingState \} = location\.state/);
  assert.match(source, /replace: true/);
});
```

- [ ] **Step 2: Run the Dashboard route test and verify RED**

Run:

```powershell
node --test src/pages/dashboardMessageRoute.test.mjs
```

Expected: FAIL because Dashboard still owns a local eBay filter and does not consume route state.

- [ ] **Step 3: Reuse the selector and add one-time drawer opening**

Update the router import in `src/pages/Dashboard.jsx`:

```jsx
import { useLocation, useNavigate } from 'react-router-dom';
```

Import the shared selector:

```jsx
import {
  filterDashboardMessages,
  getDashboardTodoGroups,
  getVisibleSystemMessages,
} from '../state/dashboardInbox.js';
```

At the start of `Dashboard`, add:

```jsx
const location = useLocation();
```

Replace the local `visibleSystemMessages` computation with:

```jsx
const visibleSystemMessages = React.useMemo(
  () => getVisibleSystemMessages(systemMessages, platformConnections),
  [platformConnections],
);
```

Add the one-time route-state effect after drawer state declarations:

```jsx
React.useEffect(() => {
  if (location.state?.openUtility !== 'messages') return;

  setSelectedSuggestion(null);
  setMessageFilter('all');
  setExpandedMessageId(null);
  setUtilityDrawer('messages');

  const { openUtility, ...remainingState } = location.state;
  navigate(location.pathname, {
    replace: true,
    state: Object.keys(remainingState).length ? remainingState : null,
  });
}, [location.pathname, location.state, navigate]);
```

Do not change the existing message drawer, message click handling, or context read-state functions.

- [ ] **Step 4: Run all automated verification**

Run:

```powershell
node --test
npm.cmd run build
git diff --check
```

Expected:

- All Node tests PASS.
- Vite production build succeeds.
- `git diff --check` reports no whitespace errors; Windows CRLF warnings are acceptable.

- [ ] **Step 5: Verify the full interaction at 1440x900**

Start the app:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Use the in-app browser at `http://127.0.0.1:5173/tasks` with a 1440x900 viewport and verify:

1. The badge shows the actual unread count, not a hard-coded `7`.
2. Clicking the bell opens one 380px popover beneath it without covering the avatar.
3. Opening the popover does not change the badge.
4. The popover shows at most 5 messages.
5. Clicking a message body expands its detail, marks only that message read, reduces the badge by one, and keeps the current route.
6. A target message shows “去处理”; clicking it performs the correct route/state navigation.
7. A non-target message has no “去处理” button.
8. “全部已读” clears all visible unread messages and hides the badge.
9. “查看全部消息” opens `/dashboard` with the existing system-message drawer visible.
10. Closing the Dashboard drawer and revisiting Dashboard does not automatically reopen it.
11. Clicking outside, clicking the bell again, and pressing `Esc` close the popover.
12. `Esc` returns focus to the bell.
13. The browser console contains no errors.

- [ ] **Step 6: Commit Dashboard handoff**

```powershell
git add -- src/pages/Dashboard.jsx src/pages/dashboardMessageRoute.test.mjs
git commit -m "feat: link notification popover to dashboard"
```

- [ ] **Step 7: Deploy production**

Run:

```powershell
npx.cmd vercel --prod --yes
```

Expected:

- Deployment completes successfully.
- Production is aliased to `https://yichang-demo.vercel.app`.

- [ ] **Step 8: Verify production**

Open:

```text
https://yichang-demo.vercel.app/tasks
```

Repeat the badge, expand-without-navigation, explicit “去处理”, “全部已读”, and “查看全部消息” checks. Confirm the production console has no errors.
