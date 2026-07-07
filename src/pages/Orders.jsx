import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock3,
  Package,
  RefreshCw,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';
import DetailDrawer from '../components/common/DetailDrawer.jsx';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import RiskTag from '../components/common/RiskTag.jsx';
import SlaCountdown from '../components/common/SlaCountdown.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useSlaClock } from '../hooks/useSlaClock.js';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { getRemainingSlaSeconds } from '../utils/sla.js';

const tabs = ['全部', '地址异常', '缺货', '物流延误', '平台同步失败', '支付异常', '退款', '清关异常'];
const defaultSelected = ['order-001', 'order-002', 'order-008'];

const filterDefaults = {
  platform: '',
  store: '',
  country: '',
  riskLevel: '',
  owner: '',
  sla: '',
};

const ORDER_PAGE_SIZE = 11;

function getVisiblePages(currentPage, pageCount) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
}

function uniqueOptions(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))];
}

function formatCurrency(value) {
  return `¥${Number(value).toLocaleString('zh-CN')}`;
}

function matchesLiveSlaFilter(value, filter, nowMs, anchorMs) {
  if (!filter) return true;

  const seconds = getRemainingSlaSeconds(value, nowMs, anchorMs);
  if (seconds == null) return false;
  if (filter.includes('2-6')) return seconds >= 7200 && seconds < 21600;
  if (filter.includes('6')) return seconds >= 21600;
  if (filter.includes('2')) return seconds > 0 && seconds < 7200;

  return true;
}

