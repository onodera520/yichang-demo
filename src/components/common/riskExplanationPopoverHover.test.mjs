import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./RiskExplanationPopover.jsx', import.meta.url), 'utf8');

assert.match(source, /const OPEN_DELAY = 100/, 'popover should open after a 100ms hover delay');
assert.match(source, /const CLOSE_DELAY = 150/, 'popover should use a short close delay');
assert.match(source, /onPointerEnter=\{scheduleOpen\}/, 'the info icon should schedule opening on hover');
assert.match(source, /onPointerLeave=\{scheduleClose\}/, 'the info icon should schedule closing when left');
assert.match(source, /onFocus=\{openImmediately\}/, 'keyboard focus should reveal the explanation');
assert.match(source, /onKeyDown=\{handleKeyDown\}/, 'Escape should close the explanation');
assert.match(source, /ref=\{panelRef\}[\s\S]*onPointerEnter=\{cancelClose\}[\s\S]*onPointerLeave=\{scheduleClose\}/, 'the panel should remain open while hovered');
assert.match(source, /event\.pointerType === 'touch'/, 'touch should retain a click-like fallback');
assert.doesNotMatch(source, /<button[\s\S]*\{children \|\| <RiskTag/, 'the risk tag must not remain inside the hover trigger button');

console.log('risk explanation popover hover tests passed');
