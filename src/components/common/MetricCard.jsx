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
    <svg className="h-10 w-full" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="趋势折线">
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
    <article className="panel relative h-[150px] overflow-hidden px-6 py-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[16px] font-semibold text-[#1D273B]">{title}</div>
          <div className="mt-3 text-[30px] font-semibold leading-none text-black">{value}</div>
          <div className="mt-3 text-sm text-[#5F6B7A]">{change}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#EAF2FF] to-[#CFE1FF] text-[#2F7BFF] shadow-[0_8px_16px_rgba(47,123,255,0.16)]">
          {icon ?? <span className="h-5 w-5 rounded bg-[#D7E6FF]" />}
        </div>
      </div>

      <div className="absolute bottom-3 left-6 right-6">
        <Sparkline points={trend} tone={tone} />
      </div>

      <button
        className="absolute right-6 top-[78px] flex items-center gap-1 text-sm font-medium text-[#2F7BFF]"
        onClick={onDetail}
        type="button"
      >
        {detailLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </article>
  );
}
