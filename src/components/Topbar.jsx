import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, ChevronRight, CircleHelp, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import zhangXiaoAvatar from '../assets/avatars/zhang-xiao.png';
import FilterSelect from './common/FilterSelect.jsx';
import NotificationPopover from './common/NotificationPopover.jsx';
import { systemMessages } from '../data/mockData.js';
import {
  formatNotificationBadgeCount,
  getNotificationPreview,
  getUnreadMessageCount,
  getVisibleSystemMessages,
} from '../state/dashboardInbox.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { useTopbarFilter } from '../state/TopbarFilterContext.jsx';

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function TopbarSelect({ label, value, allLabel, options, onChange }) {
  return (
    <FilterSelect
      label={`${label}：`}
      value={value}
      options={options}
      placeholder={allLabel}
      onChange={onChange}
      ariaLabel={label}
      className="flex items-center gap-2"
      labelClassName="text-[14px] font-medium text-[#1D273B]"
      controlClassName="h-9 min-w-[116px]"
      triggerClassName="h-9 w-full min-w-[116px] rounded-[6px] px-3 text-[14px] font-medium"
      menuClassName="w-max min-w-[150px]"
      optionClassName="px-3 py-2 text-[14px]"
    />
  );
}

export default function Topbar() {
  const {
    inventory,
    markAllMessagesRead,
    markMessageRead,
    orders,
    platformConnections,
    readMessageIds,
  } = useDemoState();
  const navigate = useNavigate();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRootRef = useRef(null);
  const bellButtonRef = useRef(null);
  const { keyword, platform, setKeyword, setPlatform, setStore, store } = useTopbarFilter();

  const platformOptions = useMemo(
    () => uniqueValues([...orders.map((item) => item.platform), ...inventory.map((item) => item.platform)]),
    [inventory, orders],
  );
  const storeOptions = useMemo(() => uniqueValues(orders.map((item) => item.store)), [orders]);
  const visibleMessages = useMemo(
    () => getVisibleSystemMessages(systemMessages, platformConnections),
    [platformConnections],
  );
  const previewMessages = useMemo(
    () => getNotificationPreview(visibleMessages),
    [visibleMessages],
  );
  const unreadCount = getUnreadMessageCount(visibleMessages, readMessageIds);

  useEffect(() => {
    if (!notificationOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!notificationRootRef.current?.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationOpen(false);
        bellButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationOpen]);

  const navigateToMessageTarget = (message) => {
    markMessageRead(message.id);
    setNotificationOpen(false);
    navigate(message.target.route, { state: message.target.state });
  };

  const viewAllMessages = () => {
    setNotificationOpen(false);
    navigate('/dashboard', { state: { openUtility: 'messages' } });
  };

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center border-b border-[#E5EAF2] bg-white px-7 shadow-[0_2px_10px_rgba(16,24,40,0.055)]">
      <div className="flex items-center gap-7">
        <TopbarSelect label="平台" value={platform} allLabel="全部平台" options={platformOptions} onChange={setPlatform} />
        <TopbarSelect label="店铺" value={store} allLabel="全部店铺" options={storeOptions} onChange={setStore} />
      </div>

      <div className="mx-auto w-[460px]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A98B3]" />
          <input
            className="h-10 w-full rounded-[8px] border border-[#E1E6EF] bg-[#FAFBFD] pl-5 pr-11 text-[14px] outline-none transition placeholder:text-[#B3BDCC] focus:border-[#2F7BFF] focus:bg-white"
            placeholder="搜索订单号、SKU、异常类型、任务"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative" ref={notificationRootRef}>
          <button
            aria-expanded={notificationOpen}
            aria-haspopup="dialog"
            aria-label={`消息通知，${unreadCount} 条未读`}
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#5F6B7A] hover:bg-[#F3F7FD]"
            onClick={() => setNotificationOpen((open) => !open)}
            ref={bellButtonRef}
            type="button"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2D2D] px-1 text-[10px] font-semibold leading-none text-white">
                {formatNotificationBadgeCount(unreadCount)}
              </span>
            ) : null}
          </button>

          {notificationOpen ? (
            <NotificationPopover
              messages={previewMessages}
              onMarkAllRead={() => markAllMessagesRead(visibleMessages.map((message) => message.id))}
              onMarkRead={markMessageRead}
              onNavigateTarget={navigateToMessageTarget}
              onViewAll={viewAllMessages}
              readMessageIds={readMessageIds}
              unreadCount={unreadCount}
            />
          ) : null}
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#5F6B7A] hover:bg-[#F3F7FD]" type="button">
          <CircleHelp className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <img
            src={zhangXiaoAvatar}
            alt="张晓"
            className="h-9 w-9 rounded-full border border-[#D7E3F8] object-cover shadow-[0_4px_12px_rgba(47,123,255,0.24)]"
          />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-[#111827]">张晓</div>
            <div className="mt-0.5 text-xs text-[#5F6B7A]">运营主管</div>
          </div>
          <ChevronRight className="h-4 w-4 text-[#1D273B]" />
        </div>
      </div>
    </header>
  );
}
