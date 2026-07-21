import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const ENTRANCE_DURATION = 650;

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.('change', updatePreference);
    return () => mediaQuery.removeEventListener?.('change', updatePreference);
  }, []);

  return reducedMotion;
}

function SparklineTooltip({ active, payload, formatValue }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[6px] border border-[#DCE4F0] bg-white px-2 py-1 text-[11px] font-semibold leading-4 text-[#1D273B] shadow-[0_6px_16px_rgba(28,39,71,0.14)]">
      {formatValue(payload[0].value)}
    </div>
  );
}

function EndpointDot({ cx, cy, index, lastIndex, color, markerColor }) {
  if (index !== lastIndex || cx == null || cy == null) return null;

  return (
    <g className="metric-sparkline-endpoint">
      <circle className="metric-sparkline-endpoint-halo" cx={cx} cy={cy} r={7} fill={color} />
      <circle
        data-sparkline-endpoint="true"
        cx={cx}
        cy={cy}
        r={3}
        fill="#fff"
        stroke={markerColor}
        strokeWidth={2}
      />
    </g>
  );
}

function ActiveDot({ cx, cy, color }) {
  if (cx == null || cy == null) return null;
  return (
    <circle
      data-sparkline-active-dot="true"
      cx={cx}
      cy={cy}
      r={3.5}
      fill="#fff"
      stroke={color}
      strokeWidth={2}
    />
  );
}

export default function MetricSparkline({
  points,
  color,
  markerColor = color,
  animationDelay = 0,
  compact = false,
  label,
  formatValue = (value) => value,
}) {
  const reducedMotion = useReducedMotion();
  const reactId = useId();
  const gradientId = `metric-sparkline-${reactId.replace(/:/g, '')}`;
  const data = useMemo(() => points.map((value, index) => ({ index, value })), [points]);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const domainPadding = range * 0.14;
  const positionClassName = compact ? 'bottom-2.5 h-5' : 'bottom-4 h-6';

  return (
    <div
      aria-label={`${label}趋势`}
      className={`metric-sparkline-host absolute left-6 right-6 z-[1] ${positionClassName} ${reducedMotion ? 'metric-sparkline-motion-off' : ''}`}
      role="img"
      style={{
        '--metric-sparkline-color': color,
        '--metric-sparkline-delay': `${animationDelay}ms`,
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 1, right: 4, bottom: 1, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.24" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <XAxis dataKey="index" hide type="number" domain={[0, Math.max(1, points.length - 1)]} />
          <YAxis hide type="number" domain={[min - domainPadding, max + domainPadding]} />
          <Area
            className="metric-sparkline-area"
            dataKey="value"
            fill={`url(#${gradientId})`}
            isAnimationActive={!reducedMotion}
            animationBegin={animationDelay}
            animationDuration={ENTRANCE_DURATION}
            animationEasing="ease-out"
            stroke="none"
            type="linear"
          />
          <Line
            className="metric-sparkline-line"
            dataKey="value"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            type="linear"
            isAnimationActive={!reducedMotion}
            animationBegin={animationDelay}
            animationDuration={ENTRANCE_DURATION}
            animationEasing="ease-out"
            dot={(dotProps) => (
              <EndpointDot
                {...dotProps}
                color={color}
                lastIndex={points.length - 1}
                markerColor={markerColor}
              />
            )}
            activeDot={(dotProps) => <ActiveDot {...dotProps} color={color} />}
          />
          <Tooltip
            allowEscapeViewBox={{ x: false, y: false }}
            content={<SparklineTooltip formatValue={formatValue} />}
            cursor={false}
            isAnimationActive={false}
            wrapperStyle={{ outline: 'none', pointerEvents: 'none', zIndex: 20 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
