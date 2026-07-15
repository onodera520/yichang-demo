import assert from 'node:assert/strict';
import fs from 'node:fs';

const ordersSource = fs.readFileSync(new URL('../Orders.jsx', import.meta.url), 'utf8');
const toolbarUrl = new URL('./OrderToolbarActions.jsx', import.meta.url);

assert.ok(fs.existsSync(toolbarUrl), '订单页应提供专用工具栏交互组件');
const toolbarSource = fs.readFileSync(toolbarUrl, 'utf8');

for (const action of ['assign', 'customerService', 'markProcessing', 'createTask', 'export', 'reject']) {
  assert.ok(toolbarSource.includes(action), `工具栏应接入 ${action}`);
}

assert.match(toolbarSource, /最近操作/);
assert.match(toolbarSource, /列表设置/);
assert.match(toolbarSource, /复制失败原因/);
assert.match(toolbarSource, /当前负载/);
assert.match(toolbarSource, /const exportSuccesses/);
assert.match(toolbarSource, /successes: exportSuccesses/);
assert.doesNotMatch(toolbarSource, /const phases = \['preview', 'form', 'confirm', 'result'\]/, '批量操作不应继续使用四步流程');
assert.doesNotMatch(toolbarSource, /影响预览.*操作信息.*最终确认.*执行结果/s, '弹窗不应继续展示四步导航');
assert.match(toolbarSource, /setPhase\('operation'\)/, '打开操作和重试失败项时应进入单屏操作态');
assert.match(toolbarSource, /查看 \{preview\.blocked\} 条不可执行项/, '不可执行订单应提供默认折叠的查看入口');
assert.match(toolbarSource, /确认\$\{actionMeta\[action\]\.shortLabel\} \$\{preview\.executable\} 条/, '主按钮应明确显示操作和执行数量');
assert.match(toolbarSource, /phase === 'result'/, '执行后仍应保留结果态');
assert.match(ordersSource, /onClick=\{\(\) => openDrawer\(row\)\}/, '表格整行点击打开抽屉的交互必须保留');
assert.match(ordersSource, /orders-row-active/, '详情行高亮逻辑必须保留');
assert.match(ordersSource, /const tableSettingsConfig = useMemo/, '列表设置对象应保持稳定，避免 SLA 刷新时重置弹窗草稿');

console.log('order toolbar interaction tests passed');