function statusClass(status) {
  if (status === '处理中') return 'text-[#2F7BFF]';
  if (status === '待分派') return 'text-[#5F6B7A]';
  if (status === '已驳回') return 'text-[#D92D20]';
  return 'text-[#111827]';
}

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { createOrderTask, orders: rows, updateOrderStatus } = useDemoState();
  const slaClock = useSlaClock();
  const [activeTab, setActiveTab] = useState('全部');
  const [filters, setFilters] = useState(filterDefaults);
  const [selectedIds, setSelectedIds] = useState(defaultSelected);
  const [drawerOrderId, setDrawerOrderId] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (location.state?.abnormalType) {
      setActiveTab(location.state.abnormalType);
    }
    if (location.state?.openOrderId) {
      setDrawerOrderId(location.state.openOrderId);
      setActionOpen(false);
    }
  }, [location.state]);

  const drawerOrder = useMemo(
    () => rows.find((row) => row.id === drawerOrderId) ?? null,
    [drawerOrderId, rows],
  );

  const filterOptions = useMemo(
    () => ({
      platform: uniqueOptions(rows, 'platform'),
      store: uniqueOptions(rows, 'store'),
      country: uniqueOptions(rows, 'country'),
      riskLevel: ['高', '中', '低'],
      owner: uniqueOptions(rows, 'owner'),
      sla: ['2小时内', '2-6小时', '6小时以上'],
    }),
    [rows],
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const tabMatch = activeTab === '全部' || row.abnormalType === activeTab;
      return (
        tabMatch &&
        (!filters.platform || row.platform === filters.platform) &&
        (!filters.store || row.store === filters.store) &&
        (!filters.country || row.country === filters.country) &&
        (!filters.riskLevel || row.riskLevel === filters.riskLevel) &&
        (!filters.owner || row.owner === filters.owner) &&
        matchesLiveSlaFilter(row.remainingSLA, filters.sla, slaClock.nowMs, slaClock.anchorMs)
      );
    });
  }, [activeTab, filters, rows, slaClock.anchorMs, slaClock.nowMs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / ORDER_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * ORDER_PAGE_SIZE, safePage * ORDER_PAGE_SIZE);
  const visiblePages = getVisiblePages(safePage, pageCount);
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.includes(row.id));

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleRow = (id) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleVisibleRows = () => {
    setSelectedIds((current) => {
      const visibleIds = visibleRows.map((row) => row.id);
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const handleBatchAssign = () => {
    showToast({ message: `已批量分派 ${selectedIds.length} 个订单`, type: 'success' });
  };

  const handleMarkProcessing = () => {
    selectedIds.forEach((id) => updateOrderStatus(id, '处理中'));
    showToast({ message: '已标记为处理中', type: 'success' });
  };

  const handleAdoptSuggestion = (orderId) => {
    updateOrderStatus(orderId, '处理中');
    setActionOpen(false);
    showToast({ message: '已采纳建议，订单状态已更新为处理中', type: 'success' });
  };

  const handleRejectSuggestion = (orderId) => {
    updateOrderStatus(orderId, '已驳回');
    setActionOpen(false);
    showToast({ message: '已驳回建议', type: 'success' });
  };

  const handleModifyPurchase = () => {
    setActionOpen(false);
    showToast({ message: '已进入采购修改流程', type: 'info' });
  };

  const handleGenerateTask = () => {
    if (!drawerOrder) return;
    const task = createOrderTask(drawerOrder);
    showToast({ message: '已生成任务', type: 'success' });
    navigate('/tasks', { state: { highlightTaskId: task.id } });
  };

  const openDrawer = (row) => {
    setDrawerOrderId(row.id);
    setActionOpen(false);
  };

  return (
    <div className="orders-page flex flex-col">
      <header className="mb-5 flex shrink-0 items-center justify-between">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-[#111827]">订单异常</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8A98B3]">数据更新时间：2026-06-01 09:41:52</span>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#E2E8F0] bg-white px-4 text-sm font-medium text-[#1D273B] shadow-[0_3px_10px_rgba(28,39,71,0.04)]"
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            刷新数据
          </button>
        </div>
      </header>

      <nav className="orders-tabs mb-4 flex shrink-0 items-center">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`orders-tab relative font-medium ${
              activeTab === tab ? 'text-[#2F7BFF]' : 'text-[#1D273B]'
            }`}
            style={{ marginRight: index === tabs.length - 1 ? 0 : undefined }}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab}
            {activeTab === tab ? (
              <span className="absolute bottom-0 left-0 h-1 w-8 rounded-full bg-[#2F7BFF]" />
            ) : null}
          </button>
        ))}
      </nav>

      <section className="orders-filter-panel mb-4 shrink-0 rounded-[10px] border border-[#DDE4EE] bg-white">
        <div className="orders-filter-row">
          <OrderFilter label="平台" value={filters.platform} options={filterOptions.platform} onChange={(value) => updateFilter('platform', value)} />
          <OrderFilter label="店铺" value={filters.store} options={filterOptions.store} onChange={(value) => updateFilter('store', value)} />
          <OrderFilter wide label="国家/地区" value={filters.country} options={filterOptions.country} onChange={(value) => updateFilter('country', value)} />
          <OrderFilter label="风险等级" value={filters.riskLevel} options={filterOptions.riskLevel} onChange={(value) => updateFilter('riskLevel', value)} />
          <OrderFilter label="负责人" value={filters.owner} options={filterOptions.owner} onChange={(value) => updateFilter('owner', value)} />
          <OrderFilter label="剩余SLA" value={filters.sla} options={filterOptions.sla} onChange={(value) => updateFilter('sla', value)} />
          <div className="flex flex-col justify-end">
            <button className="orders-more-filter inline-flex items-center justify-center" type="button">
              更多筛选
            </button>
          </div>
        </div>
      </section>

      <section className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="mr-2 text-sm text-[#344767]">已选择 {selectedIds.length} 项</span>
          <ActionButton onClick={handleBatchAssign}>批量分派</ActionButton>
          <ActionButton onClick={() => showToast({ message: '已批量转客服', type: 'success' })}>批量转客服</ActionButton>
          <ActionButton onClick={handleMarkProcessing}>标记处理中</ActionButton>
          <ActionButton icon={<ChevronRight className="h-4 w-4" />}>更多操作</ActionButton>
        </div>
        <div className="flex items-center gap-3">
          <IconButton label="刷新">
            <RefreshCw className="h-4 w-4" />
            刷新
          </IconButton>
          <IconButton label="设置">
            <Settings className="h-4 w-4" />
            设置
          </IconButton>
        </div>
      </section>

      <section className="orders-table-card">
        <div className="orders-table-shell">
          <table className="orders-table">
            <colgroup>
              <col style={{ width: 42 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 126 }} />
              <col style={{ width: 220 }} />
              <col style={{ width: 112 }} />
              <col style={{ width: 76 }} />
              <col style={{ width: 104 }} />
              <col style={{ width: 106 }} />
              <col style={{ width: 106 }} />
              <col style={{ width: 92 }} />
              <col style={{ width: 84 }} />
              <col style={{ width: 60 }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <Checkbox checked={allVisibleSelected} onChange={toggleVisibleRows} />
                </th>
                <TableHead>风险等级</TableHead>
                <TableHead>异常类型</TableHead>
                <TableHead>订单号</TableHead>
                <TableHead>店铺</TableHead>
                <TableHead>平台</TableHead>
                <TableHead>国家/地区</TableHead>
                <TableHead>异常金额</TableHead>
                <TableHead>剩余SLA</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const selected = selectedIds.includes(row.id);
                return (
                  <tr key={row.id} className={`orders-row ${selected ? 'orders-row-selected' : ''}`}>
                    <td>
                      <Checkbox checked={selected} onChange={() => toggleRow(row.id)} />
                    </td>
                    <td>
                      <RiskTag type={row.riskLevel}>{row.riskLevel}</RiskTag>
                    </td>
                    <td className="truncate">{row.abnormalType}</td>
                    <td className="truncate">
                      <button className="orders-order-link truncate" onClick={() => openDrawer(row)} type="button">
                        {row.orderNo}
                      </button>
                    </td>
                    <td className="truncate font-medium">{row.store}</td>
                    <td>
                      <PlatformLogo platform={row.platform} showName={false} size="sm" />
                    </td>
                    <td className="truncate">{row.country}</td>
                    <td className="font-semibold">{formatCurrency(row.amount)}</td>
                    <td className="font-medium">
                      <SlaCountdown value={row.remainingSLA} {...slaClock} />
                    </td>
                    <td className="truncate">{row.owner}</td>
                    <td className={statusClass(row.status)}>{row.status}</td>
                    <td>
                      <button className="font-medium text-[#2F7BFF]" onClick={() => openDrawer(row)} type="button">
                        查看
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="orders-pagination">
            <span>共 {filteredRows.length} 条</span>
            <button
              className="p-1 text-[#8A98B3] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {visiblePages.map((page) => (
              <button
                key={page}
                className={`h-8 w-8 rounded-[6px] text-sm font-medium ${
                  page === safePage ? 'bg-[#2F7BFF] text-white' : 'text-[#5F6B7A] hover:bg-[#F2F6FC]'
                }`}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
            {pageCount > visiblePages.at(-1) ? <span>...</span> : null}
            {pageCount > visiblePages.at(-1) ? (
              <button
                className="h-8 w-8 rounded-[6px] text-sm font-medium text-[#5F6B7A] hover:bg-[#F2F6FC]"
                onClick={() => setCurrentPage(pageCount)}
                type="button"
              >
                {pageCount}
              </button>
            ) : null}
            <button
              className="p-1 text-[#1D273B] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-9 font-medium text-[#1D273B]">前往</span>
            <input
              className="h-9 w-16 rounded-[6px] border border-[#D7DEE9] text-center text-[#1D273B] outline-none"
              value={safePage}
              onChange={(event) => {
                const nextPage = Number(event.target.value);
                if (Number.isFinite(nextPage) && nextPage >= 1) {
                  setCurrentPage(Math.min(pageCount, nextPage));
                }
              }}
            />
            <span className="font-medium text-[#1D273B]">页</span>
          </div>
        </div>
      </section>

      <OrderDetailDrawer
        actionOpen={actionOpen}
        onActionOpenChange={setActionOpen}
        onAdoptSuggestion={handleAdoptSuggestion}
        onClose={() => {
          setDrawerOrderId(null);
          setActionOpen(false);
        }}
        onGenerateTask={handleGenerateTask}
        onModifyPurchase={handleModifyPurchase}
        onRejectSuggestion={handleRejectSuggestion}
        order={drawerOrder}
        slaClock={slaClock}
      />
    </div>
  );
}

