// Real SQL on disposable, in-memory PostgreSQL; no Neon/network.
const assert=require('node:assert/strict'),{PGlite}=require('@electric-sql/pglite');require('./helpers/typescript.cjs');
(async()=>{
 const db=new PGlite();let locks=0;
 const query=(parts,...values)=>{
  const text=parts.reduce((s,p,i)=>s+p+(i<values.length?'$'+(i+1):''),'');
  const execute=async sql=>{if(text.includes('pg_advisory_xact_lock')){locks++;return [];}return (await sql.query(text,values)).rows;};
  return {execute,then:(resolve,reject)=>execute(db).then(resolve,reject)};
 };
 query.transaction=qs=>db.transaction(async tx=>{const out=[];for(const q of qs)out.push(await q.execute(tx));return out;});
 require('../server/db/client.ts').database=()=>query;
 try{
  const store=require('../server/our-solution/store.ts'),{seededOurSolutionData:seed}=require('../lib/our-solution-data.ts'),{seededJapanOurSolutionData:japanSeed}=require('../lib/our-solution-japan-data.ts');
  const { marketParameters, sharedParameters } = require('../lib/our-solution/shared.ts');
  const initial=await store.activeOurSolutionData();
  const initialJapan=await store.activeOurSolutionData('JP');assert.notEqual(initialJapan.version,initial.version);
  const { scenarioPanelWeightKg } = require('../lib/our-solution/parameters.ts');
  for (const { data } of [initial, initialJapan]) {
   assert.equal(data.scenario.panels_per_month,50_000_000/300/12);
   assert.equal(scenarioPanelWeightKg(data),20);
   assert.equal(data.assumptions[10]['Panel rating'][0],300);
   assert.equal(data.assumptions[6].EVA[3],0);
   assert.equal(data.assumptions[6].Backsheet[3],0);
  }
  // Simulate current production's legacy result-format row without altering its version ID.
  await db.query('UPDATE pv_our_solution_versions SET data=$1::jsonb WHERE id=$2',[JSON.stringify({solutions:[],scenario:{legacy:true}}),initial.version]);
  assert.deepEqual((await store.activeOurSolutionData()).data,seed);assert.deepEqual((await store.ourSolutionVersion(initial.version)).data,seed);
  const next=structuredClone(seed);next.assumptions[1]['Hourly wage'][0]+=1;
  const saved=await store.saveOurSolutionData(next,initial.version,{oid:'local-test',email:'test@example.invalid'},'Parameter master');assert.deepEqual(saved.data,next);
  assert.equal(await store.saveOurSolutionData(next,initial.version,{oid:'local-test',email:'test@example.invalid'}),null);
  assert.equal((await store.ourSolutionHistory()).length,2);
  assert.deepEqual((await db.query('SELECT data FROM pv_our_solution_versions WHERE id=$1',[saved.version])).rows[0].data,marketParameters(next));
  const japanNext=structuredClone(japanSeed);japanNext.assumptions[1]['Hourly wage'][0]+=1;
  const japanSaved=await store.saveOurSolutionData(japanNext,initialJapan.version,{oid:'local-test',email:'test@example.invalid'},'Japan parameter master','JP');assert.deepEqual(japanSaved.data,japanNext);
  assert.equal(await store.saveOurSolutionData(japanNext,initialJapan.version,{oid:'local-test',email:'test@example.invalid'},'','JP'),null);
  assert.deepEqual((await store.activeOurSolutionData()).data,next,'JP publish must not change US active data');
  assert.equal((await store.ourSolutionHistory('JP')).length,2);assert.deepEqual((await store.ourSolutionVersion(japanSaved.version,'JP')).data,japanNext);
  const shared = await store.activeSharedParameters();
  assert.deepEqual(shared.data, sharedParameters(next));
  const sharedEdit = structuredClone(shared.data);
  sharedEdit.capacityHistory.World[2050] += 1;
  sharedEdit.population.World[2050] += 2;
  const actorShared = {oid:'local-test',email:'test@example.invalid'};
  const sharedSaved = await store.saveSharedParameters(sharedEdit, shared.version, actorShared, 'Shared test');
  assert.equal(await store.saveSharedParameters(sharedEdit, shared.version, actorShared, 'Stale'), null);
  for (const market of ['US','JP']) {
    const active = await store.activeOurSolutionData(market);
    assert.deepEqual(sharedParameters(active.data), sharedEdit);
    assert.equal(active.version, market === 'US' ? saved.version : japanSaved.version);
  }
  const { createSharedParametersWorkbook, parseSharedParametersWorkbook } = require('../server/our-solution/workbook.ts');
  const sharedWorkbook = await createSharedParametersWorkbook(sharedSaved.data);
  const parsedShared = await parseSharedParametersWorkbook(sharedWorkbook, sharedSaved.data);
  const { diffSharedParameters } = require('../lib/our-solution-data.ts');
  assert.deepEqual(diffSharedParameters(sharedSaved.data, parsedShared), []);
  await store.saveSharedParameters(shared.data, sharedSaved.version, actorShared, 'Restore fixture');
  const ExcelJS = require('exceljs');
  const { createInitialOurSolutionTemplate, createOurSolutionWorkbook, parseOurSolutionWorkbook } = require('../server/our-solution/workbook.ts');
  async function filledWorkbook(market) {
   const template = await createInitialOurSolutionTemplate(market);
   await assert.rejects(parseOurSolutionWorkbook(template), /必須是數值或文字/);
   const workbook = new ExcelJS.Workbook();
   await workbook.xlsx.load(template);
   for (const name of ['Assumptions', 'Scenario']) {
    workbook.getWorksheet(name).eachRow(row => row.eachCell({includeEmpty:true}, cell => {
     if (cell.value !== null || cell.fill?.fgColor?.argb !== 'FFFFF2CC') return;
     const key = row.getCell(1).value;
     const sourceColumn = name === 'Assumptions' && ((cell.col === 5 && ['Glass','Aluminium','Copper','EVA','Backsheet','Silicon','Silver','Junction box'].includes(key)) || (cell.col === 4 && (/price/.test(key) || key === 'impact.grid_kg_co2e_per_kwh')));
     cell.value = sourceColumn ? 'Isolated test fixture' : 1;
    }));
   }
   return parseOurSolutionWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
  }
  const {loadSolutionView}=require('../server/our-solution/public-view.ts');
  assert.equal(await loadSolutionView('AU'),null);
  const australia = await filledWorkbook('AU');
  assert.equal(australia.meta.currency,'AUD');
  assert.equal(australia.scenario.region_code,'AU');
  assert.equal(australia.scenario.panel_weight_kg,20);
  assert.deepEqual((await parseOurSolutionWorkbook(await createOurSolutionWorkbook(australia),australia)).assumptions,australia.assumptions);
  assert.equal(await store.activeOurSolutionParameterData('AU'),null);
  assert.deepEqual(await store.ourSolutionHistory('AU'),[]);
  const actor = {oid:'local-test',email:'test@example.invalid'};
  await assert.rejects(store.saveOurSolutionData(japanNext,null,actor,'','AU'), /region_code "AU"/);
  const { emptyMarketTransport, estimateAnnualFreight, validateMarketTransport } = require('../lib/our-solution/transport.ts');
  const auTransport = emptyMarketTransport();
  Object.assign(auTransport, { maxPanelsPerPallet:30, palletTare:30, palletLengthM:2, palletWidthM:1 });
  Object.assign(auTransport.vehicles.trailer, { maxWeight: 25000, lengthM: 12, widthM: 2.3, base: 50, minimum: 75, perDistance: 4 });
  assert.deepEqual(validateMarketTransport(auTransport), []);
  const [container] = estimateAnnualFreight(auTransport, 106080, 20, [1000]);
  assert.deepEqual([container.palletSlots, container.panelsPerLoad, container.trips, container.tripCost], [12, 360, 295, 4050]);
  const usTransport = structuredClone(auTransport);
  usTransport.palletTare = 68;
  Object.assign(usTransport.vehicles.trailer, { maxWeight:43000, lengthM:630*0.0254, widthM:99*0.0254, base:0, minimum:1000, perDistance:3.11 });
  const [atZero, atTwoHundred, atOneThousand] = estimateAnnualFreight(usTransport, 106080, 20/0.45359237, [0,200,1000]);
  assert.deepEqual([atOneThousand.palletSlots, atOneThousand.panelsPerLoad, atOneThousand.trips], [16,480,221]);
  assert.deepEqual([atOneThousand.tripCost, atOneThousand.total, atOneThousand.total-atZero.total], [3110,687310,687310]);
  assert.deepEqual([atZero.vehicle, atZero.trips, atZero.total], [null,0,0]);
  assert.deepEqual([atTwoHundred.tripCost, atTwoHundred.total], [1000,221000]);
  usTransport.vehicles.trailer.maxWeight = 1200;
  const [weightLimited] = estimateAnnualFreight(usTransport, 30, 20/0.45359237, [200]);
  assert.equal(weightLimited.panelsPerLoad,25);
  assert.equal(weightLimited.trips,2);

  assert.ok(validateMarketTransport({...auTransport, palletLengthM:null}).length);
  const scopedWorkbook = await createOurSolutionWorkbook({...australia, transport:auTransport}, false, {}, false, true);
  const workbookCheck = new ExcelJS.Workbook();
  await workbookCheck.xlsx.load(scopedWorkbook);
  assert.equal(workbookCheck.getWorksheet('Capacity History'), undefined);
  assert.equal(workbookCheck.getWorksheet('Transport').getRow(1).getCell(1).value, 'field_key');
  const auParsed = await parseOurSolutionWorkbook(scopedWorkbook, australia, shared.data);
  assert.deepEqual(auParsed.transport, auTransport);
  assert.deepEqual(auParsed.capacityHistory, shared.data.capacityHistory);
  australia.transport = auTransport;
  const australiaFirst = await store.saveOurSolutionData(australia,null,actor,'Australia initial version','AU');
  assert.equal(await store.saveOurSolutionData(australia,null,actor,'','AU'),null);
  const australiaNext = structuredClone(australia);
  australiaNext.assumptions[1]['Hourly wage'][0] = 2;
  const australiaSaved = await store.saveOurSolutionData(australiaNext,australiaFirst.version,actor,'Australia updated version','AU');
  assert.deepEqual((await store.activeOurSolutionParameterData('AU')).data,australiaNext);
  const australiaView=await loadSolutionView('AU','zh-TW');
  assert.equal(australiaView.economicsData.scenario.currency,'AUD');
  assert.deepEqual(australiaView.retirementWave,australiaView.retirementMarketWaves.Australia);
  assert.deepEqual((await store.ourSolutionVersion(australiaFirst.version,'AU')).data,australia);
  assert.equal(await store.ourSolutionVersion(australiaSaved.version,'US'),null);
  assert.equal((await store.ourSolutionHistory('AU')).length,2);
  assert.equal((await store.activeOurSolutionData('JP')).version,japanSaved.version);
  for (const [market, currency, region] of [['CA','CAD','CA'],['UK','GBP','GB'],['EU','EUR','EU']]) {
   const data = await filledWorkbook(market);
   assert.equal(data.meta.currency,currency);
   assert.equal(data.scenario.region_code,region);
   assert.equal(data.assumptions[11]['Recovery fee'][1],currency+'/kg');
   const downloaded = await parseOurSolutionWorkbook(await createOurSolutionWorkbook(data),data);
   assert.deepEqual(downloaded.assumptions,data.assumptions);
   assert.equal(await store.activeOurSolutionParameterData(market),null);
   await assert.rejects(store.saveOurSolutionData(australia,null,actor,'',market), /Scenario.region_code/);
   const saved = await store.saveOurSolutionData(data,null,actor,'Initial market version',market);
   assert.equal((await store.activeOurSolutionParameterData(market)).version,saved.version);
   for(const locale of ['en-US','zh-TW','ja-JP']){
    const view=await loadSolutionView(market,locale);
    assert.equal(view.market,market);
    assert.equal(view.economicsData.scenario.currency,currency);
    assert.equal(view.economicsData.scenario.regionCode,region);
    assert.equal(view.breakeven.feeUnit,currency+'/kg');
    assert.equal(view.showPublicPricingBenchmark,false);
    assert.deepEqual(view.retirementWave,view.retirementMarketWaves[market==='EU'?'Europe':'World']);
   }
   assert.equal(await store.ourSolutionVersion(saved.version,'AU'),null);
   assert.equal((await store.ourSolutionHistory(market)).length,1);
  }
  assert.equal((await store.activeOurSolutionParameterData('AU')).version,australiaSaved.version);
  const {metalPriceStore}=require('../server/metal-prices/store.ts');assert.deepEqual(await metalPriceStore.latest(),[]);
  const row={metal:'Silver',price:45.5,unit:'USD/troy oz',source:'Mock',as_of:'2026-11-20',fetched_at:new Date().toISOString()};
  await metalPriceStore.save([row]);await metalPriceStore.save([row]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM pv_metal_prices')).rows[0].n,1,'SQL insert idempotency guard');
  assert.equal((await metalPriceStore.latest())[0].price,45.5);assert.ok(locks>=4,'table creation and writes use advisory locks');
  console.log('Our Solution/metal SQL: independent US/JP/AU/CA/UK/EU versions, legacy readback, publish, stale-version conflict, immutable history, table creation, advisory locks and idempotent insert passed on isolated PostgreSQL.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exit(1)});
