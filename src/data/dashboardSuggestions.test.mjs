import assert from 'node:assert/strict';
import test from 'node:test';
import { dashboardSuggestions, inventory, orders, systemMessages } from './mockData.js';

test('dashboard exposes eight unique, traceable suggestions', () => {
  assert.equal(dashboardSuggestions.length, 8);
  assert.equal(new Set(dashboardSuggestions.map((item) => item.id)).size, 8);

  for (const suggestion of dashboardSuggestions) {
    assert.ok(suggestion.description);
    assert.ok(suggestion.impact);
    assert.ok(suggestion.confidence >= 0.7);

    const sourceExists = suggestion.sourceKind === 'inventory'
      ? inventory.some((item) => item.sku === suggestion.sourceId)
      : orders.some((item) => item.id === suggestion.sourceId);

    assert.equal(sourceExists, true, suggestion.id);
  }
});

test('dashboard suggestions cover the approved action set', () => {
  assert.deepEqual(
    dashboardSuggestions.map((item) => item.title),
    [
      '建议切换NJ仓发货',
      '建议补货 120 件至 LA 仓',
      '建议更换物流渠道',
      '建议修正异常地址并联系买家',
      '建议重新同步平台订单',
      '建议调拨滞销库存至高销量仓',
      '建议重新发起支付并通知买家',
      '建议补充清关资料避免退运',
    ],
  );
});

test('dashboard suggestion message uses the same total', () => {
  const suggestionMessage = systemMessages.find((message) => message.category === 'AI建议');
  assert.ok(suggestionMessage);
  assert.match(suggestionMessage.content, new RegExp(`${dashboardSuggestions.length}条`));
});
