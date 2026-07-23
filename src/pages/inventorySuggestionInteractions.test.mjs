import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./Inventory.jsx', import.meta.url), 'utf8');
const contextSource = fs.readFileSync(new URL('../state/DemoStateContext.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /buildDirectInventoryAdoptionPatch/,
  'inventory should build a direct adoption patch from the AI quantity',
);
assert.match(
  source,
  /getInventorySuggestionGateReason\(selectedSku, selectedDraft\)/,
  'task creation should be gated by the saved suggestion decision',
);
assert.match(
  source,
  /onAdoptSuggestion=\{handleAdoptSuggestion\}/,
  'the drawer content should receive the inline adoption handler',
);
assert.match(source, /已采纳/, 'the inline action should show a persistent adopted state');
assert.match(
  source,
  /row\.adjustedQuantity \?\? scenario\.quantity \?\? getReplenishmentQuantity\(row\)/,
  'reopening a SKU should restore the last confirmed quantity before the AI fallback',
);
assert.match(source, /row\.adjustReason \|\| getDefaultAdjustReason\(scenario\.kind\)/, 'reopening should restore the saved reason');
assert.match(source, /row\.adjustNote \|\| ''/, 'reopening should restore the saved note');
assert.match(
  source,
  /disabled=\{selectedSku\.status !== '待分派'\}/,
  'owner assignment should only enable after the suggestion is confirmed',
);
assert.doesNotMatch(source, /handleRejectSuggestion/, 'inventory should remove the no-op rejection handler');
assert.match(
  source,
  /saveInventoryAdjustment\(selectedSku\.sku, patch\)/,
  'adjusting the quantity should use the owner-preserving inventory action',
);
assert.match(
  contextSource,
  /const saveInventoryAdjustment = \(sku, patch = \{\}\)/,
  'demo state should expose a dedicated inventory adjustment action',
);
assert.match(
  contextSource,
  /saveSourceAdjustment\(item, patch\)/,
  'the inventory adjustment action should preserve existing assignment state',
);
assert.match(source, /hasAssignedOwner \? '已保存调整方案'/, 'saving an assigned adjustment should use the concise success message');
assert.doesNotMatch(source, /负责人保持不变/, 'the adjustment toast should not explain the unchanged owner');
assert.match(
  source,
  /resolveInventoryTaskScenario\(selectedSku/,
  'the drawer should resolve a shared inventory task scenario',
);
assert.match(source, /selectedScenario\.kind !== 'clearance'/, 'slow-moving inventory should omit replenishment quantity controls');
assert.match(source, /调拨数量/, 'transfer inventory should expose a transfer quantity field');
assert.match(source, /调出仓/, 'transfer inventory should expose a source warehouse field');
assert.match(source, /调入仓/, 'transfer inventory should expose a destination warehouse field');
assert.match(
  source,
  /selectedScenario\?\.createButtonLabel/,
  'the primary drawer action should use the scenario-specific task label',
);
assert.match(
  contextSource,
  /status: task\.sourceStatus/,
  'created inventory tasks should persist the scenario-specific source status',
);
assert.match(source, /const \[adjustmentOpen, setAdjustmentOpen\] = useState\(false\)/, 'adjustment fields should start collapsed');
assert.match(source, /const \[evidenceOpen, setEvidenceOpen\] = useState\(false\)/, 'supporting evidence should start collapsed');
assert.match(source, /setAdjustmentOpen\(false\)/, 'opening another SKU should reset the adjustment disclosure');
assert.match(source, /setEvidenceOpen\(false\)/, 'opening another SKU should reset the evidence disclosure');
assert.match(source, /aria-expanded=\{adjustmentOpen\}/, 'the adjustment control should expose its state');
assert.match(source, /aria-expanded=\{evidenceOpen\}/, 'the evidence control should expose its state');
assert.match(source, /onAssignOwner=\{handleAssignInventoryOwner\}/, 'owner assignment should remain connected to the drawer content');

console.log('inventory suggestion interaction tests passed');
