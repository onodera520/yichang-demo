import React from 'react';
import { X } from 'lucide-react';

export default function DetailDrawer({ open, title, children, onClose, width = 380 }) {
  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-screen bg-white shadow-[var(--shadow-drawer)] transition-transform duration-200 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width }}
      aria-hidden={!open}
    >
      <div className="flex h-16 items-center justify-between border-b border-[#E6EAF2] px-5">
        <h2 className="text-base font-semibold text-[#1D273B]">{title}</h2>
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#E2E8F0] text-[#7889A8]"
          onClick={onClose}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[calc(100vh-64px)] overflow-auto px-5 py-4">{children}</div>
    </aside>
  );
}
