import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  inventory as mockInventory,
  orders as mockOrders,
  settings as mockSettings,
  tasks as mockTasks,
} from '../data/mockData.js';
import { buildInventoryTask, buildManualTask, buildOrderTask, buildSuggestionTask, completeTaskState } from './demoFlow.js';
import { reconnectPlatformConnections } from './trustLayer.js';
import { updateTasksByIds } from './taskOperations.js';
import { reopenTaskState, returnTaskState } from './taskReturn.js';
import {
  clearTaskTabNotice as clearTaskTabNoticeState,
  createTaskTabNotices,
  reconcileTaskTabNotices,
} from './taskTabNotices.js';
import { applyOrderTransactionState, resetOrderRows } from '../pages/orders/orderStateTransaction.js';
import {
  adoptSourceSuggestion,
  assignSourceOwner,
  getSourceTaskBlockReason,
} from './sourceTaskWorkflow.js';
import { normalizeOrderAssignmentState } from './orderAssignment.js';

const DemoStateContext = createContext(null);

function createInitialTaskState() {
  return {
    rows: mockTasks.map((task) => ({
      ...task,
      processLogs: [...(task.processLogs ?? [])],
    })),
    notices: createTaskTabNotices(),
  };
}

function commitTaskRows(current, nextRows) {
  return {
    rows: nextRows,
    notices: reconcileTaskTabNotices(current.notices, current.rows, nextRows),
  };
}

