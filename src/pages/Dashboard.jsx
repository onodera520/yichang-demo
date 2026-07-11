import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Info,
  MessageCircle,
  PackageCheck,
  RefreshCw,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import FilterSelect from '../components/common/FilterSelect.jsx';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import RiskTag from '../components/common/RiskTag.jsx';
import SlaCountdown from '../components/common/SlaCountdown.jsx';
import LiveUpdateTime from '../components/LiveUpdateTime.jsx';
import { useToast } from '../components/common/Toast.jsx';
import {
  analytics,
  dashboardStats,
  dashboardSuggestions,
  systemMessages,
} from '../data/mockData.js';
import { useSlaClock } from '../hooks/useSlaClock.js';
import { useRefreshTime } from '../hooks/useRefreshTime.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { useTopbarFilter } from '../state/TopbarFilterContext.jsx';
import {
  filterAndSortPriorityRows,
  getNextPrioritySort,
  getPriorityAbnormalTypes,
} from './dashboardPriorityControls.js';
import afterSaleIcon from '../assets/dashboard-icons/after-sale.png';
import highRiskOrderIcon from '../assets/dashboard-icons/high-risk-order.png';
import logisticsDelayIcon from '../assets/dashboard-icons/logistics-delay.png';
import lossRiskIcon from '../assets/dashboard-icons/loss-risk.png';
import stockRiskIcon from '../assets/dashboard-icons/stock-risk.png';

const metricIcons = [highRiskOrderIcon, stockRiskIcon, logisticsDelayIcon, afterSaleIcon, lossRiskIcon];
const metricMarkerTones = ['#FF4D4F', '#FF8A00', '#20C997', '#6D35FF', '#20C997'];
const suggestionIcons = [highRiskOrderIcon, stockRiskIcon, logisticsDelayIcon];

const trendTabs = ['全部', '订单异常', '库存异常', '物流异常', '售后异常', '利润风险'];

const trendLines = [
  { key: 'order', name: '订单异常', color: '#0B5FC7' },
  { key: 'inventory', name: '库存异常', color: '#2F7BFF' },
  { key: 'logistics', name: '物流异常', color: '#22A6F2' },
  { key: 'afterSale', name: '售后异常', color: '#6D35FF' },
  { key: 'profit', name: '利润风险', color: '#20C997' },
];

const todos = [
  { label: '已超时任务', value: 2, icon: Clock3, color: '#FF1F1F' },
  { label: '待确认任务', value: 3, icon: PackageCheck, color: '#FF8A00' },
  { label: '今日到期任务', value: 5, icon: MessageCircle, color: '#2F7BFF' },
];

function formatCurrency(value) {
  return `¥${Number(value).toLocaleString('zh-CN')}`;
}

