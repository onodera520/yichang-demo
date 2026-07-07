import React from 'react';
import { X } from 'lucide-react';

export default function DetailDrawer({
  open,
  title,
  titleExtra = null,
  children,
  footer = null,
  onClose,
  width = 380,
  topOffset = 0,
  bodyClassName = '',
}) {
  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-screen border-l border-[#E6EAF2] bg-white shadow-[var(--shadow-drawer)] transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width, top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
      aria-hidden={!open}
    >
      <div className="flex h-[72px] items-center justify-between px-5">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="truncate text-[22px] font-semibold tracking-[-0.01em] text-[#111827]">{title}</h2>
          {titleExtra}
        </div>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[#7889A8] hover:bg-[#F3F6FB]"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className={`overflow-auto px-5 py-3 ${footer ? 'h-[calc(100%-144px)]' : 'h-[calc(100%-72px)]'} ${bodyClassName}`}>
        {children}
      </div>
      {footer ? <div className="h-[72px] border-t border-[#E6EAF2] bg-white px-5 py-3">{footer}</div> : null}
    </aside>
  );
}