export function DemoStateProvider({ children }) {
  const [orders, setOrders] = useState(mockOrders);
  const [inventory, setInventory] = useState(() =>
    mockInventory.map((item) => ({ ...item, status: item.status || '待处理' })),
  );
  const [taskState, setTaskState] = useState(createInitialTaskState);
  const [readMessageIds, setReadMessageIds] = useState(() => new Set());
  const [platformConnections, setPlatformConnections] = useState(() =>
    mockSettings.platformConnections.map((connection) => ({ ...connection })),
  );
  const tasks = taskState.rows;
  const taskTabNotices = taskState.notices;

  const updateOrderStatus = (orderId, status) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId ? normalizeOrderAssignmentState({ ...order, status }) : order
    )));
  };

  const adoptOrderSuggestion = (orderId) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId ? adoptSourceSuggestion(order) : order
    )));
  };

  const adoptInventorySuggestion = (sku, patch = {}) => {
    setInventory((current) => current.map((item) => (
      item.sku === sku ? adoptSourceSuggestion(item, patch) : item
    )));
  };

  const assignOrderOwner = (orderId, owner) => {
    setOrders((current) => current.map((order) => (
      order.id === orderId
        ? (() => {
            const assigned = assignSourceOwner(order, owner);
            return { ...assigned, detail: { ...assigned.detail, owner } };
          })()
        : order
    )));
  };

  const assignInventoryOwner = (sku, owner) => {
    setInventory((current) => current.map((item) => (
      item.sku === sku
        ? (() => {
            const assigned = assignSourceOwner(item, owner);
            return { ...assigned, detail: { ...assigned.detail, owner } };
          })()
        : item
    )));
  };

  const applyOrderTransaction = (transaction) => {
    setOrders((current) => applyOrderTransactionState({ orders: current, tasks: [] }, transaction).orders);
    setTaskState((current) => {
      const nextRows = applyOrderTransactionState({ orders: [], tasks: current.rows }, transaction).tasks;
      return commitTaskRows(current, nextRows);
    });
  };

  const resetOrderData = () => {
    setOrders(resetOrderRows(mockOrders));
  };

  const createOrderTask = (order) => {
    const currentOrder = orders.find((item) => item.id === order.id) || order;
    const error = getSourceTaskBlockReason(currentOrder, tasks, 'order');
    if (error) return { ok: false, error };
    const task = buildOrderTask(currentOrder);
    setTaskState((current) => commitTaskRows(current, [task, ...current.rows]));
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: '处理中' } : item)));
    return { ok: true, task };
  };

  const createInventoryTask = (sku, options) => {
    const currentSku = inventory.find((item) => item.sku === sku.sku) || sku;
    const error = getSourceTaskBlockReason(currentSku, tasks, 'inventory');
    if (error) return { ok: false, error };
    const task = buildInventoryTask(currentSku, options);
    setTaskState((current) => commitTaskRows(current, [task, ...current.rows]));
    setInventory((current) => current.map((item) => (item.sku === sku.sku ? { ...item, status: '待补货' } : item)));
    return { ok: true, task };
  };

  const createSuggestionTask = (suggestion, context) => {
    const sourceKind = suggestion.sourceKind || context?.sourceKind || 'order';
    const sourceId = suggestion.sourceId || context?.sourceId || suggestion.source;
    const source = sourceKind === 'inventory'
      ? inventory.find((item) => item.sku === sourceId)
      : orders.find((item) => item.id === sourceId);
    const error = getSourceTaskBlockReason(source, tasks, sourceKind);
    if (error) return { ok: false, error };
    const task = buildSuggestionTask({ ...suggestion, owner: source.owner }, context);
    setTaskState((current) => commitTaskRows(current, [task, ...current.rows]));

    if (task.sourceKind === 'order') {
      setOrders((current) => current.map((item) => (item.id === task.sourceId ? { ...item, status: '处理中' } : item)));
    }

    if (task.sourceKind === 'inventory') {
      setInventory((current) => current.map((item) => (item.sku === task.sourceId ? { ...item, status: '待补货' } : item)));
    }

    return { ok: true, task };
  };

  const createManualTask = (payload) => {
    const task = buildManualTask(payload);
    setTaskState((current) => commitTaskRows(current, [task, ...current.rows]));
    return task;
  };

  const updateTasks = (taskIds, updater) => {
    setTaskState((current) => {
      const nextRows = updateTasksByIds(current.rows, taskIds, updater);
      return commitTaskRows(current, nextRows);
    });
  };

  const updateTask = (taskId, updater) => {
    updateTasks([taskId], updater);
  };

  const completeTask = (taskId, completionEvidence) => {
    const nextState = completeTaskState({ orders, inventory, tasks }, taskId, completionEvidence);
    setOrders(nextState.orders);
    setInventory(nextState.inventory);
    setTaskState((current) => commitTaskRows(current, nextState.tasks));
    return nextState.tasks.find((task) => task.id === taskId) ?? null;
  };

  const applyTaskReturn = (transition, taskId, options) => {
    const result = transition({ orders, inventory, tasks }, taskId, options);
    if (!result.ok) return result;

    setOrders(result.state.orders);
    setInventory(result.state.inventory);
    setTaskState((current) => commitTaskRows(current, result.state.tasks));
    return { ok: true, task: result.task };
  };

  const returnTask = (taskId, options) => applyTaskReturn(returnTaskState, taskId, options);
  const reopenTask = (taskId, options) => applyTaskReturn(reopenTaskState, taskId, options);

  const clearTaskTabNotice = (status) => {
    setTaskState((current) => ({
      ...current,
      notices: clearTaskTabNoticeState(current.notices, status),
    }));
  };

  const markMessageRead = (messageId) => {
    setReadMessageIds((current) => new Set([...current, messageId]));
  };

  const markAllMessagesRead = (messageIds) => {
    setReadMessageIds((current) => new Set([...current, ...messageIds]));
  };

  const reconnectPlatform = (platform) => {
    setPlatformConnections((current) => reconnectPlatformConnections(current, platform));
  };

  const value = useMemo(
    () => ({
      orders,
      inventory,
      tasks,
      taskTabNotices,
      readMessageIds,
      platformConnections,
      updateOrderStatus,
      adoptOrderSuggestion,
      adoptInventorySuggestion,
      assignOrderOwner,
      assignInventoryOwner,
      applyOrderTransaction,
      resetOrderData,
      createOrderTask,
      createInventoryTask,
      createSuggestionTask,
      createManualTask,
      updateTask,
      updateTasks,
      completeTask,
      returnTask,
      reopenTask,
      clearTaskTabNotice,
      markMessageRead,
      markAllMessagesRead,
      reconnectPlatform,
    }),
    [orders, inventory, taskState, readMessageIds, platformConnections],
  );

  return <DemoStateContext.Provider value={value}>{children}</DemoStateContext.Provider>;
}

export function useDemoState() {
  const context = useContext(DemoStateContext);
  if (!context) {
    throw new Error('useDemoState must be used within DemoStateProvider');
  }
  return context;
}