function normalizeKeyword(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchesKeyword(fields, keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return true;
  return fields.some((field) => normalizeKeyword(field).includes(normalizedKeyword));
}

function MetricCard({ item, index, onDetail }) {
  const icon = metricIcons[index] ?? highRiskOrderIcon;
  const markerColor = metricMarkerTones[index] ?? item.tone;
  const positive = String(item.change).includes('+');
  const negative = String(item.change).includes('-');
  const changeColor = positive ? 'text-[#FF1F1F]' : negative ? 'text-[#16C7A1]' : 'text-[#8A98B3]';

  return (
    <article className="relative h-[160px] overflow-hidden rounded-[14px] border border-[#E8ECF3] bg-white px-6 py-4 shadow-[0_8px_24px_rgba(28,39,71,0.06)]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img src={icon} alt="" className="h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0 truncate text-[17px] font-medium leading-6 text-[#111827]">{item.label}</div>
        </div>
        <div className="mt-0.5 whitespace-nowrap text-[30px] font-semibold leading-none tracking-tight text-black">{item.value}</div>
        <div className="mt-2 flex items-center justify-between text-[13px] leading-5">
          <div className="flex items-center gap-2">
            <span className="text-[#5F6B7A]">较昨日</span>
            <span className={changeColor}>
              {item.change.replace('较昨日', '')}
              {positive ? ' ↑' : negative ? ' ↓' : ''}
            </span>
          </div>
          <button
            className="shrink-0 font-medium text-[#2F7BFF]"
            onClick={onDetail}
            type="button"
          >
            查看详情
          </button>
        </div>
      </div>
      <Sparkline points={item.trend} color={item.tone} markerColor={markerColor} />
    </article>
  );
}

function Sparkline({ points, color, markerColor }) {
  const width = 210;
  const height = 32;
  const horizontalPadding = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = (width - horizontalPadding * 2) / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = horizontalPadding + index * step;
    const y = height - ((point - min) / range) * 26 - 3;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${width - horizontalPadding},${height} L${horizontalPadding},${height} Z`;
  const id = `metric-fill-${color.replace('#', '')}`;

  return (
    <div className="pointer-events-none absolute bottom-4 left-6 right-6 h-6">
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.24" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <circle cx={coords.at(-1)[0]} cy={coords.at(-1)[1]} r="2.5" fill="#fff" stroke={markerColor} strokeWidth="2" />
      </svg>
    </div>
  );
}

function PriorityTable({ rows, onDetail, slaClock }) {
  const [selectedType, setSelectedType] = React.useState('全部异常');
  const [sortDirection, setSortDirection] = React.useState('default');
  const abnormalTypes = React.useMemo(() => getPriorityAbnormalTypes(rows), [rows]);
  const renderedRows = React.useMemo(
    () => filterAndSortPriorityRows(rows, selectedType, sortDirection),
    [rows, selectedType, sortDirection],
  );
  const SortIcon = sortDirection === 'desc' ? ArrowDown : sortDirection === 'asc' ? ArrowUp : ArrowDownUp;

  React.useEffect(() => {
    if (selectedType !== '全部异常' && !abnormalTypes.includes(selectedType)) {
      setSelectedType('全部异常');
    }
  }, [abnormalTypes, selectedType]);

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">异常优先级列表</h2>
        <div className="flex gap-2">
          <FilterSelect
            value={selectedType}
            options={['全部异常', ...abnormalTypes]}
            placeholder="全部异常"
            placeholderValue="全部异常"
            includePlaceholder={false}
            onChange={setSelectedType}
            ariaLabel="异常类型"
            align="right"
            controlClassName="w-[96px]"
            triggerClassName="h-8 w-[96px] rounded-[8px] px-3 text-xs"
            menuClassName="w-36"
            optionClassName="px-3 py-2 text-xs"
          />
          <button
            type="button"
            className={`flex h-8 min-w-[116px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] border px-3 text-xs transition ${
              sortDirection === 'default'
                ? 'border-[#D7DEE9] text-[#344767]'
                : 'border-[#9CC0FF] bg-[#F2F7FF] text-[#2F7BFF]'
            }`}
            aria-pressed={sortDirection !== 'default'}
            data-sort-direction={sortDirection}
            title={sortDirection === 'desc' ? '当前：风险从高到低' : sortDirection === 'asc' ? '当前：风险从低到高' : '当前：默认顺序'}
            onClick={() => setSortDirection((current) => getNextPrioritySort(current))}
          >
            <span className="whitespace-nowrap">按风险排序</span>
            <SortIcon className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
        <table className="w-full table-fixed text-left">
          <colgroup>
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[27%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[7%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-white text-xs font-medium text-[#7889A8]">
            <tr>
              <th className="pb-2 pl-1">风险等级</th>
              <th className="pb-2">异常类型</th>
              <th className="pb-2">对象编号</th>
              <th className="pb-2">平台</th>
              <th className="pb-2">影响金额</th>
              <th className="pb-2">剩余SLA</th>
              <th className="pb-2">负责人</th>
              <th className="pb-2">状态</th>
            </tr>
          </thead>
          <tbody className="text-sm text-[#263246]">
            {renderedRows.map((row) => (
              <tr key={row.id} className="border-t border-[#E8EDF5]">
                <td className="whitespace-nowrap py-2.5 pl-1">
                  <RiskTag type={row.riskLevel}>{row.riskLevel}</RiskTag>
                </td>
                <td className="whitespace-nowrap py-2.5">{row.abnormalType}</td>
                <td className="py-2.5 pr-3">
                  <button className="block max-w-full truncate text-[#2F7BFF] underline underline-offset-2" onClick={() => onDetail(row)}>
                    {row.orderNo}
                  </button>
                </td>
                <td className="whitespace-nowrap py-2.5">
                  <PlatformLogo platform={row.platform} showName={false} size="sm" />
                </td>
                <td className="whitespace-nowrap py-2.5">{formatCurrency(row.amount)}</td>
                <td className="whitespace-nowrap py-2.5 font-medium">
                  <SlaCountdown value={row.remainingSLA} {...slaClock} />
                </td>
                <td className="whitespace-nowrap py-2.5">{row.owner}</td>
                <td className="whitespace-nowrap py-2.5">{row.status}</td>
              </tr>
            ))}
            {renderedRows.length === 0 ? (
              <tr className="border-t border-[#E8EDF5]">
                <td colSpan={8} className="py-12 text-center text-sm text-[#8A98B3]">
                  暂无匹配异常
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatSuggestionImpact(value) {
  const [summary, amount] = String(value).split('¥');
  return {
    summary: amount ? summary.replace('，', ' ｜ ').trim() : summary.trim(),
    amount: amount?.trim() ?? '',
  };
}

function SuggestionPanel({ suggestions, onGenerate, onDetail }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex shrink-0 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-[17px] font-semibold text-[#1D273B]">今日建议</h2>
          <Info className="h-4 w-4 shrink-0 text-[#9AA4B5]" aria-hidden="true" />
          <span className="truncate text-xs text-[#8A98B3]">建议仅供人工判断，高风险操作不会自动执行</span>
        </div>
        <button className="flex shrink-0 items-center gap-0.5 text-xs text-[#2F7BFF]" onClick={() => onDetail('/tasks')} type="button">
          <span>查看全部(6)</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-scroll overflow-x-hidden pr-1 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#C9CFD9]">
        {suggestions.map((item, index) => {
          const impact = formatSuggestionImpact(item.impact);
          return (
          <div key={item.id} className="flex min-h-[140px] flex-col border-b border-[#E1E6EE] px-1 py-2.5 last:border-b-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                  <img src={suggestionIcons[index] ?? stockRiskIcon} alt="" className="h-10 w-10 object-contain" />
                </div>
                <div className="min-w-0 truncate text-[15px] font-semibold leading-7 text-[#111827]">{item.title}</div>
              </div>
              <div className="w-[96px] shrink-0 pt-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
                  <div className="h-full rounded-full bg-[#A7CBFF]" style={{ width: `${item.confidence * 100}%` }} />
                </div>
                <div className="mt-1 text-right text-[13px] font-semibold text-[#1D273B]">置信度 {Math.round(item.confidence * 100)}%</div>
              </div>
            </div>
            <div className="mt-2.5 overflow-hidden whitespace-nowrap text-[13px] leading-5 text-[#111827]">{suggestionDescription(index)}</div>
            <div className="mt-auto flex min-w-0 items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-1 whitespace-nowrap text-[13px] text-[#111827]">
                <span>{impact.summary}</span>
                {impact.amount ? <span className="font-semibold text-[#FF1F1F]">¥{impact.amount}</span> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button className="h-7 rounded-[7px] border border-[#626873] px-2.5 text-xs text-[#344767]" onClick={() => onDetail('/orders')} type="button">
                  查看详情
                </button>
                <button className="h-7 rounded-[7px] bg-[#2F7BFF] px-3 text-xs font-medium text-white" onClick={() => onGenerate(item, index)} type="button">
                  生成任务
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}

function suggestionDescription(index) {
  if (index === 0) return 'LA仓库存为0，NJ仓有12件可用库存，不切换可能导致8笔订单超时';
  if (index === 1) return 'LA仓销量连续攀升，现货与在途无法覆盖补货周期';
  return '尾程轨迹超过48小时未更新，建议调整渠道并同步客服话术';
}

function TrendPanel() {
  const [activeTrend, setActiveTrend] = React.useState('全部');
  const visibleLines = activeTrend === '全部'
    ? trendLines
    : trendLines.filter((line) => line.name === activeTrend);

  return (
    <section className="flex min-h-0 flex-col rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex shrink-0 items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">异常趋势（近7天）</h2>
        <div className="flex gap-5 text-xs">
          {trendTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTrend(tab)}
              className={activeTrend === tab ? 'font-semibold text-[#2F7BFF]' : 'text-[#5F6B7A] transition hover:text-[#2F7BFF]'}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.exceptionTrend} margin={{ top: 10, right: 8, left: -18, bottom: 4 }}>
            <CartesianGrid stroke="#E8EDF5" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5F6B7A' }} />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, 800]}
              ticks={[0, 200, 400, 600, 800]}
              tick={{ fontSize: 11, fill: '#5F6B7A' }}
            />
            <Tooltip
              formatter={(value, name) => {
                const matchedLine = trendLines.find((line) => line.key === name);
                return [value, matchedLine?.name ?? name];
              }}
            />
            {visibleLines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                dot={false}
                stroke={line.color}
                strokeWidth={2.4}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex shrink-0 justify-center gap-7 text-xs text-[#344767]">
        {visibleLines.map((line) => (
          <span key={line.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
    </section>
  );
}

function TodoPanel({ onEnter }) {
  return (
    <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">待办事项</h2>
        <button className="text-xs text-[#2F7BFF]" onClick={onEnter} type="button">查看全部(8)</button>
      </div>
      <div className="space-y-2">
        {todos.map((todo) => (
          <div key={todo.label} className="flex h-11 items-center justify-between rounded-[10px] bg-[#F2F7FF] px-3">
            <div className="flex items-center gap-2 text-sm text-[#1D273B]">
              <todo.icon className="h-5 w-5" style={{ color: todo.color }} />
              {todo.label}
            </div>
            <span className="text-xl font-semibold text-black">{todo.value}</span>
          </div>
        ))}
      </div>
      <button className="mt-3 h-10 w-full rounded-[9px] bg-[#2F7BFF] text-sm font-semibold text-white" onClick={onEnter} type="button">
        进入任务协同
      </button>
    </section>
  );
}

function MessagePanel() {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">系统消息</h2>
        <button className="text-xs text-[#2F7BFF]" type="button">查看全部(12)</button>
      </div>
      <div className="flex flex-1 flex-col justify-start gap-4 pb-1">
        {systemMessages.slice(0, 5).map((message) => (
          <div key={message.id} className="flex min-h-[22px] items-center justify-between gap-4 text-[13px] leading-6">
            <span className="truncate text-[#344767]">{message.content}</span>
            <span className="shrink-0 text-[#8A98B3]">{message.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { createSuggestionTask, orders } = useDemoState();
  const { keyword: topbarKeyword, platform: topbarPlatform, store: topbarStore } = useTopbarFilter();
  const slaClock = useSlaClock();
  const { refreshTime, refreshNow } = useRefreshTime();
  const priorityRows = React.useMemo(
    () =>
      orders
        .filter(
          (order) =>
            (!topbarPlatform || order.platform === topbarPlatform) &&
            (!topbarStore || order.store === topbarStore) &&
            matchesKeyword(
              [
                order.orderNo,
                order.relatedSku,
                order.abnormalType,
                order.store,
                order.platform,
                order.country,
                order.owner,
                order.status,
                order.aiSuggestion,
                order.impact,
              ],
              topbarKeyword,
            ),
        )
        .slice(0, 10),
    [orders, topbarKeyword, topbarPlatform, topbarStore],
  );

  const goDetail = (target) => {
    if (typeof target === 'string') {
      navigate(target);
      return;
    }
    navigate('/orders', { state: { openOrderId: target.id } });
  };

  const handleMetricDetail = (index) => {
    if (index === 0) {
      const order = orders.find((item) => item.riskLevel === '高') ?? orders[0];
      navigate('/orders', { state: { openOrderId: order?.id } });
      return;
    }

    if (index === 1) {
      navigate('/inventory', { state: { openSku: 'ELE-HEAD-01' } });
      return;
    }

    if (index === 2) {
      navigate('/orders', { state: { abnormalType: '物流延误' } });
      return;
    }

    navigate('/orders');
  };

  const generateTask = (suggestion) => {
    const task = createSuggestionTask(suggestion);
    showToast({ message: '已生成任务', type: 'success' });
    navigate('/tasks', { state: { highlightTaskId: task.id } });
  };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-3">
      <div className="page-header flex h-10 shrink-0 items-center justify-between">
        <h1 className="page-title">异常工作台</h1>
        <div className="flex items-center gap-4 text-sm text-[#8A98B3]">
          <LiveUpdateTime value={refreshTime} />
          <button className="flex h-9 items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#1D273B]" onClick={refreshNow} type="button">
            <RefreshCw className="h-4 w-4" />
            刷新数据
          </button>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-5 gap-3">
        {dashboardStats.map((item, index) => (
          <MetricCard key={item.label} item={item} index={index} onDetail={() => handleMetricDetail(index)} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-3">
        <div className="grid min-h-0 grid-rows-[390px_1fr] gap-3">
          <PriorityTable rows={priorityRows} onDetail={goDetail} slaClock={slaClock} />
          <TrendPanel />
        </div>
        <div className="grid min-h-0 grid-rows-[390px_1fr] gap-3">
          <SuggestionPanel suggestions={dashboardSuggestions} onGenerate={generateTask} onDetail={goDetail} />
          <div className="grid grid-cols-[0.9fr_1.1fr] gap-3">
            <TodoPanel onEnter={() => navigate('/tasks')} />
            <MessagePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
