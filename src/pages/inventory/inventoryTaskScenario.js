const KNOWN_WAREHOUSES = ['LA', 'NJ', 'TX', 'UK', 'DE', 'JP', 'CA', 'US'];

function normalizeWarehouse(value) {
  return String(value ?? '').trim().replace(/仓$/, '').toUpperCase();
}

function positiveNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function parseTransferRoute(suggestion) {
  const text = String(suggestion ?? '');
  const fullRoute = text.match(/从\s*([A-Z0-9-]+)\s*仓.*?(?:调拨)?至\s*([A-Z0-9-]+)\s*仓/i);
  if (fullRoute) {
    return {
      fromWarehouse: normalizeWarehouse(fullRoute[1]),
      toWarehouse: normalizeWarehouse(fullRoute[2]),
    };
  }

  const destination = text.match(/调拨至\s*([A-Z0-9-]+)\s*仓/i);
  return {
    fromWarehouse: '',
    toWarehouse: normalizeWarehouse(destination?.[1]),
  };
}

function differentWarehouse(warehouse) {
  return KNOWN_WAREHOUSES.find((item) => item !== warehouse) ?? '';
}

function resolveTransferRoute(sku, options) {
  const parsed = parseTransferRoute(sku.aiSuggestion);
  const currentWarehouse = normalizeWarehouse(sku.warehouse);
  const hasExplicitFrom = Boolean(options.fromWarehouse);
  const hasExplicitTo = Boolean(options.toWarehouse);
  let fromWarehouse = normalizeWarehouse(
    options.fromWarehouse || sku.transferFromWarehouse || parsed.fromWarehouse || currentWarehouse,
  );
  let toWarehouse = normalizeWarehouse(
    options.toWarehouse || sku.transferToWarehouse || parsed.toWarehouse || differentWarehouse(fromWarehouse),
  );

  if (fromWarehouse === toWarehouse && !(hasExplicitFrom && hasExplicitTo)) {
    if (toWarehouse === currentWarehouse) fromWarehouse = differentWarehouse(toWarehouse);
    else toWarehouse = differentWarehouse(fromWarehouse);
  }

  return { fromWarehouse, toWarehouse };
}

function defaultTransferQuantity(sku) {
  const configured = positiveNumber(sku.adjustedQuantity ?? sku.suggestedTransferQuantity, 0);
  if (configured > 0) return configured;
  const demand = Math.ceil(positiveNumber(sku.dailySales, 1) * 14);
  const stock = Math.floor(positiveNumber(sku.currentStock, demand));
  return Math.max(1, Math.min(stock, demand));
}

export function getInventoryTaskKind(riskLevel) {
  if (riskLevel === '滞销') return 'clearance';
  if (riskLevel === '调拨') return 'transfer';
  return 'replenishment';
}

export function resolveInventoryTaskScenario(sku, options = {}) {
  const kind = getInventoryTaskKind(sku?.riskLevel);
  const confidence = Math.round((sku?.confidence || 0.8) * 100);

  if (kind === 'clearance') {
    return {
      kind,
      quantity: 0,
      taskLabel: '清库存任务',
      createButtonLabel: '创建清库存任务',
      createdMessage: '清库存任务已创建',
      sourceStatus: '待清库存',
      suggestionTitle: 'AI清库存建议',
      title: `清理 ${sku.sku} 滞销库存`,
      description: sku.aiSuggestion || `${sku.productName} 需要执行清库存方案。`,
      impact: `建议停止补货并执行清库存方案，置信度 ${confidence}%`,
      logAction: '创建清库存任务',
      confirmationTitle: '确认创建清库存任务',
      confirmationDescription: `即将为 ${sku.sku} 创建清库存协同任务。`,
      validationError: '',
    };
  }

  if (kind === 'transfer') {
    const { fromWarehouse, toWarehouse } = resolveTransferRoute(sku, options);
    const quantity = positiveNumber(options.quantity, defaultTransferQuantity(sku));
    const errors = [];
    if (quantity <= 0) errors.push('调拨数量必须大于 0');
    if (!fromWarehouse || !toWarehouse) errors.push('请选择调出仓和调入仓');
    if (fromWarehouse && fromWarehouse === toWarehouse) errors.push('调出仓和调入仓不能相同');

    return {
      kind,
      quantity,
      fromWarehouse,
      toWarehouse,
      taskLabel: '调拨任务',
      createButtonLabel: '创建调拨任务',
      createdMessage: '调拨任务已创建',
      sourceStatus: '待调拨',
      suggestionTitle: 'AI调拨建议',
      title: `从 ${fromWarehouse} 仓调拨 ${quantity} 件至 ${toWarehouse} 仓`,
      description: sku.aiSuggestion || `${sku.productName} 需要执行库存调拨。`,
      impact: `建议调拨 ${quantity} 件，置信度 ${confidence}%`,
      logAction: '创建调拨任务',
      confirmationTitle: '确认创建调拨任务',
      confirmationDescription: `即将为 ${sku.sku} 创建从 ${fromWarehouse} 仓调拨 ${quantity} 件至 ${toWarehouse} 仓的协同任务。`,
      validationError: errors.join('；'),
    };
  }

  const suggestedQuantity = sku.suggestedReplenishment === undefined
    ? 120
    : positiveNumber(sku.suggestedReplenishment, 0);
  const quantity = options.quantity === undefined
    ? suggestedQuantity
    : positiveNumber(options.quantity, 0);
  return {
    kind,
    quantity,
    toWarehouse: normalizeWarehouse(sku.warehouse),
    taskLabel: '补货任务',
    createButtonLabel: '创建补货任务',
    createdMessage: '补货任务已创建',
    sourceStatus: '待补货',
    suggestionTitle: 'AI补货建议',
    title: `补货 ${quantity} 件至 ${sku.warehouse} 仓`,
    description: sku.aiSuggestion || `${sku.productName} 需要创建补货任务。`,
    impact: `建议补货 ${quantity} 件，置信度 ${confidence}%`,
    logAction: '创建补货任务',
    confirmationTitle: '确认创建补货任务',
    confirmationDescription: `即将为 ${sku.sku} 创建补货 ${quantity} 件的协同任务。`,
    validationError: quantity > 0 ? '' : '补货数量必须大于 0',
  };
}
