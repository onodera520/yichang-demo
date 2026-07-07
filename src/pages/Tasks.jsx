import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Download,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react';
import RiskTag from '../components/common/RiskTag.jsx';
import SlaCountdown from '../components/common/SlaCountdown.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { tasks as mockTasks } from '../data/mockData.js';
import { useSlaClock } from '../hooks/useSlaClock.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { getRemainingSlaSeconds } from '../utils/sla.js';

const tabs = ['全部', '待分派', '已分派', '处理中', '待确认', '已完成', '已超时', '已升级'];
const owners = ['王敏', '赵宁', '陈浩', '刘畅', '周扬', '张磊', '李娜', '未分派'];
const sources = ['全部', '来源订单', '库存风险', '物流异常', '平台同步', '售后异常'];
const risks = ['全部', '高', '中', '低'];
const deadlines = ['全部', '今天', '2小时内', '已超时', '24小时内'];
const TASK_PAGE_SIZE = 9;

function getVisiblePages(currentPage, pageCount) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
}

function statusForTab(status) {
  if (status === '待处理') return '待确认';
  return status;
}

function statusClass(status) {
  if (status === '已完成') return 'text-[#159455]';
  if (status === '已升级' || status === '已超时') return 'text-[#FF1F1F]';
  if (status === '处理中') return 'text-[#111827]';
  return 'text-[#1D273B]';
}

function logDotClass(tone) {
  if (tone === 'green') return 'bg-[#20A162]';
  if (tone === 'red') return 'bg-[#FF1F1F]';
  return 'bg-[#2F7BFF]';
}

function matchesLiveDeadlineFilter(task, filter, nowMs, anchorMs) {
  if (filter === deadlines[0]) return true;
  if (task.deadline.includes(filter)) return true;

  const seconds = getRemainingSlaSeconds(task.remainingSLA, nowMs, anchorMs);
  if (filter === deadlines[2]) return seconds != null && seconds > 0 && seconds < 7200;
  if (filter === deadlines[3]) return seconds === 0;

  return false;
}

function Checkbox({ checked, onChange }) {
  return (
    <button
      className={`flex h-5 w-5 items-center justify-center rounded-[5px] border transition ${
        checked ? 'border-[#2F7BFF] bg-[#2F7BFF] text-white' : 'border-[#C9D3E1] bg-white text-transparent'
      }`}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      type="button"
    >
      <Check className="h-3.5 w-3.5" strokeWidth={3} />
    </button>
  );
}

function FilterBox({ label, value, options, onChange, wide = false }) {
  return (
    <label className={wide ? 'w-[250px]' : 'w-[150px]'}>
      <span className="mb-1.5 block text-[13px] font-medium text-[#7889A8]">{label}</span>
      <span className="relative block">
        <select
          className="h-10 w-full appearance-none rounded-[7px] border border-[#D7DEE9] bg-white px-3 pr-9 text-sm font-medium text-[#263246] outline-none transition focus:border-[#2F7BFF]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D273B]" />
      </span>
    </label>
  );
}

function DeadlineFilter({ value, onChange }) {
  return (
    <label className="w-[260px]">
      <span className="mb-1.5 block text-[13px] font-medium text-[#7889A8]">截止时间</span>
      <span className="relative flex h-10 items-center rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm font-medium text-[#A1ADC2]">
        <select
          className="absolute inset-0 cursor-pointer appearance-none opacity-0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {deadlines.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>{value === '全部' ? '开始日期' : value}</span>
        <ArrowRight className="mx-4 h-4 w-4" />
        <span>结束日期</span>
        <CalendarDays className="ml-auto h-4 w-4 text-[#7889A8]" />
      </span>
    </label>
  );
}

