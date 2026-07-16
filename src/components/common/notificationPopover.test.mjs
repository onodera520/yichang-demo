import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const componentUrl = new URL('./NotificationPopover.jsx', import.meta.url);

test('notification popover renders the compact message-center structure', () => {
  assert.equal(fs.existsSync(componentUrl), true);
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /aria-label="消息通知"/);
  assert.match(source, /w-\[380px\]/);
  assert.match(source, /全部已读/);
  assert.match(source, /查看全部消息/);
  assert.match(source, /暂无消息/);
});

test('message body marks read and expands without navigating', () => {
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /setExpandedMessageId/);
  assert.match(source, /onMarkRead\(message\.id\)/);
  assert.match(source, /expandedMessageId === message\.id/);
  assert.doesNotMatch(source, /onNavigateTarget\(message\).*setExpandedMessageId/s);
});

test('business navigation is exposed through an explicit action button', () => {
  const source = fs.readFileSync(componentUrl, 'utf8');

  assert.match(source, /message\.target \? \(/);
  assert.match(source, />\s*去处理\s*</);
  assert.match(source, /onNavigateTarget\(message\)/);
});
