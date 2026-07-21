import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { getSidebarLayout } from './sidebarLayout.js';

export default function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const layout = getSidebarLayout(isSidebarCollapsed);

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed((collapsed) => !collapsed);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar collapsed={isSidebarCollapsed} onToggle={handleSidebarToggle} />
      <div
        className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden transition-[margin-left] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ marginLeft: layout.contentOffset }}
      >
        <Topbar />
        <main className="min-h-0 flex-1 overflow-auto bg-surface px-5 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
