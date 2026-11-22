// Master-driven panel weight (PANEL_WEIGHT_LB OPEX row, Andrew t519u) and engine breakeven fees.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'panel-weight-'));
for(const f of ['units','types','fallback','calculator/engine','breakeven']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync('lib/business-case/'+f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText);}
const {fallback}=require(path.join(dir,'fallback.js')),{calculateBusinessCase}=require(path.join(dir,'calculator/engine.js')),{breakevenFees}=require(path.join(dir,'breakeven.js'));
const codes=['CONVENTIONAL','HOT_KNIFE','PVCIRCULATOR'],input={regionCode:'US-CA',panelsPerMonth:5000,processingFee:0.2,solutionCodes:codes};
assert.equal(calculateBusinessCase(fallback,input).input.panelWeightLb,44.09,'v1 default unchanged without a master row');
const withWeight={...fallback,opex:[...fallback.opex,{countryCode:'US',parameter:'PANEL_WEIGHT_LB',value:45,unit:'lb/panel',currency:'USD',active:true}]};
assert.equal(calculateBusinessCase(withWeight,input).input.panelWeightLb,45,'master PANEL_WEIGHT_LB is used');
assert.equal(calculateBusinessCase(withWeight,{...input,panelWeightLb:40}).input.panelWeightLb,40,'explicit input wins');
for(const data of [fallback,withWeight]){const b=breakevenFees(data,{regionCode:'US-CA',panelsPerMonth:5000},codes);
 for(const f of b.fees){if(f.breakevenFee>0){const e=calculateBusinessCase(data,{...input,processingFee:f.breakevenFee}).solutions.find(s=>s.code===f.code).annualEbitda;assert.ok(Math.abs(e)<1e-6,`${f.code} EBITDA at breakeven ${e}`);}}
 console.log(`Passed: ${b.panelWeightLb} lb breakeven`,b.fees.map(f=>`${f.code} ${f.breakevenFee.toFixed(4)}`).join(', '));}
console.log('Passed: master panel weight precedence (input > master PANEL_WEIGHT_LB > 44.09 default).');
