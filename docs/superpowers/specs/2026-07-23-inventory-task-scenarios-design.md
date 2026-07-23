# Inventory Task Scenarios Design

## Scope

Inventory task creation must adapt to the SKU risk type while preserving the current drawer layout, assignment workflow, task deduplication, and source auto-advance behavior.

## Scenario Rules

- High, medium, and low risks use the existing replenishment task flow.
- Slow-moving risks create clearance tasks. They do not require or display a replenishment quantity.
- Transfer risks create transfer tasks with quantity, source warehouse, destination warehouse, reason, owner, and note fields.
- Task creation updates the source inventory status to `待补货`, `待清库存`, or `待调拨` according to the scenario.

## Drawer Behavior

- The AI adoption action remains `采纳` for every scenario.
- Replenishment keeps the existing quantity field and `创建补货任务` action.
- Slow-moving inventory replaces quantity-oriented language with clearance language and uses `创建清库存任务`.
- Transfer inventory exposes editable transfer quantity, source warehouse, destination warehouse, reason, owner, and note fields and uses `创建调拨任务`.
- Existing confirmation checks for stale platform data and high-risk replenishment remain in place.

## Task Data

A pure scenario resolver supplies labels, validation, source status, task title, task impact, and process-log action. `buildInventoryTask` consumes the resolved scenario so task data and UI text cannot drift apart.

Transfer defaults are derived from explicit inventory fields first, then parsed from the AI suggestion, then fall back to the current warehouse and a different known warehouse. The source and destination must differ, and transfer quantity must be greater than zero.

## Task Filters

The task collaboration risk filter includes `全部`, `高`, `中`, `低`, `滞销`, and `调拨`. Existing `RiskTag` styling is reused.

## Verification

- Unit tests cover scenario resolution and task construction for replenishment, clearance, and transfer.
- Interaction tests cover scenario-specific drawer labels and controls.
- Task page tests cover the two added risk filter options.
- The complete Node test suite and Vite production build must pass.
