import assert from 'node:assert/strict';
import fs from 'node:fs';

const settingsSource = fs.readFileSync(new URL('./Settings.jsx', import.meta.url), 'utf8');

assert.match(settingsSource, /function SlaRulesModal\(/, 'Settings should provide a dedicated SLA rules editor');
assert.match(settingsSource, /role="dialog"/, 'SLA editor should expose dialog semantics');
assert.match(settingsSource, /aria-modal="true"/, 'SLA editor should be modal for assistive technology');
assert.match(settingsSource, /draftRules/, 'SLA editor should edit an isolated draft');
assert.match(settingsSource, /sla-threshold-/, 'SLA editor should expose threshold inputs');
assert.match(settingsSource, /sla-severity-/, 'SLA editor should expose severity selects');
assert.match(settingsSource, /sla-response-limit-/, 'SLA editor should expose response limit inputs');
assert.match(settingsSource, /errors\[index\]/, 'SLA editor should display row-level validation errors');
assert.match(settingsSource, /setShowSlaEditor\(true\)/, 'SLA edit action should open the editor');
assert.match(settingsSource, /setSlaRules\(nextRules\)/, 'saving should update the displayed SLA rules');
assert.match(settingsSource, /SLA规则已保存/, 'saving should confirm the SLA rule update');
assert.match(
  settingsSource,
  /gridTemplateRows: '346px minmax\(0, 1fr\) 190px'/,
  'SLA bottom and AI top should align with the left-column cards',
);

console.log('settings SLA rule editor tests passed');
