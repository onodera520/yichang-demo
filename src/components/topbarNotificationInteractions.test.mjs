import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source = fs.readFileSync(new URL('./Topbar.jsx', import.meta.url), 'utf8');

test('topbar badge uses shared visible messages and real unread count', () => {
  assert.match(source, /getVisibleSystemMessages/);
  assert.match(source, /getNotificationPreview/);
  assert.match(source, /getUnreadMessageCount/);
  assert.match(source, /formatNotificationBadgeCount/);
  assert.match(source, /unreadCount=\{unreadCount\}/);
  assert.doesNotMatch(source, />\s*7\s*</);
});

test('bell toggles a notification popover and supports dismiss interactions', () => {
  assert.match(source, /const \[notificationOpen, setNotificationOpen\] = useState\(false\)/);
  assert.match(source, /NotificationPopover/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /notificationRootRef\.current\?\.contains\(event\.target\)/);
  assert.match(source, /bellButtonRef\.current\?\.focus\(\)/);
});

test('message body and explicit navigation use separate callbacks', () => {
  assert.match(source, /markMessageRead\(message\.id\)/);
  assert.match(source, /navigate\(message\.target\.route, \{ state: message\.target\.state \}\)/);
  assert.match(source, /navigate\('\/dashboard', \{ state: \{ openUtility: 'messages' \} \}\)/);
});
