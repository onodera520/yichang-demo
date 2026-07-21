import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const dashboardUrl = new URL('./Dashboard.jsx', import.meta.url);

test('system message targets keep whole-card navigation and show a visible action', () => {
  const source = fs.readFileSync(dashboardUrl, 'utf8');

  assert.match(source, /onClick=\{\(\) => onMessageClick\(message\)\}/);
  assert.match(source, /message\.target \? \([\s\S]*?>\s*去处理\s*[\s\S]*?<ChevronRight/);
});

test('empty unread messages fill the drawer with a centered illustrated state', () => {
  const source = fs.readFileSync(dashboardUrl, 'utf8');

  assert.match(source, /no-unread-messages\.png/);
  assert.match(source, /alt="暂无未读消息"/);
  assert.match(source, /min-h-0 flex-1[\s\S]*items-center[\s\S]*justify-center/);
  assert.match(source, />暂无未读消息</);
});
