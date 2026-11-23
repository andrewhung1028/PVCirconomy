const assert = require('node:assert/strict');
const fs = require('node:fs');
require('./helpers/typescript.cjs');

const { assertOurSolutionMarketRegion } = require('../lib/our-solution/market.ts');

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
