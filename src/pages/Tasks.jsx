import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
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
import FilterSelect from '../components/common/FilterSelect.jsx';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog.jsx';
import PageHeaderActionButton from '../components/common/PageHeaderActionButton.jsx';
import RiskTag from '../components/common/RiskTag.jsx';
import TaskAcceptanceDialog from '../components/common/TaskAcceptanceDialog.jsx';
import TaskCreateModal from '../components/common/TaskCreateModal.jsx';
import TaskReturnDialog from '../components/common/TaskReturnDialog.jsx';
import LiveUpdateTime from '../components/LiveUpdateTime.jsx';
import { formatCompactDateTime } from '../data/demoTime.js';
import { taskTeamMembers } from '../data/mockData.js';
import { useToast } from '../components/common/Toast.jsx';
import { useRefreshTime } from '../hooks/useRefreshTime.js';
import { useSlaClock } from '../hooks/useSlaClock.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { useTopbarFilter } from '../state/TopbarFilterContext.jsx';
import { getTaskTransitionBlockReason } from '../state/taskAssignment.js';
import { getTaskReturnAction } from '../state/taskReturn.js';
import { getTaskAcceptanceBlockReason, getTaskAcceptanceChecks } from '../state/taskAcceptance.js';
import { formatTaskTabNoticeCount, prioritizeTasksByIds } from '../state/taskTabNotices.js';
import { getTaskSlaPresentation, isTaskSlaOverdue } from '../state/taskSla.js';
import {
  applyTaskRebalancingPlan,
  buildTaskRebalancingPlan,
  calculateMemberWorkloads,
  calculateTransferPreview,
  recommendTaskAssignees,
} from '../state/taskWorkload.js';
import {
  buildBatchTaskPatch,
  buildTaskReminderPatch,
  buildTasksCsv,
  calculateDeadlineDistribution,
  resolveExportTasks,
  sortTasksByCreatedAt,
  sortTasksByDeadline,
} from '../state/taskOperations.js';
import { getCenteredIndicatorOffset } from './orders/tabIndicator.js';
import TaskAdvancedFilterPopover from './tasks/TaskAdvancedFilterPopover.jsx';
import TaskRebalancingDialog from './tasks/TaskRebalancingDialog.jsx';
import TaskTransferDialog from './tasks/TaskTransferDialog.jsx';
import {
  matchesTaskAdvancedFilters,
  taskAdvancedFilterDefaults,
} from './tasks/taskAdvancedFilters.js';
import { matchesTaskTab } from './tasks/taskListVisibility.js';
import { canRemindTask, getTaskDetailActionPolicy } from './tasks/taskDetailActions.js';

const tabs = ['全部待办', '已分派', '处理中', '待验收', '已超时', '已升级', '已完成'];
const owners = ['王敏', '赵宁', '陈浩', '刘畅', '周扬', '张磊', '李娜'];
const sources = ['全部', '来源订单', '库存风险', '物流异常', '平台同步', '售后异常'];
const risks = ['全部', '高', '中', '低'];
const deadlines = ['全部', '今天', '2小时内', '已超时', '24小时内'];
const TASK_PAGE_SIZE = 9;
const DEFAULT_TASK_FILTERS = { owner: '全部', source: '全部', risk: '全部', deadline: '全部' };
function getVisiblePages(currentPage, pageCount) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
}

function normalizeKeyword(value) {
  return String(value ?? '').trim().toLowerCase();
}

function matchesKeyword(fields, keyword) {
  const normalizedKeyword = normalizeKeyword(keyword);
  if (!normalizedKeyword) return true;
  return fields.some((field) => normalizeKeyword(field).includes(normalizedKeyword));
}

function matchesTaskKeyword(task, keyword) {
  return matchesKeyword(
    [
      task.title,
      task.source,
      task.sourceType,
      task.owner,
      task.status,
      task.riskLevel,
      task.description,
      task.impact,
      ...(task.processLogs ?? []).flatMap((log) => [log.time, log.owner, log.action, log.detail]),
    ],
    keyword,
  );
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
  if (tone === 'orange') return 'bg-[#F79009]';
  return 'bg-[#2F7BFF]';
}

function matchesLiveDeadlineFilter(task, filter, nowMs, anchorMs) {
  if (filter === deadlines[0]) return true;
  if (typeof task.deadline === 'string' && task.deadline.includes(filter)) return true;

  const sla = getTaskSlaPresentation(task, nowMs, anchorMs);
  if (filter === deadlines[2]) return sla.state === 'remaining' && sla.seconds < 7200;
  if (filter === deadlines[3]) return sla.state === 'overdue';

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
    <FilterSelect
      label={label}
      value={value}
      options={options}
      placeholder="全部"
      placeholderValue="全部"
      includePlaceholder={false}
      onChange={onChange}
      ariaLabel={label}
      className={wide ? 'w-[250px]' : 'w-[150px]'}
      labelClassName="mb-1.5 block text-[13px] font-medium text-[#7889A8]"
      controlClassName="w-full"
      triggerClassName="h-10 w-full rounded-[7px] px-3 text-sm font-medium"
      menuClassName="w-max min-w-full"
      optionClassName="px-3 py-2 text-sm"
    />
  );
}

