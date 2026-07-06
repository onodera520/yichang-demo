export const dashboardStats = [
  { label: '待处理异常', value: 128, trend: '较昨日 +12', icon: 'warning' },
  { label: '超时任务', value: 16, trend: '平均超时 3.2h', icon: 'clock' },
  { label: '库存风险 SKU', value: 42, trend: '高风险 9 个', icon: 'package' },
  { label: '今日已关闭', value: 87, trend: '关闭率 68%', icon: 'check' },
];

export const orders = [
  {
    id: 'ORD-240701-8921',
    platform: 'Amazon US',
    issue: '地址校验失败',
    owner: 'Sarah Chen',
    priority: '高',
  },
  {
    id: 'ORD-240701-8846',
    platform: 'Shopify',
    issue: '支付状态不同步',
    owner: '李明',
    priority: '中',
  },
  {
    id: 'ORD-240701-8790',
    platform: 'TikTok Shop',
    issue: '物流轨迹中断',
    owner: '赵雨',
    priority: '高',
  },
];

export const inventoryRisks = [
  { sku: 'SKU-AF-1098', product: 'Portable Blender', risk: '7 天内断货' },
  { sku: 'SKU-BC-2210', product: 'LED Camping Lamp', risk: '库存周转偏慢' },
  { sku: 'SKU-KT-7721', product: 'Kitchen Scale', risk: '补货在途延迟' },
];

export const tasks = [
  {
    id: 'TASK-001',
    title: '核对 Amazon US 物流异常批次',
    assignee: '王婧',
    due: '今日 18:00',
    status: '处理中',
  },
  {
    id: 'TASK-002',
    title: '同步 Shopify 支付回调状态',
    assignee: '何涛',
    due: '明日 10:00',
    status: '待确认',
  },
  {
    id: 'TASK-003',
    title: '复核高风险 SKU 补货建议',
    assignee: '刘洋',
    due: '今日 20:00',
    status: '待处理',
  },
];

export const chartData = {
  exceptionTrend: [
    { date: '07/01', count: 98 },
    { date: '07/02', count: 112 },
    { date: '07/03', count: 87 },
    { date: '07/04', count: 136 },
    { date: '07/05', count: 128 },
    { date: '07/06', count: 119 },
    { date: '07/07', count: 104 },
  ],
  analyticsSummary: [
    { label: '异常总量', value: '1,284' },
    { label: '平均处理时长', value: '2.7h' },
    { label: '影响金额', value: '$48.2k' },
    { label: '自动化命中率', value: '31%' },
  ],
};

export const platformConnections = [
  { name: 'Amazon US', status: '已连接', lastSync: '2026-07-05 15:40' },
  { name: 'Shopify DTC', status: '已连接', lastSync: '2026-07-05 15:28' },
  { name: 'TikTok Shop', status: '需授权', lastSync: '2026-07-04 22:10' },
];
