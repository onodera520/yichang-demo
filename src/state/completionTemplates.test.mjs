import assert from 'node:assert/strict';
import * as completionTemplateApi from './completionTemplates.js';
import { applyCompletionTemplate, getCompletionTemplates } from './completionTemplates.js';

const cases = [
  ['切换至 NJ 仓发货', '来源订单', '已完成仓库切换'],
  ['补货 120 件至 LA 仓', '库存风险', '已提交补货单'],
  ['物流延误处理', '物流异常', '已更换物流渠道'],
  ['地址异常核实', '来源订单', '地址已修正'],
  ['平台同步失败修复', '平台同步', '重新同步成功'],
  ['退款审核确认', '售后异常', '退款审核通过'],
  ['清关资料补充', '来源订单', '资料已补充'],
  ['库存数据校准', '库存风险', '库存已校准'],
  ['活动需求评估', '来源订单', '已完成处理'],
];

for (const [title, sourceType, expectedFirstLabel] of cases) {
  const task = { title, sourceType, source: 'SOURCE-001' };
  const templates = getCompletionTemplates(task);
  assert.equal(templates.length, 3, `${title} should provide exactly three templates`);
  assert.equal(templates[0].label, expectedFirstLabel, `${title} should use the expected template category`);
  assert.equal(templates[0].resolvedSource, true, `${title} success template should resolve the source`);
  assert.equal(templates[0].targetStatus, '待验收', `${title} success template should submit the task for acceptance`);
  assert.equal(
    templates.every((template) => template.description.includes('SOURCE-001')),
    true,
    `${title} descriptions should contain the source identifier`,
  );
}

const titlePriority = getCompletionTemplates({
  title: '补货风险处理',
  sourceType: '平台同步',
  source: 'SKU-001',
});
assert.equal(titlePriority[0].label, '已提交补货单', 'title keywords should take priority over source type');

const sourceTypeFallbackCases = [
  ['仓库切换', '已完成仓库切换'],
  ['补货采购', '已提交补货单'],
  ['物流异常', '已更换物流渠道'],
  ['地址异常', '地址已修正'],
  ['平台同步', '重新同步成功'],
  ['售后异常', '退款审核通过'],
  ['清关发票', '资料已补充'],
  ['库存风险', '库存已校准'],
];

for (const [sourceType, expectedFirstLabel] of sourceTypeFallbackCases) {
  const templates = getCompletionTemplates({
    title: '待跟进事项',
    description: '补货物流地址等历史说明不应抢占分类',
    sourceType,
    source: 'SOURCE-TYPE-001',
  });
  assert.equal(templates[0].label, expectedFirstLabel, `${sourceType} should be used as a fallback`);
}

const warehouseTemplates = getCompletionTemplates({
  title: '切换发货仓库',
  sourceType: '来源订单',
  source: 'ORDER-001',
});
assert.equal(warehouseTemplates[1].resolvedSource, false);
assert.equal(warehouseTemplates[2].resolvedSource, false);
assert.deepEqual(
  warehouseTemplates.map((template) => template.targetStatus),
  ['待验收', '处理中', '已升级'],
  'blocked warehouse switching must upgrade instead of completing',
);

const replenishmentTemplates = getCompletionTemplates({
  title: '补货风险处理',
  sourceType: '库存风险',
  source: 'SKU-001',
});
assert.equal(replenishmentTemplates[1].label, '调整数量后提交');
assert.equal(replenishmentTemplates[1].resolvedSource, false);
assert.equal(replenishmentTemplates[2].resolvedSource, false);

for (const [title, sourceType] of cases.map(([title, sourceType]) => [title, sourceType])) {
  const templates = getCompletionTemplates({ title, sourceType, source: 'SOURCE-STATE-001' });
  assert.equal(templates[1].resolvedSource, false, `${title} secondary template should keep source unresolved`);
  assert.equal(templates[2].resolvedSource, false, `${title} tertiary template should keep source unresolved`);
}

const fallbackTemplates = getCompletionTemplates({ title: '未知任务', source: 'TASK-001' });
assert.deepEqual(
  fallbackTemplates.map((template) => template.label),
  ['已完成处理', '部分完成', '无法处理已升级'],
);
assert.equal(new Set(fallbackTemplates.map((template) => template.id)).size, 3);

const existingForm = {
  result: '',
  description: '',
  resolvedSource: '',
  referenceNo: 'REF-001',
  quantity: '8',
  cost: '304',
  attachment: { name: 'proof.png', size: 1024 },
};
const filledForm = applyCompletionTemplate(existingForm, warehouseTemplates[0]);
assert.equal(filledForm.result, warehouseTemplates[0].result);
assert.equal(filledForm.description, warehouseTemplates[0].description);
assert.equal(filledForm.resolvedSource, 'yes');
assert.equal(filledForm.referenceNo, 'REF-001');
assert.equal(filledForm.quantity, '8');
assert.equal(filledForm.cost, '304');
assert.deepEqual(filledForm.attachment, existingForm.attachment);
assert.equal(applyCompletionTemplate(existingForm, warehouseTemplates[2]).resolvedSource, 'no');

assert.equal(typeof completionTemplateApi.getCompletionDialogCopy, 'function');
assert.deepEqual(completionTemplateApi.getCompletionDialogCopy('已升级'), {
  title: '升级任务',
  submitLabel: '确认升级',
});
assert.deepEqual(completionTemplateApi.getCompletionDialogCopy('处理中'), {
  title: '提交处理结果',
  submitLabel: '提交处理结果',
});
assert.deepEqual(completionTemplateApi.getCompletionDialogCopy('已完成'), {
  title: '完成任务',
  submitLabel: '提交完成',
});
assert.deepEqual(completionTemplateApi.getCompletionDialogCopy('待验收'), {
  title: '提交处理结果',
  submitLabel: '提交验收',
});

console.log('completion template tests passed');
