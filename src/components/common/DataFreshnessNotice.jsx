import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function DataFreshnessNotice({ connection, className = '', compact = false }) {
  if (!connection?.isStale) return null;

  return (
    <div
      className={`flex items-start gap-2 rounded-[8px] border border-[#FFD8A8] bg-[#FFF8EC] text-[#8A5300] ${
        compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-[13px]'
      } ${className}`}
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F79009]" />
      <div className="min-w-0 leading-5">
        <span className="font-semibold">{connection.platform} 数据已停止同步</span>
        <span className="ml-1 text-[#9A6700]">
          最后成功同步：{connection.lastSuccessfulSync || '未知'}，当前缓存数据仅供参考。
        </span>
      </div>
    </div>
  );
}
