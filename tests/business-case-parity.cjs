const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bc-parity-'));
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
(async()=>{try{
for(const f of ['units','types','fallback','input','supported-countries','calculator/engine']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync('lib/business-case/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}
const {fallback}=require(path.join(dir,'fallback.js')),{calculateBusinessCase}=require(path.join(dir,'calculator/engine.js')),{calculationInput}=require(path.join(dir,'input.js'));
for(const f of ['lib/business-case/units','lib/business-case/types','lib/business-case/fallback','lib/business-case/calculator/engine','server/business-case/workbook']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);}
const {parseWorkbook}=require(path.join(dir,'server/business-case/workbook.js'));
const v2=await parseWorkbook(fs.readFileSync('tests/fixtures/business-case-master-v2.xlsx'));
const fixtures=require('./fixtures/parity-live-responses.json');assert.equal(fixtures.length,225);
let numeric=0,maxDelta=0;
function compare(actual,expected,at){
 if(typeof expected==='number'){assert.equal(typeof actual,'number',at);assert.ok(Number.isFinite(actual),at);const delta=Math.abs(actual-expected);maxDelta=Math.max(maxDelta,delta);assert.ok(delta===0,`${at}: delta ${delta}`);numeric++;}
 else if(expected&&typeof expected==='object'){assert.ok(actual&&typeof actual==='object',at);assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),at);for(const k of Object.keys(expected))compare(actual[k],expected[k],at+'.'+k);}
 else assert.deepEqual(actual,expected,at);
}
// Only the two explicitly added schema fields are normalized in the recorded oracle.
for(const [i,{c,live}] of fixtures.entries()){
 const expected=structuredClone(live);expected.region.wageUnit=expected.region.currency+'/hour';expected.fx.currency=expected.region.currency;
 compare(calculateBusinessCase(v2,calculationInput(c,v2)),expected,'case '+i);
}
let scenarios=0;
const codes=fallback.solutions.filter(s=>s.active).map(s=>s.code);
const sets=Array.from({length:(1<<codes.length)-1},(_,i)=>codes.filter((_,j)=>(i+1)&(1<<j)));
for(const r of fallback.regions)for(const volume of [0,1000,5000,20000,70000])for(const solutionCodes of sets){
 const input={regionCode:r.code,panelsPerMonth:volume,processingFee:r.defaultFee,solutionCodes};
 assert.deepEqual(calculateBusinessCase(v2,input),calculateBusinessCase(fallback,input));scenarios++;
}
console.log(`Passed: ${scenarios} v1/v2 region-volume-solution-set deep-equal scenarios.`);
console.log(`Passed: ${fixtures.length} live fixtures, ${numeric} numeric outputs, tolerance 0, maximum delta ${maxDelta}.`);
}finally{fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
