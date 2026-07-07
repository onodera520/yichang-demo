import React from 'react';
import { Bell, ChevronRight, CircleHelp, Search } from 'lucide-react';

function TopbarSelect({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[14px] font-medium text-[#1D273B]">{label}：</span>
      <button className="flex h-9 min-w-[116px] items-center justify-between rounded-[6px] border border-[#D7DEE9] bg-white px-3 text-[14px] font-medium text-[#263246] shadow-[0_1px_2px_rgba(28,39,71,0.03)]">
        {value}
        <ChevronRight className="h-4 w-4 text-[#1D273B]" />
      </button>
    </div>
  );
}

export default function Topbar() {
  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center border-b border-[#E5EAF2] bg-white px-7 shadow-[0_2px_10px_rgba(16,24,40,0.055)]">
      <div className="flex items-center gap-7">
        <TopbarSelect label="平台" value="全部平台" />
        <TopbarSelect label="店铺" value="全部店铺" />
      </div>

      <div className="mx-auto w-[460px]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8A98B3]" />
          <input
            className="h-10 w-full rounded-[8px] border border-[#E1E6EF] bg-[#FAFBFD] pl-5 pr-11 text-[14px] outline-none transition placeholder:text-[#B3BDCC] focus:border-[#2F7BFF] focus:bg-white"
            placeholder="搜索订单号/SKU/异常类型/任务"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#5F6B7A] hover:bg-[#F3F7FD]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF2D2D] px-1 text-[10px] font-semibold leading-none text-white">
            7
          </span>
        </button>
        <button className="flex h-9 w-9 items-center justify-center rounded-full text-[#5F6B7A] hover:bg-[#F3F7FD]">
          <CircleHelp className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C7D9FF] via-[#7DA9FF] to-[#2F7BFF] text-sm font-semibold text-white shadow-[0_4px_12px_rgba(47,123,255,0.24)]">
            张
          </div>
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
