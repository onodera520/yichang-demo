import React from 'react';
import {
  Activity,
  BarChart3,
  ClipboardList,
  Gauge,
  PackageSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import exceptionHubArt from '../assets/sidebar/exception-hub-art.png';
import { getSidebarLayout } from '../layouts/sidebarLayout.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { formatTaskTabNoticeCount } from '../state/taskTabNotices.js';

const navItems = [
  { label: '异常工作台', path: '/dashboard', icon: Gauge },
  { label: '订单异常', path: '/orders', icon: ShoppingCart },
  { label: '库存决策', path: '/inventory', icon: PackageSearch },
  { label: '任务协同', path: '/tasks', icon: ClipboardList },
  { label: '数据复盘', path: '/analytics', icon: BarChart3 },
  { label: '系统设置', path: '/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { taskTabNotices } = useDemoState();
  const layout = getSidebarLayout(collapsed);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;
  const assignedNoticeCount = taskTabNotices['已分派']?.length ?? 0;

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-screen shrink-0 flex-col overflow-hidden border-r border-[#E6EAF2] bg-white transition-[width] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
      data-collapsed={collapsed}
      style={{ width: layout.sidebarWidth }}
    >
      <div
        className={`flex h-[72px] shrink-0 items-center justify-start transition-[padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          collapsed ? 'pl-[18px] pr-0' : 'px-5'
        }`}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#2F7BFF] text-white shadow-[0_10px_20px_rgba(47,123,255,0.22)]">
          <Activity className="h-5 w-5" />
        </div>
        <div
          aria-hidden={collapsed}
          className={`overflow-hidden whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em] text-[#2F7BFF] transition-[max-width,margin,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
            collapsed
              ? 'ml-0 max-w-0 -translate-x-2 opacity-0'
              : 'ml-2.5 max-w-[116px] translate-x-0 opacity-100'
          }`}
        >
          异常中枢
        </div>
      </div>

      <nav
        aria-label="主导航"
        className={`flex-1 space-y-2 pt-8 transition-[padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          collapsed ? 'px-2' : 'px-3'
        }`}
      >
        {navItems.map((item) => {
          const noticeCount = item.path === '/tasks' ? assignedNoticeCount : 0;
          return (
            <NavLink
              aria-label={item.label}
              key={item.path}
              state={noticeCount ? { noticeTab: '已分派' } : undefined}
              title={collapsed ? item.label : undefined}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex h-11 items-center justify-start overflow-hidden rounded-[8px] text-[15px] font-semibold transition-[padding,background-color,color,box-shadow] duration-200 motion-reduce:transition-none',
                  'relative',
                  collapsed ? 'pl-[18px] pr-0' : 'px-4',
                  isActive
                    ? 'bg-[#2F7BFF] text-white shadow-[0_10px_20px_rgba(47,123,255,0.23)]'
                    : 'text-[#8A98B3] hover:bg-[#F3F7FD] hover:text-[#5F6B7A]',
                ].join(' ')
              }
            >
              <item.icon
                className={`h-5 w-5 shrink-0 stroke-[2.1] transition-[margin] duration-200 motion-reduce:transition-none ${
                  collapsed ? 'mr-0' : 'mr-3'
                }`}
              />
              <span
                aria-hidden={collapsed}
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
                  collapsed
                    ? 'max-w-0 -translate-x-1.5 opacity-0'
                    : 'max-w-[96px] translate-x-0 opacity-100'
                }`}
              >
                {item.label}
              </span>
              {noticeCount ? (
                <span
                  aria-hidden="true"
                  className={`sidebar-task-notice-badge absolute z-10 h-[18px] min-w-[18px] rounded-full bg-[#FF2D2D] px-1 text-center text-[11px] font-semibold leading-[18px] text-white shadow-[0_2px_5px_rgba(255,45,45,0.28)] ${
                    collapsed ? 'left-[34px] top-[4px]' : 'right-3 top-[5px]'
                  }`}
                >
                  {formatTaskTabNoticeCount(noticeCount)}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div
        className={`relative shrink-0 overflow-hidden pb-4 transition-[padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          collapsed ? 'px-2 pt-0' : 'px-3 pt-[168px]'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-6 h-[292px] overflow-hidden transition-opacity duration-200 motion-reduce:transition-none ${
            collapsed ? 'invisible opacity-0' : 'visible opacity-100'
          }`}
        >
          <img
            src={exceptionHubArt}
            alt=""
            className="h-full w-full scale-[1.15] object-cover opacity-40 [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_72%,transparent_100%)]"
          />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div
          className={`relative z-10 transition-[padding] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            collapsed ? 'px-0 py-0' : 'px-3 py-1.5'
          }`}
        >
          <div
            aria-hidden={collapsed}
            className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out motion-reduce:transition-none ${
              collapsed
                ? 'max-h-0 translate-y-2 opacity-0'
                : 'max-h-[52px] translate-y-0 opacity-100'
            }`}
          >
            <div className="flex items-center gap-2 whitespace-nowrap text-xs font-medium text-[#1D273B]">
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#24C26A]" />
              系统正常运行
            </div>
            <div className="mt-2 whitespace-nowrap text-xs text-[#A1ADC2]">版本 v2.4.1</div>
          </div>
          <button
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
            className={`flex w-full items-center justify-center overflow-hidden rounded-[8px] bg-white/60 text-xs text-[#7889A8] backdrop-blur-sm transition-[height,margin,background-color,color] duration-200 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9EC1FF] focus-visible:ring-offset-1 motion-reduce:transition-none ${
              collapsed ? 'mt-0 h-10' : 'mt-3 h-8 gap-1.5'
            }`}
            onClick={onToggle}
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            type="button"
          >
            <ToggleIcon className="h-4 w-4 shrink-0" />
            <span
              aria-hidden={collapsed}
              className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-150 motion-reduce:transition-none ${
                collapsed ? 'max-w-0 opacity-0' : 'max-w-[36px] opacity-100'
              }`}
            >
              收起
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
