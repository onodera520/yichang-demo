import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock3,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Truck,
  WalletCards,
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
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import RiskTag from '../components/common/RiskTag.jsx';
import SlaCountdown from '../components/common/SlaCountdown.jsx';
import { useToast } from '../components/common/Toast.jsx';
import {
  analytics,
  dashboardStats,
  dashboardSuggestions,
  systemMessages,
} from '../data/mockData.js';
import { useSlaClock } from '../hooks/useSlaClock.js';
import { useDemoState } from '../state/DemoStateContext.jsx';

const metricIcons = [AlertTriangle, PackageCheck, Truck, MessageCircle, WalletCards];

const trendTabs = ['全部', '订单异常', '库存异常', '物流异常', '售后异常', '利润风险'];

const trendLines = [
  { key: 'order', name: '订单异常', color: '#0B5FC7' },
  { key: 'inventory', name: '库存异常', color: '#2F7BFF' },
  { key: 'logistics', name: '物流异常', color: '#22A6F2' },
  { key: 'afterSale', name: '售后异常', color: '#6D35FF' },
  { key: 'profit', name: '利润异常', color: '#20C997' },
];

const todos = [
  { label: '已超时任务', value: 2, icon: Clock3, color: '#FF1F1F' },
  { label: '待确认任务', value: 3, icon: PackageCheck, color: '#FF8A00' },
  { label: '今日到期任务', value: 5, icon: MessageCircle, color: '#2F7BFF' },
];

function formatCurrency(value) {
  return `¥${Number(value).toLocaleString('zh-CN')}`;
}

function MetricCard({ item, index, onDetail }) {
  const Icon = metricIcons[index] ?? AlertTriangle;
  const positive = String(item.change).includes('+');
  const negative = String(item.change).includes('-');
  const changeColor = positive ? 'text-[#FF1F1F]' : negative ? 'text-[#16C7A1]' : 'text-[#8A98B3]';

  return (
    <article className="relative h-[150px] overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
      <div className="relative z-10 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#EAF2FF] to-[#CFE1FF] text-[#2F7BFF] shadow-[0_8px_16px_rgba(47,123,255,0.16)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative pr-16">
            <div className="truncate text-[16px] font-semibold leading-6 text-[#1D273B]">{item.label}</div>
            <button
              className="absolute right-0 top-[72px] shrink-0 text-[13px] font-medium text-[#2F7BFF]"
              onClick={onDetail}
              type="button"
            >
              查看详情
            </button>
          </div>
          <div className="mt-2 text-[30px] font-semibold leading-none tracking-tight text-black">{item.value}</div>
          <div className="mt-3 flex items-center gap-2 text-[13px]">
            <span className="text-[#5F6B7A]">较昨日</span>
            <span className={changeColor}>
              {item.change.replace('较昨日', '')}
              {positive ? ' ↑' : negative ? ' ↓' : ''}
            </span>
          </div>
        </div>
      </div>
      <Sparkline points={item.trend} color={item.tone} />
    </article>
  );
}

function Sparkline({ points, color }) {
  const width = 210;
  const height = 32;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - ((point - min) / range) * 26 - 3;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `metric-fill-${color.replace('#', '')}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute bottom-4 left-6 right-6 h-8"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <circle cx={coords.at(-1)[0]} cy={coords.at(-1)[1]} r="2.4" fill="#fff" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function PriorityTable({ rows, onDetail, slaClock }) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">异常优先级列表</h2>
        <div className="flex gap-2">
          <button className="h-8 rounded-[8px] border border-[#D7DEE9] px-3 text-xs text-[#344767]">全部异常</button>
          <button className="h-8 rounded-[8px] border border-[#D7DEE9] px-3 text-xs text-[#344767]">按风险排序</button>
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
            {rows.map((row) => (
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
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SuggestionPanel({ suggestions, onGenerate, onDetail }) {
  return (
    <section className="rounded-[14px] border border-[#E6EAF2] bg-white px-4 py-3 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[17px] font-semibold text-[#1D273B]">今日建议</h2>
          <span className="text-xs text-[#8A98B3]">建议仅供人工判断，高风险操作不会自动执行</span>
        </div>
        <button className="text-xs text-[#2F7BFF]" onClick={() => onDetail('/tasks')} type="button">
          查看全部(6)
        </button>
      </div>
      <div className="space-y-2">
        {suggestions.map((item, index) => (
          <div key={item.id} className="border-b border-[#E8EDF5] pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#EAF2FF] text-[#2F7BFF]">
                  {index === 0 ? <ShoppingBag className="h-4 w-4" /> : index === 1 ? <PackageCheck className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1D273B]">{item.title}</div>
                  <div className="mt-0.5 truncate text-xs leading-5 text-[#344767]">{suggestionDescription(index)}</div>
                  <div className="truncate text-xs text-[#5F6B7A]">{item.impact}</div>
                </div>
              </div>
              <div className="w-[84px] shrink-0 pt-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
                  <div className="h-full rounded-full bg-[#A7CBFF]" style={{ width: `${item.confidence * 100}%` }} />
                </div>
                <div className="mt-1 text-right text-xs font-semibold text-[#1D273B]">置信度 {Math.round(item.confidence * 100)}%</div>
              </div>
            </div>
            <div className="mt-1.5 flex justify-end gap-2">
              <button className="h-7 rounded-[8px] border border-[#AAB4C3] px-3 text-xs text-[#344767]" onClick={() => onDetail('/orders')}>
                查看详情
              </button>
              <button className="h-7 rounded-[8px] bg-[#2F7BFF] px-3 text-xs font-medium text-white" onClick={onGenerate}>
                生成任务
              </button>
            </div>
          </div>
        ))}
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
  return (
    <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">异常趋势（近7天）</h2>
        <div className="flex gap-5 text-xs">
          {trendTabs.map((tab, index) => (
            <span key={tab} className={index === 0 ? 'font-semibold text-[#2F7BFF]' : 'text-[#5F6B7A]'}>
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.exceptionTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#E8EDF5" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5F6B7A' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#5F6B7A' }} />
            <Tooltip />
            {trendLines.map((line) => (
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
      <div className="mt-1 flex justify-center gap-7 text-xs text-[#344767]">
        {trendLines.map((line) => (
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
    <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-[#1D273B]">系统消息</h2>
        <button className="text-xs text-[#2F7BFF]" type="button">查看全部(12)</button>
      </div>
      <div className="space-y-3">
        {systemMessages.slice(0, 5).map((message) => (
          <div key={message.id} className="flex items-center justify-between gap-3 text-xs">
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
  const { createOrderTask, orders } = useDemoState();
  const slaClock = useSlaClock();
  const priorityRows = orders.slice(0, 6);

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

  const generateTask = () => {
    const order = orders[0];
    if (!order) return;
    const task = createOrderTask(order);
    showToast({ message: '已生成任务', type: 'success' });
    navigate('/tasks', { state: { highlightTaskId: task.id } });
  };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-3 overflow-hidden">
      <div className="flex h-10 shrink-0 items-center justify-between">
        <h1 className="text-[22px] font-semibold text-[#111827]">异常工作台</h1>
        <div className="flex items-center gap-4 text-sm text-[#8A98B3]">
          <span>数据更新时间：2026-06-01 09:41:52</span>
          <button className="flex h-9 items-center gap-2 rounded-[10px] border border-[#E2E8F0] bg-white px-3 text-sm text-[#1D273B]">
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
        <div className="grid min-h-0 grid-rows-[300px_1fr] gap-3">
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
