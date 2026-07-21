import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  RotateCcw,
  Settings,
  X,
  XCircle,
} from 'lucide-react';
import RiskTag from '../../components/common/RiskTag.jsx';
import {
  buildOrdersCsv,
  executeBatchOperation,
  previewBatchOperation,
  undoBatchOperation,
} from './orderBatchOperations.js';

const actionMeta = {
  assign: { label: '批量分派', shortLabel: '分派' },
  customerService: { label: '批量转客服', shortLabel: '转客服' },
  markProcessing: { label: '标记处理中', shortLabel: '标记处理中' },
  createTask: { label: '批量生成任务', shortLabel: '生成任务' },
  export: { label: '导出选中订单', shortLabel: '导出' },
  reject: { label: '批量驳回', shortLabel: '驳回' },
};

const defaultForms = {
  assign: { owner: '王敏', reason: '按风险优先级重新分派' },
  customerService: { queue: '物流客服', reason: '需要客服介入处理', priority: '高' },
  markProcessing: {},
  createTask: { owner: '王敏', deadline: '今天 18:00', description: '根据订单异常生成协同任务' },
  reject: { reason: 'AI 建议不适用', note: '' },
  export: {},
};

const owners = ['王敏', '赵宁', '陈浩', '刘畅', '周扬', '张磊', '李娜'];
const queues = ['物流客服', '售后客服', '退款争议', '平台申诉'];
const SELECTION_OPEN_DELAY = 100;
const SELECTION_CLOSE_DELAY = 150;

