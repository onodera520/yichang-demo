import {
  DEMO_NOW,
  STALE_EBAY_SYNC_AT,
  buildBusinessDateTime,
} from './demoTime.js';

const seedOrders = [
  {
    id: 'order-001',
    orderNo: 'AMZ-US-240613-0188',
    riskLevel: '高',
    abnormalType: '缺货',
    store: 'US-旗舰店',
    platform: 'Amazon',
    country: '美国',
    amount: 4860,
    remainingSLA: '01:42:31',
    owner: '王敏',
    status: '待处理',
    aiSuggestion: '切换至 NJ 仓发货，LA 仓库存为 0，NJ 仓有 12 件可用库存，可避免订单超时取消。',
    confidence: 0.92,
    impact: '影响 8 笔订单，预计挽回金额 ¥4,860',
    relatedSku: 'ELE-HEAD-01',
  },
  {
    id: 'order-002',
    orderNo: 'TTS-US-240613-0316',
    riskLevel: '高',
    abnormalType: '物流延误',
    store: 'US-旗舰店',
    platform: 'TikTok Shop',
    country: '美国',
    amount: 2390,
    remainingSLA: '00:46:14',
    owner: '赵宁',
    status: '待处理',
    aiSuggestion: '更换物流渠道并优先补发，当前轨迹 48 小时未更新，建议同步客服安抚话术。',
    confidence: 0.75,
    impact: '影响 6 笔订单，预计挽回金额 ¥2,390',
    relatedSku: 'CAR-VAC-01',
  },
  {
    id: 'order-003',
    orderNo: 'SHP-UK-240613-0061',
    riskLevel: '中',
    abnormalType: '地址异常',
    store: 'UK-品牌店',
    platform: 'Shopee',
    country: '英国',
    amount: 1280,
    remainingSLA: '03:18:15',
    owner: '陈浩',
    status: '处理中',
    aiSuggestion: '地址邮编与城市不匹配，建议触发地址校正规则并发送买家确认消息。',
    confidence: 0.86,
    impact: '影响 3 笔订单，预计挽回金额 ¥1,280',
    relatedSku: 'ACC-PHONE-01',
  },
  {
    id: 'order-004',
    orderNo: 'EBY-DE-240613-0098',
    riskLevel: '中',
    abnormalType: '平台同步失败',
    store: 'DE-生活馆',
    platform: 'eBay',
    country: '德国',
    amount: 930,
    remainingSLA: '05:20:24',
    owner: '未分派',
    status: '待分派',
    aiSuggestion: '订单状态已在 ERP 更新但平台回写失败，建议重试接口并监控同步状态。',
    confidence: 0.89,
    impact: '影响 4 笔订单，预计挽回金额 ¥930',
    relatedSku: 'HOM-HUM-03',
  },
  {
    id: 'order-005',
    orderNo: 'AMZ-CA-240613-0114',
    riskLevel: '低',
    abnormalType: '退款',
    store: 'CA-旗舰店',
    platform: 'Amazon',
    country: '加拿大',
    amount: 560,
    remainingSLA: '12:10:14',
    owner: '刘畅',
    status: '待处理',
    aiSuggestion: '买家退款原因与物流轨迹不一致，建议客服介入并引导用户减少退款。',
    confidence: 0.78,
    impact: '影响 2 笔订单，预计挽回金额 ¥560',
    relatedSku: 'OUT-WB-01',
  },
  {
    id: 'order-006',
    orderNo: 'AMZ-JP-240612-0095',
    riskLevel: '中',
    abnormalType: '清关异常',
    store: 'JP-旗舰店',
    platform: 'Amazon',
    country: '日本',
    amount: 1150,
    remainingSLA: '08:35:53',
    owner: '张磊',
    status: '待处理',
    aiSuggestion: '补充报关资料并提前预审，避免清关异常扩大至同批次订单。',
    confidence: 0.82,
    impact: '影响 5 笔订单，预计挽回金额 ¥1,150',
    relatedSku: 'ELE-KYB-01',
  },
  {
    id: 'order-007',
    orderNo: 'TTS-US-240612-0221',
    riskLevel: '中',
    abnormalType: '支付异常',
    store: 'US-旗舰店',
    platform: 'TikTok Shop',
    country: '美国',
    amount: 780,
    remainingSLA: '02:15:51',
    owner: '李娜',
    status: '处理中',
    aiSuggestion: '支付状态与平台回调不一致，建议重新拉取支付流水并锁定异常订单。',
    confidence: 0.84,
    impact: '影响 3 笔订单，预计挽回金额 ¥780',
    relatedSku: 'ACC-PHONE-02',
  },
  {
    id: 'order-008',
    orderNo: 'SHP-AU-240612-0183',
    riskLevel: '高',
    abnormalType: '缺货',
    store: 'AU-轻奢店',
    platform: 'Shopee',
    country: '澳大利亚',
    amount: 3450,
    remainingSLA: '04:25:14',
    owner: '周洋',
    status: '待处理',
    aiSuggestion: 'AU 仓库存不足，建议调拨至可履约仓并同步缺货预警给采购。',
    confidence: 0.88,
    impact: '影响 7 笔订单，预计挽回金额 ¥3,450',
    relatedSku: 'HOM-HUM-02',
  },
  {
    id: 'order-009',
    orderNo: 'AMZ-FR-240612-0177',
    riskLevel: '中',
    abnormalType: '物流延误',
    store: 'FR-旗舰店',
    platform: 'Amazon',
    country: '法国',
    amount: 1980,
    remainingSLA: '01:05:41',
    owner: '未分派',
    status: '待分派',
    aiSuggestion: '尾程派送超时，建议更换承运商并对高价值订单生成补偿策略。',
    confidence: 0.76,
    impact: '影响 4 笔订单，预计挽回金额 ¥1,980',
    relatedSku: 'CAR-VAC-01',
  },
  {
    id: 'order-010',
    orderNo: 'EBY-IT-240612-0160',
    riskLevel: '低',
    abnormalType: '地址异常',
    store: 'IT-旗舰店',
    platform: 'eBay',
    country: '意大利',
    amount: 620,
    remainingSLA: '18:40:51',
    owner: '吴越',
    status: '待处理',
    aiSuggestion: '识别到门牌号缺失，建议向买家发送地址补全模板。',
    confidence: 0.81,
    impact: '影响 2 笔订单，预计挽回金额 ¥620',
    relatedSku: 'OUT-WB-01',
  },
  {
    id: 'order-011',
    orderNo: 'EBY-DE-240615-0177',
    riskLevel: '低',
    abnormalType: '发票异常',
    store: 'DE-生活馆',
    platform: 'eBay',
    country: '德国',
    amount: 462,
    remainingSLA: '43:11:23',
    owner: '周洋',
    status: '已完成',
    aiSuggestion: '补开发票信息并同步税务字段，避免重复触发发票异常。',
    confidence: 0.73,
    impact: '影响 1 笔订单，金额 ¥462',
    relatedSku: 'HOM-HUM-01',
  },
  {
    id: 'order-012',
    orderNo: 'SHP-AU-240611-0281',
    riskLevel: '中',
    abnormalType: '退款',
    store: 'AU-轻奢店',
    platform: 'Shopee',
    country: '澳大利亚',
    amount: 169,
    remainingSLA: '10:37:19',
    owner: '未分派',
    status: '已驳回',
    aiSuggestion: '退款凭证不完整，建议驳回并提示买家补充图片材料。',
    confidence: 0.68,
    impact: '影响 1 笔订单，金额 ¥169',
    relatedSku: 'ACC-PHONE-02',
  },
];

