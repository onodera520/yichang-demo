export function canRemindTask(task) {
  return ['已分派', '处理中', '已超时'].includes(task?.status);
}

export function getTaskDetailActionPolicy(task) {
  if (task?.status === '已分派') {
    return {
      canChangeOwner: true,
      canTransfer: true,
      transferLabel: '转交',
      canUpgrade: false,
      primaryAction: 'remind',
      primaryLabel: '提醒接单',
      primaryDisabled: false,
    };
  }

  if (canRemindTask(task)) {
    return {
      canChangeOwner: true,
      canTransfer: true,
      transferLabel: '转交',
      canUpgrade: true,
      primaryAction: 'remind',
      primaryLabel: '催办',
      primaryDisabled: false,
    };
  }

  if (task?.status === '待验收') {
    return {
      canChangeOwner: false,
      canTransfer: false,
      transferLabel: '转交',
      canUpgrade: false,
      primaryAction: 'accept',
      primaryLabel: '验收通过',
      primaryDisabled: false,
    };
  }

  if (task?.status === '已升级') {
    return {
      canChangeOwner: false,
      canTransfer: true,
      transferLabel: '重新分派',
      canUpgrade: false,
      primaryAction: null,
      primaryLabel: null,
      primaryDisabled: false,
    };
  }

  if (task?.status === '已完成') {
    return {
      canChangeOwner: false,
      canTransfer: false,
      transferLabel: '转交',
      canUpgrade: false,
      primaryAction: null,
      primaryLabel: null,
      primaryDisabled: false,
    };
  }

  return {
    canChangeOwner: true,
    canTransfer: true,
    transferLabel: '转交',
    canUpgrade: false,
    primaryAction: null,
    primaryLabel: null,
    primaryDisabled: false,
  };
}
