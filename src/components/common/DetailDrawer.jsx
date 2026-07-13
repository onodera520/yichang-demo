import React, { useEffect, useRef } from 'react';
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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <>
      <div
        aria-hidden="true"
        className={`detail-drawer-backdrop fixed inset-0 z-[35] bg-transparent transition-opacity duration-200 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        aria-hidden={!open}
        aria-label={title}
        aria-modal={open ? 'true' : undefined}
        className={`fixed right-0 top-0 z-40 h-screen border-l border-[#E6EAF2] bg-white shadow-[var(--shadow-drawer)] transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        style={{ width, top: topOffset, height: `calc(100vh - ${topOffset}px)` }}
      >
        <div className="flex h-[72px] items-center justify-between px-5">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-[22px] font-semibold tracking-[-0.01em] text-[#111827]">{title}</h2>
            {titleExtra}
          </div>
          <button
            aria-label="关闭详情抽屉"
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
    </>
  );
}
