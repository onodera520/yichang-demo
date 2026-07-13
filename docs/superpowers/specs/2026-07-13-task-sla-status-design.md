# Task SLA Status Design

## Goal

Correct the task collaboration page so overdue tasks never present a positive value as remaining SLA time.

## Semantics

- Active task before its deadline: show `剩余 HH:MM:SS`.
- Active task after its deadline: preserve its workflow `status`, derive `slaStatus` as overdue, and show `超时 HH:MM:SS` in red.
- Legacy mock task whose workflow status is `已超时`: interpret its SLA value as elapsed overdue duration and show `超时 HH:MM:SS`.
- Completed task: show `-`.
- The `已超时` tab includes both legacy `status === '已超时'` tasks and active tasks whose live SLA has reached zero.

## Data Flow

Create a focused SLA presentation helper that consumes a task plus the live clock and returns `remaining`, `overdue`, or `completed` with formatted seconds. The task table and task detail panel consume that helper instead of rendering `remainingSLA` directly.

For generated mock tasks, use `overdueDuration` for legacy overdue rows. Keep `remainingSLA` for compatibility with existing operations, exports, and other pages.

## Scope

Only task collaboration SLA behavior and its mock task data are changed. Shared order/dashboard SLA rendering remains unchanged.

## Verification

- Unit coverage for remaining, live-overdue, legacy-overdue, and completed states.
- Existing task operation tests.
- Production build.
- Browser check of `/tasks`, especially the `已超时` tab and detail card.
