import { resolveInventoryTaskScenario } from './inventoryTaskScenario.js';

function normalizeDraft(draft) {
  return typeof draft === 'object' && draft !== null ? draft : { quantity: draft };
}

function scenarioPatch(source, draft = {}) {
  const scenario = resolveInventoryTaskScenario(source, draft);
  if (scenario.validationError) throw new Error(scenario.validationError);
  return {
    adjustedQuantity: scenario.quantity,
    ...(scenario.kind === 'transfer'
      ? {
          transferFromWarehouse: scenario.fromWarehouse,
          transferToWarehouse: scenario.toWarehouse,
        }
      : {}),
  };
}

export function buildDirectInventoryAdoptionPatch(source) {
  return {
    ...scenarioPatch(source),
    suggestionDecision: 'adopted',
    adjustReason: '',
    adjustNote: '',
  };
}

export function buildAdjustedInventoryAdoptionPatch(source, draft = {}) {
  const scenario = scenarioPatch(source, draft);
  const adjustedQuantity = scenario.adjustedQuantity;
  return {
    ...scenario,
    suggestionDecision: adjustedQuantity === resolveInventoryTaskScenario(source).quantity
      ? 'adopted'
      : 'modified',
    adjustReason: String(draft.reason || ''),
    adjustNote: String(draft.note || ''),
  };
}

export function getInventorySuggestionGateReason(source, draft) {
  const normalizedDraft = normalizeDraft(draft);
  if (!source?.suggestionDecision) return '请先采纳 AI 建议或保存调整方案';
  if (Number(normalizedDraft.quantity) !== Number(source.adjustedQuantity)) return '请先保存调整方案';
  if (source.riskLevel === '调拨') {
    if (normalizedDraft.fromWarehouse !== source.transferFromWarehouse) return '请先保存调整方案';
    if (normalizedDraft.toWarehouse !== source.transferToWarehouse) return '请先保存调整方案';
  }
  return '';
}

export function isDirectInventorySuggestionAdopted(source, draft) {
  const normalizedDraft = normalizeDraft(draft);
  const scenario = resolveInventoryTaskScenario(source);
  return source?.suggestionDecision === 'adopted'
    && Number(source.adjustedQuantity) === scenario.quantity
    && Number(normalizedDraft.quantity) === scenario.quantity
    && (scenario.kind !== 'transfer'
      || (
        source.transferFromWarehouse === scenario.fromWarehouse
        && source.transferToWarehouse === scenario.toWarehouse
        && normalizedDraft.fromWarehouse === scenario.fromWarehouse
        && normalizedDraft.toWarehouse === scenario.toWarehouse
      ));
}