function TaskTable({
  rows,
  selectedTaskId,
  selectedIds,
  onSelectTask,
  onToggleSelected,
  onToggleAll,
  allSelected,
  totalCount,
  currentPage,
  pageCount,
  visiblePages,
  onPageChange,
  slaClock,
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#E3E9F3] bg-white shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4">
        <div className="flex shrink-0 items-end gap-3">
          <h2 className="whitespace-nowrap text-[18px] font-semibold text-[#111827]">任务列表</h2>
          <span className="pb-0.5 text-sm text-[#7889A8]">共 {totalCount} 条</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <TableButton>批量转交</TableButton>
          <TableButton>批量升级</TableButton>
          <TableButton>批量关闭</TableButton>
          <TableButton icon={Download}>导出</TableButton>
          <TableButton className="w-[126px]">按截止时间排序</TableButton>
          <TableButton icon={RefreshCw}>刷新</TableButton>
          <button className="inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)]" type="button">
            新建任务
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[5%]" />
            <col className="w-[10%]" />
            <col className="w-[20%]" />
            <col className="w-[19%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[4%]" />
          </colgroup>
          <thead className="bg-[#FAFBFD] text-sm font-semibold text-[#6F7F98]">
            <tr className="h-[52px] border-y border-[#E3E9F3]">
              <th className="pl-4"><Checkbox checked={allSelected} onChange={onToggleAll} /></th>
              <th>风险等级</th>
              <th>任务标题</th>
              <th>来源异常</th>
              <th>负责人</th>
              <th>状态</th>
              <th>剩余 SLA</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
        </table>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[5%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[19%]" />
              <col className="w-[10%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[4%]" />
            </colgroup>
            <tbody className="text-sm text-[#1D273B]">
              {rows.map((row) => {
                const active = row.id === selectedTaskId;
                const selected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`h-[56px] cursor-pointer border-b border-[#E3E9F3] transition ${
                      active ? 'bg-[#EAF2FF]' : 'bg-white hover:bg-[#F7FAFF]'
                    }`}
                    onClick={() => onSelectTask(row.id)}
                  >
                    <td className="pl-4">
                      <Checkbox checked={selected} onChange={() => onToggleSelected(row.id)} />
                    </td>
                    <td><RiskTag type={row.riskLevel}>{row.riskLevel}</RiskTag></td>
                    <td className="truncate pr-3 font-semibold">{row.title}</td>
                    <td>
                      <button className="max-w-full truncate text-[#2F7BFF] underline underline-offset-2" type="button">
                        {row.source}
                      </button>
                    </td>
                    <td className="truncate">{row.owner}</td>
                    <td className={`font-semibold ${statusClass(row.status)}`}>{row.status}</td>
                    <td className="font-medium">
                      <SlaCountdown value={row.remainingSLA} {...slaClock} />
                    </td>
                    <td className="text-[#7889A8]">{row.createdAt}</td>
                    <td>
                      <button className="text-sm font-medium text-[#2F7BFF]" type="button">查看</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex h-[64px] shrink-0 items-center justify-end gap-5 border-t border-[#E3E9F3] px-6 text-sm text-[#5F6B7A]">
        <span className="mr-4">共 {totalCount} 条</span>
        <button className="text-[#8A98B3] disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage <= 1} onClick={() => onPageChange((page) => Math.max(1, page - 1))} type="button">
          上一页
        </button>
        {visiblePages.map((page) => (
          <button key={page} className={`h-8 w-8 rounded-[6px] ${page === currentPage ? 'bg-[#2F7BFF] font-semibold text-white' : 'text-[#5F6B7A]'}`} onClick={() => onPageChange(page)} type="button">
            {page}
          </button>
        ))}
        {pageCount > visiblePages.at(-1) ? <span>...</span> : null}
        {pageCount > visiblePages.at(-1) ? (
          <button className="h-8 w-8 rounded-[6px] text-[#5F6B7A]" onClick={() => onPageChange(pageCount)} type="button">{pageCount}</button>
        ) : null}
        <button className="text-[#111827] disabled:cursor-not-allowed disabled:opacity-40" disabled={currentPage >= pageCount} onClick={() => onPageChange((page) => Math.min(pageCount, page + 1))} type="button">
          下一页
        </button>
        <span className="ml-8 font-semibold text-[#1D273B]">前往</span>
        <input className="h-9 w-16 rounded-[6px] border border-[#D7DEE9] text-center font-semibold text-[#111827] outline-none" value={currentPage} onChange={(event) => {
          const page = Number(event.target.value);
          if (Number.isFinite(page) && page >= 1) onPageChange(Math.min(pageCount, page));
        }} />
        <span className="font-semibold text-[#1D273B]">页</span>
      </div>
    </section>
  );
}

function TableButton({ children, icon: Icon, className = '' }) {
  return (
    <button className={`inline-flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-[7px] border border-[#D7DEE9] bg-white px-4 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.035)] ${className}`} type="button">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function DetailPanel({ task, onComplete, onUpgrade, onTransfer, slaClock }) {
  if (!task) return null;

  return (
    <section className="shrink-0 overflow-hidden rounded-[8px] border border-[#E3E9F3] bg-white px-4 py-3.5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-[#111827]">{task.title}</h2>
          <RiskTag type={task.riskLevel} className="h-6 rounded-full px-3 text-xs">{task.riskLevel}风险</RiskTag>
        </div>
        <button className="text-[#8A98B3]" type="button"><X className="h-4.5 w-4.5" /></button>
      </div>
      <div className="grid grid-cols-2 gap-5 border-b border-[#E6EAF2] pb-3 text-[13px]">
        <div>
          <div className="mb-1.5 text-[#7889A8]">{task.sourceType}</div>
          <div className="text-sm font-semibold text-[#263246]">{task.source}</div>
        </div>
        <div>
          <div className="mb-1.5 text-[#7889A8]">截止时间</div>
          <div className="text-sm font-semibold text-[#263246]">
            {task.deadline}
            {task.remainingSLA !== '-' ? (
              <span className="ml-2 text-[#FF1F1F]">(剩余时间 <SlaCountdown value={task.remainingSLA} {...slaClock} normalClassName="text-[#FF1F1F]" />)</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-b border-[#E6EAF2] py-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#111827]">任务描述</h3>
          <div className="flex items-center gap-2 text-[13px] text-[#7889A8]">
            <span>负责人</span>
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#D8E6FF] to-[#FFE2D6] text-[11px] font-semibold text-[#1D273B] shadow-[0_1px_3px_rgba(16,24,40,0.18)]">{task.owner.slice(0, 1)}</span>
            <span className="font-semibold text-[#263246]">{task.owner}</span>
            <button className="font-medium text-[#2F7BFF]" type="button" onClick={onTransfer}>更换</button>
          </div>
        </div>
        <p className="text-sm leading-6 text-[#5F6B7A]">{task.description}</p>
        <p className="mt-3 text-sm text-[#5F6B7A]">{task.impact}</p>
      </div>
      <div className="py-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#111827]">处理记录</h3>
          <button className="text-[13px] text-[#7889A8]" type="button">查看全部记录</button>
        </div>
        <div className="space-y-3">
          {task.processLogs.slice(0, 3).map((log, index) => (
            <div key={`${log.time}-${log.action}-${index}`} className="grid gap-2 text-[13px]" style={{ gridTemplateColumns: '18px 78px 66px minmax(0, 1fr)' }}>
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${logDotClass(log.tone)}`} />
              <span className="text-[#7889A8]">{log.time}</span>
              <span className="font-semibold text-[#263246]">{log.owner}</span>
              <div><div className="font-semibold text-[#1D273B]">{log.action}</div><div className="mt-0.5 text-xs text-[#7889A8]">{log.detail}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <ActionButton onClick={onTransfer}>转交</ActionButton>
        <ActionButton>退回</ActionButton>
        <ActionButton danger onClick={onUpgrade}>升级主管</ActionButton>
        <button className="h-10 rounded-[6px] bg-[#2F7BFF] text-[13px] font-semibold text-white" onClick={onComplete} type="button">完成任务</button>
      </div>
    </section>
  );
}

function ActionButton({ children, danger = false, onClick }) {
  return (
    <button className={`h-10 rounded-[6px] border bg-white text-[13px] font-semibold ${danger ? 'border-[#FF1F1F] text-[#FF1F1F]' : 'border-[#C9D3E1] text-[#263246]'}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function DeadlineStats() {
  const stats = [
    { label: '已超时', value: 3, color: '#FF1F1F', width: '42%' },
    { label: '2 小时内', value: 5, color: '#FF1F1F', width: '62%' },
    { label: '2-8 小时', value: 12, color: '#FF8A00', width: '86%' },
    { label: '8-24 小时', value: 18, color: '#FFB547', width: '92%' },
    { label: '24 小时以上', value: 26, color: '#C9D3E1', width: '100%' },
  ];
  return (
    <section className="shrink-0 overflow-hidden rounded-[8px] border border-[#E3E9F3] bg-white p-3 shadow-[var(--shadow-card)]" style={{ height: 112 }}>
      <h2 className="mb-1.5 text-[15px] font-semibold text-[#111827]">截止时间分布（按任务数）</h2>
      <div className="grid grid-cols-5 gap-1 text-center">
        {stats.map((item) => (
          <div key={item.label}><div className="text-xs text-[#7889A8]">{item.label}</div><div className="text-[16px] font-semibold" style={{ color: item.color === '#C9D3E1' ? '#A1ADC2' : item.color }}>{item.value}</div><div className="mt-1 h-2 rounded-full bg-[#E6EAF2]"><div className="h-full rounded-full" style={{ width: item.width, backgroundColor: item.color }} /></div></div>
        ))}
      </div>
    </section>
  );
}

function TeamOverview() {
  const rows = [
    ['王敏', 8, 2, 5, '80%', '#FF4D4F'], ['赵宁', 7, 1, 4, '70%', '#FF1F1F'], ['陈浩', 6, 0, 3, '60%', '#FF7A1A'], ['刘畅', 4, 0, 2, '50%', '#FF8A2A'],
    ['周扬', 5, 1, 3, '60%', '#FF8A00'], ['张磊', 3, 0, 1, '30%', '#8DBBFF'], ['李娜', 2, 0, 1, '20%', '#8DBBFF'], ['未分派', 6, 0, 2, '0%', '#DDE4EE'],
  ];
  return (
    <section className="shrink-0 overflow-hidden rounded-[8px] border border-[#E3E9F3] bg-white px-4 py-3 shadow-[var(--shadow-card)]" style={{ minHeight: 282 }}>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-[#111827]">团队任务概览</h2><button className="inline-flex items-center gap-1 text-xs text-[#7889A8]" type="button">查看全部成员<ChevronRight className="h-4 w-4" /></button></div>
      <div className="grid gap-2 text-xs text-[#7889A8]" style={{ gridTemplateColumns: '54px 50px 50px 54px minmax(0, 1fr) 42px' }}><span>成员</span><span>进行中</span><span>已超时</span><span>高风险</span><span>负载(容量)</span><span /></div>
      <div className="mt-2 space-y-2 text-xs">
        {rows.map(([name, doing, overdue, high, percent, color]) => (
          <div key={name} className="grid items-center gap-2" style={{ gridTemplateColumns: '54px 50px 50px 54px minmax(0, 1fr) 42px' }}><span className="font-medium text-[#263246]">{name}</span><span>{doing}</span><span className={overdue ? 'text-[#FF1F1F]' : ''}>{overdue}</span><span>{high}</span><span className="h-2.5 rounded-full bg-[#E6EAF2]"><span className="block h-full rounded-full" style={{ width: percent, backgroundColor: color }} /></span><span className="text-right text-[#263246]">{percent}</span></div>
        ))}
      </div>
    </section>
  );
}

function TransferModal({ open, task, owner, onOwnerChange, onClose, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/20">
      <div className="w-[360px] rounded-[12px] border border-[#E3E9F3] bg-white p-5 shadow-[0_20px_60px_rgba(16,24,40,0.22)]">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-[#111827]">转交任务</h2><button className="text-[#8A98B3]" onClick={onClose} type="button"><X className="h-4 w-4" /></button></div>
        <div className="mb-4 rounded-[8px] bg-[#F5F7FB] px-3 py-2 text-sm text-[#5F6B7A]">{task?.title}</div>
        <label className="block"><span className="mb-2 block text-sm font-medium text-[#7889A8]">选择负责人</span><select className="h-10 w-full rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm font-medium text-[#263246] outline-none focus:border-[#2F7BFF]" value={owner} onChange={(event) => onOwnerChange(event.target.value)}>{owners.filter((item) => item !== '未分派').map((item) => (<option key={item} value={item}>{item}</option>))}</select></label>
        <div className="mt-5 flex justify-end gap-2"><button className="h-9 rounded-[6px] border border-[#C9D3E1] px-4 text-sm font-semibold text-[#263246]" onClick={onClose} type="button">取消</button><button className="h-9 rounded-[6px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white" onClick={onConfirm} type="button">确认转交</button></div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const location = useLocation();
  const { showToast } = useToast();
  const { completeTask: completeGeneratedTask, generatedTasks, updateGeneratedTask } = useDemoState();
  const slaClock = useSlaClock();
  const [taskRows, setTaskRows] = useState(() => mockTasks);
  const [activeTab, setActiveTab] = useState('全部');
  const [filters, setFilters] = useState({ owner: '全部', source: '全部', risk: '全部', deadline: '全部' });
  const [selectedTaskId, setSelectedTaskId] = useState(() => location.state?.detailTaskId ?? location.state?.highlightTaskId ?? mockTasks[0]?.id);
  const [selectedIds, setSelectedIds] = useState(() => [location.state?.highlightTaskId ?? location.state?.detailTaskId ?? mockTasks[0]?.id].filter(Boolean));
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferOwner, setTransferOwner] = useState('王敏');
  const [currentPage, setCurrentPage] = useState(1);

  const allTaskRows = useMemo(() => [...generatedTasks, ...taskRows], [generatedTasks, taskRows]);

  useEffect(() => {
    const incomingTaskId = location.state?.detailTaskId ?? location.state?.highlightTaskId;
    if (!incomingTaskId) return;
    setActiveTab('全部');
    setSelectedTaskId(incomingTaskId);
    setSelectedIds([incomingTaskId]);
  }, [location.state]);

  useEffect(() => {
    if (selectedTaskId) return;
    setSelectedTaskId(allTaskRows[0]?.id);
  }, [allTaskRows, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    return allTaskRows.filter((task) => {
      const tabMatch = activeTab === '全部' || statusForTab(task.status) === activeTab;
      return tabMatch && (filters.owner === '全部' || task.owner === filters.owner) && (filters.source === '全部' || task.sourceType === filters.source) && (filters.risk === '全部' || task.riskLevel === filters.risk) && matchesLiveDeadlineFilter(task, filters.deadline, slaClock.nowMs, slaClock.anchorMs);
    });
  }, [activeTab, allTaskRows, filters, slaClock.anchorMs, slaClock.nowMs]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / TASK_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedTasks = filteredTasks.slice((safePage - 1) * TASK_PAGE_SIZE, safePage * TASK_PAGE_SIZE);
  const visiblePages = getVisiblePages(safePage, pageCount);
  const selectedTask = allTaskRows.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? allTaskRows[0];
  const allSelected = pagedTasks.length > 0 && pagedTasks.every((task) => selectedIds.includes(task.id));

  const updateTask = (patch, toastMessage) => {
    if (!selectedTask) return;
    const applyPatch = (task) => ({ ...task, ...patch, processLogs: [...task.processLogs, { time: '刚刚', owner: task.owner === '未分派' ? '系统' : task.owner, action: patch.status === '已完成' ? '完成任务' : patch.status === '已升级' ? '升级主管' : '更新任务', detail: toastMessage, tone: patch.status === '已升级' ? 'red' : 'green' }] });
    if (selectedTask.sourceKind) { updateGeneratedTask(selectedTask.id, applyPatch); showToast({ message: toastMessage, type: patch.status === '已升级' ? 'info' : 'success' }); return; }
    setTaskRows((current) => current.map((task) => (task.id === selectedTask.id ? applyPatch(task) : task)));
    showToast({ message: toastMessage, type: patch.status === '已升级' ? 'info' : 'success' });
  };
  const completeTask = () => { if (selectedTask?.sourceKind) { completeGeneratedTask(selectedTask.id); showToast({ message: '任务已完成，对应异常状态已同步', type: 'success' }); return; } updateTask({ status: '已完成', remainingSLA: '-' }, '任务已完成'); };
  const upgradeTask = () => { updateTask({ status: '已升级' }, '已升级主管'); };
  const confirmTransfer = () => {
    if (!selectedTask) return;
    const applyTransfer = (task) => ({ ...task, owner: transferOwner, status: task.status === '待分派' ? '已分派' : task.status, processLogs: [...task.processLogs, { time: '刚刚', owner: '系统', action: '转交任务', detail: `已转交给 ${transferOwner}`, tone: 'green' }] });
    if (selectedTask.sourceKind) { updateGeneratedTask(selectedTask.id, applyTransfer); setTransferOpen(false); showToast({ message: `已转交给 ${transferOwner}`, type: 'success' }); return; }
    setTaskRows((current) => current.map((task) => (task.id === selectedTask.id ? applyTransfer(task) : task)));
    setTransferOpen(false);
    showToast({ message: `已转交给 ${transferOwner}`, type: 'success' });
  };
  const toggleAll = () => { setSelectedIds((current) => { const visibleIds = pagedTasks.map((task) => task.id); if (allSelected) return current.filter((id) => !visibleIds.includes(id)); return [...new Set([...current, ...visibleIds])]; }); };
  const resetFilters = () => { setFilters({ owner: '全部', source: '全部', risk: '全部', deadline: '全部' }); setActiveTab('全部'); };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[760px] flex-col overflow-hidden">
      <header className="mb-4 flex shrink-0 items-center justify-between"><h1 className="text-[24px] font-semibold tracking-[-0.01em] text-[#111827]">任务协同</h1><div className="flex items-center gap-4"><span className="text-sm text-[#8A98B3]">数据更新时间：2026-06-01 09:41:52</span><button className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#1D273B] shadow-[0_3px_10px_rgba(28,39,71,0.04)]" type="button"><RefreshCw className="h-4 w-4" />刷新数据</button></div></header>
      <div className="grid min-h-0 flex-1 gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 405px' }}>
        <div className="flex min-h-0 flex-col">
          <nav className="mb-3 flex shrink-0 items-center" style={{ columnGap: 56 }}>{tabs.map((tab) => (<button key={tab} className={`relative h-9 text-[15px] font-medium ${activeTab === tab ? 'text-[#2F7BFF]' : 'text-[#1D273B]'}`} onClick={() => setActiveTab(tab)} type="button">{tab}{activeTab === tab ? <span className="absolute bottom-0 left-0 h-1 w-8 rounded-full bg-[#2F7BFF]" /> : null}</button>))}</nav>
          <section className="mb-4 flex shrink-0 items-end gap-7"><FilterBox label="负责人" value={filters.owner} options={['全部', ...owners]} onChange={(value) => setFilters((current) => ({ ...current, owner: value }))} /><FilterBox label="异常来源" value={filters.source} options={sources} onChange={(value) => setFilters((current) => ({ ...current, source: value }))} /><FilterBox label="风险等级" value={filters.risk} options={risks} onChange={(value) => setFilters((current) => ({ ...current, risk: value }))} /><DeadlineFilter value={filters.deadline} onChange={(value) => setFilters((current) => ({ ...current, deadline: value }))} /><div className="flex flex-col"><span aria-hidden="true" className="mb-1.5 block h-5" /><button className="h-10 min-w-[104px] rounded-[7px] border border-[#D7DEE9] bg-white px-7 text-sm font-semibold text-[#263246]" type="button">更多筛选</button></div><div className="flex flex-col"><span aria-hidden="true" className="mb-1.5 block h-5" /><button className="h-10 min-w-[76px] rounded-[7px] border border-[#D7DEE9] bg-white px-7 text-sm font-semibold text-[#263246]" onClick={resetFilters} type="button">重置</button></div></section>
          <TaskTable rows={pagedTasks} selectedTaskId={selectedTask?.id} selectedIds={selectedIds} onSelectTask={setSelectedTaskId} onToggleSelected={(id) => setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))} onToggleAll={toggleAll} allSelected={allSelected} totalCount={filteredTasks.length} currentPage={safePage} pageCount={pageCount} visiblePages={visiblePages} onPageChange={setCurrentPage} slaClock={slaClock} />
        </div>
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1"><DetailPanel task={selectedTask} onComplete={completeTask} onUpgrade={upgradeTask} onTransfer={() => { setTransferOwner(selectedTask?.owner && selectedTask.owner !== '未分派' ? selectedTask.owner : '王敏'); setTransferOpen(true); }} slaClock={slaClock} /><DeadlineStats /><TeamOverview /></aside>
      </div>
      <TransferModal open={transferOpen} task={selectedTask} owner={transferOwner} onOwnerChange={setTransferOwner} onClose={() => setTransferOpen(false)} onConfirm={confirmTransfer} />
    </div>
  );
}