function OrderFilter({ label, value, options, onChange, wide = false }) {
  return (
    <label className={`orders-filter ${wide ? 'orders-filter-wide' : ''}`}>
      <span className="orders-filter-label">{label}</span>
      <div className="relative">
        <select className="orders-filter-select" value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">全部</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1D273B]" />
      </div>
    </label>
  );
}

function ActionButton({ children, onClick, icon }) {
  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[6px] border border-[#D7DEE9] bg-white px-4 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.03)] hover:border-[#B9C4D4]"
      onClick={onClick}
      type="button"
    >
      {children}
      {icon}
    </button>
  );
}

function IconButton({ children, label }) {
  return (
    <button
      className="inline-flex h-10 items-center gap-2 rounded-[6px] border border-[#D7DEE9] bg-white px-3 text-sm font-semibold text-[#263246] shadow-[0_2px_8px_rgba(28,39,71,0.03)] hover:border-[#B9C4D4]"
      aria-label={label}
      type="button"
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange }) {
  return (
    <button
      className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors ${
        checked ? 'border-[#2F7BFF] bg-[#2F7BFF]' : 'border-[#C9D2DF] bg-white'
      }`}
      onClick={onChange}
      type="button"
      aria-pressed={checked}
    >
      {checked ? <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} /> : null}
    </button>
  );
}

function TableHead({ children }) {
  return (
    <th className="h-[48px] pr-3">
      <span className="inline-flex items-center gap-1">
        {children}
        <ChevronsUpDown className="h-3.5 w-3.5 text-[#A8B3C5]" />
      </span>
    </th>
  );
}

function OrderDetailDrawer({
  actionOpen,
  onActionOpenChange,
  onAdoptSuggestion,
  onClose,
  onGenerateTask,
  onModifyPurchase,
  onRejectSuggestion,
  order,
  slaClock,
}) {
  const detail = useMemo(() => getOrderDetail(order), [order]);

  return (
    <DetailDrawer
      bodyClassName="bg-white"
      footer={
        order ? (
          <div className="flex h-full items-center gap-3">
            <div className="relative flex-1">
              {actionOpen ? (
                <div
                  className="absolute left-0 z-50 w-full overflow-hidden rounded-[10px] border border-[#D7DEE9] bg-white shadow-[0_14px_34px_rgba(16,24,40,0.16)]"
                  style={{ bottom: 46 }}
                >
                  <button className="block h-10 w-full px-4 text-left text-sm font-medium text-[#263246] hover:bg-[#F5F7FB]" onClick={onModifyPurchase} type="button">
                    修改采购
                  </button>
                  <button className="block h-10 w-full px-4 text-left text-sm font-medium text-[#D92D20] hover:bg-[#FFF4F5]" onClick={() => onRejectSuggestion(order.id)} type="button">
                    驳回建议
                  </button>
                  <button className="block h-10 w-full px-4 text-left text-sm font-medium text-[#2F7BFF] hover:bg-[#F2F7FF]" onClick={() => onAdoptSuggestion(order.id)} type="button">
                    采纳建议
                  </button>
                </div>
              ) : null}
              <button
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-[#2F7BFF] bg-white text-sm font-semibold text-[#2F7BFF]"
                onClick={() => onActionOpenChange(!actionOpen)}
                type="button"
              >
                处理动作
                <ChevronRight className={`h-4 w-4 transition-transform ${actionOpen ? '-rotate-90' : ''}`} />
              </button>
            </div>
            <button className="h-10 flex-1 rounded-[8px] bg-[#2F7BFF] text-sm font-semibold text-white" onClick={onGenerateTask} type="button">
              生成任务
            </button>
          </div>
        ) : null
      }
      onClose={onClose}
      open={Boolean(order)}
      title="订单异常详情"
      titleExtra={order ? <RiskTag type={order.riskLevel}>{order.riskLevel}风险</RiskTag> : null}
      topOffset={64}
      width={450}
    >
      {order ? (
        <div className="space-y-4 pb-2">
          <DrawerSection title="订单信息">
            <InfoRow label="订单编号" value={order.orderNo} />
            <InfoRow label="平台 / 店铺" value={`${order.platform} / ${detail.store}`} />
            <InfoRow label="订单金额" value={formatCurrency(detail.orderAmount)} />
            <InfoRow label="下单时间" value={detail.createdAt} />
            <InfoRow label="收件人 / 国家" value={`${detail.receiver} / ${detail.country}`} />
          </DrawerSection>

          <DrawerSection
            title="异常信息"
            action={
              <span className="rounded-[7px] bg-[#FFF1F2] px-2 py-1 text-xs font-semibold text-[#FF1F1F]">
                SLA&nbsp;<SlaCountdown value={order.remainingSLA} {...slaClock} className="font-semibold" urgentClassName="text-[#FF1F1F]" normalClassName="text-[#FF1F1F]" />
              </span>
            }
          >
            <InfoRow label="异常类型" value={order.abnormalType} strong />
            <InfoRow label="异常原因" value={detail.reason} strong />
            <InfoRow label="影响金额" value={formatCurrency(order.amount)} strong />
            <InfoRow label="当前状态" value={<StatusPill status={order.status} />} />
            <InfoRow
              label="负责人"
              value={
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF2FF] text-[#2F7BFF]">
                    <UserRound className="h-4 w-4" />
                  </span>
                  {detail.owner}
                </span>
              }
            />
          </DrawerSection>

          <DrawerSection title="关联SKU（1）">
            <div className="flex items-center gap-3 rounded-[10px] bg-[#F4F6FB] p-3">
              <div className="relative flex h-[74px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-[#D9ECFF] via-[#97BCE4] to-[#355A7E] shadow-inner">
                <div className="absolute bottom-3 h-9 w-12 rounded-b-[20px] rounded-t-[6px] bg-[#6D8FB2]" />
                <div className="absolute top-4 left-4 h-7 w-7 rounded-full bg-[#254462] shadow-[18px_0_0_#254462]" />
                <Package className="relative z-10 mt-6 h-5 w-5 text-white/70" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[#1D273B]">{detail.skuName}</div>
                <div className="mt-1 text-sm text-[#8A98B3]">SKU：{detail.skuCode}</div>
                <div className="mt-2 flex items-center gap-5 text-sm">
                  <span className="font-semibold text-[#FF1F1F]">可用库存：{detail.availableStock}</span>
                  <span className="text-[#1D273B]">在途库存：{detail.inTransitStock}</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#1D273B]" />
            </div>
          </DrawerSection>

          <DrawerSection
            title="AI建议"
            action={
              <span className="inline-flex items-center gap-1 text-xs text-[#8A98B3]">
                <Sparkles className="h-3.5 w-3.5" />
                建议仅供人工判断，高风险操作不会自动执行
              </span>
            }
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[15px] font-semibold text-[#FF1F1F]">{detail.aiTitle}</div>
              <div className="shrink-0 text-sm font-semibold text-[#FF1F1F]">置信度 {Math.round((order.confidence || 0) * 100)}%</div>
            </div>
            <p className="pt-1 text-sm leading-6 text-[#5F6B7A]">{detail.aiDescription}</p>
          </DrawerSection>

          <DrawerSection title="结果预估">
            <div className="flex items-center justify-between rounded-[10px] bg-[#F7FAFF] px-4 py-3">
              <div className="text-sm text-[#8A98B3]">
                采纳前
                <div className="mt-2">
                  <RiskTag type={detail.beforeRisk}>{detail.beforeRisk}风险</RiskTag>
                </div>
              </div>
              <div className="h-px flex-1 bg-[#DCE5F2] mx-5" />
              <div className="text-right text-sm text-[#8A98B3]">
                采纳后
                <div className="mt-2">
                  <RiskTag type={detail.afterRisk}>{detail.afterRisk}风险</RiskTag>
                </div>
              </div>
            </div>
          </DrawerSection>
        </div>
      ) : null}
    </DetailDrawer>
  );
}

function getOrderDetail(order) {
  if (!order) return {};
  const detail = order.detail ?? {};
  return {
    country: detail.country ?? order.country,
    createdAt: detail.createdAt ?? '2026-06-01 09:12:06',
    orderAmount: detail.orderAmount ?? order.amount,
    owner: detail.owner ?? order.owner,
    reason: detail.reason ?? order.aiSuggestion,
    receiver: detail.receiver ?? '海外客户',
    store: detail.store ?? order.store,
    skuName: detail.skuName ?? '关联商品',
    skuCode: detail.skuCode ?? order.relatedSku ?? 'SKU-UNKNOWN',
    availableStock: detail.availableStock ?? 0,
    inTransitStock: detail.inTransitStock ?? 0,
    aiTitle: detail.aiTitle ?? `建议处理${order.abnormalType}`,
    aiDescription: detail.aiDescription ?? order.aiSuggestion,
    beforeRisk: detail.beforeRisk ?? order.riskLevel,
    afterRisk: detail.afterRisk ?? (order.riskLevel === '高' ? '低' : order.riskLevel),
  };
}

function DrawerSection({ title, action, children }) {
  return (
    <section className="border-b border-[#E6EAF2] pb-4 last:border-b-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#1D273B]">{title}</h3>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value, strong = false }) {
  return (
    <div className="grid grid-cols-[118px_1fr] items-start gap-4 text-sm">
      <span className="text-[#8A98B3]">{label}</span>
      <span className={`min-w-0 break-words text-[#1D273B] ${strong ? 'font-semibold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}

function StatusPill({ status }) {
  const isProcessing = status === '处理中';
  const isRejected = status === '已驳回';
  const className = isProcessing
    ? 'bg-[#EAF2FF] text-[#2F7BFF]'
    : isRejected
      ? 'bg-[#FFF1F2] text-[#D92D20]'
      : 'bg-[#F2F4F7] text-[#344767]';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}
