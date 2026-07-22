import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  RotateCcw,
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
import AiEvidencePanel from '../components/common/AiEvidencePanel.jsx';
import AssigneeWorkloadSelect from '../components/common/AssigneeWorkloadSelect.jsx';
import ConfirmActionDialog from '../components/common/ConfirmActionDialog.jsx';
import DataFreshnessNotice from '../components/common/DataFreshnessNotice.jsx';
import FilterSelect from '../components/common/FilterSelect.jsx';
import MetricSparkline from '../components/common/MetricSparkline.jsx';
import PageHeaderActionButton from '../components/common/PageHeaderActionButton.jsx';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import RiskExplanationPopover from '../components/common/RiskExplanationPopover.jsx';
import LiveUpdateTime from '../components/LiveUpdateTime.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { buildRollingDateLabels } from '../data/demoTime.js';
import { useRefreshTime } from '../hooks/useRefreshTime.js';
import { inventoryMetricStats, taskTeamMembers } from '../data/mockData.js';
import stockout7Icon from '../assets/inventory-icons/stockout-7days.png';
import stockout14Icon from '../assets/inventory-icons/stockout-14days.png';
import slowMovingIcon from '../assets/inventory-icons/slow-moving.png';
import transferIcon from '../assets/inventory-icons/transfer.png';
import productPhoneStandImage from '../assets/products/acc-phone-stand.png';
import productCarVacImage from '../assets/products/car-vac-01.png';
import productCameraImage from '../assets/products/ele-cam-02.png';
import productHeadphoneImage from '../assets/products/ele-head-01.png';
import productKeyboardImage from '../assets/products/ele-kyb-01.png';
import productHumidifierImage from '../assets/products/hom-humidifier.png';
import productKidLampImage from '../assets/products/kid-lamp-05.png';
import productBottleImage from '../assets/products/out-wb-01.png';
import productPetFeederImage from '../assets/products/pet-feed-02.png';
import { useDemoState } from '../state/DemoStateContext.jsx';
import { useTopbarFilter } from '../state/TopbarFilterContext.jsx';
import {
  createSourceAdvanceIntent,
  resolveSourceAdvance,
} from './tasks/taskAutoAdvance.js';
import { getReplenishmentQuantity, requiresStaleDataConfirmation } from '../state/trustLayer.js';
import { getSourceTaskBlockReason } from '../state/sourceTaskWorkflow.js';
import { formatMetricValue } from '../utils/formatMetricValue.js';
import { buildInventoryCsv } from './inventory/inventoryExport.js';
import {
  applyInventoryDashboardPreset,
  buildInventoryMetricStats,
  getInventoryDashboardPresetMeta,
  matchesInventoryAvailableDays,
} from './inventory/dashboardPreset.js';

