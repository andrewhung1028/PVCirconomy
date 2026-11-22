const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bc-parity-'));
try{
for(const f of ['types','fallback','input','supported-countries','calculator/engine']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync('lib/business-case/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}
const {fallback}=require(path.join(dir,'fallback.js')),{calculateBusinessCase}=require(path.join(dir,'calculator/engine.js')),{calculationInput}=require(path.join(dir,'input.js'));
const fixtures=require('./fixtures/parity-live-responses.json');assert.equal(fixtures.length,225);
let numeric=0,maxDelta=0;
function compare(actual,expected,at){
 if(typeof expected==='number'){assert.equal(typeof actual,'number',at);assert.ok(Number.isFinite(actual),at);const delta=Math.abs(actual-expected);maxDelta=Math.max(maxDelta,delta);assert.ok(delta<=1,`${at}: delta ${delta}`);numeric++;}
 else if(expected&&typeof expected==='object'){assert.ok(actual&&typeof actual==='object',at);assert.deepEqual(Object.keys(actual).sort(),Object.keys(expected).sort(),at);for(const k of Object.keys(expected))compare(actual[k],expected[k],at+'.'+k);}
 else assert.deepEqual(actual,expected,at);
}
for(const [i,{c,live}] of fixtures.entries())compare(calculateBusinessCase(fallback,calculationInput(c,fallback)),live,'case '+i);
console.log(`Passed: ${fixtures.length} live fixtures, ${numeric} numeric outputs, tolerance $1, maximum delta ${maxDelta}.`);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