const orderPlatforms = ['Amazon', 'TikTok Shop', 'Shopee', 'eBay'];
const orderCountries = ['美国', '英国', '德国', '日本', '加拿大', '澳大利亚', '法国', '西班牙', '意大利', '墨西哥'];
const orderStores = ['US-旗舰店', 'UK-品牌店', 'DE-生活馆', 'JP-旗舰店', 'CA-旗舰店', 'AU-轻奢店', 'FR-家居店', 'ES-数码店'];
const orderTypes = ['缺货', '物流延误', '地址异常', '平台同步失败', '支付异常', '退款', '清关异常', '发票异常'];
const orderOwners = ['王敏', '赵宁', '陈浩', '未分派', '刘畅', '张磊', '李娜', '周扬'];
const orderStatuses = ['待处理', '处理中', '待分派', '已完成', '已驳回'];
const orderSkuPool = ['ELE-HEAD-01', 'CAR-VAC-01', 'ACC-PHONE-01', 'HOM-HUM-03', 'OUT-WB-01', 'ELE-KYB-01', 'PET-FEED-02', 'KID-LAMP-05'];
const countryCodes = { 美国: 'US', 英国: 'UK', 德国: 'DE', 日本: 'JP', 加拿大: 'CA', 澳大利亚: 'AU', 法国: 'FR', 西班牙: 'ES', 意大利: 'IT', 墨西哥: 'MX' };

function pad(value, size = 3) {
  return String(value).padStart(size, '0');
}

