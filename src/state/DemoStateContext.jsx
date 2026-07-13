import React, { createContext, useContext, useMemo, useState } from 'react';
import { inventory as mockInventory, orders as mockOrders, settings as mockSettings } from '../data/mockData.js';
import { buildInventoryTask, buildManualTask, buildOrderTask, buildSuggestionTask, completeTaskState } from './demoFlow.js';
import { reconnectPlatformConnections } from './trustLayer.js';
import { updateTasksByIds } from './taskOperations.js';

const DemoStateContext = createContext(null);

export function DemoStateProvider({ children }) {
  const [orders, setOrders] = useState(mockOrders);
  const [inventory, setInventory] = useState(() =>
    mockInventory.map((item) => ({ ...item, status: item.status || '待处理' })),
  );
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [platformConnections, setPlatformConnections] = useState(() =>
    mockSettings.platformConnections.map((connection) => ({ ...connection })),
  );

  const updateOrderStatus = (orderId, status) => {
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status } : order)));
  };

  const createOrderTask = (order) => {
    const task = buildOrderTask(order);
    setGeneratedTasks((current) => [task, ...current]);
    setOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: '处理中' } : item)));
    return task;
  };

  const createInventoryTask = (sku, options) => {
    const task = buildInventoryTask(sku, options);
    setGeneratedTasks((current) => [task, ...current]);
    setInventory((current) => current.map((item) => (item.sku === sku.sku ? { ...item, status: '待补货' } : item)));
    return task;
  };

  const createSuggestionTask = (suggestion, context) => {
    const task = buildSuggestionTask(suggestion, context);
    setGeneratedTasks((current) => [task, ...current]);

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
    setGeneratedTasks((current) => [task, ...current]);
    return task;
  };

  const updateGeneratedTasks = (taskIds, updater) => {
    setGeneratedTasks((current) => updateTasksByIds(current, taskIds, updater));
  };

  const updateGeneratedTask = (taskId, updater) => {
    updateGeneratedTasks([taskId], updater);
  };

  const completeTask = (taskId, completionEvidence) => {
    const nextState = completeTaskState({ orders, inventory, tasks: generatedTasks }, taskId, completionEvidence);
    setOrders(nextState.orders);
    setInventory(nextState.inventory);
    setGeneratedTasks(nextState.tasks);
    return nextState.tasks.find((task) => task.id === taskId) ?? null;
  };

  const reconnectPlatform = (platform) => {
    setPlatformConnections((current) => reconnectPlatformConnections(current, platform));
  };

  const value = useMemo(
    () => ({
      orders,
      inventory,
      generatedTasks,
      platformConnections,
      updateOrderStatus,
      createOrderTask,
      createInventoryTask,
      createSuggestionTask,
      createManualTask,
      updateGeneratedTask,
      updateGeneratedTasks,
      completeTask,
      reconnectPlatform,
    }),
    [orders, inventory, generatedTasks, platformConnections],
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
