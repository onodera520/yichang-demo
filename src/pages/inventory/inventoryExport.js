const inventoryExportColumns = [
  ['风险等级', 'riskLevel'],
  ['SKU', 'sku'],
  ['商品名称', 'productName'],
  ['平台', 'platform'],
  ['仓库', 'warehouse'],
  ['当前库存', 'currentStock'],
  ['在途库存', 'inTransitStock'],
  ['日均销量', 'dailySales'],
  ['可售天数', 'availableDays'],
  ['AI建议', 'aiSuggestion'],
  ['置信度', 'confidence'],
  ['建议补货量', 'suggestedReplenishment'],
];

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatInventoryExportValue(row, field) {
  if (field !== 'confidence') return row[field];
  return Number.isFinite(row.confidence) ? `${Math.round(row.confidence * 100)}%` : '';
}

export function buildInventoryCsv(rows) {
  const header = inventoryExportColumns.map(([label]) => escapeCsv(label)).join(',');
  const lines = rows.map((row) =>
    inventoryExportColumns
      .map(([, field]) => escapeCsv(formatInventoryExportValue(row, field)))
      .join(','),
  );

  return `\uFEFF${[header, ...lines].join('\r\n')}`;
}