function buildSla(index) {
  const hours = (index * 3) % 18;
  const minutes = (index * 17) % 60;
  const seconds = (index * 11) % 60;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}`;
}

function orderSuggestion(type, warehouse, count) {
  const map = {
    缺货: `建议切换至 ${warehouse} 仓发货，并同步采购补货 ${count} 件，避免订单超时取消。`,
    物流延误: '建议更换物流渠道并同步客服安抚话术，优先处理超过 48 小时未更新轨迹的包裹。',
    地址异常: '建议触发地址校正规则并发送买家确认消息，避免派送失败。',
    平台同步失败: '建议重试平台回写接口，并记录 ERP 与平台状态差异。',
    支付异常: '建议重新拉取支付流水并锁定异常订单，避免重复发货。',
    退款: '建议复核退款原因与物流轨迹，确认是否需要客服介入。',
    清关异常: '建议补充报关资料并提前预约清关窗口，降低退运风险。',
    发票异常: '建议重新生成发票并同步税务字段，避免平台审核失败。',
  };
  return map[type] ?? map.缺货;
}

function createOrder(index) {
  const type = orderTypes[index % orderTypes.length];
  const platform = orderPlatforms[index % orderPlatforms.length];
  const country = orderCountries[index % orderCountries.length];
  const store = orderStores[index % orderStores.length];
  const status = orderStatuses[index % orderStatuses.length];
  const owner = status === '待分派' ? '未分派' : orderOwners[index % orderOwners.length];
  const riskLevel = index % 9 === 0 ? '高' : index % 3 === 0 ? '中' : index % 4 === 0 ? '低' : index % 5 === 0 ? '高' : '中';
  const amount = 420 + ((index * 317) % 7200);
  const warehouse = ['NJ', 'LA', 'TX', 'UK', 'DE'][index % 5];
  const relatedSku = orderSkuPool[index % orderSkuPool.length];
  const orderNo = `${platform === 'Amazon' ? 'AMZ' : platform === 'TikTok Shop' ? 'TTS' : platform === 'Shopee' ? 'SHP' : 'EBY'}-${countryCodes[country] ?? 'US'}-2406${pad((index % 18) + 10, 2)}-${pad(index + 1, 4)}`;

  return {
    id: `order-${pad(index + 1)}`,
    orderNo,
    riskLevel,
    abnormalType: type,
    store,
    platform,
    country,
    amount,
    remainingSLA: buildSla(index),
    owner,
    status,
    aiSuggestion: orderSuggestion(type, warehouse, 80 + (index % 9) * 20),
    confidence: Number((0.68 + (index % 25) / 100).toFixed(2)),
    impact: `影响 ${2 + (index % 9)} 笔订单，预计挽回金额 ¥${amount.toLocaleString('zh-CN')}`,
    relatedSku,
    detail: {
      createdAt: `2026-06-${pad((index % 28) + 1, 2)} ${pad(8 + (index % 10), 2)}:${pad((index * 7) % 60, 2)}:${pad((index * 13) % 60, 2)}`,
      receiver: ['John Smith', 'Emma Wilson', '佐藤健一', 'Mia Brown', 'Lucas Martin', 'Sofia Garcia'][index % 6],
      country,
      store,
      orderAmount: amount + 160 + (index % 8) * 35,
      owner,
      reason: `${type}触发规则命中，系统检测到 ${store} / ${platform} 存在履约风险。`,
      skuName: ['头戴式无线降噪耳机Pro', '便携式车载无线吸尘器', '手机桌面支架', '桌面加湿器', '运动保温水杯', '机械键盘'][index % 6],
      skuCode: relatedSku,
      availableStock: (index * 5) % 42,
      inTransitStock: (index * 11) % 80,
      aiTitle: type === '缺货' ? `建议切换至 ${warehouse} 仓发货` : `建议处理${type}`,
      aiDescription: orderSuggestion(type, warehouse, 80 + (index % 9) * 20),
      beforeRisk: riskLevel,
      afterRisk: riskLevel === '高' ? '低' : riskLevel === '中' ? '低' : riskLevel,
    },
  };
}

function enrichOrder(order, index) {
  if (order.detail) return order;
  return {
    ...order,
    detail: {
      createdAt: `2026-06-01 ${pad(8 + (index % 4), 2)}:${pad((index * 9) % 60, 2)}:${pad((index * 17) % 60, 2)}`,
      receiver: ['John Smith', 'Emma Wilson', 'Michael Lee', 'Sakura Tanaka'][index % 4],
      country: order.country,
      store: order.store,
      orderAmount: order.amount,
      owner: order.owner,
      reason: order.aiSuggestion,
      skuName: ['头戴式无线降噪耳机Pro', '便携式车载无线吸尘器', '手机桌面支架', '桌面加湿器'][index % 4],
      skuCode: order.relatedSku,
      availableStock: (index * 7) % 38,
      inTransitStock: (index * 13) % 76,
      aiTitle: order.abnormalType === '缺货' ? '建议切换至 NJ 仓发货' : `建议处理${order.abnormalType}`,
      aiDescription: order.aiSuggestion,
      beforeRisk: order.riskLevel,
      afterRisk: order.riskLevel === '高' ? '低' : order.riskLevel,
    },
  };
}

export const orders = [...seedOrders, ...Array.from({ length: 128 - seedOrders.length }, (_, index) => createOrder(index + seedOrders.length))].map(enrichOrder);

const seedInventory = [
  {
    sku: 'ELE-HEAD-01',
    productName: '头戴式无线降噪耳机Pro',
    platform: 'Amazon',
    warehouse: 'LA',
    currentStock: 12,
    inTransitStock: 6,
    dailySales: 18,
    availableDays: 0.8,
    riskLevel: '高',
    aiSuggestion: '补货300件，并将 NJ 仓 12 件可用库存切换为优先发货仓。',
    confidence: 0.92,
    suggestedReplenishment: 300,
  },
  {
    sku: 'SKU-NJ-2406-018',
    productName: '智能降噪蓝牙耳机标准版',
    platform: 'Amazon',
    warehouse: 'LA',
    currentStock: 24,
    inTransitStock: 36,
    dailySales: 12,
    availableDays: 4.7,
    riskLevel: '高',
    aiSuggestion: '补货120件至 LA 仓，覆盖活动周期并保留安全库存。',
    confidence: 0.88,
    suggestedReplenishment: 120,
  },
  {
    sku: 'ELE-KYB-01',
    productName: '有线机械键盘 黑轴',
    platform: 'TikTok Shop',
    warehouse: 'NJ',
    currentStock: 8,
    inTransitStock: 16,
    dailySales: 16,
    availableDays: 0.5,
    riskLevel: '高',
    aiSuggestion: '补货200件，短期提升 NJ 仓安全库存并限制促销投放。',
    confidence: 0.88,
    suggestedReplenishment: 200,
  },
  {
    sku: 'CAR-VAC-01',
    productName: '便携式车载无线吸尘器',
    platform: 'Shopee',
    warehouse: 'UK',
    currentStock: 54,
    inTransitStock: 32,
    dailySales: 16.6,
    availableDays: 2.9,
    riskLevel: '中',
    aiSuggestion: '补货100件，优先覆盖 UK 仓 7 天销量缺口。',
    confidence: 0.84,
    suggestedReplenishment: 100,
  },
  {
    sku: 'OUT-WB-01',
    productName: '运动保温水杯 750ml',
    platform: 'eBay',
    warehouse: 'LA',
    currentStock: 120,
    inTransitStock: 80,
    dailySales: 2,
    availableDays: 60,
    riskLevel: '低',
    aiSuggestion: '库存健康，建议持续观察并维持当前补货节奏。',
    confidence: 0.76,
    suggestedReplenishment: 0,
  },
  {
    sku: 'HOM-HUM-01',
    productName: '家用静音小型桌面加湿器',
    platform: 'Amazon',
    warehouse: 'US',
    currentStock: 300,
    inTransitStock: 0,
    dailySales: 1,
    availableDays: 290.3,
    riskLevel: '滞销',
    aiSuggestion: '促销清库存，建议降价 8% 并组合搭售桌面支架。',
    confidence: 0.87,
    suggestedReplenishment: 0,
  },
  {
    sku: 'ACC-PHONE-01',
    productName: '可折叠手机桌面懒人支架',
    platform: 'Shopee',
    warehouse: 'UK',
    currentStock: 240,
    inTransitStock: 10,
    dailySales: 2,
    availableDays: 120,
    riskLevel: '滞销',
    aiSuggestion: '促销清库存，建议转入配件组合包并压缩后续采购。',
    confidence: 0.79,
    suggestedReplenishment: 0,
  },
  {
    sku: 'HOM-HUM-02',
    productName: '静音小型桌面加湿器',
    platform: 'Amazon',
    warehouse: 'US',
    currentStock: 183,
    inTransitStock: 6,
    dailySales: 1,
    availableDays: 183,
    riskLevel: '滞销',
    aiSuggestion: '促销清库存，建议与高动销 SKU 捆绑。',
    confidence: 0.75,
    suggestedReplenishment: 0,
  },
  {
    sku: 'ACC-PHONE-02',
    productName: '手机桌面懒人支架',
    platform: 'Shopee',
    warehouse: 'UK',
    currentStock: 72,
    inTransitStock: 50,
    dailySales: 9.6,
    availableDays: 7.5,
    riskLevel: '调拨',
    aiSuggestion: '调拨至 LA 仓，缓解 US 店铺未来 7 天库存缺口。',
    confidence: 0.82,
    suggestedReplenishment: 0,
  },
  {
    sku: 'HOM-HUM-03',
    productName: '小型桌面加湿器',
    platform: 'Amazon',
    warehouse: 'US',
    currentStock: 54,
    inTransitStock: 70,
    dailySales: 8,
    availableDays: 7,
    riskLevel: '调拨',
    aiSuggestion: '调拨至 US 仓并设置安全库存 80 件。',
    confidence: 0.8,
    suggestedReplenishment: 0,
  },
  {
    sku: 'ELE-CAM-02',
    productName: '户外运动摄像机套装',
    platform: 'eBay',
    warehouse: 'DE',
    currentStock: 91,
    inTransitStock: 24,
    dailySales: 7.2,
    availableDays: 12.6,
    riskLevel: '低',
    aiSuggestion: '库存可覆盖 12 天销售，建议暂不补货，关注欧洲站活动排期。',
    confidence: 0.72,
    suggestedReplenishment: 0,
  },
];

const inventoryPlatforms = ['Amazon', 'TikTok Shop', 'Shopee', 'eBay', 'Shopify'];
const inventoryWarehouses = ['LA', 'NJ', 'TX', 'UK', 'DE', 'JP', 'CA'];
const inventoryRiskLevels = ['高', '中', '低', '滞销', '调拨'];
const inventoryNames = ['头戴式无线降噪耳机Pro', '便携式车载无线吸尘器', '可折叠手机桌面支架', '桌面静音加湿器', '运动保温水杯', '机械键盘黑轴', '智能宠物喂食器', '儿童护眼台灯'];

function buildSalesTrend(index, base) {
  return Array.from({ length: 7 }, (_, day) => ({
    date: `5.${26 + day}`,
    sales: Math.max(2, base + ((index + day * 3) % 9) - 3),
  }));
}

function createInventoryItem(index) {
  const platform = inventoryPlatforms[index % inventoryPlatforms.length];
  const warehouse = inventoryWarehouses[index % inventoryWarehouses.length];
  const riskLevel = inventoryRiskLevels[index % inventoryRiskLevels.length];
  const dailySales = 4 + (index % 26);
  const currentStock = riskLevel === '高' ? index % 18 : 18 + ((index * 7) % 260);
  const inTransitStock = riskLevel === '滞销' ? 0 : (index * 11) % 180;
  const availableDays = riskLevel === '滞销' ? 96 + (index % 80) : Math.max(1, Math.round(currentStock / dailySales));
  const suggestedReplenishment = riskLevel === '滞销' ? 0 : 80 + (index % 12) * 25;
  const sku = `${['ELE', 'CAR', 'ACC', 'HOM', 'OUT', 'PET', 'KID', 'KIT'][index % 8]}-${platform.replace(/\s/g, '').slice(0, 3).toUpperCase()}-${pad(index + 1, 3)}`;
  const productName = inventoryNames[index % inventoryNames.length];

  return {
    sku,
    productName,
    platform,
    warehouse,
    currentStock,
    inTransitStock,
    dailySales,
    availableDays,
    riskLevel,
    aiSuggestion:
      riskLevel === '滞销'
        ? '建议下调补货优先级，转入活动清仓或组合销售。'
        : riskLevel === '调拨'
          ? `建议从 ${inventoryWarehouses[(index + 2) % inventoryWarehouses.length]} 仓调拨至 ${warehouse} 仓。`
          : `建议补货 ${suggestedReplenishment} 件至 ${warehouse} 仓，覆盖安全库存周期。`,
    confidence: Number((0.7 + (index % 24) / 100).toFixed(2)),
    suggestedReplenishment,
    status: riskLevel === '高' ? '待处理' : riskLevel === '调拨' ? '待调拨' : '待复核',
    detail: {
      displayName: productName,
      warehouseName: `${warehouse}仓`,
      salesTrend: buildSalesTrend(index, dailySales),
      suggestionReason:
        riskLevel === '滞销'
          ? '近 14 天销量低于安全阈值，建议控制补货并加入清仓活动。'
          : `结合日均销量 ${dailySales} 件、可售 ${availableDays} 天与在途库存 ${inTransitStock} 件，建议优先处理。`,
      processStatus: riskLevel === '高' ? '待补货确认' : riskLevel === '调拨' ? '待调拨确认' : '待人工复核',
    },
  };
}

function enrichInventory(item, index) {
  if (item.detail) return item;
  return {
    ...item,
    detail: {
      displayName: item.productName,
      warehouseName: `${item.warehouse}仓`,
      salesTrend: buildSalesTrend(index, item.dailySales),
      suggestionReason: item.aiSuggestion || `建议补货 ${item.suggestedReplenishment || 120} 件，平衡库存与缺货风险。`,
      processStatus: item.status || '待处理',
    },
  };
}

export const inventory = [...seedInventory, ...Array.from({ length: 125 - seedInventory.length }, (_, index) => createInventoryItem(index + seedInventory.length))].map(enrichInventory);

const seedTaskRows = [
  {
    id: 'task-001',
    title: '切换至 NJ 仓发货',
    source: 'AMZ-US-240613-0188',
    riskLevel: '高',
    owner: '王敏',
    status: '处理中',
    remainingSLA: '01:42:32',
    createdAt: '2026-06-01 10:24',
    description: '由于 LA 仓库存为 0，NJ 仓有可用库存，请切换发货仓以避免订单超时取消。',
    processLogs: [
      { time: '今天 10:24', owner: '林晓', action: '创建任务', detail: '来源：AI 建议 - 切换至 NJ 仓发货' },
      { time: '今天 10:25', owner: '王敏', action: '接收任务', detail: '确认订单与库存数据一致' },
      { time: '今天 10:25', owner: '王敏', action: '开始处理', detail: '正在切换仓库并同步平台' },
    ],
  },
  {
    id: 'task-002',
    title: '补货 120 件至 LA 仓',
    source: 'SKU-NJ-2406-018',
    riskLevel: '高',
    owner: '赵宁',
    status: '已完成',
    remainingSLA: '-',
    createdAt: '2026-06-01 09:58',
    description: 'LA 仓销量连续攀升，现货与在途无法覆盖补货周期。',
    processLogs: [
      { time: '今天 09:58', owner: 'AI', action: '生成建议', detail: '建议补货 120 件至 LA 仓' },
      { time: '今天 10:08', owner: '赵宁', action: '完成任务', detail: '已提交采购补货单' },
    ],
  },
  {
    id: 'task-003',
    title: '物流延误处理',
    source: 'TTS-US-240613-0316',
    riskLevel: '中',
    owner: '赵宁',
    status: '待确认',
    remainingSLA: '00:46:12',
    createdAt: '2026-06-01 09:50',
    description: 'TikTok Shop 订单物流轨迹超过 48 小时未更新。',
    processLogs: [
      { time: '今天 09:50', owner: '系统', action: '创建任务', detail: '物流轨迹超时触发 SLA' },
    ],
  },
  {
    id: 'task-004',
    title: '地址异常核实',
    source: 'SHP-UK-240613-0061',
    riskLevel: '中',
    owner: '陈浩',
    status: '处理中',
    remainingSLA: '02:05:51',
    createdAt: '2026-06-01 09:32',
    description: '邮编与城市不匹配，需确认买家地址并更新平台信息。',
    processLogs: [
      { time: '今天 09:32', owner: '系统', action: '创建任务', detail: '地址规则校验失败' },
      { time: '今天 09:40', owner: '陈浩', action: '开始处理', detail: '已发送买家确认消息' },
    ],
  },
  {
    id: 'task-005',
    title: '平台同步失败修复',
    source: 'EBY-DE-240613-0098',
    riskLevel: '中',
    owner: '未分派',
    status: '待分派',
    remainingSLA: '05:20:21',
    createdAt: '2026-06-01 09:10',
    description: 'ERP 与 eBay 订单状态不一致，需要重试接口并记录同步结果。',
    processLogs: [
      { time: '今天 09:10', owner: '系统', action: '创建任务', detail: '平台回写失败' },
    ],
  },
  {
    id: 'task-006',
    title: '退款审核确认',
    source: 'AMZ-CA-240613-0114',
    riskLevel: '低',
    owner: '刘畅',
    status: '已完成',
    remainingSLA: '-',
    createdAt: '2026-06-01 08:45',
    description: '复核退款原因与物流轨迹，确认是否需要客服介入。',
    processLogs: [
      { time: '今天 08:45', owner: '系统', action: '创建任务', detail: '退款异常进入复核' },
      { time: '今天 09:16', owner: '刘畅', action: '完成任务', detail: '已联系买家并关闭异常' },
    ],
  },
  {
    id: 'task-007',
    title: '库存数据校准',
    source: 'SKU-UK-2406-033',
    riskLevel: '高',
    owner: '周扬',
    status: '处理中',
    remainingSLA: '00:25:53',
    createdAt: '2026-06-01 08:30',
    description: '高风险 SKU 库存数据与仓库回传不一致，需人工校准。',
    processLogs: [
      { time: '今天 08:30', owner: '系统', action: '创建任务', detail: '库存校验差异超过阈值' },
    ],
  },
  {
    id: 'task-008',
    title: '清关资料补充',
    source: 'AMZ-JP-240612-0095',
    riskLevel: '中',
    owner: '张磊',
    status: '待确认',
    remainingSLA: '08:35:11',
    createdAt: '2026-06-01 08:12',
    description: '清关资料缺少品名补充说明，需上传资料避免订单积压。',
    processLogs: [
      { time: '今天 08:12', owner: '系统', action: '创建任务', detail: '清关异常触发' },
    ],
  },
  {
    id: 'task-009',
    title: '成本异常核查',
    source: 'TTS-US-240612-0221',
    riskLevel: '低',
    owner: '李娜',
    status: '已完成',
    remainingSLA: '-',
    createdAt: '2026-06-01 07:58',
    description: '支付手续费与结算金额差异偏高，需要核查成本归因。',
    processLogs: [
      { time: '今天 07:58', owner: '系统', action: '创建任务', detail: '成本异常进入复核' },
      { time: '今天 08:33', owner: '李娜', action: '完成任务', detail: '已修正费用标签' },
    ],
  },
  {
    id: 'task-010',
    title: '活动需求评估',
    source: 'SKU-NJ-2406-077',
    riskLevel: '低',
    owner: '未分派',
    status: '待分派',
    remainingSLA: '18:40:42',
    createdAt: '2026-06-01 07:40',
    description: '活动前库存风险评估，确认是否需要暂停部分促销资源。',
    processLogs: [
      { time: '今天 07:40', owner: '系统', action: '创建任务', detail: '活动库存风险预警' },
    ],
  },
];

function isClosedTaskStatus(status) {
  return status === '已完成' || status === '已驳回';
}

function taskCreatedAt(status, index) {
  if (isClosedTaskStatus(status) && index % 4 === 0) {
    return `2026-06-${pad((index % 18) + 1)} 09:${pad((index * 7) % 60)}:00`;
  }

  return buildBusinessDateTime({
    daysAgo: index % 3 === 0 ? 1 : 0,
    hour: 7 + (index % 9),
    minute: (index * 6) % 60,
    second: 0,
  });
}

function alignTaskLogTimes(task, createdAt) {
  if (!createdAt.startsWith('2026-06-')) return task.processLogs;
  const dateLabel = createdAt.slice(5, 10);
  return task.processLogs.map((log) => ({
    ...log,
    time: `${dateLabel} ${String(log.time).slice(-5)}`,
  }));
}

const seedTasks = seedTaskRows.map((task, index) => {
  const createdAt = taskCreatedAt(task.status, index);
  return {
    ...task,
    createdAt,
    processLogs: alignTaskLogTimes(task, createdAt),
  };
});

const taskStatuses = ['待分派', '已分派', '处理中', '待确认', '已完成', '已超时', '已升级'];
const taskSources = ['来源订单', '库存风险', '物流异常', '平台同步', '售后异常'];
const taskTitles = ['切换发货仓库', '补货风险处理', '物流延误跟进', '平台同步修复', '退款复核确认', '清关资料补充', '发票信息重开', '库存数据校准'];
const assignedTaskOwners = orderOwners.filter((owner) => owner !== '未分派');

function createTask(index) {
  const sourceType = taskSources[index % taskSources.length];
  const riskLevel = index % 6 === 0 ? '高' : index % 3 === 0 ? '中' : '低';
  const status = taskStatuses[index % taskStatuses.length];
  const owner = status === '待分派' ? '未分派' : assignedTaskOwners[index % assignedTaskOwners.length];
  const source = sourceType === '库存风险' ? orderSkuPool[index % orderSkuPool.length] : orders[index % orders.length].orderNo;
  const title = taskTitles[index % taskTitles.length];
  const remainingSLA = status === '已完成' ? '-' : buildSla(index + 4);
  const overdueDuration = status === '已超时' ? remainingSLA : undefined;

  return {
    id: `task-${pad(index + 1)}`,
    title,
    source,
    sourceType,
    riskLevel,
    owner,
    status,
    remainingSLA,
    ...(overdueDuration ? { overdueDuration } : {}),
    deadline: index % 4 === 0 ? '今天 18:00' : index % 4 === 1 ? '今天 14:30' : index % 4 === 2 ? '明天 10:00' : '24小时内',
    createdAt: taskCreatedAt(status, index),
    description: `${sourceType}触发 ${title}，需要负责人确认处理路径并回写处理结果。`,
    impact: `预计影响 ${2 + (index % 12)} 个对象，关联金额 ¥${(600 + (index * 281) % 9000).toLocaleString('zh-CN')}`,
    processLogs: [
      { time: '今天 09:00', owner: '系统', action: '创建任务', detail: `${sourceType}规则触发`, tone: 'blue' },
      {
        time: '今天 09:12',
        owner: status === '待分派' ? '系统' : owner,
        action: status === '待分派' ? '等待分派' : '接收任务',
        detail: status === '待分派' ? '等待分配具体负责人' : `负责人 ${owner} 已进入处理队列`,
        tone: status === '待分派' ? 'blue' : 'green',
      },
      ...(status === '已完成'
        ? [{ time: '今天 10:20', owner, action: '完成任务', detail: '处理结果已同步至异常对象', tone: 'green' }]
        : status === '已升级'
          ? [{ time: '今天 10:16', owner, action: '升级主管', detail: '需要主管确认后继续处理', tone: 'red' }]
          : []),
    ],
  };
}

export const tasks = [
  ...seedTasks,
  ...Array.from({ length: 89 - seedTasks.length }, (_, index) => createTask(index + seedTasks.length)),
].map((task) => ({
  ...task,
  processLogs: alignTaskLogTimes(task, task.createdAt),
}));

export const analytics = {
  overviewMetrics: [
    { label: '累计异常数', value: '2,813', currentValue: 2813, change: '+131', changeValue: 131, valueFormat: 'integer', trend: [1572, 1650, 1739, 1821, 1910, 1988, 2076, 2164, 2251, 2340, 2452, 2564, 2682, 2813] },
    { label: '已处理异常', value: '2,487', currentValue: 2487, change: '+211', changeValue: 211, valueFormat: 'integer', trend: [1336, 1418, 1502, 1589, 1680, 1764, 1855, 1941, 2034, 2118, 2189, 2238, 2276, 2487] },
    { label: '平均处理时长', value: '37.2 分', currentValue: 37.2, change: '-2.1', changeValue: -2.1, valueFormat: 'minutes-1', trend: [45.8, 44.6, 43.9, 44.8, 42.7, 43.5, 41.8, 42.4, 40.9, 41.6, 40.7, 40.1, 39.3, 37.2] },
    { label: '任务超时率', value: '6.12%', currentValue: 6.12, change: '-0.14%', changeValue: -0.14, valueFormat: 'percent-2', trend: [8.42, 8.11, 8.36, 7.92, 7.68, 7.81, 7.44, 7.26, 7.39, 6.98, 6.74, 6.55, 6.26, 6.12] },
    { label: 'AI采纳率', value: '78.6%', currentValue: 78.6, change: '+6.4%', changeValue: 6.4, valueFormat: 'percent-1', trend: [61.2, 62.8, 61.9, 64.1, 65.4, 64.8, 66.2, 67.5, 66.9, 68.3, 69.7, 71.1, 72.2, 78.6] },
    { label: '预警准确率', value: '92.4%', currentValue: 92.4, change: '+3.1%', changeValue: 3.1, valueFormat: 'percent-1', trend: [83.4, 84.2, 83.8, 85.1, 86, 85.6, 87.2, 86.8, 87.9, 88.4, 87.7, 88.6, 89.3, 92.4] },
  ],
  exceptionTrend: [
    { date: '5.26', order: 420, inventory: 360, logistics: 120, afterSale: 550, profit: 480 },
    { date: '5.27', order: 260, inventory: 240, logistics: 180, afterSale: 490, profit: 560 },
    { date: '5.28', order: 460, inventory: 420, logistics: 560, afterSale: 680, profit: 590 },
    { date: '5.29', order: 540, inventory: 690, logistics: 460, afterSale: 750, profit: 460 },
    { date: '5.30', order: 350, inventory: 750, logistics: 360, afterSale: 610, profit: 620 },
    { date: '5.31', order: 180, inventory: 560, logistics: 440, afterSale: 330, profit: 560 },
    { date: '6.01', order: 210, inventory: 640, logistics: 650, afterSale: 350, profit: 700 },
  ],
  aiSuggestionEffect: [
    { abnormalType: '缺货', adopted: 71.3, modified: 23.6, rejected: 5.1 },
    { abnormalType: '平台同步失败', adopted: 75.4, modified: 17.6, rejected: 7.0 },
    { abnormalType: '物流异常', adopted: 66.5, modified: 27.6, rejected: 5.9 },
    { abnormalType: '清关异常', adopted: 69.3, modified: 19.6, rejected: 11.1 },
    { abnormalType: '地址异常', adopted: 76.7, modified: 20.1, rejected: 3.2 },
    { abnormalType: '平均', adopted: 70.5, modified: 21.1, rejected: 8.4 },
  ],
  efficiencyAnalysis: [
    { date: '5.26', averageMinutes: 38, processedCount: 2980 },
    { date: '5.27', averageMinutes: 43, processedCount: 2200 },
    { date: '5.28', averageMinutes: 34, processedCount: 2400 },
    { date: '5.29', averageMinutes: 45, processedCount: 4366 },
    { date: '5.30', averageMinutes: 48, processedCount: 4000 },
    { date: '5.31', averageMinutes: 34, processedCount: 1900 },
    { date: '6.01', averageMinutes: 54, processedCount: 2400 },
  ],
  repeatedIssues: [
    { source: 'AMZ-US-250601-001', platform: 'Amazon', issueType: '缺货', count: 32, amount: 1260, action: '优化补货策略，设置安全预警' },
    { source: 'TTS-US-250601-002', platform: 'TikTok Shop', issueType: '物流延误', count: 28, amount: 2460, action: '更换物流渠道，优化发货时效' },
    { source: 'SHP-UK-250601-003', platform: 'Shopee', issueType: '地址异常', count: 21, amount: 327, action: '添加地址规则，拦截错误地址' },
    { source: 'EBY-DE-250601-004', platform: 'eBay', issueType: '平台同步失败', count: 15, amount: 534, action: '优化接口机制，监控同步状态' },
    { source: 'AMZ-CA-250601-005', platform: 'Amazon', issueType: '清关异常', count: 8, amount: 140, action: '补充报关资料，提前预审' },
    { source: 'SHP-AU-250601-006', platform: 'Shopee', issueType: '退款', count: 6, amount: 169, action: '客服介入，引导用户减少退款' },
  ],
};

export const settings = {
  platformConnections: [
    { platform: 'Amazon', status: '已连接', lastSync: '1分钟前', description: '最后同步：1分钟前' },
    { platform: 'TikTok Shop', status: '已连接', lastSync: '3分钟前', description: '最后同步：3分钟前' },
    { platform: 'Shopee', status: '已连接', lastSync: '3分钟前', description: '最后同步：3分钟前' },
    { platform: 'eBay', status: '已断开', lastSync: '-', description: '断开连接' },
    { platform: 'Shopify', status: '待授权', lastSync: '-', description: '未授权' },
  ],
  storeSyncStatus: [
    { storeName: 'US Store 01', platform: 'Amazon', region: '美国', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 32, second: 51 }) },
    { storeName: 'EU Store 02', platform: 'Amazon', region: '欧洲', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 31, second: 21 }) },
    { storeName: 'TikTok Shop-US', platform: 'TikTok Shop', region: '美国', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 27, second: 11 }) },
    { storeName: 'TikTok Shop-UK', platform: 'TikTok Shop', region: '英国', syncStatus: '成功', lastSyncAt: buildBusinessDateTime({ hour: 9, minute: 18, second: 43 }) },
    { storeName: 'eBay-AU', platform: 'eBay', region: '澳大利亚', syncStatus: '延迟', lastSyncAt: STALE_EBAY_SYNC_AT },
    { storeName: 'eBay-US', platform: 'eBay', region: '美国', syncStatus: '延迟', lastSyncAt: STALE_EBAY_SYNC_AT },
    { storeName: 'Shopify-CA', platform: 'Shopify', region: '加拿大', syncStatus: '未授权', lastSyncAt: '-' },
  ],
  slaRules: [
    { rule: '缺货导致订单取消', threshold: '>5单/日', severity: '高', responseLimit: '30分钟' },
    { rule: '物流延误', threshold: '>48小时', severity: '中', responseLimit: '2小时' },
    { rule: '地址异常', threshold: '>10单/日', severity: '中', responseLimit: '2小时' },
    { rule: '退款处理超时', threshold: '>24小时', severity: '低', responseLimit: '8小时' },
  ],
  aiSettings: {
    enableSuggestion: true,
    requireManualConfirmForHighRisk: true,
    lowConfidencePromptOnly: true,
    confidenceThreshold: 0.72,
    description: 'AI将基于历史数据生成处理建议，高风险操作需人工审核。',
  },
  notificationSettings: {
    email: true,
    systemMessage: true,
    taskReminder: true,
    highRiskAlert: true,
    dailyDigest: false,
  },
};

export const dashboardStats = [
  { label: '高风险订单', value: 23, currentValue: 23, change: '较昨日 +8', changeValue: 8, valueFormat: 'integer', detail: '8 单即将超时', trend: [18, 21, 17, 22, 18, 20, 16, 24, 18, 21, 15, 23], tone: '#FF4D4F' },
  { label: '即将缺货SKU', value: 37, currentValue: 37, change: '较昨日 +12', changeValue: 12, valueFormat: 'integer', detail: '查看详情', trend: [19, 22, 24, 20, 26, 23, 21, 27, 24, 22, 25, 37], tone: '#FF4D4F' },
  { label: '物流延误', value: 18, currentValue: 18, change: '较昨日 -5', changeValue: -5, valueFormat: 'integer', detail: '查看详情', trend: [27, 30, 24, 32, 28, 24, 29, 25, 28, 31, 23, 18], tone: '#20C997' },
  { label: '售后高发', value: 14, currentValue: 14, change: '较昨日 +3', changeValue: 3, valueFormat: 'integer', detail: '查看详情', trend: [12, 14, 10, 16, 13, 11, 15, 12, 14, 18, 11, 14], tone: '#FF1F1F' },
  { label: '潜在亏损', value: '¥32,560', currentValue: 32560, change: '较昨日 -1,580', changeValue: -1580, valueFormat: 'currency', detail: '查看详情', trend: [33820, 34640, 33210, 34980, 34120, 32950, 34460, 34310, 35620, 34890, 34140, 32560], tone: '#20C997' },
];

export const inventoryMetricStats = [
  { label: '7天内缺货', value: 128, currentValue: 128, change: '+17', changeValue: 17, valueFormat: 'integer', trend: [96, 101, 108, 99, 113, 106, 102, 115, 109, 103, 110, 122, 114, 107, 116, 120, 111, 128] },
  { label: '14天内缺货', value: 243, currentValue: 243, change: '+32', changeValue: 32, valueFormat: 'integer', trend: [198, 205, 214, 201, 220, 212, 204, 196, 210, 206, 199, 218, 231, 217, 209, 225, 211, 243] },
  { label: '库存滞销', value: 23, currentValue: 23, change: '-12', changeValue: -12, valueFormat: 'integer', trend: [42, 44, 39, 46, 41, 38, 43, 40, 36, 42, 48, 45, 39, 37, 41, 38, 35, 23] },
  { label: '建议调拨', value: 98, currentValue: 98, change: '+9', changeValue: 9, valueFormat: 'integer', trend: [72, 75, 79, 73, 82, 78, 74, 70, 76, 73, 79, 85, 91, 84, 80, 87, 89, 98] },
];

export const dashboardSuggestions = [
  {
    id: 'suggestion-001',
    title: '建议切换NJ仓发货',
    taskTitle: '切换至 NJ 仓发货',
    source: 'AMZ-US-240613-0188',
    sourceId: 'order-001',
    sourceKind: 'order',
    sourceType: '来源订单',
    riskLevel: '高',
    owner: '王敏',
    remainingSLA: '01:42:31',
    confidence: 0.92,
    impact: '影响8笔订单，预计挽回金额 ¥1,260',
    action: '生成任务',
  },
  {
    id: 'suggestion-002',
    title: '建议补货 120 件至 LA 仓',
    taskTitle: '补货 120 件至 LA 仓',
    source: 'SKU-NJ-2406-018',
    sourceId: 'SKU-NJ-2406-018',
    sourceKind: 'inventory',
    sourceType: '库存风险',
    riskLevel: '高',
    owner: '赵宁',
    remainingSLA: '04:00:00',
    confidence: 0.88,
    impact: '影响4笔订单，预计挽回金额 ¥2,134',
    action: '生成任务',
  },
  {
    id: 'suggestion-003',
    title: '建议更换物流渠道',
    taskTitle: '更换物流渠道',
    source: 'TTS-US-240613-0316',
    sourceId: 'order-002',
    sourceKind: 'order',
    sourceType: '物流异常',
    riskLevel: '中',
    owner: '赵宁',
    remainingSLA: '00:46:14',
    confidence: 0.75,
    impact: '影响6笔订单，减少延误投诉',
    action: '生成任务',
  },
];

export const systemMessages = [
  {
    id: 'msg-001',
    content: 'AI生成了6条新的异常建议',
    detail: 'AI 已完成最新一轮异常扫描，生成 6 条可执行建议，请结合风险等级和置信度进行人工复核。',
    category: 'AI建议',
    time: '5分钟前',
  },
  {
    id: 'msg-002',
    content: '订单AMZ-US-250601-001处理超时',
    detail: '该订单异常已超过处理 SLA，建议立即核对库存和发货仓，避免平台处罚。',
    category: '订单',
    time: '23分钟前',
    target: { route: '/orders', state: { openOrderId: 'order-001' } },
  },
  {
    id: 'msg-003',
    content: 'SKU库存预警，LA仓补货120件',
    detail: 'ELE-HEAD-01 当前库存无法覆盖补货周期，系统建议优先向 LA 仓补货。',
    category: '库存',
    time: '1小时前',
    target: { route: '/inventory', state: { openSku: 'ELE-HEAD-01' } },
  },
  {
    id: 'msg-004',
    content: '任务待确认#20260601001已完成待确认',
    detail: '负责人已提交处理凭证，请运营主管复核结果并确认是否关闭任务。',
    category: '任务',
    time: '1小时前',
    target: { route: '/tasks', state: { detailTaskId: 'task-011' } },
  },
  {
    id: 'msg-005',
    content: '陈浩将对象TTS-US-250601-002分派至张晓',
    detail: '物流延误任务的负责人已变更，请新负责人及时确认剩余 SLA 和处理计划。',
    category: '任务',
    time: '2小时前',
    target: { route: '/tasks', state: { detailTaskId: 'task-003' } },
  },
  {
    id: 'msg-006',
    content: 'Shopee 地址异常订单等待买家确认',
    detail: '买家地址中的邮编和城市不一致，客服已发送确认消息。',
    category: '订单',
    time: '3小时前',
    target: { route: '/orders', state: { openOrderId: 'order-003' } },
  },
  {
    id: 'msg-007',
    content: 'NJ仓键盘库存进入高风险区间',
    detail: 'ELE-KYB-01 可售天数低于安全阈值，请复核在途库存和补货建议。',
    category: '库存',
    time: '3小时前',
    target: { route: '/inventory', state: { openSku: 'ELE-KYB-01' } },
  },
  {
    id: 'msg-008',
    content: '平台同步修复任务等待分派',
    detail: 'eBay 回写失败任务尚未分派负责人，建议由平台运营优先处理。',
    category: '任务',
    time: '4小时前',
    target: { route: '/tasks', state: { detailTaskId: 'task-005' } },
  },
  {
    id: 'msg-009',
    content: 'Shopify连接尚未完成授权',
    detail: 'Shopify 店铺仍处于待授权状态，授权前不会参与数据完整度计算。',
    category: '平台',
    time: '5小时前',
    target: { route: '/settings' },
  },
  {
    id: 'msg-010',
    content: 'Amazon退款异常已完成复核',
    detail: '退款原因与物流轨迹已完成核对，相关订单异常可以进入关闭流程。',
    category: '订单',
    time: '6小时前',
    target: { route: '/orders', state: { openOrderId: 'order-006' } },
  },
  {
    id: 'msg-011',
    content: '本周异常处理效率报告已生成',
    detail: '最新数据复盘已生成，可查看异常趋势、AI建议效果和反复问题识别结果。',
    category: '复盘',
    time: '昨天',
    target: { route: '/analytics' },
  },
];

const riskScores = { 高: 86, 中: 68, 低: 42, 滞销: 61, 调拨: 57 };

function createRiskExplanation(item, index = 0) {
  const score = riskScores[item.riskLevel] ?? 60;
  const amount = Number(item.amount || item.currentStock * item.dailySales || 0);
  const slaScore = Math.round(score * 0.3);
  const impactScore = Math.round(score * 0.28);
  const repeatScore = Math.round(score * 0.2);
  const alternativeScore = -8;
  const platformScore = score - slaScore - impactScore - repeatScore - alternativeScore;
  return {
    score,
    factors: [
      { label: '剩余 SLA', score: slaScore, detail: item.remainingSLA || `${item.availableDays} 天可售` },
      { label: '影响范围', score: impactScore, detail: item.impact || `预计影响金额 ¥${amount.toLocaleString('zh-CN')}` },
      { label: '反复发生', score: repeatScore, detail: `近 30 天命中 ${2 + (index % 6)} 次同类规则` },
      { label: '平台与履约风险', score: platformScore, detail: '综合平台处罚、履约时效和数据完整度' },
      { label: '可替代方案', score: alternativeScore, detail: '存在人工确认后的可执行方案' },
    ],
  };
}

settings.platformConnections.forEach((connection) => {
  if (connection.platform === 'eBay') {
    Object.assign(connection, {
      isStale: true,
      lastSuccessfulSync: STALE_EBAY_SYNC_AT,
      dataCompleteness: 48,
      description: '数据已停止同步，仅供参考',
    });
    return;
  }
  if (connection.platform === 'Shopify') {
    Object.assign(connection, { isStale: false, dataCompleteness: 100, includeInCompleteness: false });
    return;
  }
  Object.assign(connection, {
    isStale: false,
    lastSuccessfulSync: DEMO_NOW,
    dataCompleteness: 100,
  });
});

orders.forEach((order, index) => {
  order.riskExplanation = createRiskExplanation(order, index);
  order.aiEvidence = {
    updatedAt: order.platform === 'eBay' ? STALE_EBAY_SYNC_AT : DEMO_NOW,
    evidence: [
      `${order.abnormalType}规则已命中，关联 ${order.relatedSku || '订单商品'} 数据`,
      `当前影响金额 ¥${Number(order.amount || 0).toLocaleString('zh-CN')}`,
      `剩余 SLA ${order.remainingSLA}，负责人 ${order.owner || '未分派'}`,
    ],
    risks: [
      order.platform === 'eBay' ? '平台数据已停止同步，执行前需复核最新状态' : '执行后需确认平台状态已成功回写',
      order.riskLevel === '高' ? '高风险操作需要人工确认' : '建议保留处理记录用于后续复盘',
    ],
  };
});

inventory.forEach((item, index) => {
  const effectiveTransitStock = Number(item.inTransitStock || 0);
  const dailySales = Number(item.dailySales || 0);
  const safetyStock = item.sku === 'ELE-HEAD-01' ? 4 : Math.max(0, Math.round(dailySales * 0.25));
  const packSize = item.sku === 'ELE-HEAD-01' ? 20 : 5;
  const exactAvailableDays = dailySales > 0
    ? Math.max(0, (Number(item.currentStock || 0) + effectiveTransitStock - safetyStock) / dailySales)
    : 0;
  item.availableDays = Math.round(exactAvailableDays * 10) / 10;
  const targetDays = item.sku === 'ELE-HEAD-01'
    ? 17
    : item.suggestedReplenishment > 0 && dailySales > 0
      ? (item.suggestedReplenishment + item.currentStock + effectiveTransitStock - safetyStock - 0.01) / dailySales
      : Math.max(0, exactAvailableDays - 0.01);

  item.inventoryPlanning = {
    effectiveTransitStock,
    safetyStock,
    targetDays,
    packSize,
    supplierLeadDays: 12 + (index % 5),
  };
  item.riskExplanation = createRiskExplanation(item, index);
  item.aiEvidence = {
    updatedAt: item.platform === 'eBay' ? STALE_EBAY_SYNC_AT : DEMO_NOW,
    evidence: [
      `当前库存 ${item.currentStock} 件，有效在途 ${effectiveTransitStock} 件`,
      `安全库存 ${safetyStock} 件，预测日均销量 ${item.dailySales} 件`,
      `目标覆盖 ${item.inventoryPlanning.targetDays.toFixed(1)} 天，箱规 ${packSize} 件`,
    ],
    risks: [
      item.platform === 'eBay' ? '平台数据已过期，补货前需复核实时库存' : '销量预测变化可能影响最终补货数量',
      `供应商预计交期 ${item.inventoryPlanning.supplierLeadDays} 天`,
    ],
  };
});

const suggestionEvidence = {
  'suggestion-001': {
    evidence: ['NJ 仓可用库存 42 件', 'LA 仓可用库存 0 件', '切换后预计增加运费 ¥38', '可避免 8 笔订单超时'],
    risks: ['预计送达时间增加 1 天', '其中 2 笔订单仍可能超过平台承诺时效'],
  },
  'suggestion-002': {
    evidence: ['LA 仓近 7 日销量持续上升', '当前库存无法覆盖补货周期', '120 件符合最小补货箱规'],
    risks: ['供应商交期可能波动 2 天', '活动销量上升时仍需二次补货'],
  },
  'suggestion-003': {
    evidence: ['物流轨迹已超过 48 小时未更新', '备用渠道当前妥投率 96.2%', '切换后预计减少 6 笔延误投诉'],
    risks: ['渠道切换会增加单票成本约 ¥12', '需同步客服更新买家话术'],
  },
};

dashboardSuggestions.forEach((suggestion, index) => {
  suggestion.aiEvidence = {
    updatedAt: DEMO_NOW,
    ...suggestionEvidence[suggestion.id],
  };
  suggestion.riskExplanation = createRiskExplanation(suggestion, index);
});

systemMessages.unshift({
  id: 'msg-platform-ebay',
  content: 'eBay 数据已停止同步，当前缓存数据仅供参考',
  detail: 'eBay 平台连接已中断，最后一次成功同步后的缓存数据可能与平台实时状态不一致。',
  category: '平台',
  time: '23分钟前',
  tone: 'warning',
  target: { route: '/settings' },
});

export const chartData = analytics;
export const inventoryRisks = inventory;
export const platformConnections = settings.platformConnections;
