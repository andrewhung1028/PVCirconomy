const assert = require('node:assert/strict');
require('./helpers/typescript.cjs');

const { annualFacilityCost, SQ_FT_PER_SQ_M } = require('../lib/business-case/units.ts');
const { formatCurrency, localeForRegion } = require('../lib/region-format.ts');
const { calculateBusinessCase } = require('../lib/business-case/calculator/engine.ts');
const { fallback } = require('../lib/business-case/fallback.ts');
const { calculationInput } = require('../lib/business-case/input.ts');
const { japanBusinessCaseProfile } = require('../lib/business-case/japan-profile.ts');
const { seededJapanOurSolutionData } = require('../lib/our-solution-japan-data.ts');

assert.equal(annualFacilityCost(1_000, 2, 18, 3.5, 'USD/sq.ft./year'), 43_000);
assert.ok(Math.abs(annualFacilityCost(SQ_FT_PER_SQ_M * 100, 2, 1_000, 200, 'JPY/sq.m./month')-2_880_000)<1e-6);
assert.equal(localeForRegion({countryCode:'JP',currency:'JPY'}), 'ja-JP');
assert.equal(formatCurrency(1234.49, {countryCode:'JP',currency:'JPY'}), '￥1,234');
assert.equal(formatCurrency(1234.49, {countryCode:'US',currency:'USD'}), '$1,234.49');

const master = structuredClone(fallback);
const source = master.regions.find(region => region.code === 'US-CA');
const jp = {
  ...source,
  code: 'JP', region: 'Japan', country: 'Japan', currency: 'JPY',
  feeUnit: 'JPY/kg', defaultFee: 100, hourlyWage: 2_000, wageUnit: 'JPY/hour',
  baseRent: 2_500, cam: 500, rentUnit: 'JPY/sq.m./month',
  electricityPrice: 30, electricityUnit: 'JPY/kWh',
  landfillCost: 25_000, landfillUnit: 'JPY/metric ton',
};
master.regions.push(jp);
master.fx.push({currency:'JPY', localPerUSD:158, effectiveDate:'2026-11-23', active:true});
const result = calculateBusinessCase(master, {regionCode:'JP', panelsPerMonth:1_000, processingFee:100, solutionCodes:['PVCIRCULATOR'], panelWeightKg:20});
assert.equal(result.input.panelWeightKg, 20);
assert.equal(result.input.inputMetricTons, 240);
assert.equal(result.input.panelWeightLb, 20 / 0.45359237);

console.log('Passed: native JPY/kg, JPY/sq.m./month, kg input and zero-decimal ja-JP formatting; US units/format unchanged.');

const japan = japanBusinessCaseProfile(seededJapanOurSolutionData);
const japanRegion = japan.data.regions[0];
assert.equal(japan.defaultPanels, 13_888.89);
assert.equal(japanRegion.landfillUnit, 'JPY/metric ton');
assert.equal(japanRegion.rentUnit, 'JPY/sq.m./month');
assert.deepEqual(japan.data.solutions.map(solution => solution.operators), [7, 5, 3]);
const japanInput = calculationInput({
  regionCode: 'JP', panelsPerMonth: japan.defaultPanels, processingFee: japanRegion.defaultFee,
  solutionCodes: ['PVCIRCULATOR', 'CONVENTIONAL', 'HOT_KNIFE'],
}, japan.data);
const japanResult = calculateBusinessCase(japan.data, japanInput);
assert.equal(japanResult.input.panelWeightKg, 20);
for (const solution of japanResult.solutions) {
  assert.ok(Number.isFinite(solution.annualEbitda));
  assert.ok(Math.abs(solution.processingRevenue - japan.defaultPanels * 12 * 20 * 100) < 0.001);
}
assert.equal(japan.data.materials.find(material => material.code === 'GLASS').benchmarkPrice, 100 * japan.data.fx[0].localPerUSD);
assert.throws(() => calculationInput(japanInput, fallback), /not available for this region/);
console.log('Passed: the Japanese workbook provisions a separate JPY calculator profile, including all three routes.');
