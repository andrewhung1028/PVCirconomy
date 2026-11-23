const assert=require('node:assert/strict'),fs=require('node:fs'),ExcelJS=require('exceljs');
require('./helpers/typescript.cjs');
const {model}=require('../lib/our-solution/model.ts'),{parseOurSolutionWorkbook:parse,createOurSolutionWorkbook:exportBook}=require('../server/our-solution/workbook.ts');
const {seededOurSolutionData:seed,diffOurSolutionData:diff,effectiveParameters}=require('../lib/our-solution-data.ts');
const ref=require('./fixtures/our-solution-reference.json');
function close(a,b,path){assert.ok(Math.abs(a-b)<=Math.max(1e-9,Math.abs(b)*1e-6),`${path}: ${a} != ${b}`)}
function compare(a,b,path=''){for(const [k,v]of Object.entries(b)){if(typeof v==='number')close(a[k],v,path+'.'+k);else if(v&&typeof v==='object')compare(a[k],v,path+'.'+k);}}
(async()=>{
 const fixture=fs.readFileSync('tests/fixtures/our-solution-master-2026-11-22.xlsx');
 const parsed=await parse(fixture);assert.deepEqual(parsed,seed,'parse(fixture) = generated seed');
 await assert.rejects(parse(fixture,parsed),/缺少工作表：Website Data/,'admin uploads must use the current workbook with Website Data');
 const m=model(parsed);
 compare(m,{annualPanels:ref.annualPanels,inputT:ref.inputT,operatingDays:ref.operatingDays,solutions:ref.solutions,cellPowder:ref.cellPowder,kgPerMw:ref.kgPerMw,perCapitaKg:ref.perCapitaKg});
 for(const [key,years]of Object.entries(ref.usRetirementT))for(const [year,value]of Object.entries(years))assert.equal(m.retirementWave[key][m.retirementWave.years.indexOf(Number(year))],value);
 for(const [key,values]of Object.entries(ref.usCross))for(const [threshold,year]of Object.entries(values))assert.equal(m.retirementWave.crossings[key][String(Number(threshold))],year);
 for(const [market,v]of Object.entries(ref.capacity2025))close(m.capacity[market][2025],v,market+' 2025');
 for(const [market,v]of Object.entries(ref.capacity2050))close(m.capacity[market][2050],v,market+' 2050');
 assert.deepEqual(await parse(await exportBook(parsed)),parsed,'export → parse lossless');
 assert.deepEqual(await parse(await exportBook(parsed),parsed),parsed,'current admin export includes required Website Data');
 assert.deepEqual(await parse(await exportBook(parsed,false,require('../server/metal-prices/service.ts').workbookPrices(parsed))),parsed,'DB-unavailable API export → parse lossless');
 assert.deepEqual(await parse(await exportBook(parsed,true)),parsed,'template is a complete parameter master');
 assert.deepEqual(diff(parsed,seed),[]);assert.equal(effectiveParameters({solutions:[]}),seed);
 const edit=async(fn)=>{const w=new ExcelJS.Workbook;await w.xlsx.load(fixture);fn(w);return parse(Buffer.from(await w.xlsx.writeBuffer()));};
 const renamed=await edit(w=>{for(const sheet of w.worksheets)sheet.eachRow(row=>row.eachCell(cell=>{if(typeof cell.value==='string')cell.value=cell.value.replace(/Hot knife/g,'Thermal processing').replace(/hot-knife/g,'thermal-processing');}));});
 assert.deepEqual(renamed,parsed,'Thermal processing workbook labels preserve every parameter');
 const template=new ExcelJS.Workbook();await template.xlsx.load(await exportBook(parsed,true));
 const website=template.getWorksheet('Website Data');assert.ok(website,'export includes Website Data');assert.deepEqual(website.getRow(1).values.slice(1),['field_key','section','label','value','unit','source']);
 const footprintRow=website.getRows(2,website.rowCount-1).find(row=>row.getCell(1).value==='methods.shredding.footprint_m2');assert.equal(footprintRow.getCell(4).value,480);footprintRow.getCell(4).value=481;
 const websiteEdited=await parse(Buffer.from(await template.xlsx.writeBuffer()));assert.equal(websiteEdited.publicData['methods.shredding.footprint_m2'].value,481);assert.ok(diff(parsed,websiteEdited).some(row=>row.field.includes('publicData.methods.shredding.footprint_m2.value')));
 const missingWebsite=new ExcelJS.Workbook();await missingWebsite.xlsx.load(await exportBook(parsed,true));const websiteSheet=missingWebsite.getWorksheet('Website Data');websiteSheet.spliceRows(websiteSheet.rowCount,1);await assert.rejects(parse(Buffer.from(await missingWebsite.xlsx.writeBuffer())),/Website Data 缺少必要欄位/);
 const headerLabels=[];template.getWorksheet('Assumptions').eachRow(row=>row.eachCell(cell=>{if(typeof cell.value==='string')headerLabels.push(cell.value);}));assert.ok(headerLabels.includes('Thermal processing'));assert.ok(!headerLabels.some(v=>/hot[- ]knife/i.test(v)));
 await assert.rejects(edit(w=>w.getWorksheet('Scenario').getCell('C4').value={formula:'5000',result:5000}),/Scenario!C4.*公式/);
 await assert.rejects(edit(w=>w.getWorksheet('Instructions').getCell('B2').value={formula:'1'}),/Instructions!B2.*公式/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('B40').value=.69),/比例總和/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('B54').value=1.1),/回收率/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('D54').value=2),/旗標/);
 await assert.rejects(edit(w=>w.getWorksheet('Capacity History').getRow(5).values=[]),/缺少年份 2000/);
 await assert.rejects(edit(w=>w.getWorksheet('Capacity History').getCell('B30').value=1),/World.*六個市場/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('B74').value={formula:'B41',result:.7}),/B74.*相符材料/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('C74').value=2),/旗標/);
 await assert.rejects(edit(w=>w.getWorksheet('Population').getCell('B5').value=0),/正有限/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('D40').value='USD/kg'),/價格單位/);
 await assert.rejects(edit(w=>w.getWorksheet('Assumptions').getCell('B55').value={formula:'1',result:1}),/B55.*公式/);
 await assert.rejects(edit(w=>w.getWorksheet('Scenario').getCell('A8').value='panels_per_month'),/重複/);
 await assert.rejects(edit(w=>w.addWorksheet('Annual Summary')),/舊版.*現行/);
 // Cached Section 8 values and Product Value results never affect the model.
 const ignored=await edit(w=>{w.getWorksheet('Assumptions').getCell('B74').value={formula:'B40',result:999};w.getWorksheet('Product Value').getCell('C5').value={formula:'999',result:999};});assert.deepEqual(model(ignored),m);
 // Move parameter rows, including their share references: importer resolves labels, not row numbers.
 const moved=await edit(w=>{const a=w.getWorksheet('Assumptions');const x=a.getRow(6).values;a.getRow(6).values=a.getRow(7).values;a.getRow(7).values=x;});assert.deepEqual(moved,seed);
 const changed=structuredClone(seed);changed.assumptions[1]['Hourly wage'][0]+=1;assert.ok(diff(seed,changed).some(r=>r.label.includes('ebitda')));assert.ok(diff(seed,changed).some(r=>r.label.includes('Hourly wage')));
 const p2=structuredClone(seed);p2.scenario.panel_weight_lb=40;assert.notEqual(model(p2).kgPerMw,m.kgPerMw);
 const eff={Silver:{price:50,unit:'USD/troy oz',source:'Mock spot',asOf:'2026-11-23'}};
 const e=await parse(await exportBook(seed,false,eff));assert.equal(e.assumptions[5].Silver[1],50);assert.match(e.assumptions[5].Silver[3],/Mock spot.*2026-11-23/);
 console.log('Our Solution: complete reference parity; seed; round trips; formula, label, year, share and value validation; legacy fallback; effective-price export and result diffs passed.');
})().catch(e=>{console.error(e);process.exit(1)});
