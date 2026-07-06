import React from 'react';
import { Bell, ChevronDown, CircleHelp, Search } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="flex h-16 items-center border-b border-[#E6EAF2] bg-white px-5 shadow-[0_1px_8px_rgba(16,24,40,0.04)]">
      <div className="flex items-center gap-3">
        {['平台：全部平台', '店铺：全部店铺'].map((label) => (
          <button
            key={label}
            className="flex h-9 min-w-[138px] items-center justify-between rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#344767]"
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5 text-[#8A98B3]" />
          </button>
        ))}
      </div>

      <div className="mx-auto w-[500px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A98B3]" />
          <input
            className="h-9 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFD] pl-9 pr-3 text-[13px] outline-none transition placeholder:text-[#A1ADC2] focus:border-[#2F7BFF] focus:bg-white"
            placeholder="搜索订单号、SKU、任务或店铺"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white">
          <Bell className="h-4 w-4 text-[#7889A8]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#FF4D4F] ring-2 ring-white" />
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8F0] bg-white">
          <CircleHelp className="h-4 w-4 text-[#7889A8]" />
        </button>
        <div className="flex items-center gap-2.5 pl-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2F7BFF] to-[#78A8FF] text-sm font-semibold text-white">
            张
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#1D273B]">张晓</div>
            <div className="mt-0.5 text-[11px] text-[#8A98B3]">运营主管</div>
          </div>
        </div>
      </div>
    </header>
  );
}
