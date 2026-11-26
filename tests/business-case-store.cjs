const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const {PGlite}=require('@electric-sql/pglite');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pv-bc-store-'));
function compile(source){const target=path.join(dir,source.replace(/\.ts$/,'.js'));fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);}
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
(async()=>{const db=new PGlite();try{
 const migration=fs.readFileSync('server/db/business-case-phase1.sql','utf8');await db.exec(migration);await db.exec(migration);assert.equal((await db.query('SELECT count(*)::int AS n FROM pv_business_case_versions')).rows[0].n,1);
 for(const f of ['server/business-case/store.ts','server/business-case/workbook.ts','lib/business-case/units.ts','lib/business-case/types.ts','lib/business-case/fallback.ts','lib/business-case/calculator/engine.ts'])compile(f);
 const client=path.join(dir,'server/db/client.js');fs.mkdirSync(path.dirname(client),{recursive:true});fs.writeFileSync(client,'exports.database=()=>global.__businessCaseSql;');
 global.__businessCaseSql=(parts,...values)=>db.query(parts.reduce((s,p,i)=>s+p+(i<values.length?'$'+(i+1):''),''),values).then(r=>r.rows);
 const store=require(path.join(dir,'server/business-case/store.js')),workbook=require(path.join(dir,'server/business-case/workbook.js'));
 const initial=await store.activeData();assert.equal(initial.number,1);assert.equal(workbook.diffData(initial.data,workbook.seed).length,0);assert.equal((await store.dataOrSeed()).source,'Published master v1');
 const next=structuredClone(initial.data);next.regions[0].hourlyWage+=2;const saved=await store.save(next,initial.version,'andrew@tsgc.com.tw','Test update');assert.equal(saved.number,2);assert.equal(await store.save(next,initial.version,'andrew@tsgc.com.tw','Stale'),null);assert.equal((await store.history()).length,2);
 const restored=await store.save((await store.version(initial.version)).data,saved.version,'andrew@tsgc.com.tw','Restore');assert.equal(restored.number,3);assert.equal(workbook.diffData(restored.data,initial.data).length,0);
 const attempts=await Promise.all([store.save(next,restored.version,'andrew@tsgc.com.tw','Concurrent A'),store.save(next,restored.version,'andrew@tsgc.com.tw','Concurrent B')]);assert.equal(attempts.filter(Boolean).length,1);assert.equal((await store.history()).length,4);
 await db.query('INSERT INTO pv_business_case_followups(id,reference,submission) VALUES ($1,$2,$3)',[crypto.randomUUID(),'BC-TEST',JSON.stringify({email:'test@example.invalid'})]);assert.equal((await db.query('SELECT email_status FROM pv_business_case_followups')).rows[0].email_status,'stored');
 // Exercise the real publish/restore route with local auth and PostgreSQL adapters.
 compile('app/api/admin/business-case-data/route.ts');
 const routeFile=path.join(dir,'app/api/admin/business-case-data/route.js');fs.writeFileSync(routeFile,fs.readFileSync(routeFile,'utf8').replaceAll('require("@/','require("'+dir+'/'));
 const authFile=path.join(dir,'server/auth/microsoft.js');fs.mkdirSync(path.dirname(authFile),{recursive:true});fs.writeFileSync(authFile,'exports.adminAccess=async()=>null;exports.staffSession=async()=>({email:"andrew@tsgc.com.tw"});exports.trustedOrigin=()=>true;');
 const route=require(routeFile),current=await store.activeData();
 const post=body=>route.POST(new Request('http://localhost/api/admin/business-case-data/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
 assert.equal((await post({data:next,expectedVersion:initial.version})).status,409);
 assert.equal((await post({data:{},expectedVersion:current.version})).status,400);
 const restoredResponse=await post({restoreVersion:initial.version,expectedVersion:current.version,note:'Restore through API'});assert.equal(restoredResponse.status,201);assert.equal((await restoredResponse.json()).active.number,5);

 // Import validates before any database access; database errors are service errors.
 compile('app/api/admin/business-case-data/import/route.ts');
 const importFile=path.join(dir,'app/api/admin/business-case-data/import/route.js');fs.writeFileSync(importFile,fs.readFileSync(importFile,'utf8').replaceAll('require("@/','require("'+dir+'/'));
 const importer=require(importFile),realSql=global.__businessCaseSql;let dbCalls=0;
 global.__businessCaseSql=()=>{dbCalls++;throw Error('database_not_configured');};
 const upload=bytes=>{const form=new FormData();form.append('file',new File([bytes],'test.xlsx'));return importer.POST(new Request('http://localhost/api/admin/business-case-data/import/',{method:'POST',body:form}));};
 assert.equal((await upload(Buffer.from('invalid'))).status,400);assert.equal(dbCalls,0);
 const unavailable=await upload(await workbook.exportWorkbook());assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).error,'database_unavailable');assert.equal(dbCalls,1);
 global.__businessCaseSql=()=>{throw Error('connection refused');};assert.equal((await upload(await workbook.exportWorkbook())).status,503);
 global.__businessCaseSql=realSql;assert.equal((await upload(await workbook.exportWorkbook())).status,200);
 console.log('Passed: import validation before DB, unconfigured/unavailable DB 503, valid import 200.');
 // Disabled-mail follow-ups run against the same isolated PostgreSQL database.
 for(const f of ['app/api/follow-up/route.ts','lib/region-format.ts','lib/business-case/master-data.ts','lib/business-case/input.ts','lib/business-case/supported-countries.ts','lib/business-case/report-time.ts','lib/business-case/solution-labels.ts','lib/business-case/business-case-email.ts','lib/business-case/business-case-pdf.ts'])compile(f);
 const followFile=path.join(dir,'app/api/follow-up/route.js');fs.writeFileSync(followFile,fs.readFileSync(followFile,'utf8').replaceAll('require("@/','require("'+dir+'/'));
 const mailFile=path.join(dir,'server/delivery/communications.js');fs.mkdirSync(path.dirname(mailFile),{recursive:true});fs.writeFileSync(mailFile,'exports.mailConfigured=()=>false;exports.sendBusinessCaseMessage=()=>{throw Error("Unexpected mail call")};');
 const follow=require(followFile);const response=await follow.POST(new Request('http://localhost/api/follow-up/',{method:'POST',body:JSON.stringify({name:'Test',email:'test@example.invalid',result:{input:{regionCode:'US-CA',panelsPerMonth:1000,processingFee:.2,solutionCodes:['PVCIRCULATOR','CONVENTIONAL']},solutions:[{annualRevenue:999999999}]}})}));assert.equal(response.status,200);assert.equal((await response.json()).emailStatus,'not_configured');
 const followups=(await db.query("SELECT submission,email_status FROM pv_business_case_followups WHERE reference!='BC-TEST'")).rows;assert.equal(followups.length,1);assert.equal(followups[0].email_status,'not_configured');assert.notEqual(followups[0].submission.result.solutions[0].annualRevenue,999999999);
 console.log('Passed: local in-memory PostgreSQL migration twice, seed v1, publish v2, stale conflict, restore v3, competing publishers, immutable history, stored-only follow-up and API 409/400/201 responses.');
 }finally{await db.close();fs.rmSync(dir,{recursive:true,force:true});delete global.__businessCaseSql;}})().catch(e=>{console.error(e);process.exitCode=1;});
