import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ordersSource = readFileSync(new URL('../Orders.jsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../styles/index.css', import.meta.url), 'utf8');

assert.match(
  ordersSource,
  /const ORDER_PAGE_SIZE = 15;/,
  'orders should paginate in groups of 15 rows',
);

assert.match(
  ordersSource,
  /import \{ sortOrdersByPurchaseTimeDesc \} from '\.\.\/utils\/orderSorting\.js';/,
  'orders should use the shared purchase-time sorter',
);

assert.match(
  ordersSource,
  /const sortedRows = useMemo\(\(\) => \{[\s\S]*?applyOrderDashboardPreset\([\s\S]*?filteredRows[\s\S]*?sortOrdersByPurchaseTimeDesc\(filteredRows\)[\s\S]*?Math\.ceil\(sortedRows\.length \/ ORDER_PAGE_SIZE\)[\s\S]*?const visibleRows = sortedRows\.slice/,
  'orders should apply the active sort before pagination',
);

assert.match(
  ordersSource,
  /const \[pendingLocateOrderId, setPendingLocateOrderId\] = useState\(null\);/,
  'orders should retain a one-time navigation target until its row is located',
);

assert.match(
  ordersSource,
  /getOrderPageForId\(sortedRows, pendingLocateOrderId, ORDER_PAGE_SIZE\)/,
  'orders should calculate the page containing the navigation target',
);

assert.match(
  ordersSource,
  /data-order-id=\{row\.id\}/,
  'order rows should expose a stable locator',
);

assert.match(
  ordersSource,
  /scrollIntoView\(\{ behavior: 'smooth', block: 'center' \}\)/,
  'the target order should be centered inside the table viewport',
);

assert.match(
  ordersSource,
  /<div ref=\{tableScrollRef\} className="orders-table-scroll">[\s\S]*?<table className="orders-table">/,
  'the orders table should render inside its own scroll viewport',
);

assert.match(
  ordersSource,
  /<\/div>\s*<div className="orders-pagination">/,
  'pagination should stay outside the scrolling table viewport',
);

assert.match(
  stylesSource,
  /\.orders-page\s*\{[\s\S]*?height:\s*calc\(100vh - 104px\);[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*hidden;/,
  'the orders page should be constrained to the available app viewport',
);

assert.match(
  stylesSource,
  /\.orders-table-scroll\s*\{[\s\S]*?flex:\s*1;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*auto;/,
  'the table viewport should own vertical and horizontal scrolling',
);

assert.match(
  stylesSource,
  /\.orders-table thead\s*\{[\s\S]*?position:\s*sticky;[\s\S]*?top:\s*0;/,
  'the orders table header should remain visible while rows scroll',
);

assert.match(
  stylesSource,
  /\.orders-pagination\s*\{[\s\S]*?height:\s*60px;[\s\S]*?justify-content:\s*flex-end;/,
  'pagination should remain in a fixed-height footer aligned to the right',
);
