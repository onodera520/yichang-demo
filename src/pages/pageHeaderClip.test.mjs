import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageFiles = ['Dashboard.jsx', 'Inventory.jsx', 'Tasks.jsx', 'Analytics.jsx', 'Settings.jsx'];
const styles = fs.readFileSync(new URL('../styles/index.css', import.meta.url), 'utf8');

for (const pageFile of pageFiles) {
  const source = fs.readFileSync(new URL(`./${pageFile}`, import.meta.url), 'utf8');
  const rootMatch = source.match(/<div className="([^"]*h-\[calc\(100vh-104px\)\][^"]*)"/);
  assert.ok(rootMatch, `${pageFile} should expose a page root container`);
  assert.doesNotMatch(
    rootMatch[1],
    /\boverflow-hidden\b/,
    `${pageFile} root must not clip the negatively offset shared page header`,
  );
}

assert.match(
  styles,
  /\.orders-page\s*>\s*\.page-header\s*\{\s*margin-top:\s*0;\s*\}/,
  'orders should cancel the shared negative header offset inside its clipped page root',
);

console.log('page header clipping tests passed');
