import React from 'react';
import {
  BarChart3,
  ClipboardList,
  Gauge,
  PackageSearch,
  PanelLeftClose,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: '异常工作台', path: '/dashboard', icon: Gauge },
  { label: '订单异常', path: '/orders', icon: ShoppingCart },
  { label: '库存决策', path: '/inventory', icon: PackageSearch },
  { label: '任务协同', path: '/tasks', icon: ClipboardList },
  { label: '数据复盘', path: '/analytics', icon: BarChart3 },
  { label: '系统设置', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-[180px] shrink-0 flex-col border-r border-[#E6EAF2] bg-white">
      <div className="flex h-16 items-center px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2F7BFF] text-sm font-semibold text-white">
          异
        </div>
        <div className="ml-2.5 text-base font-semibold tracking-tight text-[#1D273B]">
          异常中枢
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 px-3 pt-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex h-10 items-center rounded-[10px] px-3 text-[13px] font-medium transition',
                isActive
                  ? 'bg-[#2F7BFF] text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)]'
                  : 'text-[#7889A8] hover:bg-[#F2F6FC] hover:text-[#344767]',
              ].join(' ')
            }
          >
            <item.icon className="mr-2.5 h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="relative mb-3 h-[92px] overflow-hidden rounded-[14px] bg-gradient-to-br from-[#EAF2FF] via-[#F6FAFF] to-[#DCEBFF]">
          <div className="absolute -left-5 bottom-[-18px] h-20 w-20 rounded-full bg-[#8DBBFF]/30" />
          <div className="absolute right-3 top-4 h-9 w-9 rounded-full bg-white/70" />
          <div className="absolute bottom-4 right-5 h-12 w-12 rotate-12 rounded-[18px] bg-[#2F7BFF]/20" />
          <div className="absolute left-4 top-4 text-[11px] font-medium text-[#6F8DB8]">
            Exception Hub
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E6EAF2] bg-[#FAFCFF] px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#1D273B]">
            <span className="h-2 w-2 rounded-full bg-[#24C26A]" />
            系统正常运行
          </div>
          <div className="mt-1.5 text-[11px] text-[#8A98B3]">版本 v2.4.1</div>
          <button className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#E6EAF2] bg-white text-xs text-[#7889A8]">
            <PanelLeftClose className="h-3.5 w-3.5" />
            收起
          </button>
        </div>
      </div>
    </aside>
  );
}
