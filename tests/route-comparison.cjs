const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'phase2-routes-'));
try {
 fs.mkdirSync(path.join(dir,"node_modules"),{recursive:true});fs.writeFileSync(path.join(dir,"node_modules/server-only.js"),"// Server-only marker stub for this Node server test.\n");
 for(const f of ['business-case/units','business-case/types','business-case/defaults','business-case/fallback','business-case/calculator/engine','route-comparison/index','route-comparison/config']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync('lib/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}
 const {fallback}=require(path.join(dir,'business-case/fallback.js')),helper=require(path.join(dir,'route-comparison/index.js')),config=require(path.join(dir,'route-comparison/config.js'));
 assert.equal(config.REFERENCE_CASE.panelWatts,300);assert.equal(config.REFERENCE_CASE.panelWeightLb,44.09245243697551);
 const routes=helper.routeComparison(fallback);assert.equal(config.SHOW_COMPETITOR_PROFIT,false);
 for(const [code,landfill,co2,ebitda] of [['PVCIRCULATOR',.97,1.05,67453],['CONVENTIONAL',19.68,3.50,32769],['HOT_KNIFE',.65,3.50,33565]]){const r=routes.find(r=>r.code===code);for(const [key,expected,tolerance] of [['landfillTPerMw',landfill,.01],['co2eTPerMw',co2,.01],['ebitdaPerMw',ebitda,1],['feePerMw',29395,1]])assert.ok(Math.abs(r[key]-expected)<=tolerance,`${code} ${key}: ${r[key]}`);}
 const publicRoutes=helper.publicRoutes(routes);for(const route of publicRoutes.filter(r=>r.code!=='PVCIRCULATOR')){assert.ok(!('ebitdaPerMw' in route));assert.ok(!('materialRevenuePerMw' in route));}
 config.SHOW_COMPETITOR_PROFIT=true;assert.ok(helper.publicRoutes(routes).every(r=>r.ebitdaPerMw!=null));config.SHOW_COMPETITOR_PROFIT=false;
 const inactive=structuredClone(fallback);inactive.regions.find(r=>r.code==='US-CA').active=false;assert.deepEqual(helper.routeComparison(inactive),[]);
 const partial=structuredClone(fallback);partial.solutions.find(r=>r.code==='HOT_KNIFE').active=false;assert.equal(helper.routeComparison(partial).length,2);
 console.log('T3/T4 helper: route metrics within tolerance; hidden financials stripped; enabled financials retained; inactive region and route handled.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
