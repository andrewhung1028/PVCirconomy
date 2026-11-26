const assert = require('node:assert/strict');
const fs = require('node:fs');
require('./helpers/typescript.cjs');

const { assertOurSolutionMarketRegion, publicSolutionMarketForPage, solutionMarketForPage, solutionHref } = require('../lib/our-solution/market.ts');

assert.equal(solutionMarketForPage(undefined, 'en-US'), 'US');
assert.equal(solutionMarketForPage(undefined, 'ja-JP'), 'JP');
assert.equal(solutionMarketForPage('US', 'ja-JP'), 'US');
assert.equal(solutionMarketForPage('JP', 'en-US'), 'JP');
assert.equal(solutionMarketForPage(['JP', 'US'], 'en-US'), 'US');
assert.equal(solutionMarketForPage('GB', 'ja-JP'), 'JP');
assert.equal(solutionHref('ja-JP', 'US'), '/ja/solutions/?market=US');
assert.equal(solutionHref('en-US', 'JP'), '/solutions/?market=JP');

assert.doesNotThrow(() => assertOurSolutionMarketRegion('JP', 'JP'));
assert.doesNotThrow(() => assertOurSolutionMarketRegion('JP', ' jp '));
assert.doesNotThrow(() => assertOurSolutionMarketRegion('US', 'US'));
assert.doesNotThrow(() => assertOurSolutionMarketRegion('US', 'US-CA'));
assert.throws(() => assertOurSolutionMarketRegion('JP', 'US'), /market=JP.*"JP"/);
assert.throws(() => assertOurSolutionMarketRegion('US', 'JP'), /目標市場 US.*region_code "JP"/);

const previewRoute = fs.readFileSync('app/api/admin/our-solution-data/import/route.ts', 'utf8');
const publishRoute = fs.readFileSync('app/api/admin/our-solution-data/route.ts', 'utf8');
const admin = fs.readFileSync('app/components/economics-admin.tsx', 'utf8');
assert.match(previewRoute, /assertOurSolutionMarketRegion\(market, data\.scenario\.region_code\)/, 'preview must enforce the market-region guard');
assert.match(previewRoute, /error: "region_mismatch"/, 'preview must return an explicit mismatch error');
assert.match(publishRoute, /assertOurSolutionMarketRegion\(market, checked\.data\.scenario\.region_code\)/, 'publish must independently enforce the market-region guard');
assert.match(publishRoute, /error: "region_mismatch"/, 'publish must return an explicit mismatch error');
assert.match(admin, /發布目標：/);
assert.match(admin, /Workbook Scenario\.region_code/);

console.log('Our Solution region guard: JP accepts only JP; US rejects JP; preview, publish and confirmation integrations passed.');

for(const market of ['US','JP','AU','CA','UK','EU'])for(const locale of ['en-US','zh-TW','ja-JP']){assert.equal(publicSolutionMarketForPage(market,locale),market);assert.match(solutionHref(locale,market),new RegExp('market='+market+'$'));}