const metricCardVisuals = [
  {
    icon: stockout7Icon,
    filter: { availableDays: '7' },
  },
  {
    icon: stockout14Icon,
    filter: { availableDays: '8-14' },
  },
  {
    icon: slowMovingIcon,
    filter: { riskLevel: '滞销' },
  },
  {
    icon: transferIcon,
    filter: { riskLevel: '调拨' },
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

const skuProductImages = {
  'ELE-HEAD-01': productHeadphoneImage,
  'ELE-KYB-01': productKeyboardImage,
  'ELE-CAM-02': productCameraImage,
  'CAR-VAC-01': productCarVacImage,
  'OUT-WB-01': productBottleImage,
  'HOM-HUM-01': productHumidifierImage,
  'HOM-HUM-02': productHumidifierImage,
  'HOM-HUM-03': productHumidifierImage,
  'ACC-PHONE-01': productPhoneStandImage,
  'ACC-PHONE-02': productPhoneStandImage,
};

function getSkuProductImage(sku, productName = '') {
  if (skuProductImages[sku]) return skuProductImages[sku];
  if (sku.startsWith('PET-') || productName.includes('宠物')) return productPetFeederImage;
  if (sku.startsWith('KID-') || productName.includes('台灯')) return productKidLampImage;
  if (sku.startsWith('CAR-') || productName.includes('吸尘')) return productCarVacImage;
  if (sku.startsWith('OUT-') || productName.includes('水杯')) return productBottleImage;
  if (sku.startsWith('HOM-') || productName.includes('加湿')) return productHumidifierImage;
  if (sku.startsWith('ACC-') || productName.includes('支架')) return productPhoneStandImage;
  if (sku.startsWith('ELE-') && productName.includes('键盘')) return productKeyboardImage;
  if (sku.startsWith('ELE-') && productName.includes('摄像')) return productCameraImage;
  return productHeadphoneImage;
}

const skuSalesTrend = buildRollingDateLabels(7).map((date, index) => ({
  date,
  sales: [14, 16, 15, 18, 20, 17, 22][index],
}));

const INVENTORY_PAGE_SIZE = 10;

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

function InventoryMetricCard({ card, index, onDetail }) {
  const positive = card.change.startsWith('+');
  const changeClass = positive ? 'text-[#FF2D2D]' : 'text-[#16C7A1]';

  return (
    <article className="metric-sparkline-card relative h-[160px] overflow-hidden rounded-[14px] border border-[#E8ECF3] bg-white px-6 py-4 shadow-[0_8px_24px_rgba(28,39,71,0.06)]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center">
            <img className="h-10 w-10 object-contain" src={card.icon} alt="" aria-hidden="true" />
          </div>
          <div className="min-w-0 truncate text-[17px] font-medium leading-6 text-[#111827]">{card.label}</div>
        </div>
        <div className="mt-0.5 whitespace-nowrap text-[30px] font-semibold leading-none tracking-tight text-black">{card.value}</div>
        <div className="mt-2 flex items-center justify-between text-[13px] leading-5">
          <div className="flex items-center gap-2">
            <span className="text-[#5F6B7A]">较昨日</span>
            <span className={changeClass}>
              {card.change} {positive ? '↑' : '↓'}
            </span>
          </div>
          <button className="shrink-0 font-medium text-[#2F7BFF]" onClick={onDetail} type="button">
            查看详情
          </button>
        </div>
      </div>
      <MetricSparkline
        animationDelay={index * 50}
        color={card.tone}
        formatValue={(value) => formatMetricValue(value, card.valueFormat)}
        label={card.label}
        points={card.trend}
      />
    </article>
  );
}

function FilterBox({ label, value, options, onChange }) {
  return (
    <FilterSelect
      label={label}
      value={value}
      options={options}
      placeholder="全部"
      onChange={onChange}
      ariaLabel={label}
      className="flex items-center gap-2"
      labelClassName="text-sm text-[#7889A8]"
      controlClassName="min-w-[122px]"
      triggerClassName="h-10 min-w-[122px] rounded-[8px] px-4 text-sm font-medium"
      menuClassName="w-max min-w-full"
      optionClassName="px-4 py-2 text-sm"
    />
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
    return `补货${row.suggestedReplenishment ?? 100}件`;
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
  const location = useLocation();
  const { showToast } = useToast();
  const {
    adoptInventorySuggestion,
    assignInventoryOwner,
    createInventoryTask,
    inventory,
    platformConnections,
    tasks,
  } = useDemoState();
  const { keyword: topbarKeyword, platform: topbarPlatform } = useTopbarFilter();
  const { refreshTime, refreshNow } = useRefreshTime();
  const [filters, setFilters] = useState({
    platform: '',
    warehouse: '',
    riskLevel: '',
    availableDays: '',
  });
  const [dashboardPreset, setDashboardPreset] = useState('');
  const [selectedSku, setSelectedSku] = useState(null);
  const [adjustedQuantity, setAdjustedQuantity] = useState('300');
  const [adjustReason, setAdjustReason] = useState('覆盖安全库存');
  const [adjustNote, setAdjustNote] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingAction, setPendingAction] = useState(null);

  const metricRows = useMemo(
    () => inventory.filter((item) => !topbarPlatform || item.platform === topbarPlatform),
    [inventory, topbarPlatform],
  );
  const metricCards = useMemo(
    () => buildInventoryMetricStats(metricRows, inventoryMetricStats).map((metric, index) => ({
      ...metric,
      ...metricCardVisuals[index],
    })),
    [metricRows],
  );

  useEffect(() => {
    const presetKey = location.state?.dashboardPreset;
    const preset = getInventoryDashboardPresetMeta(presetKey);
    if (preset) {
      setDashboardPreset(presetKey);
      setFilters({
        platform: '',
        warehouse: '',
        riskLevel: '',
        availableDays: preset.availableDays,
      });
      setCurrentPage(1);
      setSelectedSku(null);
      setPendingAction(null);
    }

    if (location.state?.openSku) {
      setDashboardPreset('');
      const row = inventory.find((item) => item.sku === location.state.openSku);
      if (row) openSkuDrawer(row);
    }
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
      if (topbarPlatform && item.platform !== topbarPlatform) return false;
      if (filters.platform && item.platform !== filters.platform) return false;
      if (filters.warehouse && item.warehouse !== filters.warehouse) return false;
      if (filters.riskLevel && item.riskLevel !== filters.riskLevel) return false;
      if (filters.availableDays && !matchesInventoryAvailableDays(item, filters.availableDays)) return false;
      if (
        !matchesKeyword(
          [
            item.sku,
            item.productName,
            item.platform,
            item.warehouse,
            item.riskLevel,
            item.aiSuggestion,
            item.suggestedReplenishment,
          ],
          topbarKeyword,
        )
      ) {
        return false;
      }
      return true;
    });
  }, [filters, inventory, topbarKeyword, topbarPlatform]);

  const sortedRows = useMemo(
    () => dashboardPreset
      ? applyInventoryDashboardPreset(filteredRows, dashboardPreset)
      : filteredRows,
    [dashboardPreset, filteredRows],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, topbarKeyword, topbarPlatform]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / INVENTORY_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const visibleRows = sortedRows.slice((safePage - 1) * INVENTORY_PAGE_SIZE, safePage * INVENTORY_PAGE_SIZE);
  const visiblePages = getVisiblePages(safePage, pageCount);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const resetFilters = () => setFilters({ platform: '', warehouse: '', riskLevel: '', availableDays: '' });
  const applyMetricFilter = (filter) => {
    setDashboardPreset('');
    setFilters({ platform: '', warehouse: '', riskLevel: '', availableDays: '', ...filter });
    setCurrentPage(1);
  };
  const exportInventory = () => {
    if (!sortedRows.length) {
      showToast({ message: '当前没有可导出的库存数据', type: 'info' });
      return;
    }

    const blob = new Blob([buildInventoryCsv(sortedRows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `异常中枢-库存风险清单-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast({ message: `已导出 ${sortedRows.length} 条库存风险数据`, type: 'success' });
  };
  const openSkuDrawer = (row) => {
    setSelectedSku(row);
    setAdjustedQuantity(String(getReplenishmentQuantity(row)));
    setAdjustReason('覆盖安全库存');
    setAdjustNote('');
  };
  const handleSkuRowKeyDown = (event, row) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSkuDrawer(row);
  };

  const taskBlockReason = selectedSku
    ? getSourceTaskBlockReason(selectedSku, tasks, 'inventory')
    : '';
  const inventoryTaskAlreadyCreated = taskBlockReason === '已存在进行中的关联任务';

  const handleModifyPurchase = () => {
    if (!selectedSku) return;
    if (Number(adjustedQuantity) <= 0) {
      showToast({ message: '补货数量必须大于 0', type: 'error' });
      return;
    }
    adoptInventorySuggestion(selectedSku.sku, { adjustedQuantity: Number(adjustedQuantity) });
    showToast({ message: '已保存修改采购数量，请分派负责人', type: 'success' });
  };
  const handleRejectSuggestion = () => showToast({ message: '已驳回AI建议', type: 'info' });
  const handleAssignInventoryOwner = (owner) => {
    if (!selectedSku) return;
    try {
      assignInventoryOwner(selectedSku.sku, owner);
      showToast({ message: `已分派给${owner}`, type: 'success' });
    } catch (error) {
      showToast({ message: error.message, type: 'info' });
    }
  };
  const handleCreateTask = () => {
    if (!selectedSku) return;
    if (Number(adjustedQuantity) <= 0) {
      showToast({ message: '补货数量必须大于 0', type: 'error' });
      return;
    }
    if (taskBlockReason) {
      showToast({ message: taskBlockReason, type: 'info' });
      return;
    }
    const stale = requiresStaleDataConfirmation(selectedSku, platformConnections);
    const highRisk = selectedSku.riskLevel === '高';
    const execute = () => {
      const advanceIntent = createSourceAdvanceIntent(
        sortedRows.map((row) => row.sku),
        selectedSku.sku,
      );
      const result = createInventoryTask(selectedSku, { quantity: adjustedQuantity });
      if (!result.ok) {
        showToast({ message: result.error, type: 'info' });
        return;
      }

      const advance = resolveSourceAdvance(
        advanceIntent,
        sortedRows.map((row) => row.sku),
        INVENTORY_PAGE_SIZE,
      );

      if (advance.isQueueComplete) {
        setSelectedSku(null);
        showToast({ message: '补货任务已创建，当前队列已处理完成', type: 'success' });
        return;
      }

      const nextSku = sortedRows.find((row) => row.sku === advance.itemId);
      setCurrentPage(advance.page);
      openSkuDrawer(nextSku);
      showToast({ message: '补货任务已创建', type: 'success' });
    };
    if (!stale && !highRisk) {
      execute();
      return;
    }
    const connection = platformConnections.find((item) => item.platform === selectedSku.platform);
    setPendingAction({
      title: '确认创建补货任务',
      description: `即将为 ${selectedSku.sku} 创建补货 ${adjustedQuantity} 件的协同任务。`,
      warnings: [
        ...(highRisk ? ['该 SKU 为高风险库存，请确认已核对补货公式和 AI 判断依据。'] : []),
        ...(stale ? [`${selectedSku.platform} 数据已停止同步，最后成功同步：${connection?.lastSuccessfulSync || '未知'}。`] : []),
      ],
      execute,
    });
  };

  const selectedConnection = platformConnections.find((item) => item.platform === selectedSku?.platform);

  return (
    <>
      <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-3">
        <header className="page-header flex shrink-0 items-center justify-between">
          <h1 className="page-title">库存决策</h1>
          <div className="flex items-center gap-4">
            <LiveUpdateTime className="text-sm text-[#7889A8]" value={refreshTime} />
            <PageHeaderActionButton icon={RefreshCw} onClick={refreshNow}>刷新数据</PageHeaderActionButton>
          </div>
        </header>

        <div className="grid shrink-0 grid-cols-4 gap-3">
          {metricCards.map((card, index) => (
            <InventoryMetricCard key={card.label} card={card} index={index} onDetail={() => applyMetricFilter(card.filter)} />
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
                { label: '8–14天', value: '8-14' },
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
              className="flex h-10 min-w-[104px] items-center justify-center gap-2 rounded-[8px] border border-[#9CC0FF] bg-[#F5F9FF] px-4 text-sm font-semibold text-[#2F7BFF] transition hover:bg-[#EAF2FF]"
              onClick={exportInventory}
              type="button"
            >
              <Download className="h-4 w-4" />
              导出清单
            </button>
          </div>
        </section>

        <section className="min-h-0 flex-1 overflow-hidden rounded-[14px] border border-[#E6EAF2] bg-white shadow-[var(--shadow-card)]">
          <div className="flex h-[62px] items-center px-5">
            <h2 className="text-[20px] font-semibold text-[#111827]">
              SKU风险列表 <span className="ml-1 text-base font-normal text-[#8A98B3]">（共{sortedRows.length}个SKU）</span>
            </h2>
          </div>

          {dashboardPreset ? (
            <div className="mx-5 mb-2 flex h-8 shrink-0 items-center justify-between rounded-[8px] border border-[#CFE0FF] bg-[#F4F8FF] px-3 text-xs text-[#3767A6]">
              <span>来自异常工作台：{getInventoryDashboardPresetMeta(dashboardPreset).label}</span>
              <button
                type="button"
                className="font-medium text-[#2F7BFF]"
                onClick={() => {
                  setDashboardPreset('');
                  setCurrentPage(1);
                }}
              >
                清除
              </button>
            </div>
          ) : null}

          <div className={`${dashboardPreset ? 'h-[calc(100%-162px)]' : 'h-[calc(100%-122px)]'} overflow-y-auto overflow-x-hidden px-5 [scrollbar-gutter:stable]`}>
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '7%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '6%' }} />
              </colgroup>
              <thead className="sticky top-0 z-10 h-[52px] border-b border-[#E3E9F3] bg-white text-sm font-semibold text-[#8A98B3]">
                <tr>
                  <th className="pl-2">风险等级</th>
                  <th>SKU</th>
                  <th>商品名称</th>
                  <th className="text-center">平台</th>
                  <th className="text-center">仓库</th>
                  <th className="text-center">当前库存</th>
                  <th className="text-center">在途库存</th>
                  <th className="text-center">日均销量</th>
                  <th className="text-center">可售天数</th>
                  <th>AI建议</th>
                  <th className="text-center">负责人</th>
                  <th className="pr-2 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#1D273B]">
                {visibleRows.map((row) => {
                  const isSelected = selectedSku?.sku === row.sku;

                  return (
                  <tr
                    key={row.sku}
                    aria-selected={isSelected}
                    tabIndex={0}
                    onClick={() => openSkuDrawer(row)}
                    onKeyDown={(event) => handleSkuRowKeyDown(event, row)}
                    className={`h-[52px] cursor-pointer border-b border-[#E3E9F3] transition focus-visible:outline-none ${
                      isSelected ? 'bg-[#EAF2FF] shadow-[inset_3px_0_0_#2F7BFF]' : 'hover:bg-[#F8FAFE]'
                    }`}
                  >
                    <td className="pl-2">
                      <RiskExplanationPopover level={row.riskLevel} explanation={row.riskExplanation}>
                        <RiskBadge level={row.riskLevel} />
                      </RiskExplanationPopover>
                    </td>
                    <td>
                      <button
                        className="font-medium text-[#2F7BFF] underline underline-offset-2"
                        onClick={(event) => {
                          event.stopPropagation();
                          openSkuDrawer(row);
                        }}
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
                    <td className="text-center">{row.owner}</td>
                    <td className="pr-2 text-right">
                      <button
                        className="font-medium text-[#2F7BFF]"
                        onClick={(event) => {
                          event.stopPropagation();
                          openSkuDrawer(row);
                        }}
                        type="button"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedRows.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-[#8A98B3]">暂无符合条件的 SKU 风险</div>
            ) : null}
          </div>

          <div className="flex h-[60px] items-center justify-end gap-5 border-t border-[#E8EDF5] px-5 text-sm text-[#6B778C]">
            <span>共 {sortedRows.length} 个SKU</span>
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
        titleExtra={selectedSku ? (
          <RiskExplanationPopover level={selectedSku.riskLevel} explanation={selectedSku.riskExplanation}>
            <RiskBadge level={selectedSku.riskLevel} />
          </RiskExplanationPopover>
        ) : null}
        onClose={() => setSelectedSku(null)}
        width={450}
        topOffset={64}
        bodyClassName="bg-[#F5F7FB]"
        footer={
          <div className="flex h-full items-center gap-3">
            <button
              className="h-10 flex-1 rounded-[8px] border border-[#2F7BFF] bg-white px-2 text-sm font-semibold text-[#2F7BFF]"
              onClick={handleModifyPurchase}
              type="button"
            >
              修改采购
            </button>
            <button
              className="h-10 flex-1 rounded-[8px] border border-[#D9E1EE] bg-white px-2 text-sm font-semibold text-[#5F6B7A]"
              onClick={handleRejectSuggestion}
              type="button"
            >
              驳回建议
            </button>
            <button
              className="h-10 flex-1 rounded-[8px] bg-[#2F7BFF] px-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(47,123,255,0.22)] disabled:cursor-not-allowed disabled:bg-[#AFCBFF]"
              disabled={Boolean(taskBlockReason)}
              onClick={handleCreateTask}
              title={taskBlockReason}
              type="button"
            >
              {inventoryTaskAlreadyCreated ? '任务已创建' : '创建补货任务'}
            </button>
          </div>
        }
      >
        {selectedSku ? (
          <div className="space-y-3">
            <DataFreshnessNotice connection={selectedConnection} />
            <SkuDetailDrawerContent
              selectedSku={selectedSku}
              connection={selectedConnection}
              adjustedQuantity={adjustedQuantity}
              adjustReason={adjustReason}
              adjustNote={adjustNote}
              setAdjustedQuantity={setAdjustedQuantity}
              setAdjustReason={setAdjustReason}
              setAdjustNote={setAdjustNote}
              onAssignOwner={handleAssignInventoryOwner}
              tasks={tasks}
            />
          </div>
        ) : null}
      </DetailDrawer>
      <ConfirmActionDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
        description={pendingAction?.description}
        warnings={pendingAction?.warnings}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          const execute = pendingAction?.execute;
          setPendingAction(null);
          execute?.();
        }}
      />
    </>
  );
}

function SkuDetailDrawerContent({
  selectedSku,
  connection,
  adjustedQuantity,
  adjustReason,
  adjustNote,
  setAdjustedQuantity,
  setAdjustReason,
  setAdjustNote,
  onAssignOwner,
  tasks,
}) {
  const detail = selectedSku.detail ?? {};
  const productName = detail.displayName ?? productNameOverrides[selectedSku.sku] ?? selectedSku.productName;
  const warehouse = detail.warehouseName ?? `${selectedSku.warehouse}仓`;
  const productImage = getSkuProductImage(selectedSku.sku, productName);
  const replenishment = getReplenishmentQuantity(selectedSku);
  const confidence = Math.round((selectedSku.confidence || 0.8) * 100);
  const planning = selectedSku.inventoryPlanning ?? {};
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
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[#DCEAFF] via-[#F4F8FF] to-[#BFD6FF]">
            <img className="h-full w-full object-contain p-1.5" src={productImage} alt={productName} />
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
          <span className="font-semibold text-[#1D273B]">{selectedSku.status ?? detail.processStatus ?? '待处理'}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E6EAF2]">
          <div className="h-full rounded-full bg-[#2F7BFF]" style={{ width: `${confidence}%` }} />
        </div>
      </section>

      <AiEvidencePanel evidence={selectedSku.aiEvidence} connection={connection} />

      <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
        <h3 className="text-sm font-semibold text-[#1D273B]">库存计算口径</h3>
        <div className="mt-3 space-y-2 text-xs leading-5 text-[#5F6B7A]">
          <div className="flex justify-between gap-3"><span>有效在途 / 安全库存</span><span className="font-semibold text-[#1D273B]">{planning.effectiveTransitStock} / {planning.safetyStock} 件</span></div>
          <div className="flex justify-between gap-3"><span>预测周期 / 箱规</span><span className="font-semibold text-[#1D273B]">{Number(planning.targetDays || 0).toFixed(1)} 天 / {planning.packSize} 件</span></div>
          <div className="rounded-[8px] bg-[#F5F7FB] px-3 py-2 text-[#344767]">
            可售天数 =（{selectedSku.currentStock} + {planning.effectiveTransitStock} - {planning.safetyStock}）÷ {selectedSku.dailySales} = <strong>{selectedSku.availableDays} 天</strong>
          </div>
          <div className="rounded-[8px] bg-[#F5F7FB] px-3 py-2 text-[#344767]">
            补货量按目标周期缺口计算，并按 {planning.packSize} 件箱规向上取整 = <strong>{replenishment} 件</strong>
          </div>
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
            <span className="text-xs text-[#7889A8]">负责人</span>
            <AssigneeWorkloadSelect
              ariaLabel="分派库存负责人"
              className="mt-1"
              disabled={selectedSku.status === '待处理'}
              members={taskTeamMembers}
              onChange={onAssignOwner}
              source={selectedSku}
              tasks={tasks}
              triggerClassName="h-9 w-full rounded-[8px] px-3 text-sm"
              value={selectedSku.owner}
            />
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