function TaskSlaDisplay({ task, slaClock, className = '' }) {
  const sla = getTaskSlaPresentation(task, slaClock.nowMs, slaClock.anchorMs);
  const toneClassName = sla.state === 'overdue' || (sla.state === 'remaining' && sla.seconds < 7200)
    ? 'text-[#FF1F1F]'
    : sla.state === 'completed'
      ? 'text-[#5F6B7A]'
      : 'text-[#1D273B]';

  return <span className={`${toneClassName} ${className}`.trim()}>{sla.label}</span>;
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
  focusedTaskIds,
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
  onBulkTransfer,
  onBulkUpgrade,
  onBulkRemind,
  onExport,
  onSort,
  onRefresh,
  onCreate,
  sortDirection,
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-[#E3E9F3] bg-white shadow-[var(--shadow-card)]">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4">
        <div className="flex shrink-0 items-end gap-3">
          <h2 className="whitespace-nowrap text-[18px] font-semibold text-[#111827]">任务列表</h2>
          <span className="pb-0.5 text-sm text-[#7889A8]">共 {totalCount} 条</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-1.5">
          <TableButton onClick={onBulkTransfer}>批量转交</TableButton>
          <TableButton onClick={onBulkRemind}>批量催办</TableButton>
          <TableButton onClick={onBulkUpgrade}>批量升级</TableButton>
          <TableButton icon={Download} onClick={onExport}>导出</TableButton>
          <TableButton aria-pressed={Boolean(sortDirection)} className="w-[126px]" onClick={onSort}>
            {sortDirection === 'asc' ? '截止时间升序' : sortDirection === 'desc' ? '截止时间降序' : '按截止时间排序'}
          </TableButton>
          <TableButton icon={RefreshCw} onClick={onRefresh}>刷新</TableButton>
          <button className="inline-flex h-10 items-center gap-1 whitespace-nowrap rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)]" onClick={onCreate} type="button">
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
              <th>SLA 状态</th>
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
                const focused = focusedTaskIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={`h-[56px] cursor-pointer border-b border-[#E3E9F3] transition ${focused ? 'task-row-arrival ' : ''}${
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
                      <TaskSlaDisplay task={row} slaClock={slaClock} />
                    </td>
                    <td className="text-[#7889A8]">
                      <span className="whitespace-nowrap" title={row.createdAt}>
                        {formatCompactDateTime(row.createdAt)}
                      </span>
                    </td>
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

function TableButton({ children, icon: Icon, className = '', ...buttonProps }) {
  return (
    <button {...buttonProps} className={`inline-flex h-10 items-center justify-center gap-1 whitespace-nowrap rounded-[7px] border border-[#D7DEE9] bg-white px-4 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.035)] transition hover:border-[#9CC0FF] hover:bg-[#F7FAFF] active:scale-[0.98] ${className}`} type="button">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

function DetailPanel({
  task,
  acceptanceBlockReason,
  acceptanceChecks,
  onAccept,
  onRemind,
  onReturn,
  onUpgrade,
  onTransfer,
  slaClock,
}) {
  if (!task) return null;
  const returnAction = getTaskReturnAction(task);
  const actionPolicy = getTaskDetailActionPolicy(task);
  const primaryBlockReason = actionPolicy.primaryAction === 'accept' ? acceptanceBlockReason : '';
  const actionCount = Number(Boolean(actionPolicy.primaryAction))
    + Number(actionPolicy.canTransfer)
    + Number(Boolean(returnAction))
    + Number(actionPolicy.canUpgrade);
  const primaryAction = actionPolicy.primaryAction === 'remind'
    ? onRemind
    : actionPolicy.primaryAction === 'accept'
      ? onAccept
      : undefined;

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
              <span className="ml-2">(<TaskSlaDisplay task={task} slaClock={slaClock} />)</span>
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
            {actionPolicy.canChangeOwner ? (
              <button className="font-medium text-[#2F7BFF]" type="button" onClick={onTransfer}>更换</button>
            ) : null}
          </div>
        </div>
        <p className="text-sm leading-6 text-[#5F6B7A]">{task.description}</p>
        <p className="mt-3 text-sm text-[#5F6B7A]">{task.impact}</p>
      </div>
      {task.completionEvidence ? (
        <div className="border-b border-[#E6EAF2] py-3">
          <h3 className="mb-2 text-[16px] font-semibold text-[#111827]">员工提交结果</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <EvidenceItem label="提交人" value={task.completionEvidence.submittedBy || task.owner} />
            <EvidenceItem label="提交时间" value={task.completionEvidence.submittedAt || '-'} />
            <EvidenceItem label="处理结果" value={task.completionEvidence.result} wide />
            <EvidenceItem label="执行说明" value={task.completionEvidence.description} wide />
            <EvidenceItem label="原异常" value={task.completionEvidence.resolvedSource ? '已解决' : '未解决'} />
            <EvidenceItem label="关联单号" value={task.completionEvidence.referenceNo || '-'} />
            <EvidenceItem label="执行数量" value={task.completionEvidence.quantity || '-'} />
            <EvidenceItem label="实际成本" value={task.completionEvidence.cost ? `¥${task.completionEvidence.cost}` : '-'} />
            <EvidenceItem label="附件" value={task.completionEvidence.attachment?.name || '-'} wide />
          </div>
        </div>
      ) : null}
      {task.status === '待验收' ? (
        <div className="border-b border-[#E6EAF2] py-3">
          <h3 className="mb-2 text-[16px] font-semibold text-[#111827]">系统验收检查</h3>
          <div className="space-y-1.5 text-xs">
            {acceptanceChecks.map((check) => (
              <div key={check.key} className="flex items-center gap-2">
                {check.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#20A162]" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[#FF1F1F]" />
                )}
                <span className={check.passed ? 'text-[#5F6B7A]' : 'text-[#FF1F1F]'}>{check.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {task.acceptance ? (
        <div className="border-b border-[#E6EAF2] py-3">
          <h3 className="mb-2 text-[16px] font-semibold text-[#111827]">验收记录</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <EvidenceItem label="验收人" value={task.acceptance.reviewer} />
            <EvidenceItem label="验收时间" value={task.acceptance.reviewedAt} />
            <EvidenceItem label="验收备注" value={task.acceptance.note || '已核对处理结果和凭证'} wide />
          </div>
        </div>
      ) : null}
      <div className="py-3">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-[#111827]">处理记录</h3>
          <button className="text-[13px] text-[#7889A8]" type="button">查看全部记录</button>
        </div>
        <div className="space-y-3">
          {task.processLogs.slice(-3).map((log, index) => (
            <div key={`${log.time}-${log.action}-${index}`} className="grid gap-2 text-[13px]" style={{ gridTemplateColumns: '18px 78px 66px minmax(0, 1fr)' }}>
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${logDotClass(log.tone)}`} />
              <span className="text-[#7889A8]">{log.time}</span>
              <span className="font-semibold text-[#263246]">{log.owner}</span>
              <div><div className="font-semibold text-[#1D273B]">{log.action}</div><div className="mt-0.5 text-xs text-[#7889A8]">{log.detail}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${actionCount}, minmax(0, 1fr))` }}>
        {actionPolicy.canTransfer ? <ActionButton onClick={onTransfer}>{actionPolicy.transferLabel}</ActionButton> : null}
        {returnAction ? (
          <ActionButton onClick={onReturn}>{returnAction.label}</ActionButton>
        ) : null}
        {actionPolicy.canUpgrade ? <ActionButton danger onClick={onUpgrade}>升级主管</ActionButton> : null}
        {actionPolicy.primaryAction ? (
          <button
            className="h-10 rounded-[6px] bg-[#2F7BFF] text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#AFCBFF]"
            disabled={actionPolicy.primaryDisabled || Boolean(primaryBlockReason)}
            onClick={primaryAction}
            title={primaryBlockReason || undefined}
            type="button"
          >
            {actionPolicy.primaryLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function EvidenceItem({ label, value, wide = false }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <span className="text-[#8A98B3]">{label}：</span>
      <span className="break-words font-medium text-[#344767]">{value}</span>
    </div>
  );
}

function ActionButton({ children, danger = false, onClick }) {
  return (
    <button className={`h-10 rounded-[6px] border bg-white text-[13px] font-semibold ${danger ? 'border-[#FF1F1F] text-[#FF1F1F]' : 'border-[#C9D3E1] text-[#263246]'}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function DeadlineStats({ tasks, slaClock }) {
  const distribution = useMemo(
    () => calculateDeadlineDistribution(tasks, slaClock.nowMs, slaClock.anchorMs),
    [slaClock.anchorMs, slaClock.nowMs, tasks],
  );
  const stats = [
    { label: '已超时', value: distribution.overdue, color: '#FF1F1F' },
    { label: '2 小时内', value: distribution.within2Hours, color: '#FF1F1F' },
    { label: '2-8 小时', value: distribution.within8Hours, color: '#FF8A00' },
    { label: '8-24 小时', value: distribution.within24Hours, color: '#FFB547' },
    { label: '24 小时以上', value: distribution.over24Hours, color: '#C9D3E1' },
  ];
  const maxValue = Math.max(0, ...stats.map((item) => item.value));
  return (
    <section className="shrink-0 overflow-hidden rounded-[8px] border border-[#E3E9F3] bg-white p-3 shadow-[var(--shadow-card)]" style={{ height: 112 }}>
      <h2 className="mb-1.5 text-[15px] font-semibold text-[#111827]">截止时间分布（按任务数）</h2>
      <div className="grid grid-cols-5 gap-1 text-center">
        {stats.map((item) => (
          <div key={item.label}><div className="text-xs text-[#7889A8]">{item.label}</div><div className="text-[16px] font-semibold" style={{ color: item.color === '#C9D3E1' ? '#A1ADC2' : item.color }}>{item.value}</div><div className="mt-1 h-2 rounded-full bg-[#E6EAF2]"><div className="h-full rounded-full transition-[width] duration-300" style={{ width: maxValue ? `${Math.round((item.value / maxValue) * 100)}%` : '0%', backgroundColor: item.color }} /></div></div>
        ))}
      </div>
    </section>
  );
}

function TeamOverview({ tasks, slaClock, onGeneratePlan }) {
  const rows = useMemo(
    () => calculateMemberWorkloads(tasks, taskTeamMembers, slaClock.nowMs, slaClock.anchorMs),
    [slaClock.anchorMs, slaClock.nowMs, tasks],
  );

  const getLoadColor = (percent) => {
    if (percent >= 70) return '#FF4D4F';
    if (percent >= 40) return '#FF8A00';
    if (percent > 0) return '#8DBBFF';
    return '#DDE4EE';
  };

  return (
    <section className="shrink-0 overflow-hidden rounded-[8px] border border-[#E3E9F3] bg-white px-4 py-3 shadow-[var(--shadow-card)]" style={{ minHeight: 282 }}>
      <div className="mb-3 flex items-center justify-between"><h2 className="text-[16px] font-semibold text-[#111827]">团队任务概览</h2><button className="inline-flex items-center gap-1 text-xs text-[#2F7BFF]" onClick={onGeneratePlan} type="button">生成调度方案<ChevronRight className="h-4 w-4" /></button></div>
      <div className="grid gap-1 text-[11px] text-[#7889A8]" style={{ gridTemplateColumns: '76px 42px 42px 46px minmax(0, 1fr) 38px' }}><span>成员</span><span>进行中</span><span>已超时</span><span>高风险</span><span>负载</span><span /></div>
      <div className="mt-2 space-y-2 text-xs">
        {rows.map(({ name, active, overdue, highRisk, loadPercent, level, availability }) => (
          <div key={name} className="grid items-center gap-1" style={{ gridTemplateColumns: '76px 42px 42px 46px minmax(0, 1fr) 38px' }}>
            <span className="flex min-w-0 items-center gap-1 font-medium text-[#263246]">
              <span>{name}</span>
              <span className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold ${availability === '不可用' ? 'bg-[#EEF1F6] text-[#8A98B3]' : level === 'overloaded' ? 'bg-[#FFF0F0] text-[#FF3B30]' : level === 'busy' ? 'bg-[#FFF5E8] text-[#E87900]' : 'bg-[#EAF8F0] text-[#12A66A]'}`}>{availability === '不可用' ? '不可用' : level === 'overloaded' ? '过载' : level === 'busy' ? '忙碌' : '可接单'}</span>
            </span>
            <span>{active}</span>
            <span className={overdue ? 'text-[#FF1F1F]' : ''}>{overdue}</span>
            <span>{highRisk}</span>
            <span className="h-2.5 rounded-full bg-[#E6EAF2]"><span className="block h-full rounded-full transition-[width] duration-300" style={{ width: `${Math.min(100, loadPercent)}%`, backgroundColor: getLoadColor(loadPercent) }} /></span>
            <span className="text-right text-[#263246]">{loadPercent}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Tasks() {
  const location = useLocation();
  const { showToast } = useToast();
  const {
    acceptTask,
    createManualTask,
    inventory,
    orders,
    tasks,
    taskTabNotices,
    clearTaskTabNotice,
    reopenTask,
    returnTask,
    updateTask: updateTaskState,
    updateTasks: updateTasksState,
  } = useDemoState();
  const { keyword: topbarKeyword, setKeyword } = useTopbarFilter();
  const { refreshTime, refreshNow } = useRefreshTime();
  const slaClock = useSlaClock();
  const [activeTab, setActiveTab] = useState('全部待办');
  const tabListRef = useRef(null);
  const tabButtonRefs = useRef(new Map());
  const indicatorReadyRef = useRef(false);
  const [tabIndicator, setTabIndicator] = useState({ x: 0, ready: false, animated: false });
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS);
  const [advancedFilters, setAdvancedFilters] = useState(taskAdvancedFilterDefaults);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [focusedTaskIds, setFocusedTaskIds] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(() => location.state?.detailTaskId ?? location.state?.highlightTaskId ?? tasks[0]?.id);
  const [selectedIds, setSelectedIds] = useState(() => [location.state?.highlightTaskId ?? location.state?.detailTaskId ?? tasks[0]?.id].filter(Boolean));
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMode, setTransferMode] = useState('single');
  const [transferOwner, setTransferOwner] = useState('王敏');
  const [currentPage, setCurrentPage] = useState(1);
  const [acceptanceOpen, setAcceptanceOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkConfirmAction, setBulkConfirmAction] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [rebalancingOpen, setRebalancingOpen] = useState(false);
  const [rebalancingPlan, setRebalancingPlan] = useState({
    moves: [],
    beforeWorkloads: [],
    afterWorkloads: [],
  });

  const allTaskRows = tasks;

  useLayoutEffect(() => {
    const tabList = tabListRef.current;
    const activeButton = tabButtonRefs.current.get(activeTab);
    if (!tabList || !activeButton) return undefined;

    const updateIndicator = () => {
      const x = getCenteredIndicatorOffset(activeButton.offsetLeft, activeButton.offsetWidth);
      setTabIndicator((current) => (
        current.x === x && current.ready
          ? current
          : { ...current, x, ready: true }
      ));
      indicatorReadyRef.current = true;
    };

    updateIndicator();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateIndicator);
      return () => window.removeEventListener('resize', updateIndicator);
    }

    const observer = new ResizeObserver(updateIndicator);
    observer.observe(tabList);
    observer.observe(activeButton);
    return () => observer.disconnect();
  }, [activeTab]);

  useEffect(() => {
    if (!tabIndicator.ready || tabIndicator.animated) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (indicatorReadyRef.current) {
        setTabIndicator((current) => ({ ...current, animated: true }));
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tabIndicator.animated, tabIndicator.ready]);

  useEffect(() => {
    const incomingTaskId = location.state?.detailTaskId ?? location.state?.highlightTaskId;
    if (!incomingTaskId) return;
    setActiveTab('全部待办');
    setAdvancedFilters(taskAdvancedFilterDefaults);
    setAdvancedFiltersOpen(false);
    setFocusedTaskIds([]);
    setSelectedTaskId(incomingTaskId);
    setSelectedIds([incomingTaskId]);
  }, [location.state]);

  useEffect(() => {
    if (selectedTaskId) return;
    setSelectedTaskId(allTaskRows[0]?.id);
  }, [allTaskRows, selectedTaskId]);

  const filteredTasks = useMemo(() => {
    return allTaskRows.filter((task) => {
      const tabMatch = matchesTaskTab(
        task,
        activeTab,
        isTaskSlaOverdue(task, slaClock.nowMs, slaClock.anchorMs),
      );
      return tabMatch
        && (filters.owner === '全部' || task.owner === filters.owner)
        && (filters.source === '全部' || task.sourceType === filters.source)
        && (filters.risk === '全部' || task.riskLevel === filters.risk)
        && matchesLiveDeadlineFilter(
          task,
          filters.deadline,
          slaClock.nowMs,
          slaClock.anchorMs,
        )
        && matchesTaskAdvancedFilters(
          task,
          advancedFilters,
          slaClock.nowMs,
          slaClock.anchorMs,
        )
        && matchesTaskKeyword(task, topbarKeyword);
    });
  }, [
    activeTab,
    advancedFilters,
    allTaskRows,
    filters,
    slaClock.anchorMs,
    slaClock.nowMs,
    topbarKeyword,
  ]);

  const displayedTasks = useMemo(() => {
    const sortedTasks = sortDirection
      ? sortTasksByDeadline(filteredTasks, sortDirection, slaClock.nowMs, slaClock.anchorMs)
      : sortTasksByCreatedAt(filteredTasks);
    return prioritizeTasksByIds(sortedTasks, focusedTaskIds);
  }, [filteredTasks, focusedTaskIds, slaClock.anchorMs, slaClock.nowMs, sortDirection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, advancedFilters, filters, topbarKeyword]);

  const pageCount = Math.max(1, Math.ceil(displayedTasks.length / TASK_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedTasks = displayedTasks.slice((safePage - 1) * TASK_PAGE_SIZE, safePage * TASK_PAGE_SIZE);
  const visiblePages = getVisiblePages(safePage, pageCount);
  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null;
  const selectedAcceptanceChecks = useMemo(
    () => getTaskAcceptanceChecks(selectedTask, orders, inventory),
    [inventory, orders, selectedTask],
  );
  const selectedAcceptanceBlockReason = getTaskAcceptanceBlockReason(selectedTask, orders, inventory);
  const selectedReturnAction = getTaskReturnAction(selectedTask);
  const selectedTaskRows = allTaskRows.filter((task) => selectedIds.includes(task.id));
  const transferTaskRows = transferMode === 'bulk'
    ? selectedTaskRows
    : [selectedTask].filter(Boolean);
  const transferReferenceTask = transferTaskRows[0];
  const transferRecommendations = useMemo(() => recommendTaskAssignees(
    transferReferenceTask,
    allTaskRows,
    taskTeamMembers,
    slaClock.nowMs,
    slaClock.anchorMs,
    3,
  ), [allTaskRows, slaClock.anchorMs, slaClock.nowMs, transferReferenceTask]);
  const transferPreview = useMemo(() => calculateTransferPreview(
    transferTaskRows,
    allTaskRows,
    taskTeamMembers,
    transferOwner,
    slaClock.nowMs,
    slaClock.anchorMs,
  ), [allTaskRows, slaClock.anchorMs, slaClock.nowMs, transferOwner, transferTaskRows]);
  const allSelected = pagedTasks.length > 0 && pagedTasks.every((task) => selectedIds.includes(task.id));

  const handleTabClick = (tab) => {
    const noticeIds = tab === '全部待办' ? [] : (taskTabNotices[tab] ?? []);
    setActiveTab(tab);

    if (!noticeIds.length) {
      setFocusedTaskIds([]);
      return;
    }

    setFilters(DEFAULT_TASK_FILTERS);
    setAdvancedFilters(taskAdvancedFilterDefaults);
    setAdvancedFiltersOpen(false);
    setKeyword('');
    setCurrentPage(1);
    setFocusedTaskIds(noticeIds);
    setSelectedTaskId(noticeIds[0]);
    setSelectedIds([]);
    clearTaskTabNotice(tab);
    showToast({ message: `已定位 ${noticeIds.length} 条新流转任务`, type: 'info' });
  };

  const updateTask = (patch, toastMessage) => {
    if (!selectedTask) return;
    const applyPatch = (task) => ({ ...task, ...patch, processLogs: [...task.processLogs, { time: '刚刚', owner: task.owner === '未分派' ? '系统' : task.owner, action: patch.status === '已完成' ? '完成任务' : patch.status === '已升级' ? '升级主管' : '更新任务', detail: toastMessage, tone: patch.status === '已升级' ? 'red' : 'green' }] });
    updateTaskState(selectedTask.id, applyPatch);
    showToast({ message: toastMessage, type: patch.status === '已升级' ? 'info' : 'success' });
  };
  const upgradeTask = () => {
    const blockReason = getTaskTransitionBlockReason(selectedTask, 'upgrade');
    if (blockReason) {
      showToast({ message: blockReason, type: 'info' });
      return;
    }
    updateTask({ status: '已升级' }, '已升级主管');
  };
  const remindTask = () => {
    if (!selectedTask || !['已分派', '处理中', '已超时'].includes(selectedTask.status)) {
      showToast({ message: '当前状态无需催办', type: 'info' });
      return;
    }
    updateTaskState(selectedTask.id, buildTaskReminderPatch);
    showToast({
      message: selectedTask.status === '已分派' ? '已提醒负责人尽快接单' : '已提醒负责人尽快处理',
      type: 'success',
    });
  };
  const openAcceptance = () => {
    if (selectedAcceptanceBlockReason) {
      showToast({ message: selectedAcceptanceBlockReason, type: 'info' });
      return;
    }
    setAcceptanceOpen(true);
  };
  const submitAcceptance = ({ confirmed, note }) => {
    if (!selectedTask) return;
    const result = acceptTask(selectedTask.id, { confirmed, note, reviewer: '张晓' });
    if (!result.ok) {
      showToast({ message: result.error, type: 'error' });
      return;
    }
    setAcceptanceOpen(false);
    showToast({ message: '任务已验收完成，对应异常状态已同步', type: 'success' });
  };
  const openTaskReturn = () => {
    if (!selectedReturnAction) {
      showToast({ message: '当前状态无法退回', type: 'info' });
      return;
    }
    setReturnDialogOpen(true);
  };
  const submitTaskReturn = ({ reason, remark }) => {
    if (!selectedTask || !selectedReturnAction) {
      showToast({ message: '当前状态无法退回', type: 'error' });
      return;
    }

    const result = selectedReturnAction.type === 'reopen'
      ? reopenTask(selectedTask.id, { reason, remark })
      : returnTask(selectedTask.id, { reason, remark });
    if (!result.ok) {
      showToast({ message: result.error, type: 'error' });
      return;
    }

    const successMessages = {
      return: '任务已退回处理中',
      reopen: '任务已重新打开',
    };
    setReturnDialogOpen(false);
    showToast({ message: successMessages[selectedReturnAction.type], type: 'success' });
  };
  const requireSelectedTasks = () => {
    if (selectedTaskRows.length) return true;
    showToast({ message: '请先勾选任务', type: 'info' });
    return false;
  };
  const applyBatchAction = (action, payload, successMessage) => {
    if (selectedTaskRows.some((task) => getTaskTransitionBlockReason(task, action))) {
      showToast({ message: '请先为所选任务分派负责人', type: 'info' });
      return;
    }
    const updater = buildBatchTaskPatch(action, payload);
    const ids = selectedTaskRows.map((task) => task.id);
    updateTasksState(ids, updater);
    setSelectedIds([]);
    setBulkConfirmAction(null);
    showToast({ message: `${successMessage}，共 ${ids.length} 条`, type: action === 'upgrade' ? 'info' : 'success' });
  };
  const openBulkTransfer = () => {
    if (!requireSelectedTasks()) return;
    const referenceTask = selectedTaskRows[0];
    const recommendedOwner = recommendTaskAssignees(
      referenceTask,
      allTaskRows,
      taskTeamMembers,
      slaClock.nowMs,
      slaClock.anchorMs,
      1,
    )[0]?.name;
    setTransferOwner(recommendedOwner || '');
    setTransferMode('bulk');
    setTransferOpen(true);
  };
  const remindSelectedTasks = () => {
    if (!requireSelectedTasks()) return;
    if (selectedTaskRows.some((task) => !canRemindTask(task))) {
      showToast({ message: '仅已分派或处理中的任务可批量催办', type: 'info' });
      return;
    }
    const ids = selectedTaskRows.map((task) => task.id);
    updateTasksState(ids, buildTaskReminderPatch);
    setSelectedIds([]);
    showToast({ message: `已批量提醒负责人，共 ${ids.length} 条`, type: 'success' });
  };
  const openBulkConfirm = (action) => {
    if (!requireSelectedTasks()) return;
    if (selectedTaskRows.some((task) => getTaskTransitionBlockReason(task, action))) {
      showToast({ message: '请先为所选任务分派负责人', type: 'info' });
      return;
    }
    setBulkConfirmAction(action);
  };
  const confirmTransfer = () => {
    if (transferMode === 'bulk') {
      applyBatchAction('transfer', { owner: transferOwner }, `已批量转交给 ${transferOwner}`);
      setTransferOpen(false);
      return;
    }
    if (!selectedTask) return;
    const applyTransfer = (task) => ({ ...task, owner: transferOwner, status: task.status === '待分派' ? '已分派' : task.status, processLogs: [...task.processLogs, { time: '刚刚', owner: '系统', action: '转交任务', detail: `已转交给 ${transferOwner}`, tone: 'green' }] });
    updateTaskState(selectedTask.id, applyTransfer);
    setTransferOpen(false);
    showToast({ message: `已转交给 ${transferOwner}`, type: 'success' });
  };
  const openSingleTransfer = () => {
    if (!selectedTask) return;
    const recommendedOwner = recommendTaskAssignees(
      selectedTask,
      allTaskRows,
      taskTeamMembers,
      slaClock.nowMs,
      slaClock.anchorMs,
      1,
    )[0]?.name;
    setTransferMode('single');
    setTransferOwner(recommendedOwner || '');
    setTransferOpen(true);
  };
  const openRebalancingPlan = () => {
    setRebalancingPlan(buildTaskRebalancingPlan(
      allTaskRows,
      taskTeamMembers,
      slaClock.nowMs,
      slaClock.anchorMs,
      5,
    ));
    setRebalancingOpen(true);
  };
  const removeRebalancingMove = (taskId) => {
    setRebalancingPlan((current) => {
      const moves = current.moves.filter((move) => move.taskId !== taskId);
      const simulatedTasks = applyTaskRebalancingPlan(allTaskRows, { moves });
      return {
        ...current,
        moves,
        afterWorkloads: calculateMemberWorkloads(
          simulatedTasks,
          taskTeamMembers,
          slaClock.nowMs,
          slaClock.anchorMs,
        ),
      };
    });
  };
  const confirmRebalancingPlan = () => {
    if (!rebalancingPlan.moves.length) return;
    const nextTasks = applyTaskRebalancingPlan(allTaskRows, rebalancingPlan);
    const nextTasksById = new Map(nextTasks.map((task) => [task.id, task]));
    const movedIds = rebalancingPlan.moves.map((move) => move.taskId);
    updateTasksState(movedIds, (task) => nextTasksById.get(task.id) || task);

    const firstMove = rebalancingPlan.moves[0];
    const before = rebalancingPlan.beforeWorkloads.find((member) => member.name === firstMove.fromOwner)?.loadPercent;
    const after = rebalancingPlan.afterWorkloads.find((member) => member.name === firstMove.fromOwner)?.loadPercent;
    setRebalancingOpen(false);
    showToast({
      message: `已重新分派 ${movedIds.length} 条任务${before == null || after == null ? '' : `，${firstMove.fromOwner}负载由 ${before}% 降至 ${after}%`}`,
      type: 'success',
    });
  };
  const exportTasks = () => {
    const tasksToExport = resolveExportTasks(allTaskRows, selectedIds, displayedTasks);
    if (!tasksToExport.length) {
      showToast({ message: '当前没有可导出的任务', type: 'info' });
      return;
    }
    const blob = new Blob([buildTasksCsv(tasksToExport)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `异常中枢-任务列表-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast({ message: `已导出 ${tasksToExport.length} 条任务`, type: 'success' });
  };
  const toggleDeadlineSort = () => {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  };
  const refreshTasks = () => {
    refreshNow();
    showToast({ message: '任务列表已刷新', type: 'success' });
  };
  const submitManualTask = (payload) => {
    const task = createManualTask(payload);
    setCreateOpen(false);
    setActiveTab('全部待办');
    setFilters(DEFAULT_TASK_FILTERS);
    setAdvancedFilters(taskAdvancedFilterDefaults);
    setAdvancedFiltersOpen(false);
    setFocusedTaskIds([]);
    setSortDirection(null);
    setCurrentPage(1);
    setSelectedTaskId(task.id);
    setSelectedIds([task.id]);
    showToast({ message: '任务已创建', type: 'success' });
  };
  const toggleAll = () => { setSelectedIds((current) => { const visibleIds = pagedTasks.map((task) => task.id); if (allSelected) return current.filter((id) => !visibleIds.includes(id)); return [...new Set([...current, ...visibleIds])]; }); };
  const resetFilters = () => {
    setFilters(DEFAULT_TASK_FILTERS);
    setAdvancedFilters(taskAdvancedFilterDefaults);
    setAdvancedFiltersOpen(false);
    setFocusedTaskIds([]);
    setActiveTab('全部待办');
    setCurrentPage(1);
  };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[760px] flex-col">
      <header className="page-header mb-4 flex shrink-0 items-center justify-between">
        <h1 className="page-title">任务协同</h1>
        <div className="flex items-center gap-4">
          <LiveUpdateTime className="text-sm text-[#8A98B3]" value={refreshTime} />
          <PageHeaderActionButton icon={RefreshCw} onClick={refreshNow}>刷新数据</PageHeaderActionButton>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 405px' }}>
        <div className="flex min-h-0 flex-col">
          <nav ref={tabListRef} className="relative mb-3 flex shrink-0 items-center" style={{ columnGap: 56 }} role="tablist">
            {tabs.map((tab) => {
              const noticeCount = tab === '全部待办' ? 0 : (taskTabNotices[tab]?.length ?? 0);
              return (
                <button
                  key={tab}
                  ref={(node) => {
                    if (node) tabButtonRefs.current.set(tab, node);
                    else tabButtonRefs.current.delete(tab);
                  }}
                  aria-label={noticeCount ? `${tab}，${noticeCount} 条新流转任务` : tab}
                  aria-selected={activeTab === tab}
                  className={`relative h-9 text-[15px] font-medium transition-colors duration-200 ${activeTab === tab ? 'text-[#2F7BFF]' : 'text-[#1D273B]'}`}
                  onClick={() => handleTabClick(tab)}
                  role="tab"
                  type="button"
                >
                  {tab}
                  {noticeCount ? (
                    <span aria-hidden="true" className="task-tab-notice-badge">
                      {formatTaskTabNoticeCount(noticeCount)}
                    </span>
                  ) : null}
                </button>
              );
            })}
            <span
              aria-hidden="true"
              className={`orders-tab-indicator${tabIndicator.ready ? ' is-ready' : ''}${tabIndicator.animated ? ' is-animated' : ''}`}
              style={{ transform: `translate3d(${tabIndicator.x}px, 0, 0)` }}
            />
          </nav>
          <section className="mb-4 flex shrink-0 items-end gap-7">
            <FilterBox
              label="负责人"
              onChange={(value) => setFilters((current) => ({ ...current, owner: value }))}
              options={['全部', ...owners]}
              value={filters.owner}
            />
            <FilterBox
              label="异常来源"
              onChange={(value) => setFilters((current) => ({ ...current, source: value }))}
              options={sources}
              value={filters.source}
            />
            <FilterBox
              label="风险等级"
              onChange={(value) => setFilters((current) => ({ ...current, risk: value }))}
              options={risks}
              value={filters.risk}
            />
            <DeadlineFilter
              onChange={(value) => setFilters((current) => ({ ...current, deadline: value }))}
              value={filters.deadline}
            />
            <TaskAdvancedFilterPopover
              filters={advancedFilters}
              onApply={(nextFilters) => {
                setAdvancedFilters(nextFilters);
                setFocusedTaskIds([]);
                setCurrentPage(1);
              }}
              onOpenChange={setAdvancedFiltersOpen}
              open={advancedFiltersOpen}
            />
            <div className="flex flex-col">
              <span aria-hidden="true" className="mb-1.5 block h-5" />
              <button
                className="h-10 min-w-[76px] rounded-[7px] border border-[#D7DEE9] bg-white px-7 text-sm font-semibold text-[#263246]"
                onClick={resetFilters}
                type="button"
              >
                重置
              </button>
            </div>
          </section>
          <TaskTable
            rows={pagedTasks}
            selectedTaskId={selectedTask?.id}
            selectedIds={selectedIds}
            focusedTaskIds={focusedTaskIds}
            onSelectTask={setSelectedTaskId}
            onToggleSelected={(id) => setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))}
            onToggleAll={toggleAll}
            allSelected={allSelected}
            totalCount={filteredTasks.length}
            currentPage={safePage}
            pageCount={pageCount}
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            slaClock={slaClock}
            onBulkTransfer={openBulkTransfer}
            onBulkRemind={remindSelectedTasks}
            onBulkUpgrade={() => openBulkConfirm('upgrade')}
            onExport={exportTasks}
            onSort={toggleDeadlineSort}
            onRefresh={refreshTasks}
            onCreate={() => setCreateOpen(true)}
            sortDirection={sortDirection}
          />
        </div>
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto pr-1"><DetailPanel task={selectedTask} acceptanceBlockReason={selectedAcceptanceBlockReason} acceptanceChecks={selectedAcceptanceChecks} onAccept={openAcceptance} onRemind={remindTask} onReturn={openTaskReturn} onUpgrade={upgradeTask} onTransfer={openSingleTransfer} slaClock={slaClock} /><DeadlineStats tasks={filteredTasks} slaClock={slaClock} /><TeamOverview tasks={allTaskRows} slaClock={slaClock} onGeneratePlan={openRebalancingPlan} /></aside>
      </div>
      <TaskTransferDialog
        members={taskTeamMembers}
        onClose={() => setTransferOpen(false)}
        onConfirm={confirmTransfer}
        onOwnerChange={setTransferOwner}
        open={transferOpen}
        owner={transferOwner}
        preview={transferPreview}
        recommendations={transferRecommendations}
        selectedCount={transferMode === 'bulk' ? selectedTaskRows.length : 1}
        task={transferReferenceTask}
      />
      <TaskRebalancingDialog
        onClose={() => setRebalancingOpen(false)}
        onConfirm={confirmRebalancingPlan}
        onRemoveMove={removeRebalancingMove}
        open={rebalancingOpen}
        plan={rebalancingPlan}
      />
      <TaskReturnDialog
        action={selectedReturnAction}
        onClose={() => setReturnDialogOpen(false)}
        onSubmit={submitTaskReturn}
        open={returnDialogOpen}
        task={selectedTask}
      />
      <TaskAcceptanceDialog checks={selectedAcceptanceChecks} open={acceptanceOpen} task={selectedTask} onClose={() => setAcceptanceOpen(false)} onSubmit={submitAcceptance} />
      <TaskCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={submitManualTask} />
      <ConfirmActionDialog
        open={bulkConfirmAction === 'upgrade'}
        title="确认批量升级"
        description={`将 ${selectedTaskRows.length} 条任务升级至主管处理。`}
        confirmLabel="确认升级"
        onCancel={() => setBulkConfirmAction(null)}
        onConfirm={() => applyBatchAction('upgrade', {}, '已批量升级')}
      />
    </div>
  );
}
