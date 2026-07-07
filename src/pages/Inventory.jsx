import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArchiveX,
  Boxes,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Shuffle,
  Warehouse,
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
import DetailDrawer from '../components/common/DetailDrawer.jsx';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { useDemoState } from '../state/DemoStateContext.jsx';

const metricCards = [
  {
    label: '7天内缺货',
    value: 128,
    change: '+17',
    tone: '#FF3B3B',
    icon: PackageCheck,
    filter: { availableDays: '7' },
    trend: [18, 22, 26, 19, 30, 25, 20, 27, 23, 18, 24, 41, 29, 20, 25, 19, 38],
  },
  {
    label: '14天内缺货',
    value: 243,
    change: '+32',
    tone: '#FF3B3B',
    icon: Warehouse,
    filter: { availableDays: '14' },
    trend: [25, 28, 30, 24, 33, 29, 25, 21, 27, 24, 21, 27, 43, 32, 24, 28, 22, 40],
  },
  {
    label: '库存滞销',
    value: 23,
    change: '-12',
    tone: '#20C997',
    icon: ArchiveX,
    filter: { riskLevel: '滞销' },
    trend: [26, 28, 30, 24, 32, 29, 25, 30, 27, 24, 28, 40, 31, 25, 29, 42, 34, 27],
  },
  {
    label: '建议调拨',
    value: 98,
    change: '+9',
    tone: '#FF3B3B',
    icon: Shuffle,
    filter: { riskLevel: '调拨' },
    trend: [22, 24, 26, 21, 28, 25, 22, 19, 24, 22, 25, 30, 42, 33, 24, 27, 23, 39],
  },
];

const riskStyles = {
  高: 'bg-[#FFEDEE] text-[#F04438]',
  中: 'bg-[#FFF3E0] text-[#F79009]',
  低: 'bg-[#EAF8F0] text-[#12B76A]',
  滞销: 'bg-[#F2EAFE] text-[#8B5CF6]',
  调拨: 'bg-[#EAF2FF] text-[#2F7BFF]',
};

const productNameOverrides = {
  'ELE-HEAD-01': '头戴式无线降噪耳机Pro',
  'ELE-KYB-01': '有线机械键盘 黑轴',
  'CAR-VAC-01': '便携式车载无线吸尘器',
  'OUT-WB-01': '运动保温水杯 750ml',
  'HOM-HUM-01': '家用静音小型桌面加湿器',
  'ACC-PHONE-01': '可折叠手机桌面懒人支架',
};

const skuSalesTrend = [
  { date: '5.26', sales: 14 },
  { date: '5.27', sales: 16 },
  { date: '5.28', sales: 15 },
  { date: '5.29', sales: 18 },
  { date: '5.30', sales: 20 },
  { date: '5.31', sales: 17 },
  { date: '6.01', sales: 22 },
];

const INVENTORY_PAGE_SIZE = 10;

function getVisiblePages(currentPage, pageCount) {
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  return Array.from({ length: Math.min(5, pageCount) }, (_, index) => start + index);
}

