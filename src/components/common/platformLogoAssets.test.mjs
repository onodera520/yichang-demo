import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./PlatformLogo.jsx', import.meta.url), 'utf8');
const assets = ['shopee.png', 'shopify.png', 'tiktok-shop.png'];

for (const asset of assets) {
  assert.match(source, new RegExp(`platform-logos/${asset.replace('.', '\\.')}`), `${asset} should be used by PlatformLogo`);
  assert.ok(
    fs.existsSync(new URL(`../../assets/platform-logos/${asset}`, import.meta.url)),
    `${asset} should exist in the shared platform logo assets`,
  );
}

assert.match(source, /Shopee:[\s\S]*src: shopeeLogo/, 'Shopee should map to the supplied PNG');
assert.match(source, /Shopify:[\s\S]*src: shopifyLogo/, 'Shopify should map to the supplied PNG');
assert.match(source, /'TikTok Shop':[\s\S]*src: tiktokShopLogo/, 'TikTok Shop should map to the supplied PNG');

console.log('platform logo asset tests passed');
