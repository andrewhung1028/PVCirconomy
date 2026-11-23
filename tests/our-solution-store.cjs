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
  const initial=await store.activeOurSolutionData();assert.deepEqual(initial.data,seed);
  const initialJapan=await store.activeOurSolutionData('JP');assert.deepEqual(initialJapan.data,japanSeed);assert.notEqual(initialJapan.version,initial.version);
  // Simulate current production's legacy result-format row without altering its version ID.
  await db.query('UPDATE pv_our_solution_versions SET data=$1::jsonb WHERE id=$2',[JSON.stringify({solutions:[],scenario:{legacy:true}}),initial.version]);
  assert.deepEqual((await store.activeOurSolutionData()).data,seed);assert.deepEqual((await store.ourSolutionVersion(initial.version)).data,seed);
  const next=structuredClone(seed);next.assumptions[1]['Hourly wage'][0]+=1;
  const saved=await store.saveOurSolutionData(next,initial.version,{oid:'local-test',email:'test@example.invalid'},'Parameter master');assert.deepEqual(saved.data,next);
  assert.equal(await store.saveOurSolutionData(next,initial.version,{oid:'local-test',email:'test@example.invalid'}),null);
  assert.equal((await store.ourSolutionHistory()).length,2);
  assert.deepEqual((await db.query('SELECT data FROM pv_our_solution_versions WHERE id=$1',[saved.version])).rows[0].data,next);
  const japanNext=structuredClone(japanSeed);japanNext.assumptions[1]['Hourly wage'][0]+=1;
  const japanSaved=await store.saveOurSolutionData(japanNext,initialJapan.version,{oid:'local-test',email:'test@example.invalid'},'Japan parameter master','JP');assert.deepEqual(japanSaved.data,japanNext);
  assert.equal(await store.saveOurSolutionData(japanNext,initialJapan.version,{oid:'local-test',email:'test@example.invalid'},'','JP'),null);
  assert.deepEqual((await store.activeOurSolutionData()).data,next,'JP publish must not change US active data');
  assert.equal((await store.ourSolutionHistory('JP')).length,2);assert.deepEqual((await store.ourSolutionVersion(japanSaved.version,'JP')).data,japanNext);
  const {metalPriceStore}=require('../server/metal-prices/store.ts');assert.deepEqual(await metalPriceStore.latest(),[]);
  const row={metal:'Silver',price:45.5,unit:'USD/troy oz',source:'Mock',as_of:'2026-11-20',fetched_at:new Date().toISOString()};
  await metalPriceStore.save([row]);await metalPriceStore.save([row]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM pv_metal_prices')).rows[0].n,1,'SQL insert idempotency guard');
  assert.equal((await metalPriceStore.latest())[0].price,45.5);assert.ok(locks>=4,'table creation and writes use advisory locks');
  console.log('Our Solution/metal SQL: independent US/JP versions, legacy readback, publish, stale-version conflict, immutable history, table creation, advisory locks and idempotent insert passed on isolated PostgreSQL.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exit(1)});
