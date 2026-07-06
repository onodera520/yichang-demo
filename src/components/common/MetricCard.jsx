import React from 'react';
import { ArrowRight } from 'lucide-react';

const defaultTrend = [18, 28, 22, 36, 30, 46, 42, 58];

function Sparkline({ points = defaultTrend, tone = '#2F7BFF' }) {
  const width = 168;
  const height = 48;
  const padding = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (width - padding * 2) / (points.length - 1 || 1);
  const pathPoints = points.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });
  const line = pathPoints.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${line} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
  const gradientId = `metric-gradient-${String(tone).replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg className="h-12 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="趋势折线">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.2" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={tone} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </svg>
  );
}

export default function MetricCard({
  title,
  value,
  change,
  detailLabel = '查看详情',
  onDetail,
  trend = defaultTrend,
  tone = '#2F7BFF',
  icon,
}) {
  return (
    <article className="panel overflow-hidden p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[13px] font-medium text-[#7889A8]">{title}</div>
          <div className="mt-2 text-[28px] font-semibold leading-none text-[#1D273B]">{value}</div>
          <div className="mt-2 text-xs text-[#8A98B3]">{change}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#F1F6FF]">
          {icon ?? <span className="h-5 w-5 rounded bg-[#D7E6FF]" />}
        </div>
      </div>

      <div className="mt-3">
        <Sparkline points={trend} tone={tone} />
      </div>

      <button
        className="mt-2 flex items-center gap-1 text-xs font-medium text-[#2F7BFF]"
        onClick={onDetail}
        type="button"
      >
        {detailLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
