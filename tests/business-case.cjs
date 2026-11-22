const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pv-business-case-'));
function compile(source,target){const out=path.join(dir,target);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);}
// Resolve installed dependencies from this repository, even though compiled files are isolated.
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
(async()=>{try{
 for(const f of ['types','fallback','calculator/engine']){compile('lib/business-case/'+f+'.ts','lib/business-case/'+f+'.js');compile('../businesscase/lib/'+f+'.ts','reference/'+f+'.js');}
 compile('server/business-case/workbook.ts','server/business-case/workbook.js');compile('server/auth/roles.ts','server/auth/roles.js');
 const {seed,parseWorkbook,exportWorkbook,diffData,validateData,sheets}=require(path.join(dir,'server/business-case/workbook.js'));
 const {calculateBusinessCase:calc}=require(path.join(dir,'lib/business-case/calculator/engine.js')),{calculateBusinessCase:reference}=require(path.join(dir,'reference/calculator/engine.js')),{fallback}=require(path.join(dir,'reference/fallback.js'));
 assert.equal(fs.readFileSync('lib/business-case/calculator/engine.ts','utf8'),fs.readFileSync('../businesscase/lib/calculator/engine.ts','utf8'));
 const bytes=await exportWorkbook(),parsed=await parseWorkbook(bytes);assert.equal(diffData(seed,parsed).length,0);assert.equal(sheets.length,7);
 let scenarios=0,numeric=0;function equal(a,b){if(typeof a==='number'){assert.ok(Math.abs(a-b)<=1,`${a} vs ${b}`);numeric++;}else if(a&&typeof a==='object'){for(const k of Object.keys(a))equal(a[k],b[k]);}else assert.deepEqual(a,b);}
 for(const r of fallback.regions)for(const s of fallback.solutions)for(const volume of [1000,10000]){const input={regionCode:r.code,panelsPerMonth:volume,processingFee:r.defaultFee,solutionCodes:[s.code]};const expected=reference(fallback,input);equal(calc(parsed,input),expected);equal(calc({...parsed,payable:[{material:'SILVER',route:s.code,payable:1,source:'test',note:''}]},input),expected);scenarios++;}
 const ExcelJS=require('exceljs');async function changed(fn){const b=new ExcelJS.Workbook();await b.xlsx.load(bytes);fn(b);return Buffer.from(await b.xlsx.writeBuffer());}
 for(const mutate of [b=>b.getWorksheet(1).getCell('A1').value='Wrong',b=>b.removeWorksheet(1),b=>b.getWorksheet(1).getCell('G2').value={formula:'1+1',result:2},b=>b.getWorksheet(1).getCell('G2').value=-1,b=>b.getWorksheet(4).getCell('B2').value=0,b=>b.getWorksheet(6).getCell('A2').value='UNKNOWN',b=>b.getWorksheet(1).addRow(b.getWorksheet(1).getRow(2).values)])await assert.rejects(()=>changed(mutate).then(parseWorkbook));
 await assert.rejects(()=>parseWorkbook(Buffer.alloc(3000001)));
 const modified=structuredClone(parsed);modified.regions[0].hourlyWage+=1;assert.equal(diffData(parsed,modified).length,1);validateData(modified);
 const {canAccess,staffRole}=require(path.join(dir,'server/auth/roles.js'));let roles=0;for(const email of ['ANDREW@TSGC.COM.TW','terry.ko@pvcirconomy.com','emily.cheng@tsgc.com.tw','emily.cheng@pvcirconomy.com','other@tsgc.com.tw'])for(const resource of ['system','pricing','delivery','communications','our-solution-data','business-case-data','orders','quotations'])for(const method of ['GET','POST']){assert.equal(canAccess(email,resource,method),staffRole(email)==='admin'||(staffRole(email)==='viewer'&&method==='GET'&&['orders','quotations'].includes(resource)));roles++;}
 assert.equal(diffData(seed,await parseWorkbook(fs.readFileSync('data/business-case/seed-v1.xlsx'))).length,0);
 console.log(`Passed: ${scenarios} reference scenarios, ${numeric} numeric comparisons (tolerance $1; actual delta 0), Payable independence, workbook round trip, 8 rejection cases, diff, ${roles} role checks.`);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
