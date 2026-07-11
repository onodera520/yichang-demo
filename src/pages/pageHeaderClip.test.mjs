import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageFiles = ['Dashboard.jsx', 'Inventory.jsx', 'Tasks.jsx', 'Analytics.jsx', 'Settings.jsx'];

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

console.log('page header clipping tests passed');
