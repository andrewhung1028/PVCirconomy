const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pv-business-case-'));
function compile(source,target){const out=path.join(dir,target);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);}
// Resolve installed dependencies from this repository, even though compiled files are isolated.
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
(async()=>{try{
 for(const f of ['units','types','defaults','fallback','input','supported-countries','market','calculator/engine']){compile('lib/business-case/'+f+'.ts','lib/business-case/'+f+'.js');}
 for(const f of ['business-case-pdf','report-time','solution-labels'])compile('lib/business-case/'+f+'.ts','lib/business-case/'+f+'.js');
 compile('lib/region-format.ts','lib/region-format.js');
 compile('server/business-case/workbook.ts','server/business-case/workbook.js');compile('server/auth/roles.ts','server/auth/roles.js');
 const {seed,parseWorkbook,exportWorkbook,diffData,validateData,sheets}=require(path.join(dir,'server/business-case/workbook.js'));
 const {calculateBusinessCase:calc}=require(path.join(dir,'lib/business-case/calculator/engine.js')),{fallback}=require(path.join(dir,'lib/business-case/fallback.js'));
 const v2=await parseWorkbook(fs.readFileSync('tests/fixtures/business-case-master-v2.xlsx'));
 const {initialBusinessCaseRegion,businessCaseMarketForCountry}=require(path.join(dir,'lib/business-case/market.js'));
 for(const market of ['US','AU','CA','UK','EU']){
  const region=initialBusinessCaseRegion(v2.regions,market);
  assert.equal(businessCaseMarketForCountry(region.countryCode),market);
 }
 assert.equal(initialBusinessCaseRegion(v2.regions,'EU','SE').code,'SE');
 assert.equal(initialBusinessCaseRegion(v2.regions,undefined,'CA-BC').code,'CA-BC');
 assert.equal(initialBusinessCaseRegion(v2.regions,'UK','US-CA').code,'GB');
 assert.equal(initialBusinessCaseRegion(v2.regions.filter(region=>region.countryCode==='US'),'CA'),undefined);
 assert.deepEqual([v2.regions.length,v2.opex.length,v2.fx.length,v2.materials.length,v2.recovery.length],[101,264,13,9,27]);
 assert.deepEqual(await parseWorkbook(await exportWorkbook(v2)),v2);assert.deepEqual(diffData(v2,await parseWorkbook(await exportWorkbook(v2))),[]);
 const legacy=structuredClone(seed);for(const r of legacy.regions)delete r.wageUnit;
 const normalized=validateData(legacy);assert.ok(normalized.regions.every(r=>r.wageUnit===r.currency+'/hour'));assert.deepEqual(diffData(legacy,normalized),[]);
 const legacyBook=new (require('exceljs').Workbook)();await legacyBook.xlsx.load(await exportWorkbook());legacyBook.getWorksheet('Operating Regions').spliceColumns(9,1);
 const legacyParsed=await parseWorkbook(Buffer.from(await legacyBook.xlsx.writeBuffer()));assert.deepEqual(legacyParsed,normalized);
 const bad=(mutate,pattern)=>{const d=structuredClone(v2);mutate(d);assert.throws(()=>validateData(d),pattern);};
 bad(d=>d.regions.find(r=>r.code==='SE').wageUnit='EUR/hour',/Operating Regions row .*column Wage Unit.*must equal region currency SEK/);
 bad(d=>d.regions.find(r=>r.code==='SE').electricityUnit='EUR/kWh',/column Electricity Unit.*must equal region currency SEK/);
 for(const field of ['feeUnit','wageUnit','rentUnit','electricityUnit','landfillUnit'])bad(d=>{const r=d.regions.find(r=>r.code==='SE');r[field]=r[field].replace('SEK','EUR');},/Operating Regions row .*column .*must equal region currency SEK/);
 for(const field of ['feeUnit','wageUnit','rentUnit','electricityUnit','landfillUnit']){
  bad(d=>d.regions[0][field]='USD/unknown',/Operating Regions row 2, column .*Unknown unit/);
  const d=structuredClone(v2);d.regions[0][field]='USD/unknown';assert.throws(()=>calc(d,{regionCode:d.regions[0].code,panelsPerMonth:5000,processingFee:0,solutionCodes:['PVCIRCULATOR']}),/Unknown unit/);
 }
 bad(d=>d.materials[0].priceUnit='USD/unknown',/Materials row 2, column Price Unit.*Unknown/);
 bad(d=>d.fx=d.fx.filter(f=>f.currency!=='SEK'),/Missing active FX SEK/);
 bad(d=>d.opex.find(o=>o.countryCode==='SE').currency='EUR',/OPEX Parameters row .*column Currency/);
 const noFx=structuredClone(v2);noFx.fx.find(f=>f.currency==='SEK').active=false;assert.throws(()=>calc(noFx,{regionCode:'SE',panelsPerMonth:5000,processingFee:0,solutionCodes:['PVCIRCULATOR']}),/Missing active FX SEK/);
 const {calculationInput}=require(path.join(dir,'lib/business-case/input.js'));
 const eu='AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB CH NO'.split(' '),errors=[],samples={};
 for(const code of eu){try{
  const r=v2.regions.find(r=>r.countryCode===code);const result=calc(v2,calculationInput({regionCode:r.code,panelsPerMonth:5000,processingFee:r.defaultFee,solutionCodes:['PVCIRCULATOR','CONVENTIONAL']},v2));
  assert.equal(result.fx.currency,r.currency);
  const op=key=>v2.opex.find(o=>o.countryCode===code&&o.parameter===key).value;
  for(const out of result.solutions){const solution=v2.solutions.find(s=>s.code===out.code);assert.equal(out.opex.labor,solution.operators*r.hourlyWage*op('OPERATING_HOURS_DAY')*op('OPERATING_DAYS_MONTH')*12*out.requiredShifts);assert.equal(out.opex.electricity,60000*solution.kwhPerPanel*r.electricityPrice);}
  if(['SE','DE','GB'].includes(code))samples[code]={currency:r.currency,fee:r.defaultFee,wage:r.hourlyWage,electricity:r.electricityPrice,solutions:result.solutions.map(s=>({code:s.code,annualRevenue:s.annualRevenue,annualOpex:s.annualOpex,annualEbitda:s.annualEbitda,labor:s.opex.labor,electricity:s.opex.electricity,simplePaybackYears:s.simplePaybackYears}))};
 }catch(e){errors.push({code,error:e.message});}}
 assert.deepEqual(errors,[]);console.log('EU country errors: '+JSON.stringify(errors));console.log('EU samples: '+JSON.stringify(samples));
 const {PDFDocument}=require('pdf-lib'),createDocument=PDFDocument.create;const printed=[];
 PDFDocument.create=async(...args)=>{const doc=await createDocument(...args),add=doc.addPage.bind(doc);doc.addPage=(...args)=>{const page=add(...args),draw=page.drawText.bind(page);page.drawText=(text,...args)=>{printed.push(text);return draw(text,...args);};return page;};return doc;};
 try{for(const code of ['SE','US-CA']){printed.length=0;const r=v2.regions.find(r=>r.code===code);const result=calc(v2,{regionCode:code,panelsPerMonth:5000,processingFee:r.defaultFee,solutionCodes:['PVCIRCULATOR','CONVENTIONAL']});await require(path.join(dir,'lib/business-case/business-case-pdf.js')).createBusinessCasePdf(result,'OFFLINE-TEST');assert.ok(printed.some(t=>code==='SE'?/Panel weight: 20 kg \(44.09 lb\)/.test(t):/Panel weight: 44.09 lb \|/.test(t)));assert.ok(printed.some(t=>t.startsWith('FX:')&&t.includes(r.currency+'/USD')));}}finally{PDFDocument.create=createDocument;}
 console.log('Passed: PDF metric/imperial panel weights, unchanged US weight label and explicit FX currency.');
 console.log('Passed: v2 round trip, legacy workbook/JSON normalization/diff, strict units, missing/inactive FX, OPEX currency, 30 EU countries and local-currency labor/electricity.');
 const bytes=await exportWorkbook(),parsed=await parseWorkbook(bytes);assert.equal(diffData(seed,parsed).length,0);assert.equal(sheets.length,7);
 let scenarios=0,numeric=0;function equal(a,b){if(typeof a==='number'){assert.ok(Math.abs(a-b)===0,`${a} vs ${b}`);numeric++;}else if(a&&typeof a==='object'){for(const k of Object.keys(a))equal(a[k],b[k]);}else assert.deepEqual(a,b);}
 for(const r of fallback.regions)for(const s of fallback.solutions)for(const volume of [1000,10000]){const input={regionCode:r.code,panelsPerMonth:volume,processingFee:r.defaultFee,solutionCodes:[s.code]};const expected=calc(fallback,input);equal(calc(parsed,input),expected);equal(calc({...parsed,payable:[{material:'SILVER',route:s.code,payable:1,source:'test',note:''}]},input),expected);scenarios++;}
 const ExcelJS=require('exceljs');async function changed(fn){const b=new ExcelJS.Workbook();await b.xlsx.load(bytes);fn(b);return Buffer.from(await b.xlsx.writeBuffer());}
 for(const mutate of [b=>b.getWorksheet(1).getCell('A1').value='Wrong',b=>b.removeWorksheet(1),b=>b.getWorksheet(1).getCell('G2').value={formula:'1+1',result:2},b=>b.getWorksheet(1).getCell('G2').value=-1,b=>b.getWorksheet(4).getCell('B2').value=0,b=>b.getWorksheet(6).getCell('A2').value='UNKNOWN',b=>b.getWorksheet(1).addRow(b.getWorksheet(1).getRow(2).values)])await assert.rejects(()=>changed(mutate).then(parseWorkbook));
 await assert.rejects(()=>parseWorkbook(Buffer.alloc(3000001)));
 const modified=structuredClone(parsed);modified.regions[0].hourlyWage+=1;assert.equal(diffData(parsed,modified).length,1);validateData(modified);

 const reordered=structuredClone(parsed);for(const sheet of sheets)reordered[sheet.key].reverse();assert.deepEqual(diffData(parsed,reordered),[]);
 const keyed=structuredClone(parsed);keyed.regions.shift();keyed.regions[0].hourlyWage+=1;keyed.regions.push({...parsed.regions[0],code:'TEST-NEW'});const kd=diffData(parsed,keyed);assert.deepEqual(kd.map(d=>d.kind).sort(),['added','changed','removed']);assert.ok(kd.every(d=>d.sheet==='Operating Regions'));
 const converted=await parseWorkbook(await changed(b=>{b.getWorksheet(4).getCell('C2').value=new Date('2026-10-02T00:00:00Z');b.getWorksheet(1).getCell('G2').value=' 1,234.50 ';}));assert.equal(converted.fx[0].effectiveDate,'2026-10-02');assert.equal(converted.regions[0].defaultFee,1234.5);
 for(const [sheet,cell,value] of [[1,'G2','12oops'],[1,'G2','1,2'],[4,'B2',0],[6,'A2','UNKNOWN']])await assert.rejects(()=>changed(b=>{b.getWorksheet(sheet).getCell(cell).value=value;}).then(parseWorkbook),e=>/row 2, (column|cell)/.test(e.message)&&e.message.includes(sheets[sheet-1].name));
 await assert.rejects(()=>changed(b=>{const ws=b.getWorksheet(1);ws.spliceRows(2,0,[]);ws.getCell('G3').value=-1;}).then(parseWorkbook),/Operating Regions row 3, column Default Processing Fee/);
 console.log('Passed: key-based reorder/add/remove/change, date-formatted cells, numeric text and location-rich validation (including blank rows).');
 const {canAccess,staffRole}=require(path.join(dir,'server/auth/roles.js'));let roles=0;for(const email of ['ANDREW@TSGC.COM.TW','terry.ko@pvcirconomy.com','emily.cheng@tsgc.com.tw','emily.cheng@pvcirconomy.com','other@tsgc.com.tw'])for(const resource of ['system','pricing','delivery','communications','our-solution-data','business-case-data','orders','quotations'])for(const method of ['GET','POST']){assert.equal(canAccess(email,resource,method),staffRole(email)==='admin'||(staffRole(email)==='viewer'&&method==='GET'&&['orders','quotations'].includes(resource)));roles++;}
 assert.equal(diffData(seed,await parseWorkbook(fs.readFileSync('data/business-case/seed-v1.xlsx'))).length,0);
 console.log(`Passed: ${scenarios} fallback round-trip scenarios, ${numeric} numeric comparisons (tolerance 0; actual delta 0), Payable independence, workbook round trip, 8 rejection cases, diff, ${roles} role checks.`);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
