// Transpile the Market Capacity and US retirement libraries for plain-Node tests.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
let cached;
module.exports=function load(){
 if(cached)return cached;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'market-capacity-'));
 for(const f of ['lib/market-capacity','lib/us-retirement-wave']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}
 const capacity=require(path.join(dir,'lib/market-capacity.js')),wave=require(path.join(dir,'lib/us-retirement-wave.js'));
 const rows=JSON.parse(fs.readFileSync('data/our-solution-market-capacity.json','utf8'));
 cached={capacity,wave,rows,seedWave:wave.computeRetirementWave(capacity.usCumulativeMw(rows))};
 return cached;
};
