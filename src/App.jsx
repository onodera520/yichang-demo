import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/common/index.js';
import AppLayout from './layouts/AppLayout.jsx';
import Analytics from './pages/Analytics.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import Settings from './pages/Settings.jsx';
import Tasks from './pages/Tasks.jsx';
import { DemoStateProvider } from './state/DemoStateContext.jsx';
import { TopbarFilterProvider } from './state/TopbarFilterContext.jsx';

export default function App() {
  return (
    <ToastProvider>
      <DemoStateProvider>
        <TopbarFilterProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </TopbarFilterProvider>
      </DemoStateProvider>
    </ToastProvider>
  );
}