function Sparkline({ points, color }) {
  const width = 260;
  const height = 36;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((point, index) => {
    const x = index * step;
    const y = height - ((point - min) / range) * 27 - 4;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const id = `inventory-metric-${color.replace('#', '')}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute bottom-4 left-7 right-7 h-8"
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
    </svg>
  );
}

function InventoryMetricCard({ card, onDetail }) {
  const Icon = card.icon;
  const positive = card.change.startsWith('+');
  const changeClass = positive ? 'text-[#FF2D2D]' : 'text-[#16C7A1]';

  return (
    <article className="relative h-[150px] overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white px-6 py-5 shadow-[var(--shadow-card)]">
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-[#EAF2FF] to-[#CDE0FF] text-[#2F7BFF] shadow-[0_8px_16px_rgba(47,123,255,0.16)]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[16px] font-semibold leading-6 text-[#1D273B]">{card.label}</div>
            <div className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-black">{card.value}</div>
            <div className="mt-3 flex items-center gap-2 text-[13px]">
              <span className="text-[#5F6B7A]">较昨日</span>
              <span className={changeClass}>
                {card.change} {positive ? '↑' : '↓'}
              </span>
            </div>
          </div>
        </div>
        <button className="mt-[67px] text-[13px] font-medium text-[#2F7BFF]" onClick={onDetail} type="button">
          查看详情
        </button>
      </div>
      <Sparkline points={card.trend} color={card.tone} />
    </article>
  );
}

function FilterBox({ label, value, options, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-[#7889A8]">{label}</span>
      <div className="relative">
        <select
          className="h-10 min-w-[122px] appearance-none rounded-[8px] border border-[#D9E1EE] bg-white pl-4 pr-9 text-sm font-medium text-[#1D273B] outline-none transition focus:border-[#2F7BFF]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">全部</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#1D273B]" />
      </div>
    </label>
  );
}

function RiskBadge({ level }) {
  return (
    <span className={`inline-flex h-8 w-[64px] items-center justify-center rounded-[7px] text-sm font-semibold ${riskStyles[level] ?? 'bg-[#F2F6FC] text-[#7889A8]'}`}>
      {level}
    </span>
  );
}

function suggestionSummary(row) {
  if (row.riskLevel === '高' || row.riskLevel === '中') {
    return `补货${row.suggestedReplenishment || 100}件`;
  }
  if (row.riskLevel === '滞销') return '促销清库存';
  if (row.riskLevel === '调拨') return row.warehouse === 'UK' ? '调拨至LA仓' : `调拨至${row.warehouse}仓`;
  return '持续观察';
}

function redIfLow(row, field) {
  if (field === 'currentStock') return row.currentStock <= 20 || row.availableDays <= 1;
  if (field === 'inTransitStock') return row.inTransitStock <= 10 && row.availableDays <= 7;
  if (field === 'availableDays') return row.availableDays < 3;
  return false;
}

export default function Inventory() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { createInventoryTask, inventory } = useDemoState();
  const [filters, setFilters] = useState({
    platform: '',
    warehouse: '',
    riskLevel: '',
    availableDays: '',
  });
  const [selectedSku, setSelectedSku] = useState(null);
  const [adjustedQuantity, setAdjustedQuantity] = useState('300');
  const [adjustReason, setAdjustReason] = useState('覆盖安全库存');
  const [adjustNote, setAdjustNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!location.state?.openSku) return;
    const row = inventory.find((item) => item.sku === location.state.openSku);
    if (row) openSkuDrawer(row);
  }, [location.state, inventory]);

  useEffect(() => {
    if (!selectedSku) return;
    const latestSku = inventory.find((item) => item.sku === selectedSku.sku);
    if (latestSku && latestSku !== selectedSku) {
      setSelectedSku(latestSku);
    }
  }, [inventory, selectedSku]);

  const platformOptions = useMemo(
    () => [...new Set(inventory.map((item) => item.platform))].map((value) => ({ label: value, value })),
    [inventory],
  );
  const warehouseOptions = useMemo(
    () => [...new Set(inventory.map((item) => item.warehouse))].map((value) => ({ label: `${value}仓`, value })),
    [inventory],
  );

  const filteredRows = useMemo(() => {
    return inventory.filter((item) => {
      if (filters.platform && item.platform !== filters.platform) return false;
      if (filters.warehouse && item.warehouse !== filters.warehouse) return false;
      if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
      if (filters.availableDays === '7' && item.availableDays > 7) return false;
      if (filters.availableDays === '14' && item.availableDays > 14) return false;
      if (filters.availableDays === '30' && item.availableDays > 30) return false;
      if (filters.availableDays === 'slow' && item.availableDays < 90) return false;
      return true;
    });
  }, [filters, inventory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / INVENTORY_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = filteredRows.slice((safePage - 1) * INVENTORY_PAGE_SIZE, safePage * INVENTORY_PAGE_SIZE);
  const visiblePages = getVisiblePages(safePage, pageCount);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ platform: '', warehouse: '', riskLevel: '', availableDays: '' });
  const applyMetricFilter = (filter) => setFilters((current) => ({ ...current, ...filter }));
  const openSkuDrawer = (row) => {
    setSelectedSku(row);
    setAdjustedQuantity(String(row.suggestedReplenishment || 300));
    setAdjustReason('覆盖安全库存');
    setAdjustNote('');
  };

  const handleModifyPurchase = () => showToast({ message: '已保存修改采购数量', type: 'success' });
  const handleRejectSuggestion = () => showToast({ message: '已驳回AI建议', type: 'info' });
  const handleCreateTask = () => {
    if (!selectedSku) return;
    const task = createInventoryTask(selectedSku, { quantity: adjustedQuantity });
    showToast({ message: '补货任务已创建', type: 'success' });
    navigate('/tasks', { state: { detailTaskId: task.id, highlightTaskId: task.id } });
  };

  return (
    <>
      <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-3 overflow-hidden">
        <header className="flex shrink-0 items-center justify-between">
          <h1 className="text-[26px] font-semibold tracking-tight text-[#111827]">库存决策</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#7889A8]">数据更新时间：2026-06-01 09:41:52</span>
            <button
              className="flex h-9 items-center gap-2 rounded-[9px] border border-[#DDE4F0] bg-white px-3 text-sm font-medium text-[#1D273B] shadow-[0_4px_10px_rgba(28,39,71,0.04)]"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              刷新数据
            </button>
          </div>
        </header>

        <div className="grid shrink-0 grid-cols-4 gap-3">
          {metricCards.map((card) => (
            <InventoryMetricCard key={card.label} card={card} onDetail={() => applyMetricFilter(card.filter)} />
          ))}
        </div>

        <section className="flex h-[58px] shrink-0 items-center justify-between rounded-[10px] border border-[#E6EAF2] bg-white px-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-4">
            <FilterBox label="平台" value={filters.platform} options={platformOptions} onChange={(value) => updateFilter('platform', value)} />
            <FilterBox label="仓库" value={filters.warehouse} options={warehouseOptions} onChange={(value) => updateFilter('warehouse', value)} />
            <FilterBox
              label="风险等级"
              value={filters.riskLevel}
              options={['高', '中', '低', '滞销', '调拨'].map((value) => ({ label: value, value }))}
              onChange={(value) => updateFilter('riskLevel', value)}
            />
            <FilterBox
              label="可售天数"
              value={filters.availableDays}
              options={[
                { label: '7天内', value: '7' },
                { label: '14天内', value: '14' },
                { label: '30天内', value: '30' },
                { label: '90天以上', value: 'slow' },
              ]}
              onChange={(value) => updateFilter('availableDays', value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex h-10 min-w-[76px] items-center justify-center gap-2 rounded-[8px] border border-[#D9E1EE] bg-white px-4 text-sm font-semibold text-[#1D273B]"
              onClick={resetFilters}
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
              重置
            </button>
            <button
              className="flex h-10 min-w-[76px] items-center justify-center gap-2 rounded-[8px] bg-[#2F7BFF] px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(47,123,255,0.2)]"
              type="button"
            >
              <Search className="h-4 w-4" />
              筛选
            </button>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white shadow-[var(--shadow-card)]">
          <div className="flex h-[62px] items-center px-5">
            <h2 className="text-[20px] font-semibold text-[#111827]">
              SKU风险列表 <span className="ml-1 text-base font-normal text-[#8A98B3]">（共{filteredRows.length}条）</span>
            </h2>
          </div>

          <div className="h-[calc(100%-122px)] overflow-y-auto overflow-x-hidden px-5 [scrollbar-gutter:stable]">
            <table className="w-full table-fixed text-left">
              <thead className="sticky top-0 z-10 h-[52px] border-b border-[#E3E9F3] bg-white text-sm font-semibold text-[#8A98B3]">
                <tr>
                  <th className="w-[90px] pl-2">风险等级</th>
                  <th className="w-[142px]">SKU</th>
                  <th className="w-[220px]">商品名称</th>
                  <th className="w-[84px] text-center">平台</th>
                  <th className="w-[70px] text-center">仓库</th>
                  <th className="w-[90px] text-center">当前库存</th>
                  <th className="w-[90px] text-center">在途库存</th>
                  <th className="w-[88px] text-center">日均销量</th>
                  <th className="w-[88px] text-center">可售天数</th>
                  <th>AI建议</th>
                  <th className="w-[64px] pr-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#1D273B]">
                {visibleRows.map((row) => (
                  <tr key={row.sku} className="h-[52px] border-b border-[#E3E9F3] transition hover:bg-[#F8FAFE]">
                    <td className="pl-2">
                      <RiskBadge level={row.riskLevel} />
                    </td>
                    <td>
                      <button
                        className="font-medium text-[#2F7BFF] underline underline-offset-2"
                        onClick={() => openSkuDrawer(row)}
                        type="button"
                      >
                        {row.sku}
                      </button>
                    </td>
                    <td className="truncate pr-4 font-medium">{productNameOverrides[row.sku] ?? row.productName}</td>
                    <td className="text-center">
                      <PlatformLogo platform={row.platform} showName={false} size="sm" />
                    </td>
                    <td className="text-center">{row.warehouse}</td>
                    <td className={`text-center ${redIfLow(row, 'currentStock') ? 'font-medium text-[#FF2D2D]' : ''}`}>{row.currentStock}</td>
                    <td className={`text-center ${redIfLow(row, 'inTransitStock') ? 'font-medium text-[#FF2D2D]' : ''}`}>{row.inTransitStock}</td>
                    <td className="text-center">{row.dailySales}</td>
                    <td className={`text-center ${redIfLow(row, 'availableDays') ? 'font-medium text-[#FF2D2D]' : ''}`}>{row.availableDays}</td>
                    <td className={`truncate pr-3 ${row.riskLevel === '高' ? 'font-medium text-[#FF2D2D]' : ''}`}>{suggestionSummary(row)}</td>
                    <td className="pr-2 text-right">
                      <button className="font-medium text-[#2F7BFF]" onClick={() => openSkuDrawer(row)} type="button">
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#8A98B3]">暂无符合条件的 SKU 风险</div>
            ) : null}
          </div>

          <div className="flex h-[60px] items-center justify-end gap-5 border-t border-[#E8EDF5] px-5 text-sm text-[#6B778C]">
            <span>共 {filteredRows.length} 条</span>
            <button
              className="text-[#8A98B3] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {visiblePages.map((page) => (
              <button
                key={page}
                className={`h-8 min-w-8 rounded-[7px] px-2 font-semibold ${page === safePage ? 'bg-[#2F7BFF] text-white' : 'text-[#6B778C]'}`}
                onClick={() => setCurrentPage(page)}
                type="button"
              >
                {page}
              </button>
            ))}
            {pageCount > visiblePages.at(-1) ? <span>...</span> : null}
            {pageCount > visiblePages.at(-1) ? (
              <button className="font-semibold text-[#6B778C]" onClick={() => setCurrentPage(pageCount)} type="button">
                {pageCount}
              </button>
            ) : null}
            <button
              className="text-[#1D273B] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={safePage >= pageCount}
              onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
              type="button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-7">跳至</span>
            <input
              className="h-8 w-12 rounded-[6px] border border-[#D9E1EE] text-center text-sm outline-none"
              value={safePage}
              onChange={(event) => {
                const nextPage = Number(event.target.value);
                if (Number.isFinite(nextPage) && nextPage >= 1) {
                  setCurrentPage(Math.min(pageCount, nextPage));
                }
              }}
            />
            <span>页</span>
          </div>
        </section>
      </div>

      <DetailDrawer
        open={Boolean(selectedSku)}
        title={selectedSku ? `SKU详情 - ${selectedSku.sku}` : 'SKU详情'}
        titleExtra={selectedSku ? <RiskBadge level={selectedSku.riskLevel} /> : null}
        onClose={() => setSelectedSku(null)}
        width={380}
        topOffset={64}
        bodyClassName="bg-[#F5F7FB]"
        footer={
          <div className="flex gap-2">
            <button
              className="h-9 flex-1 rounded-[8px] border border-[#2F7BFF] bg-white px-2 text-xs font-semibold text-[#2F7BFF]"
              onClick={handleModifyPurchase}
              type="button"
            >
              修改采购
            </button>
            <button
              className="h-9 flex-1 rounded-[8px] border border-[#D9E1EE] bg-white px-2 text-xs font-semibold text-[#5F6B7A]"
              onClick={handleRejectSuggestion}
              type="button"
            >
              驳回建议
            </button>
            <button
              className="h-9 flex-1 rounded-[8px] bg-[#2F7BFF] px-2 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)]"
              onClick={handleCreateTask}
              type="button"
            >
              创建补货任务
            </button>
          </div>
        }
      >
        {selectedSku ? (
          <SkuDetailDrawerContent
            selectedSku={selectedSku}
            adjustedQuantity={adjustedQuantity}
            adjustReason={adjustReason}
            adjustNote={adjustNote}
            setAdjustedQuantity={setAdjustedQuantity}
            setAdjustReason={setAdjustReason}
            setAdjustNote={setAdjustNote}
          />
        ) : null}
      </DetailDrawer>
    </>
  );
}

function SkuDetailDrawerContent({
  selectedSku,
  adjustedQuantity,
  adjustReason,
  adjustNote,
  setAdjustedQuantity,
  setAdjustReason,
  setAdjustNote,
}) {
  const detail = selectedSku.detail ?? {};
  const productName = detail.displayName ?? productNameOverrides[selectedSku.sku] ?? selectedSku.productName;
  const warehouse = detail.warehouseName ?? `${selectedSku.warehouse}仓`;
  const replenishment = selectedSku.suggestedReplenishment || 300;
  const confidence = Math.round((selectedSku.confidence || 0.8) * 100);
  const salesTrend = detail.salesTrend ?? skuSalesTrend;
  const metrics = [
    { label: '当前库存', value: `${selectedSku.currentStock}件`, tone: redIfLow(selectedSku, 'currentStock') ? 'text-[#F04438]' : 'text-[#1D273B]' },
    { label: '在途库存', value: `${selectedSku.inTransitStock}件`, tone: redIfLow(selectedSku, 'inTransitStock') ? 'text-[#F04438]' : 'text-[#1D273B]' },
    { label: '可售天数', value: `${selectedSku.availableDays}天`, tone: redIfLow(selectedSku, 'availableDays') ? 'text-[#F04438]' : 'text-[#1D273B]' },
    { label: '日均销量', value: `${selectedSku.dailySales}件`, tone: 'text-[#1D273B]' },
  ];

  return (
    <div className="space-y-3">
      <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-gradient-to-br from-[#DCEAFF] via-[#F4F8FF] to-[#BFD6FF]">
            <div className="absolute left-3 top-5 h-7 w-3 rounded-full border-2 border-[#2F7BFF] bg-white/75" />
            <div className="absolute right-3 top-5 h-7 w-3 rounded-full border-2 border-[#2F7BFF] bg-white/75" />
            <div className="absolute left-[18px] top-3 h-8 w-7 rounded-t-full border-2 border-b-0 border-[#2F7BFF]" />
            <div className="absolute bottom-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#8FB8FF]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-[#1D273B]">{productName}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-[#5F6B7A]">
              <PlatformLogo platform={selectedSku.platform} size="sm" />
              <span>{warehouse}</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#A0A8B8]" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[12px] border border-[#E6EAF2] bg-white px-3 py-3">
            <div className="text-xs text-[#7889A8]">{metric.label}</div>
            <div className={`mt-1 text-xl font-semibold ${metric.tone}`}>{metric.value}</div>
          </div>
        ))}
      </section>

      <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1D273B]">
          <Boxes className="h-4 w-4 text-[#2F7BFF]" />
          AI补货建议：{replenishment}件
        </div>
        <p className="mt-2 text-xs leading-5 text-[#344767]">建议理由：{detail.suggestionReason ?? selectedSku.aiSuggestion}</p>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-[#7889A8]">置信度</span>
          <span className="font-semibold text-[#1D273B]">{confidence}%</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-[#7889A8]">处理状态</span>
          <span className="font-semibold text-[#1D273B]">{detail.processStatus ?? selectedSku.status ?? '待处理'}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
          <div className="h-full rounded-full bg-[#2F7BFF]" style={{ width: `${confidence}%` }} />
        </div>
      </section>

      <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
        <h3 className="text-sm font-semibold text-[#1D273B]">销售趋势（日均）</h3>
        <div className="mt-2" style={{ height: 132 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="#E8EDF5" vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7889A8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7889A8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#2F7BFF" strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: '#2F7BFF', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
        <h3 className="text-sm font-semibold text-[#1D273B]">人工调整</h3>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs text-[#7889A8]">AI建议数量</span>
            <div className="mt-1 h-9 rounded-[8px] bg-[#F5F7FB] px-3 py-2 text-sm font-semibold text-[#1D273B]">{replenishment}件</div>
          </label>
          <label className="block">
            <span className="text-xs text-[#7889A8]">修改后数量</span>
            <input
              className="mt-1 h-9 w-full rounded-[8px] border border-[#D9E1EE] px-3 text-sm font-semibold text-[#1D273B] outline-none focus:border-[#2F7BFF]"
              inputMode="numeric"
              min="0"
              type="number"
              value={adjustedQuantity}
              onChange={(event) => setAdjustedQuantity(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-[#7889A8]">修改原因</span>
            <select
              className="mt-1 h-9 w-full rounded-[8px] border border-[#D9E1EE] bg-white px-3 text-sm text-[#1D273B] outline-none focus:border-[#2F7BFF]"
              value={adjustReason}
              onChange={(event) => setAdjustReason(event.target.value)}
            >
              <option>覆盖安全库存</option>
              <option>预算限制</option>
              <option>供应商交期变化</option>
              <option>人工复核调整</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-[#7889A8]">备注</span>
            <textarea
              className="mt-1 h-16 w-full resize-none rounded-[8px] border border-[#D9E1EE] px-3 py-2 text-sm text-[#1D273B] outline-none focus:border-[#2F7BFF]"
              placeholder="填写调整说明"
              value={adjustNote}
              onChange={(event) => setAdjustNote(event.target.value)}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
