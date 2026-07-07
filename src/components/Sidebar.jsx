import React from 'react';
import {
  Activity,
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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[180px] shrink-0 flex-col border-r border-[#E6EAF2] bg-white">
      <div className="flex h-[72px] items-center px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#2F7BFF] text-white shadow-[0_10px_20px_rgba(47,123,255,0.22)]">
          <Activity className="h-5 w-5" />
        </div>
        <div className="ml-2.5 whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em] text-[#2F7BFF]">
          异常中枢
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 pt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                'flex h-11 items-center rounded-[8px] px-4 text-[15px] font-semibold transition',
                isActive
                  ? 'bg-[#2F7BFF] text-white shadow-[0_10px_20px_rgba(47,123,255,0.23)]'
                  : 'text-[#8A98B3] hover:bg-[#F3F7FD] hover:text-[#5F6B7A]',
              ].join(' ')
            }
          >
            <item.icon className="mr-3 h-5 w-5 stroke-[2.1]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <div className="relative mb-3 h-[126px] overflow-hidden rounded-[16px] bg-gradient-to-b from-[#F8FBFF] via-[#EDF6FF] to-[#F9FCFF]">
          <div className="absolute -left-9 bottom-[-34px] h-28 w-28 rounded-full bg-[#7DB5FF]/18" />
          <div className="absolute bottom-5 right-5 h-14 w-14 rotate-12 rounded-[20px] bg-[#2F7BFF]/14" />
          <div className="absolute right-2 top-4 h-11 w-11 rounded-full bg-white/75" />
          <div className="absolute left-4 top-4 text-xs font-medium text-[#7D98BF]">Exception Hub</div>
        </div>

        <div className="rounded-[12px] border border-[#E6EAF2] bg-[#FAFCFF] px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#1D273B]">
            <span className="h-2 w-2 rounded-full bg-[#24C26A]" />
            系统正常运行
          </div>
          <div className="mt-2 text-xs text-[#A1ADC2]">版本 v2.4.1</div>
          <button className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#E6EAF2] bg-white text-xs text-[#7889A8] hover:border-[#C9D3E1]">
            <PanelLeftClose className="h-3.5 w-3.5" />
            收起
          </button>
        </div>
      </div>
    </aside>
  );
}