export default function OrderToolbarActions({
  allOrders,
  connections,
  onCommit,
  onClearSelection,
  onRefresh,
  onSettingsChange,
  selectionGroups,
  selectedOrders,
  settings,
  showToast,
  tasks,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [phase, setPhase] = useState('operation');
  const [form, setForm] = useState({});
  const [targetIds, setTargetIds] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const targetOrders = useMemo(() => {
    const ids = new Set(targetIds);
    return allOrders.filter((order) => ids.has(order.id));
  }, [allOrders, targetIds]);

  const preview = useMemo(
    () => previewBatchOperation(modalAction, targetOrders, { connections, tasks }),
    [connections, modalAction, targetOrders, tasks],
  );

  const openAction = (action) => {
    if (!selectedOrders.length) {
      showToast({ message: '请先选择订单', type: 'info' });
      return;
    }
    setModalAction(action);
    setTargetIds(selectedOrders.map((order) => order.id));
    setForm({ ...defaultForms[action] });
    setResult(null);
    setPhase('operation');
    setMoreOpen(false);
  };

  const closeModal = () => {
    setModalAction(null);
    setResult(null);
  };

  const execute = () => {
    if (modalAction === 'export') {
      const csv = buildOrdersCsv(targetOrders);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `订单异常-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      const exportSuccesses = targetOrders.map((order) => ({ id: order.id, orderNo: order.orderNo, reason: '已导出' }));
      const exportResult = {
        successes: exportSuccesses,
        failures: [],
        record: { id: `order-operation-export-${Date.now()}`, action: 'export', label: actionMeta.export.label, createdAt: '刚刚', items: [], successes: exportSuccesses, failures: [] },
      };
      setResult(exportResult);
      setPhase('result');
      setHistory((current) => [exportResult.record, ...current].slice(0, 10));
      showToast({ message: `已导出 ${targetOrders.length} 条订单`, type: 'success' });
      return;
    }
    try {
      const output = executeBatchOperation(modalAction, targetOrders, form, { connections, tasks });
      onCommit({ orders: output.orders, tasksToAdd: output.tasksToAdd });
      setResult(output);
      setHistory((current) => [output.record, ...current].slice(0, 10));
      setPhase('result');
      showToast({
        message: `${actionMeta[modalAction].label}完成：成功 ${output.successes.length}，失败 ${output.failures.length}`,
        type: output.failures.length ? 'info' : 'success',
      });
    } catch (error) {
      showToast({ message: error.message, type: 'error' });
    }
  };

  const retryFailures = () => {
    setTargetIds(result.failures.map((item) => item.id));
    setPhase('operation');
    setResult(null);
  };

  const undoRecord = (record) => {
    const undo = undoBatchOperation(record, allOrders, tasks);
    onCommit({ orders: undo.orders, taskIdsToRemove: undo.taskIdsToRemove });
    setHistory((current) => current.map((item) => item.id === record.id ? { ...item, undone: undo.failures.length === 0, undoFailures: undo.failures } : item));
    setResult((current) => current?.record?.id === record.id ? { ...current, record: { ...current.record, undone: undo.failures.length === 0 } } : current);
    showToast({
      message: `撤销完成：成功 ${undo.successes.length}，失败 ${undo.failures.length}`,
      type: undo.failures.length ? 'info' : 'success',
    });
  };

  const refreshOrders = () => {
    onRefresh();
    setHistory([]);
    setMoreOpen(false);
    showToast({ message: '订单数据已刷新', type: 'success' });
  };

  const disabled = selectedOrders.length === 0;
  return (
    <>
      <section className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <SelectionSummaryPopover
            onClearSelection={onClearSelection}
            selectionGroups={selectionGroups}
          />
          <ActionButton disabled={disabled} onClick={() => openAction('assign')}>批量分派</ActionButton>
          <ActionButton disabled={disabled} onClick={() => openAction('customerService')}>批量转客服</ActionButton>
          <ActionButton disabled={disabled} onClick={() => openAction('markProcessing')}>标记处理中</ActionButton>
          <div className="relative">
            <ActionButton icon={<ChevronRight className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-90' : ''}`} />} onClick={() => setMoreOpen((open) => !open)}>更多操作</ActionButton>
            {moreOpen ? (
              <div className="absolute left-0 top-12 z-40 w-48 overflow-hidden rounded-[8px] border border-[#D7DEE9] bg-white py-1 shadow-[0_12px_30px_rgba(16,24,40,0.14)]">
                <MenuButton disabled={disabled} onClick={() => openAction('createTask')}>批量生成任务</MenuButton>
                <MenuButton disabled={disabled} onClick={() => openAction('export')}>导出选中订单</MenuButton>
                <MenuButton danger disabled={disabled} onClick={() => openAction('reject')}>批量驳回</MenuButton>
                <div className="my-1 border-t border-[#E6EAF2]" />
                <MenuButton onClick={() => { setHistoryOpen(true); setMoreOpen(false); }}>最近操作</MenuButton>
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IconButton label="刷新" onClick={refreshOrders}><RefreshCw className="h-4 w-4" />刷新</IconButton>
          <IconButton label="设置" onClick={() => setSettingsOpen(true)}><Settings className="h-4 w-4" />设置</IconButton>
        </div>
      </section>

      <BatchOperationModal
        action={modalAction}
        allOrders={allOrders}
        form={form}
        onClose={closeModal}
        onExecute={execute}
        onFormChange={setForm}
        onRetry={retryFailures}
        onUndo={() => undoRecord(result.record)}
        phase={phase}
        preview={preview}
        result={result}
      />
      <RecentOperationsModal history={history} onClose={() => setHistoryOpen(false)} onUndo={undoRecord} open={historyOpen} />
      <OrderTableSettingsModal onChange={onSettingsChange} onClose={() => setSettingsOpen(false)} open={settingsOpen} settings={settings} />
    </>
  );
}

function SelectionSummaryPopover({ onClearSelection, selectionGroups }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const total = selectionGroups.currentPage.length + selectionGroups.otherPages.length;

  const clearOpenTimer = () => {
    window.clearTimeout(openTimerRef.current);
    openTimerRef.current = null;
  };

  const cancelClose = () => {
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelWidth = 420;
    setPosition({
      top: rect.bottom + 8,
      left: Math.min(Math.max(12, rect.left), window.innerWidth - panelWidth - 12),
    });
  };

  const closeImmediately = () => {
    clearOpenTimer();
    cancelClose();
    setOpen(false);
  };

  const openImmediately = () => {
    if (!total) return;
    clearOpenTimer();
    cancelClose();
    updatePosition();
    setOpen(true);
  };

  const scheduleOpen = () => {
    cancelClose();
    clearOpenTimer();
    if (open || !total) return;
    openTimerRef.current = window.setTimeout(openImmediately, SELECTION_OPEN_DELAY);
  };

  const scheduleClose = () => {
    clearOpenTimer();
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), SELECTION_CLOSE_DELAY);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') closeImmediately();
  };

  const clearAll = () => {
    closeImmediately();
    onClearSelection();
  };

  useEffect(() => () => {
    window.clearTimeout(openTimerRef.current);
    window.clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => {
    if (!total) setOpen(false);
  }, [total]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      closeImmediately();
    };
    const closeOnViewportChange = () => closeImmediately();
    const closeOnScroll = (event) => {
      if (event.target instanceof Node && panelRef.current?.contains(event.target)) {
        cancelClose();
        return;
      }
      closeImmediately();
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  if (!total) {
    return <span className="mr-2 inline-flex h-10 items-center text-sm text-[#344767]">已选择 0 项</span>;
  }

  return (
    <>
      <div className="mr-1 inline-flex h-10 items-center gap-1.5">
        <button
          ref={triggerRef}
          aria-controls="order-selection-summary"
          aria-expanded={open}
          aria-haspopup="dialog"
          className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 text-sm text-[#344767] hover:bg-[#F2F6FC] hover:text-[#2F7BFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9CC0FF]"
          onBlur={scheduleClose}
          onFocus={openImmediately}
          onKeyDown={handleKeyDown}
          onPointerDown={(event) => {
            if (event.pointerType !== 'touch') return;
            event.preventDefault();
            if (open) closeImmediately();
            else openImmediately();
          }}
          onPointerEnter={scheduleOpen}
          onPointerLeave={scheduleClose}
          type="button"
        >
          <span className="font-medium">已选择 {total} 项</span>
          <span className="text-[#7889A8]">· 当前页 {selectionGroups.currentPage.length} · 其他页 {selectionGroups.otherPages.length}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          aria-label="取消全部已选订单"
          className="inline-flex h-8 items-center gap-1 rounded-[6px] px-2 text-xs font-medium text-[#2F7BFF] hover:bg-[#EAF2FF]"
          onClick={clearAll}
          type="button"
        >
          <X className="h-3.5 w-3.5" />
          取消全部
        </button>
      </div>
      {open
        ? createPortal(
            <div
              ref={panelRef}
              aria-label="已选订单概要"
              className="fixed z-[75] w-[420px] overflow-hidden rounded-[10px] border border-[#DDE4EE] bg-white shadow-[0_14px_40px_rgba(24,39,75,0.18)]"
              id="order-selection-summary"
              onPointerEnter={cancelClose}
              onPointerLeave={scheduleClose}
              role="dialog"
              style={position}
            >
              <div className="flex h-12 items-center justify-between border-b border-[#E6EAF2] px-4">
                <span className="text-sm font-semibold text-[#1D273B]">已选订单概要</span>
                <span className="text-xs text-[#7889A8]">共 {total} 项</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto p-3">
                <SelectionSummaryGroup label="当前页" orders={selectionGroups.currentPage} />
                <SelectionSummaryGroup label="其他页" orders={selectionGroups.otherPages} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function SelectionSummaryGroup({ label, orders }) {
  if (!orders.length) return null;

  return (
    <section className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between px-1 text-xs font-semibold text-[#5F6B7A]">
        <span>{label}</span>
        <span>{orders.length} 项</span>
      </div>
      <div className="overflow-hidden rounded-[8px] border border-[#E6EAF2]">
        {orders.map((order) => (
          <div key={order.id} className="grid min-h-[54px] grid-cols-[42px_minmax(0,1fr)_64px] items-center gap-2 border-b border-[#EEF2F7] px-3 py-2 last:border-b-0 hover:bg-[#F7FAFF]">
            <RiskTag className="!h-6 !min-w-[36px] !rounded-[6px] !px-2 !text-xs" type={order.riskLevel}>{order.riskLevel}</RiskTag>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-[#2F7BFF]">{order.orderNo}</div>
              <div className="mt-0.5 truncate text-xs text-[#7889A8]">{order.abnormalType} · {order.platform}</div>
            </div>
            <span className="truncate text-right text-xs text-[#344767]">{order.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionButton({ children, disabled, onClick, icon }) {
  return <button className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[#D7DEE9] bg-white px-4 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.03)] hover:border-[#B9C4D4] disabled:cursor-not-allowed disabled:opacity-40" disabled={disabled} onClick={onClick} type="button">{children}{icon}</button>;
}

function IconButton({ children, label, onClick }) {
  return <button className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#D7DEE9] bg-white px-3 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.03)] hover:border-[#B9C4D4]" aria-label={label} onClick={onClick} type="button">{children}</button>;
}

function MenuButton({ children, danger = false, disabled = false, onClick }) {
  return <button className={`block h-10 w-full px-4 text-left text-sm font-medium hover:bg-[#F5F7FB] disabled:cursor-not-allowed disabled:opacity-40 ${danger ? 'text-[#D92D20]' : 'text-[#263246]'}`} disabled={disabled} onClick={onClick} type="button">{children}</button>;
}

function ModalFrame({ children, onClose, open, title, width = 'max-w-[720px]' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111827]/25 px-4" role="presentation">
      <div className={`w-full ${width} overflow-hidden rounded-[12px] border border-[#E3E9F3] bg-white shadow-[0_22px_70px_rgba(16,24,40,0.24)]`} role="dialog" aria-modal="true">
        <div className="flex h-16 items-center justify-between border-b border-[#E6EAF2] px-6"><h2 className="text-lg font-semibold text-[#111827]">{title}</h2><button className="p-1 text-[#8A98B3]" onClick={onClose} type="button" aria-label="关闭"><X className="h-5 w-5" /></button></div>
        {children}
      </div>
    </div>
  );
}

function BatchOperationModal({ action, allOrders, form, onClose, onExecute, onFormChange, onRetry, onUndo, phase, preview, result }) {
  if (!action) return null;
  const canUndo = action !== 'export' && result?.successes.length > 0 && !result?.record?.undone;
  const primaryLabel = `确认${actionMeta[action].shortLabel} ${preview.executable} 条`;
  return (
    <ModalFrame onClose={onClose} open title={actionMeta[action].label}>
      <div className="min-h-[330px] max-h-[520px] overflow-y-auto px-6 py-5">
        {phase === 'operation' ? <OperationContent action={action} allOrders={allOrders} form={form} onFormChange={onFormChange} preview={preview} /> : null}
        {phase === 'result' ? <ResultContent result={result} /> : null}
      </div>
      <div className="flex h-16 items-center justify-between border-t border-[#E6EAF2] px-6">
        <button className="h-9 rounded-[7px] border border-[#D7DEE9] px-4 text-sm font-semibold text-[#344767]" onClick={onClose} type="button">关闭</button>
        <div className="flex items-center gap-2">
          {phase === 'operation' ? <button className={`h-9 rounded-[7px] px-5 text-sm font-semibold text-white disabled:opacity-45 ${action === 'reject' ? 'bg-[#D92D20]' : 'bg-[#2F7BFF]'}`} disabled={!preview.executable} onClick={onExecute} type="button">{primaryLabel}</button> : null}
          {phase === 'result' && result?.failures.length ? <button className="h-9 rounded-[7px] border border-[#2F7BFF] px-4 text-sm font-semibold text-[#2F7BFF]" onClick={onRetry} type="button">调整并重试失败项</button> : null}
          {phase === 'result' && canUndo ? <button className="h-9 rounded-[7px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white" onClick={onUndo} type="button">撤销成功项</button> : null}
        </div>
      </div>
    </ModalFrame>
  );
}

function OperationContent({ action, allOrders, form, onFormChange, preview }) {
  return (
    <div>
      <div className="grid grid-cols-4 divide-x divide-[#E6EAF2] rounded-[8px] border border-[#E6EAF2] py-3 text-center">
        <Metric label="已选择" value={preview.total} />
        <Metric label="可执行" value={preview.executable} tone="text-[#12B76A]" />
        <Metric label="预计失败" value={preview.blocked} tone="text-[#F04438]" />
        <Metric label="影响金额" value={`¥${preview.amount.toLocaleString('zh-CN')}`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#5F6B7A]">
        <span>涉及平台：{preview.platforms.join('、') || '-'}</span>
        <span>风险分布：高 {preview.riskCounts.高 || 0} / 中 {preview.riskCounts.中 || 0} / 低 {preview.riskCounts.低 || 0}</span>
      </div>
      {preview.blocked ? (
        <details className="mt-3 rounded-[8px] border border-[#F9D7A5] bg-[#FFF8EC] px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#8A5300]">查看 {preview.blocked} 条不可执行项</summary>
          <div className="mt-3"><ResultRows rows={preview.details.filter((item) => item.reason)} failed /></div>
        </details>
      ) : (
        <div className="mt-3 rounded-[8px] bg-[#ECFDF3] px-4 py-2.5 text-sm text-[#027A48]">所选订单均可执行</div>
      )}
      <div className="my-5 border-t border-[#E6EAF2]" />
      <OperationForm action={action} allOrders={allOrders} form={form} onChange={onFormChange} />
    </div>
  );
}

function Metric({ label, value, tone = 'text-[#1D273B]' }) { return <div><div className={`text-xl font-semibold ${tone}`}>{value}</div><div className="mt-1 text-xs text-[#8A98B3]">{label}</div></div>; }

function OperationForm({ action, allOrders, form, onChange }) {
  const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));
  if (action === 'markProcessing') return <div className="rounded-[8px] bg-[#F2F7FF] px-4 py-4 text-sm leading-6 text-[#344767]">当前操作人：<strong className="text-[#1D273B]">张晓</strong><br />未分派订单将自动由张晓认领，其他订单保留原负责人。</div>;
  if (action === 'export') return <div className="rounded-[8px] bg-[#F2F7FF] px-4 py-4 text-sm leading-6 text-[#344767]">导出格式：UTF-8 CSV<br />包含表格字段、关联 SKU、AI 建议、置信度及置信度建议说明。</div>;
  const ownerLoad = allOrders.filter((order) => order.owner === form.owner && !['已完成', '已驳回'].includes(order.status)).length;
  return <div className="grid grid-cols-2 gap-5">{action === 'assign' ? <><Field label="负责人"><Select value={form.owner} options={owners} onChange={(value) => update('owner', value)} /><div className="mt-2 text-xs text-[#8A98B3]">当前负载：{ownerLoad} 条进行中订单</div></Field><Field label="分派原因"><Select value={form.reason} options={['按风险优先级重新分派', '负责人负载调整', '专业能力匹配', '主管指定']} onChange={(value) => update('reason', value)} /></Field></> : null}{action === 'customerService' ? <><Field label="客服队列"><Select value={form.queue} options={queues} onChange={(value) => update('queue', value)} /></Field><Field label="优先级"><Select value={form.priority} options={['高', '中', '低']} onChange={(value) => update('priority', value)} /></Field><Field label="转交原因" wide><textarea className="h-24 w-full resize-none rounded-[7px] border border-[#D7DEE9] px-3 py-2 text-sm outline-none focus:border-[#2F7BFF]" value={form.reason} onChange={(event) => update('reason', event.target.value)} /></Field></> : null}{action === 'createTask' ? <><Field label="负责人"><div className="flex h-10 items-center rounded-[7px] border border-[#D7DEE9] bg-[#F5F7FB] px-3 text-sm text-[#5F6B7A]">沿用已分派负责人</div></Field><Field label="截止时间"><Select value={form.deadline} options={['今天 18:00', '明天 10:00', '24小时内']} onChange={(value) => update('deadline', value)} /></Field><Field label="任务说明" wide><textarea className="h-24 w-full resize-none rounded-[7px] border border-[#D7DEE9] px-3 py-2 text-sm outline-none focus:border-[#2F7BFF]" value={form.description} onChange={(event) => update('description', event.target.value)} /></Field></> : null}{action === 'reject' ? <><Field label="驳回原因"><Select value={form.reason} options={['AI 建议不适用', '订单数据不完整', '已通过其他方式解决', '需重新评估']} onChange={(value) => update('reason', value)} /></Field><Field label="补充备注"><input className="h-10 w-full rounded-[7px] border border-[#D7DEE9] px-3 text-sm outline-none focus:border-[#2F7BFF]" value={form.note} onChange={(event) => update('note', event.target.value)} placeholder="选填" /></Field></> : null}</div>;
}

function Field({ children, label, wide = false }) { return <label className={wide ? 'col-span-2' : ''}><span className="mb-2 block text-sm font-medium text-[#7889A8]">{label}</span>{children}</label>; }
function Select({ onChange, options, value }) { return <select className="h-10 w-full rounded-[7px] border border-[#D7DEE9] bg-white px-3 text-sm font-medium text-[#263246] outline-none focus:border-[#2F7BFF]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select>; }

function ResultContent({ result }) {
  const copyFailures = () => navigator.clipboard?.writeText(result.failures.map((item) => `${item.orderNo}：${item.reason}`).join('\n'));
  return <div><div className="grid grid-cols-2 gap-4"><div className="flex items-center gap-3 rounded-[8px] bg-[#ECFDF3] px-4 py-4"><CheckCircle2 className="h-6 w-6 text-[#12B76A]" /><div><div className="text-xl font-semibold text-[#027A48]">{result?.successes.length || 0}</div><div className="text-xs text-[#027A48]">执行成功</div></div></div><div className="flex items-center gap-3 rounded-[8px] bg-[#FFF1F2] px-4 py-4"><XCircle className="h-6 w-6 text-[#F04438]" /><div><div className="text-xl font-semibold text-[#B42318]">{result?.failures.length || 0}</div><div className="text-xs text-[#B42318]">执行失败</div></div></div></div>{result?.failures.length ? <div className="mt-5"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-[#263246]">失败明细</h3><button className="text-xs font-semibold text-[#2F7BFF]" onClick={copyFailures} type="button">复制失败原因</button></div><ResultRows rows={result.failures} failed /></div> : <div className="mt-5 rounded-[8px] bg-[#F5F7FB] px-4 py-3 text-sm text-[#5F6B7A]">全部选中订单已处理完成。</div>}</div>;
}

function ResultRows({ failed, rows }) { return <div className="max-h-48 overflow-y-auto rounded-[8px] border border-[#E6EAF2]">{rows.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#E6EAF2] px-3 py-2.5 text-sm last:border-b-0"><span className="font-medium text-[#263246]">{item.orderNo}</span><span className={failed ? 'text-[#D92D20]' : 'text-[#12B76A]'}>{item.reason}</span></div>)}</div>; }

function RecentOperationsModal({ history, onClose, onUndo, open }) {
  return <ModalFrame onClose={onClose} open={open} title="最近操作" width="max-w-[640px]"><div className="max-h-[480px] min-h-[260px] overflow-y-auto px-6 py-5">{history.length ? history.map((record) => <div key={record.id} className="flex items-center justify-between border-b border-[#E6EAF2] py-3 last:border-b-0"><div><div className="text-sm font-semibold text-[#263246]">{record.label}</div><div className="mt-1 text-xs text-[#8A98B3]">{record.createdAt} · 成功 {record.successes.length} · 失败 {record.failures.length}</div></div>{record.action !== 'export' ? <button className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-[#D7DEE9] px-3 text-xs font-semibold text-[#2F7BFF] disabled:opacity-45" disabled={record.undone} onClick={() => onUndo(record)} type="button"><RotateCcw className="h-3.5 w-3.5" />{record.undone ? '已撤销' : '撤销'}</button> : <Download className="h-4 w-4 text-[#8A98B3]" />}</div>) : <div className="flex min-h-[220px] items-center justify-center text-sm text-[#8A98B3]">暂无批量操作记录</div>}</div></ModalFrame>;
}

function OrderTableSettingsModal({ onChange, onClose, open, settings }) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => { if (open) setDraft(settings); }, [open, settings]);
  const move = (index, delta) => { const columns = [...draft.columns]; const next = index + delta; if (next < 0 || next >= columns.length) return; [columns[index], columns[next]] = [columns[next], columns[index]]; setDraft({ ...draft, columns }); };
  const toggle = (key) => setDraft({ ...draft, hidden: draft.hidden.includes(key) ? draft.hidden.filter((item) => item !== key) : [...draft.hidden, key] });
  return <ModalFrame onClose={onClose} open={open} title="列表设置" width="max-w-[560px]"><div className="max-h-[520px] overflow-y-auto px-6 py-5"><div className="mb-5"><div className="mb-2 text-sm font-semibold text-[#263246]">行密度</div><div className="inline-flex rounded-[7px] bg-[#F2F4F7] p-1">{['standard', 'compact'].map((density) => <button key={density} className={`h-8 rounded-[5px] px-4 text-sm font-medium ${draft.density === density ? 'bg-white text-[#2F7BFF] shadow-sm' : 'text-[#5F6B7A]'}`} onClick={() => setDraft({ ...draft, density })} type="button">{density === 'standard' ? '标准' : '紧凑'}</button>)}</div></div><div className="mb-2 text-sm font-semibold text-[#263246]">显示与排序</div><div className="rounded-[8px] border border-[#E6EAF2]">{draft.columns.map((key, index) => <div key={key} className="flex h-11 items-center border-b border-[#E6EAF2] px-3 last:border-b-0"><label className="flex flex-1 items-center gap-2 text-sm text-[#263246]"><input checked={!draft.hidden.includes(key)} onChange={() => toggle(key)} type="checkbox" />{settings.labels[key]}</label><button className="p-1 text-[#8A98B3] disabled:opacity-30" disabled={!index} onClick={() => move(index, -1)} type="button" aria-label="上移"><ArrowUp className="h-4 w-4" /></button><button className="p-1 text-[#8A98B3] disabled:opacity-30" disabled={index === draft.columns.length - 1} onClick={() => move(index, 1)} type="button" aria-label="下移"><ArrowDown className="h-4 w-4" /></button></div>)}</div></div><div className="flex h-16 items-center justify-between border-t border-[#E6EAF2] px-6"><button className="h-9 rounded-[7px] border border-[#D7DEE9] px-4 text-sm font-semibold text-[#344767]" onClick={() => setDraft(settings.defaults)} type="button">恢复默认</button><div className="flex gap-2"><button className="h-9 rounded-[7px] border border-[#D7DEE9] px-4 text-sm font-semibold text-[#344767]" onClick={onClose} type="button">取消</button><button className="h-9 rounded-[7px] bg-[#2F7BFF] px-5 text-sm font-semibold text-white" onClick={() => { onChange(draft); onClose(); }} type="button">保存设置</button></div></div></ModalFrame>;
}
