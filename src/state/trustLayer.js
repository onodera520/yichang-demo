export function calculateAvailableDays(item) {
  const planning = item.inventoryPlanning ?? {};
  const dailySales = Number(item.dailySales || 0);
  if (dailySales <= 0) return 0;

  const currentStock = Number(item.currentStock || 0);
  const effectiveTransitStock = Number(planning.effectiveTransitStock ?? item.inTransitStock ?? 0);
  const safetyStock = Number(planning.safetyStock || 0);
  return Math.max(0, Math.round(((currentStock + effectiveTransitStock - safetyStock) / dailySales) * 10) / 10);
}

export function calculateSuggestedReplenishment(item) {
  const planning = item.inventoryPlanning ?? {};
  const dailySales = Number(item.dailySales || 0);
  if (dailySales <= 0) return 0;

  const currentStock = Number(item.currentStock || 0);
  const effectiveTransitStock = Number(planning.effectiveTransitStock ?? item.inTransitStock ?? 0);
  const safetyStock = Number(planning.safetyStock || 0);
  const targetDays = Number(planning.targetDays || 0);
  const packSize = Math.max(1, Number(planning.packSize || 1));
  const requiredQuantity = dailySales * targetDays + safetyStock - currentStock - effectiveTransitStock;

  return Math.ceil(Math.max(0, requiredQuantity) / packSize) * packSize;
}

export function getReplenishmentQuantity(item, fallback = 300) {
  return Number(item.suggestedReplenishment ?? fallback);
}

export function getVisibleAiRisks(evidence, connection) {
  const risks = evidence?.risks ?? [];
  if (!connection || connection.isStale) return risks;
  return risks.filter((risk) => !/(停止同步|数据已过期)/.test(risk));
}

export function hasTaskSource(task, orders, inventory) {
  if (!task?.sourceKind) return true;
  if (task.sourceKind === 'order') return orders.some((order) => order.id === task.sourceId);
  if (task.sourceKind === 'inventory') return inventory.some((item) => item.sku === task.sourceId);
  return false;
}

export function calculateDataCompleteness(connections) {
  const included = connections.filter(
    (connection) => connection.includeInCompleteness !== false && Number.isFinite(connection.dataCompleteness),
  );
  if (included.length === 0) return 100;

  const total = included.reduce((sum, connection) => sum + connection.dataCompleteness, 0);
  return Math.round(total / included.length);
}

export function requiresStaleDataConfirmation(source, connections) {
  if (!source?.platform) return false;
  const connection = connections.find((item) => item.platform === source.platform);
  return Boolean(connection && (connection.isStale || connection.status === '已断开'));
}

export function reconnectPlatformConnections(connections, platform, lastSync = '刚刚') {
  return connections.map((connection) =>
    connection.platform === platform
      ? {
          ...connection,
          status: '已连接',
          isStale: false,
          lastSync,
          lastSuccessfulSync: lastSync,
          dataCompleteness: 100,
          description: `最后同步：${lastSync}`,
        }
      : connection,
  );
}

export function validateCompletionEvidence(evidence) {
  const errors = {};
  if (!evidence.result?.trim()) errors.result = '请填写处理结果';
  if (!evidence.description?.trim()) errors.description = '请填写执行说明';
  if (typeof evidence.resolvedSource !== 'boolean') {
    errors.resolvedSource = '请选择是否解决原异常';
  }
  return errors;
}

export function buildCompletionPatch(task, evidence) {
  const referenceText = evidence.referenceNo ? `，关联单号 ${evidence.referenceNo}` : '';
  return {
    status: '已完成',
    remainingSLA: '-',
    completionEvidence: evidence,
    processLogs: [
      ...(task.processLogs || []),
      {
        time: '刚刚',
        owner: task.owner || '系统',
        action: '完成任务',
        detail: `${evidence.result}：${evidence.description}${referenceText}`,
        tone: 'green',
      },
    ],
  };
}
