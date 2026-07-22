function template(
  id,
  label,
  description,
  resolvedSource,
  targetStatus = resolvedSource ? '待验收' : '处理中',
) {
  return { id, label, result: label, description, resolvedSource, targetStatus };
}

const templateFactories = {
  warehouse: (source) => [
    template('warehouse-success', '已完成仓库切换', `已完成 ${source} 的目标仓切换，并同步平台订单状态。`, true),
    template('warehouse-partial', '部分订单已切换', `已完成 ${source} 的部分订单仓库切换，剩余订单继续处理中。`, false),
    template('warehouse-blocked', '无法切换已升级', `${source} 因目标仓库存或履约条件不足无法切换，已升级主管处理。`, false, '已升级'),
  ],
  replenishment: (source) => [
    template('replenishment-success', '已提交补货单', `已为 ${source} 按建议数量提交补货，并确认预计到货时间。`, true),
    template('replenishment-adjusted', '调整数量后提交', `已根据最新库存和销量调整 ${source} 的补货数量并提交，等待供应商确认。`, false),
    template('replenishment-hold', '暂缓补货', `${source} 经复核暂不补货，等待供应商或销量数据更新。`, false),
  ],
  logistics: (source) => [
    template('logistics-channel', '已更换物流渠道', `已为 ${source} 更换物流渠道，并同步客服更新买家通知。`, true),
    template('logistics-recovered', '物流轨迹已恢复', `${source} 的物流轨迹已恢复更新，继续观察当前履约时效。`, false),
    template('logistics-waiting', '等待物流商反馈', `${source} 已提交物流商查询，当前等待外部处理结果。`, false),
  ],
  address: (source) => [
    template('address-corrected', '地址已修正', `已修正 ${source} 的收件地址并同步至平台。`, true),
    template('address-waiting', '等待买家确认', `已向 ${source} 的买家发送地址确认消息，等待回复。`, false),
    template('address-closed', '地址无效已升级', `${source} 的地址经核验仍无效，已升级主管继续处理。`, false, '已升级'),
  ],
  platform: (source) => [
    template('platform-success', '重新同步成功', `${source} 已重新同步成功，平台与 ERP 状态一致。`, true),
    template('platform-retrying', '正在重试同步', `${source} 已进入重试队列，等待平台返回最新状态。`, false),
    template('platform-escalated', '已升级技术处理', `${source} 多次同步失败，已升级技术人员继续处理。`, false, '已升级'),
  ],
  refund: (source) => [
    template('refund-approved', '退款审核通过', `${source} 的退款资料已复核通过，并同步处理结果。`, true),
    template('refund-rejected', '退款审核待复核', `${source} 的退款申请存在条件争议，已记录原因并等待复核。`, false),
    template('refund-waiting', '等待补充材料', `${source} 的退款审核缺少必要材料，等待补充后继续处理。`, false),
  ],
  compliance: (source) => [
    template('compliance-complete', '资料已补充', `已补充 ${source} 所需的清关或发票资料，并提交审核。`, true),
    template('compliance-review', '等待平台审核', `${source} 的资料已提交，当前等待平台或海关审核。`, false),
    template('compliance-transfer', '已转交合规处理', `${source} 涉及合规风险，已转交合规负责人继续处理。`, false),
  ],
  inventory: (source) => [
    template('inventory-calibrated', '库存已校准', `已完成 ${source} 的库存复核与校准，账实数据一致。`, true),
    template('inventory-transferred', '库存调拨待确认', `已提交 ${source} 的库存调拨，等待目标仓确认可用库存。`, false),
    template('inventory-waiting', '等待仓库复核', `${source} 已提交仓库复核，等待最新盘点结果。`, false),
  ],
  fallback: (source) => [
    template('fallback-success', '已完成处理', `已完成 ${source} 的处理并记录执行结果。`, true),
    template('fallback-partial', '部分完成', `${source} 已完成部分处理，剩余事项继续跟进。`, false),
    template('fallback-escalated', '无法处理已升级', `${source} 当前无法继续处理，已升级相关负责人。`, false, '已升级'),
  ],
};

function detectCategory(task) {
  const titleText = task?.title || '';
  if (/切换.*仓|发货仓|仓发货/.test(titleText)) return 'warehouse';
  if (/补货|采购/.test(titleText)) return 'replenishment';
  if (/物流|渠道/.test(titleText)) return 'logistics';
  if (/地址/.test(titleText)) return 'address';
  if (/平台同步|同步失败|同步修复/.test(titleText)) return 'platform';
  if (/退款|售后/.test(titleText)) return 'refund';
  if (/清关|发票|合规/.test(titleText)) return 'compliance';
  if (/库存|SKU|调拨/.test(titleText)) return 'inventory';

  const sourceType = task?.sourceType || '';
  if (/仓库切换|发货仓|仓储/.test(sourceType)) return 'warehouse';
  if (/补货|采购/.test(sourceType)) return 'replenishment';
  if (/物流|渠道/.test(sourceType)) return 'logistics';
  if (/地址/.test(sourceType)) return 'address';
  if (/平台同步|同步失败/.test(sourceType)) return 'platform';
  if (/退款|售后/.test(sourceType)) return 'refund';
  if (/清关|发票|合规/.test(sourceType)) return 'compliance';
  if (/库存|SKU|调拨/.test(sourceType)) return 'inventory';
  return 'fallback';
}

export function getCompletionTemplates(task) {
  const source = task?.source || task?.title || '当前任务';
  return templateFactories[detectCategory(task)](source);
}

export function applyCompletionTemplate(form, completionTemplate) {
  return {
    ...form,
    result: completionTemplate.result,
    description: completionTemplate.description,
    resolvedSource: completionTemplate.resolvedSource ? 'yes' : 'no',
  };
}

export function getCompletionDialogCopy(targetStatus) {
  if (targetStatus === '已完成') {
    return { title: '完成任务', submitLabel: '提交完成' };
  }
  if (targetStatus === '已升级') {
    return { title: '升级任务', submitLabel: '确认升级' };
  }
  if (targetStatus === '待验收') {
    return { title: '提交处理结果', submitLabel: '提交验收' };
  }
  return { title: '提交处理结果', submitLabel: '提交处理结果' };
}
