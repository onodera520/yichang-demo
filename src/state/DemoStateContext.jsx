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
import { applyOrderTransactionState, resetOrderRows } from '../pages/orders/orderStateTransaction.js';

const DemoStateContext = createContext(null);

export function DemoStateProvider({ children }) {
  const [orders, setOrders] = useState(mockOrders);
  const [inventory, setInventory] = useState(() =>
    mockInventory.map((item) => ({ ...item, status: item.status || '待处理' })),
  );
  const [tasks, setTasks] = useState(() =>
    mockTasks.map((task) => ({
      ...task,
      processLogs: [...(task.processLogs ?? [])],
    })),
  );
  const [readMessageIds, setReadMessageIds] = useState(() => new Set());
  const [platformConnections, setPlatformConnections] = useState(() =>
    mockSettings.platformConnections.map((connection) => ({ ...connection })),
  );

  const updateOrderStatus = (orderId, status) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const applyOrderTransaction = (transaction) => {
    setOrders((current) => applyOrderTransactionState({ orders: current, tasks: [] }, transaction).orders);
    setTasks((current) => applyOrderTransactionState({ orders: [], tasks: current }, transaction).tasks);
  };

  const resetOrderData = () => {
    setOrders(resetOrderRows(mockOrders));
  };

  const createOrderTask = (order) => {
    const task = buildOrderTask(order);
    setTasks((current) => [task, ...current]);
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: '处理中' } : item)));
    return task;
  };

  const createInventoryTask = (sku, options) => {
    const task = buildInventoryTask(sku, options);
    setTasks((current) => [task, ...current]);
    setInventory((current) => current.map((item) => (item.sku === sku.sku ? { ...item, status: '待补货' } : item)));
    return task;
  };

  const createSuggestionTask = (suggestion, context) => {
    const task = buildSuggestionTask(suggestion, context);
    setTasks((current) => [task, ...current]);

    if (task.sourceKind === 'order') {
      setOrders((current) => current.map((item) => (item.id === task.sourceId ? { ...item, status: '处理中' } : item)));
    }

    if (task.sourceKind === 'inventory') {
      setInventory((current) => current.map((item) => (item.sku === task.sourceId ? { ...item, status: '待补货' } : item)));
    }

    return task;
  };

  const createManualTask = (payload) => {
    const task = buildManualTask(payload);
    setTasks((current) => [task, ...current]);
    return task;
  };

  const updateTasks = (taskIds, updater) => {
    setTasks((current) => updateTasksByIds(current, taskIds, updater));
  };

  const updateTask = (taskId, updater) => {
    updateTasks([taskId], updater);
  };

  const completeTask = (taskId, completionEvidence) => {
    const nextState = completeTaskState({ orders, inventory, tasks }, taskId, completionEvidence);
    setOrders(nextState.orders);
    setInventory(nextState.inventory);
    setTasks(nextState.tasks);
    return nextState.tasks.find((task) => task.id === taskId) ?? null;
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
      readMessageIds,
      platformConnections,
      updateOrderStatus,
      applyOrderTransaction,
      resetOrderData,
      createOrderTask,
      createInventoryTask,
      createSuggestionTask,
      createManualTask,
      updateTask,
      updateTasks,
      completeTask,
      markMessageRead,
      markAllMessagesRead,
      reconnectPlatform,
    }),
    [orders, inventory, tasks, readMessageIds, platformConnections],
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
