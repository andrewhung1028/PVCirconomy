const assert=require('node:assert/strict');require('./helpers/typescript.cjs');
const {capacityHistory,model}=require('../lib/our-solution/model.ts'),{validateParameters}=require('../lib/our-solution/validation.ts'),{capacityTrend}=require('../lib/market-capacity.ts');
const {seededOurSolutionData:p}=require('../lib/our-solution-data.ts'),ref=require('./fixtures/our-solution-reference.json'),cap=capacityHistory(p),trend=capacityTrend(p);
assert.deepEqual(validateParameters(p),[]);assert.equal(trend.length,26);
for(const [m,v]of Object.entries(ref.capacity2025))assert.ok(Math.abs(cap[m][2025]-v)<1e-6);
for(const m of Object.keys(p.capacityHistory))for(let y=2025;y<2050;y++)assert.equal(cap[m][y],cap[m][2024]*(cap[m][2050]/cap[m][2024])**((y-2024)/26));
for(let y=2000;y<=2050;y++)assert.ok(Math.abs(cap.World[y]-['Europe','United States','Japan','Taiwan','China','Australia','Other markets'].reduce((s,m)=>s+cap[m][y],0))<1e-8);
for(const m of Object.keys(ref.perCapitaKg))for(const [y,v]of Object.entries(ref.perCapitaKg[m]))assert.ok(Math.abs(model(p).perCapitaKg[m][y]-v)<1e-6);
console.log('Capacity History: actuals, constant growth, World balance, chart and all per-capita reference values passed.');
