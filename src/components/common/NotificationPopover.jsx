import React, { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { getUnreadMessageCount } from '../../state/dashboardInbox.js';

export default function NotificationPopover({
  messages,
  readMessageIds,
  onMarkRead,
  onMarkAllRead,
  onNavigateTarget,
  onViewAll,
}) {
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const unreadCount = getUnreadMessageCount(messages, readMessageIds);

  const toggleMessage = (message) => {
    onMarkRead(message.id);
    setExpandedMessageId((current) => (
      current === message.id ? null : message.id
    ));
  };

  return (
    <section
      aria-label="消息通知"
      className="absolute right-0 top-[44px] z-50 w-[380px] overflow-hidden rounded-[10px] border border-[#E3E9F3] bg-white shadow-[0_16px_40px_rgba(16,24,40,0.18)]"
      role="dialog"
    >
      <header className="flex h-14 items-center justify-between border-b border-[#E9EDF4] px-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#1D273B]">消息通知</h2>
          <p className="mt-0.5 text-xs text-[#8A98B3]">{unreadCount} 条未读</p>
        </div>
        <button
          className="inline-flex items-center gap-1 text-xs font-medium text-[#2F7BFF] disabled:cursor-not-allowed disabled:text-[#AAB4C5]"
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
          type="button"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          全部已读
        </button>
      </header>

      <div className="max-h-[520px] overflow-y-auto p-2">
        {messages.map((message) => {
          const unread = !readMessageIds.has(message.id);
          const expanded = expandedMessageId === message.id;

          return (
            <article
              className={`mb-1 rounded-[8px] border transition-colors ${
                unread
                  ? 'border-[#CFE0FF] bg-[#F5F9FF]'
                  : 'border-transparent bg-white'
              }`}
              key={message.id}
            >
              <button
                aria-expanded={expanded}
                className="flex w-full items-start gap-3 px-3 py-3 text-left"
                onClick={() => toggleMessage(message)}
                type="button"
              >
                <span
                  aria-label={unread ? '未读' : '已读'}
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    unread ? 'bg-[#2F7BFF]' : 'bg-[#D7DEE9]'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-5 text-[#1D273B]">
                    {message.content}
                  </span>
                  <span className="mt-1 block text-xs text-[#8A98B3]">
                    {message.category} · {message.time}
                  </span>
                  {expanded ? (
                    <span className="mt-2 block text-xs leading-5 text-[#5F6B7A]">
                      {message.detail}
                    </span>
                  ) : null}
                </span>
              </button>

              {message.target ? (
                <div className="flex justify-end px-3 pb-3">
                  <button
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2F7BFF] hover:text-[#195FD1]"
                    onClick={() => onNavigateTarget(message)}
                    type="button"
                  >
                    去处理
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}

        {messages.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#8A98B3]">暂无消息</div>
        ) : null}
      </div>

      <button
        className="h-11 w-full border-t border-[#E9EDF4] text-sm font-medium text-[#2F7BFF] transition hover:bg-[#F7FAFF]"
        onClick={onViewAll}
        type="button"
      >
        查看全部消息
      </button>
    </section>
  );
}
