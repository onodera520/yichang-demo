import React, { useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import FilterSelect from '../components/common/FilterSelect.jsx';
import MetricSparkline from '../components/common/MetricSparkline.jsx';
import PageHeaderActionButton from '../components/common/PageHeaderActionButton.jsx';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import LiveUpdateTime from '../components/LiveUpdateTime.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { buildRollingDateLabels } from '../data/demoTime.js';
import { analytics } from '../data/mockData.js';
import { useRefreshTime } from '../hooks/useRefreshTime.js';
import aiAdoptionRateIcon from '../assets/analytics-icons/ai-adoption-rate.png';
import averageProcessingTimeIcon from '../assets/analytics-icons/average-processing-time.png';
import cumulativeAnomaliesIcon from '../assets/analytics-icons/cumulative-anomalies.png';
import processedAnomaliesIcon from '../assets/analytics-icons/processed-anomalies.png';
import taskTimeoutRateIcon from '../assets/analytics-icons/task-timeout-rate.png';
import warningAccuracyIcon from '../assets/analytics-icons/warning-accuracy.png';
import {
  formatCountUnit,
  formatDurationUnit,
  formatEfficiencyTooltipValue,
} from '../utils/chartUnits.js';
import { formatMetricValue } from '../utils/formatMetricValue.js';

const metricVisualConfig = [
  { icon: cumulativeAnomaliesIcon, tone: '#2F7BFF' },
  { icon: processedAnomaliesIcon, tone: '#2F7BFF' },
  { icon: averageProcessingTimeIcon, tone: '#19CFA4' },
  { icon: taskTimeoutRateIcon, tone: '#19CFA4' },
  { icon: aiAdoptionRateIcon, tone: '#2F7BFF' },
  { icon: warningAccuracyIcon, tone: '#2F7BFF' },
];

const metricConfig = analytics.overviewMetrics.map((metric, index) => ({
  ...metric,
  ...metricVisualConfig[index],
}));

const trendLines = [
  { key: 'order', name: '订单异常', color: '#0B5FC7' },
  { key: 'inventory', name: '库存异常', color: '#2F7BFF' },
  { key: 'logistics', name: '物流异常', color: '#22A6F2' },
  { key: 'afterSale', name: '售后异常', color: '#8B5CF6' },
  { key: 'profit', name: '利润异常', color: '#20C997' },
];

const timeOptions = ['近7天', '近30天', '本月'];
const trendTimeOptions = ['近7天', '近30天'];
const aiEffectTimeOptions = ['近7天', '近30天'];
const efficiencyTimeOptions = ['近7天', '近30天', '近一年'];

const repeatedIssueRows = [
  ...analytics.repeatedIssues,
  { source: 'AMZ-US-250601-007', platform: 'Amazon', issueType: '缺货', count: 11, amount: 980, action: '提高安全库存水位，提前锁定热销 SKU 采购计划' },
  { source: 'TTS-UK-250601-008', platform: 'TikTok Shop', issueType: '物流延误', count: 10, amount: 1760, action: '切换尾程承运商，建立轨迹超时自动提醒' },
  { source: 'SHP-AU-250601-009', platform: 'Shopee', issueType: '退款', count: 9, amount: 642, action: '补充售后审核规则，降低重复退款触发率' },
  { source: 'EBY-FR-250601-010', platform: 'eBay', issueType: '发票异常', count: 8, amount: 520, action: '完善税务字段校验，减少发票补开工单' },
  { source: 'AMZ-JP-250601-011', platform: 'Amazon', issueType: '清关异常', count: 7, amount: 890, action: '提前预审报关资料，统一补全申报模板' },
  { source: 'TTS-US-250601-012', platform: 'TikTok Shop', issueType: '支付异常', count: 7, amount: 430, action: '增加支付回调重试，监控平台账单差异' },
  { source: 'SHP-TH-250601-013', platform: 'Shopee', issueType: '地址异常', count: 6, amount: 218, action: '按国家维护地址黑名单与邮编校正规则' },
  { source: 'EBY-IT-250601-014', platform: 'eBay', issueType: '平台同步失败', count: 5, amount: 366, action: '优化接口失败重放机制，补充同步状态看板' },
];

const issueTypes = ['缺货', '平台同步失败', '物流异常', '清关异常', '地址异常', '平均'];

function buildTrendData(labels, seed = 0) {
  return labels.map((date, index) => {
    const phase = index + seed;
    return {
      date,
      order: Math.round(330 + Math.sin(phase * 0.48) * 150 + index * 4),
      inventory: Math.round(420 + Math.cos(phase * 0.38) * 170 + index * 3),
      logistics: Math.round(260 + Math.sin(phase * 0.34 - 1.1) * 210 + index * 5),
      afterSale: Math.round(500 + Math.cos(phase * 0.28 + 0.8) * 220),
      profit: Math.round(460 + Math.sin(phase * 0.25 + 0.4) * 160 + index * 2),
    };
  });
}

function buildAiEffectData(adopted, modified) {
  return issueTypes.map((abnormalType, index) => {
    const rejected = Number((100 - adopted[index] - modified[index]).toFixed(1));
    return {
      abnormalType,
      adopted: adopted[index],
      modified: modified[index],
      rejected,
    };
  });
}

function buildEfficiencyData(labels, seed = 0) {
  return labels.map((date, index) => {
    const phase = index + seed;
    return {
      date,
      averageMinutes: Math.round(34 + Math.sin(phase * 0.5) * 10 + (index % 5)),
      processedCount: Math.round(2200 + Math.cos(phase * 0.35) * 780 + index * 68),
    };
  });
}

function getDateTicks(data) {
  if (data.length <= 12) return data.map((item) => item.date);
  const tickIndexes = [0, 5, 10, 15, 20, 25, data.length - 1];
  return tickIndexes.map((index) => data[index]?.date).filter(Boolean);
}

const last30DayLabels = buildRollingDateLabels(30);
const yearlyEfficiencyData = [
  { date: '2025.07', averageMinutes: 43, processedCount: 23840 },
  { date: '2025.08', averageMinutes: 39, processedCount: 25210 },
  { date: '2025.09', averageMinutes: 41, processedCount: 24760 },
  { date: '2025.10', averageMinutes: 36, processedCount: 26980 },
  { date: '2025.11', averageMinutes: 34, processedCount: 28430 },
  { date: '2025.12', averageMinutes: 46, processedCount: 31860 },
  { date: '2026.01', averageMinutes: 44, processedCount: 30120 },
  { date: '2026.02', averageMinutes: 38, processedCount: 27640 },
  { date: '2026.03', averageMinutes: 35, processedCount: 32980 },
  { date: '2026.04', averageMinutes: 32, processedCount: 34720 },
  { date: '2026.05', averageMinutes: 37, processedCount: 33460 },
  { date: '2026.06', averageMinutes: 31, processedCount: 36150 },
  { date: '2026.07', averageMinutes: 30, processedCount: 18420 },
];

const trendDataByRange = {
  近7天: analytics.exceptionTrend,
  近30天: buildTrendData(last30DayLabels, 2),
};

const aiEffectDataByRange = {
  近7天: analytics.aiSuggestionEffect,
  近30天: buildAiEffectData([68.2, 72.1, 63.8, 65.4, 73.5, 68.6], [24.7, 19.9, 28.4, 22.8, 21.0, 23.1]),
};

const efficiencyDataByRange = {
  近7天: analytics.efficiencyAnalysis,
  近30天: buildEfficiencyData(last30DayLabels, 3),
  近一年: yearlyEfficiencyData,
};

const repeatedIssueRowsByRange = {
  近7天: repeatedIssueRows,
  近30天: [
    ...repeatedIssueRows,
    { source: 'AMZ-MX-250530-015', platform: 'Amazon', issueType: '缺货', count: 18, amount: 1420, action: '扩展区域安全库存，提前同步采购预估' },
    { source: 'TTS-DE-250529-016', platform: 'TikTok Shop', issueType: '物流延误', count: 16, amount: 1180, action: '复盘慢线路由，切换高峰期承运方案' },
    { source: 'SHP-SG-250528-017', platform: 'Shopee', issueType: '地址异常', count: 13, amount: 388, action: '补充新加坡地址校验模板，拦截异常邮编' },
    { source: 'EBY-ES-250527-018', platform: 'eBay', issueType: '平台同步失败', count: 12, amount: 760, action: '增加同步失败重试次数，记录接口错误码' },
  ],
  本月: [
    { source: 'AMZ-US-250601-021', platform: 'Amazon', issueType: '缺货', count: 46, amount: 3860, action: '按月重算安全库存，建立补货红线' },
    { source: 'TTS-US-250601-022', platform: 'TikTok Shop', issueType: '物流延误', count: 39, amount: 3280, action: '重排物流渠道优先级，月度复盘承运商表现' },
    { source: 'SHP-UK-250601-023', platform: 'Shopee', issueType: '地址异常', count: 34, amount: 980, action: '沉淀地址规则库，降低客服二次确认频率' },
    { source: 'EBY-DE-250601-024', platform: 'eBay', issueType: '平台同步失败', count: 29, amount: 1210, action: '建立同步失败告警，拆分接口责任范围' },
    { source: 'AMZ-CA-250601-025', platform: 'Amazon', issueType: '清关异常', count: 21, amount: 890, action: '月度整理报关资料模板，提前预审高频 SKU' },
    { source: 'SHP-AU-250601-026', platform: 'Shopee', issueType: '退款', count: 18, amount: 640, action: '更新售后判责规则，减少重复退款' },
    { source: 'TTS-UK-250601-027', platform: 'TikTok Shop', issueType: '支付异常', count: 15, amount: 520, action: '对账支付流水，补充回调监控' },
    { source: 'EBY-FR-250601-028', platform: 'eBay', issueType: '发票异常', count: 12, amount: 360, action: '统一税务字段口径，减少发票补开' },
  ],
};

function formatCurrency(value) {
  return `¥${Number(value).toLocaleString('zh-CN')}`;
}

function formatPercent(value) {
  return `${Number(value).toFixed(1)}%`;
}

function TimeSelect({ value, onChange, open, onOpenChange, options = timeOptions }) {
  return (
    <FilterSelect
      value={value}
      options={options}
      includePlaceholder={false}
      onChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel="时间范围"
      align="right"
      controlClassName="min-w-[86px]"
      triggerClassName="h-8 min-w-[86px] rounded-[8px] px-3 text-sm"
      menuClassName="w-[104px]"
      optionClassName="h-8 px-3 text-sm"
    />
  );
}

function AnalyticsMetricCard({ index, item }) {
  const isPositive = item.change.startsWith('+');
  const changeColor = isPositive ? 'text-[#2F7BFF]' : 'text-[#19CFA4]';

  return (
    <article className="metric-sparkline-card relative h-[160px] overflow-hidden rounded-[14px] border border-[#E8ECF3] bg-white px-6 py-4 shadow-[0_8px_24px_rgba(28,39,71,0.06)]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src={item.icon} alt="" aria-hidden="true" className="h-10 w-10 object-contain" />
          </div>
          <div className="whitespace-nowrap text-[17px] font-medium leading-6 text-[#111827]">{item.label}</div>
        </div>
        <div className="mt-0.5 whitespace-nowrap text-[30px] font-semibold leading-none tracking-tight text-black">{item.value}</div>
        <div className="mt-2 flex items-center gap-2 text-[13px] leading-5">
          <span className="text-[#5F6B7A]">较昨日</span>
          <span className={changeColor}>
            {item.change} {isPositive ? '↑' : '↓'}
          </span>
        </div>
      </div>
      <MetricSparkline
        animationDelay={index * 50}
        color={item.tone}
        formatValue={(value) => formatMetricValue(value, item.valueFormat)}
        label={item.label}
        points={item.trend}
      />
    </article>
  );
}

function Panel({ title, children, action }) {
  return (
    <section className="min-h-0 rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function TrendPanel({ range, open, setOpen, setRange }) {
  const data = trendDataByRange[range] ?? trendDataByRange['近7天'];
  const dateTicks = getDateTicks(data);
  const showDots = data.length === 1;

  return (
    <Panel
      title="异常趋势"
      action={<TimeSelect value={range} options={trendTimeOptions} open={open === 'trend'} onOpenChange={(nextOpen) => setOpen(nextOpen ? 'trend' : null)} onChange={(value) => { setRange(value); setOpen(null); }} />}
    >
      <div style={{ height: 203 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#E8EDF5" vertical={false} />
            <XAxis dataKey="date" ticks={dateTicks} interval={0} padding={{ left: 8, right: 20 }} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5F6B7A' }} />
            <YAxis domain={[0, 1000]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5F6B7A', dx: 8 }} tickFormatter={formatCountUnit} />
            <Tooltip formatter={(value) => formatCountUnit(value)} contentStyle={{ borderRadius: 10, borderColor: '#D7DEE9' }} />
            {trendLines.map((line) => (
              <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} dot={showDots ? { r: 3, fill: line.color } : false} stroke={line.color} strokeWidth={2.6} activeDot={{ r: 4 }} />
            ))}
            <Legend content={<TrendLegend />} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function TrendLegend({ payload = [] }) {
  return (
    <div className="mx-auto flex w-full max-w-[520px] items-center justify-between pt-2 text-xs">
      {payload.map((item) => (
        <span key={item.dataKey ?? item.value} className="inline-flex items-center gap-2 whitespace-nowrap" style={{ color: item.color }}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          {item.value}
        </span>
      ))}
    </div>
  );
}

function AiEffectPanel({ range, open, setOpen, setRange }) {
  const data = aiEffectDataByRange[range] ?? aiEffectDataByRange['近7天'];

  return (
    <Panel
      title="AI建议处理效果"
      action={<TimeSelect value={range} options={aiEffectTimeOptions} open={open === 'ai'} onOpenChange={(nextOpen) => setOpen(nextOpen ? 'ai' : null)} onChange={(value) => { setRange(value); setOpen(null); }} />}
    >
      <div className="mb-1 flex items-center justify-center gap-5 text-sm text-[#344767]">
        <LegendItem color="#2F7BFF" label="采纳" />
        <LegendItem color="#4C8FF5" label="修改" />
        <LegendItem color="#7FB0FF" label="驳回" />
      </div>
      <div style={{ height: 182 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 6, right: 4, left: 8, bottom: 10 }} barGap={8}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="abnormalType" axisLine={false} tickLine={false} width={96} tick={{ fontSize: 13, fill: '#263246' }} />
            <Tooltip formatter={(value) => formatPercent(value)} contentStyle={{ borderRadius: 10, borderColor: '#D7DEE9' }} />
            <Bar dataKey="adopted" name="采纳" stackId="effect" barSize={26} shape={renderPercentSegment('adopted', '#2F7BFF', 'left')} />
            <Bar dataKey="modified" name="修改" stackId="effect" barSize={26} shape={renderPercentSegment('modified', '#4C8FF5')} />
            <Bar dataKey="rejected" name="驳回" stackId="effect" barSize={26} shape={renderPercentSegment('rejected', '#7FB0FF', 'right')} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function renderPercentSegment(key, fill, roundedSide) {
  return ({ x, y, width, height, payload }) => {
    const value = payload?.[key];
    const radius = roundedSide ? 5 : 2;

    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} rx={radius} ry={radius} />
        {value != null ? (
          <text x={x + width / 2} y={y + height / 2 + 4} textAnchor="middle" fill="#fff" fontSize="12">
            {formatPercent(value)}
          </text>
        ) : null}
      </g>
    );
  };
}

function LegendItem({ color, label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-3.5 w-3.5 rounded-[3px]" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function EfficiencyPanel({ range, open, setOpen, setRange }) {
  const data = efficiencyDataByRange[range] ?? efficiencyDataByRange['近7天'];
  const dateTicks = getDateTicks(data);

  return (
    <Panel
      title="处理效率分析"
      action={<TimeSelect value={range} options={efficiencyTimeOptions} open={open === 'efficiency'} onOpenChange={(nextOpen) => setOpen(nextOpen ? 'efficiency' : null)} onChange={(value) => { setRange(value); setOpen(null); }} />}
    >
      <div className="mb-2 flex items-center gap-8 text-sm text-[#263246]">
        <LegendItem color="#2F7BFF" label="处理时长" />
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-8 rounded-full bg-[#18C5A5]" />
          处理量
        </span>
      </div>
      <div style={{ height: 262 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="barFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2F7BFF" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#CFE1FF" stopOpacity="0.55" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E8EDF5" vertical={false} />
            <XAxis dataKey="date" ticks={dateTicks} interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5F6B7A' }} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5F6B7A' }} tickFormatter={formatDurationUnit} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#5F6B7A' }} tickFormatter={formatCountUnit} />
            <Tooltip formatter={(value, name) => formatEfficiencyTooltipValue(value, name)} contentStyle={{ borderRadius: 10, borderColor: '#D7DEE9' }} />
            <Bar yAxisId="left" dataKey="averageMinutes" name="处理时长" barSize={48} fill="url(#barFill)" radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="processedCount" name="处理量" stroke="#18C5A5" strokeWidth={2.6} dot={{ r: 3, fill: '#fff', stroke: '#18C5A5', strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

function RepeatIssueTable({ range, open, setOpen, setRange }) {
  const rows = repeatedIssueRowsByRange[range] ?? repeatedIssueRowsByRange['近7天'];

  return (
    <Panel
      title="反复问题识别"
      action={<TimeSelect value={range} open={open === 'repeat'} onOpenChange={(nextOpen) => setOpen(nextOpen ? 'repeat' : null)} onChange={(value) => { setRange(value); setOpen(null); }} />}
    >
      <div className="overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]" style={{ height: 312 }}>
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[17%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white text-xs font-medium text-[#7889A8]">
            <tr>
              <th className="pb-2">对象来源</th>
              <th className="pb-2">问题类型</th>
              <th className="pb-2">出现次数</th>
              <th className="pb-2">影响金额</th>
              <th className="pb-2">建议改进行动</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#263246]">
            {rows.map((item) => (
              <tr key={item.source} className="border-t border-[#E8EDF5]">
                <td className="py-2.5 pr-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PlatformLogo platform={item.platform} showName={false} size="sm" />
                    <button className="min-w-0 truncate text-[#2F7BFF] underline underline-offset-2" type="button">
                      {item.source}
                    </button>
                  </div>
                </td>
                <td className="whitespace-nowrap py-2.5">{item.issueType}</td>
                <td className="whitespace-nowrap py-2.5">{item.count}</td>
                <td className="whitespace-nowrap py-2.5">{formatCurrency(item.amount)}</td>
                <td className="py-2.5">
                  <span className="block truncate" title={item.action}>
                    {item.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export default function Analytics() {
  const { showToast } = useToast();
  const { refreshTime, refreshNow } = useRefreshTime();
  const [ranges, setRanges] = useState({
    trend: '近7天',
    ai: '近7天',
    efficiency: '近7天',
    repeat: '近7天',
  });
  const [open, setOpen] = useState(null);
  const metrics = useMemo(() => metricConfig, []);

  const setPanelRange = (panel, value) => {
    setRanges((current) => ({ ...current, [panel]: value }));
  };

  const exportReport = () => {
    showToast({ message: '报表已导出', type: 'success' });
  };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-3">
      <div className="page-header flex shrink-0 items-center justify-between">
        <h1 className="page-title">数据复盘</h1>
        <div className="flex items-center gap-3">
          <LiveUpdateTime className="text-sm text-[#7889A8]" value={refreshTime} />
          <PageHeaderActionButton icon={RefreshCw} onClick={refreshNow}>刷新数据</PageHeaderActionButton>
          <PageHeaderActionButton icon={Download} onClick={exportReport} variant="primary">导出报表</PageHeaderActionButton>
        </div>
      </div>

      <div className="grid shrink-0 gap-3" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        {metrics.map((item, index) => (
          <AnalyticsMetricCard key={item.label} index={index} item={item} />
        ))}
      </div>

      <div
        className="grid min-h-0 flex-1 gap-3"
        style={{ gridTemplateColumns: '0.9fr 1.15fr', gridTemplateRows: '284px 1fr' }}
      >
        <TrendPanel range={ranges.trend} open={open} setOpen={setOpen} setRange={(value) => setPanelRange('trend', value)} />
        <AiEffectPanel range={ranges.ai} open={open} setOpen={setOpen} setRange={(value) => setPanelRange('ai', value)} />
        <EfficiencyPanel range={ranges.efficiency} open={open} setOpen={setOpen} setRange={(value) => setPanelRange('efficiency', value)} />
        <RepeatIssueTable range={ranges.repeat} open={open} setOpen={setOpen} setRange={(value) => setPanelRange('repeat', value)} />
      </div>
    </div>
  );
}
