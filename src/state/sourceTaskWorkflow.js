const UNASSIGNED_OWNER = '未分派';
const TERMINAL_SOURCE_STATUSES = new Set(['已完成', '已驳回']);

function getSourceId(source, sourceKind) {
  return sourceKind === 'inventory' ? source?.sku : source?.id;
}

export function isAssignedOwner(owner) {
  return Boolean(owner && owner !== UNASSIGNED_OWNER);
}

export function adoptSourceSuggestion(source, patch = {}) {
  return { ...source, ...patch, status: '待分派', owner: UNASSIGNED_OWNER };
}

export function saveSourceAdjustment(source, patch = {}) {
  return { ...source, ...patch, status: '待分派' };
}

export function assignSourceOwner(source, owner) {
  if (source?.status !== '待分派') throw new Error('请先采纳或保存 AI 建议');
  if (!isAssignedOwner(owner)) throw new Error('请选择负责人');
  return { ...source, owner };
}

export function findActiveSourceTask(source, tasks = [], sourceKind = 'order') {
  const sourceId = getSourceId(source, sourceKind);
  return tasks.find((task) => (
    task.sourceKind === sourceKind
    && task.sourceId === sourceId
    && task.status !== '已完成'
  ));
}

export function getSourceTaskBlockReason(source, tasks = [], sourceKind = 'order') {
  if (!source) return '未找到异常记录';
  if (TERMINAL_SOURCE_STATUSES.has(source.status)) return `当前状态为${source.status}，不可生成任务`;
  if (sourceKind === 'inventory' && source.status === '待处理') return '请先保存修改采购数量';
  if (sourceKind === 'order' && source.status === '待处理') return '请先采纳 AI 建议';
  if (!isAssignedOwner(source.owner)) return '请先分派负责人';
  if (findActiveSourceTask(source, tasks, sourceKind)) return '已存在进行中的关联任务';
  return '';
}
