import assert from 'node:assert/strict';
import { dashboardSuggestions, inventory, orders, settings } from './mockData.js';
import {
  calculateAvailableDays,
  calculateDataCompleteness,
  calculateSuggestedReplenishment,
} from '../state/trustLayer.js';

assert.equal(calculateDataCompleteness(settings.platformConnections), 87);

const ebayConnection = settings.platformConnections.find((item) => item.platform === 'eBay');
assert.equal(ebayConnection.isStale, true);
assert.equal(ebayConnection.lastSuccessfulSync, '2026-06-01 09:18:41');

assert.equal(
  orders.every((order) => order.riskExplanation?.factors?.length && order.aiEvidence?.evidence?.length),
  true,
  'every order should expose risk factors and AI evidence',
);

const primarySku = inventory.find((item) => item.sku === 'ELE-HEAD-01');
assert.equal(calculateAvailableDays(primarySku), primarySku.availableDays);
assert.equal(calculateSuggestedReplenishment(primarySku), primarySku.suggestedReplenishment);
assert.equal(primarySku.inventoryPlanning.packSize, 20);
assert.equal(primarySku.aiEvidence.risks.length > 0, true);
assert.equal(
  inventory.every((item) => calculateAvailableDays(item) === item.availableDays),
  true,
  'inventory planning metadata should reproduce every displayed available-days value',
);
assert.equal(
  inventory.every((item) => calculateSuggestedReplenishment(item) === item.suggestedReplenishment),
  true,
  'inventory planning metadata should reproduce every displayed replenishment value',
);

assert.equal(
  dashboardSuggestions.every((suggestion) => suggestion.aiEvidence?.evidence?.length),
  true,
  'dashboard suggestions should include explainable evidence',
);
assert.equal(
  dashboardSuggestions
    .filter((suggestion) => suggestion.sourceKind === 'inventory')
    .every((suggestion) => inventory.some((item) => item.sku === suggestion.sourceId)),
  true,
  'inventory suggestions should reference a real SKU',
);

const explainableItems = [...orders, ...inventory, ...dashboardSuggestions];
assert.equal(
  explainableItems.every((item) =>
    item.riskExplanation.factors.reduce((sum, factor) => sum + factor.score, 0) === item.riskExplanation.score),
  true,
  'risk score should equal the sum of displayed factors',
);

console.log('mock trust data tests passed');
