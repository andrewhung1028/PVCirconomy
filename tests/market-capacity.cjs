// Market Capacity sheet: seed reproduces the pre-sheet chart, workbook round trip, validation and diff.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'market-capacity-test-'));
process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
for(const f of ['lib/market-capacity','lib/our-solution-data','server/our-solution/workbook']){const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,resolveJsonModule:true}}).outputText);}
fs.mkdirSync(path.join(dir,'data'),{recursive:true});for(const f of ['our-solution-economics-usd.json','our-solution-market-capacity.json'])fs.copyFileSync('data/'+f,path.join(dir,'data',f));
const mc=require(path.join(dir,'lib/market-capacity.js')),osd=require(path.join(dir,'lib/our-solution-data.js')),wb=require(path.join(dir,'server/our-solution/workbook.js'));
const ExcelJS=require('exceljs');
(async()=>{
 const rows=osd.seededMarketCapacity;assert.deepEqual(mc.validateMarketCapacity(rows),[]);
 // 1. Every chart year 2025–2050 is stored for all 8 markets; US also 2000–2024. No interpolation at runtime.
 assert.equal(rows.length,26*8+25);
 const trend=mc.capacityTrend(rows);assert.equal(trend.length,26);
 // 2. Non-US markets and World equal the pre-sheet formula exactly (same expression, same floating-point result).
 const start=[361.49691,260.89131,98.366494,16.100058,43.946566,951.13452],end=[1940,3200,524,80,1900,5500];
 trend.forEach((point,index)=>{const p=index/25;assert.equal(point.total,2185.4493*Math.pow(20059/2185.4493,p));
  [0,2,3,4,5].forEach(m=>assert.equal(point.values[m],start[m]*Math.pow(end[m]/start[m],p)));
  assert.ok(Math.abs(point.values[6]-(point.total-point.values.slice(0,6).reduce((a,b)=>a+b,0)))<1e-9);});
 assert.equal(trend[0].totalLabel,'2.2 TW');assert.equal(trend[25].totalLabel,'20.1 TW');
 // 3. US: IRENA statistics 2000–2025 (same CSV as the retirement curve), then fixed growth to 3,200 GW in 2050.
 const csv=fs.readFileSync('data/us-pv-installations.csv','utf8').trim().split('\n').slice(1).map(l=>l.split(',').map(Number));
 for(const [year,mw] of csv){const row=rows.find(r=>r.market==='United States'&&r.year===year);assert.ok(Math.abs(row.gw*1000-mw)<1e-6);assert.equal(row.source,'IRENA statistics');}
 assert.equal(rows.find(r=>r.market==='United States'&&r.year===2050).gw,3200);
 assert.ok(rows.filter(r=>r.source!=='IRENA statistics').every(r=>r.source==='待補'));
 // 4. Older published versions without the sheet fall back to the seed.
 const legacy=JSON.parse(fs.readFileSync('data/our-solution-economics-usd.json','utf8'));assert.equal(legacy.marketCapacity,undefined);
 assert.equal(osd.validateOurSolutionData(legacy).valid,true);assert.equal(osd.marketCapacityOf(legacy),rows);
 // 5. Export → import round trip is lossless and produces no diff.
 const buffer=await wb.createOurSolutionWorkbook(osd.seededOurSolutionData);
 const parsed=await wb.parseOurSolutionWorkbook(buffer,legacy);assert.deepEqual(parsed.marketCapacity,rows);
 assert.deepEqual(osd.diffOurSolutionData(osd.seededOurSolutionData,parsed),[]);
 assert.deepEqual(osd.diffOurSolutionData(legacy,parsed),[],'legacy version vs seeded sheet: no visible change');
 // Header names as specified.
 const book=new ExcelJS.Workbook();await book.xlsx.load(buffer);const sheet=book.getWorksheet('Market Capacity');
 assert.deepEqual([1,2,3,4,5,6].map(c=>sheet.getCell(1,c).value),['市場','年份','累積裝置量 GW','出處','出處年份','備註']);
 // 6. A workbook without the sheet keeps the current rows.
 book.removeWorksheet(sheet.id);const without=Buffer.from(await book.xlsx.writeBuffer());
 assert.equal((await wb.parseOurSolutionWorkbook(without,osd.seededOurSolutionData)).marketCapacity.length,rows.length);
 // 7. Validation rejects negatives, duplicates, Other markets ≠ World − six, and missing US history.
 const edit=async(fn)=>{const b=new ExcelJS.Workbook();await b.xlsx.load(buffer);fn(b.getWorksheet('Market Capacity'));return wb.parseOurSolutionWorkbook(Buffer.from(await b.xlsx.writeBuffer()),legacy);};
 const rowOf=(s,market,year)=>{for(let i=2;i<=s.actualRowCount;i++)if(s.getCell(i,1).value===market&&s.getCell(i,2).value===year)return i;throw Error('row');};
 await assert.rejects(edit(s=>{s.getCell(rowOf(s,'Japan',2030),3).value=-1;}),/不可為負數/);
 await assert.rejects(edit(s=>{s.getCell(rowOf(s,'Japan',2031),2).value=2030;}),/重複/);
 await assert.rejects(edit(s=>{const r=rowOf(s,'Other markets',2040);s.getCell(r,3).value=s.getCell(r,3).value+0.5;}),/Other markets 應等於 World 減六個市場/);
 await assert.rejects(edit(s=>{const r=rowOf(s,'United States',2010);s.getRow(r).values=[];}),/United States 需要/);
 await assert.rejects(edit(s=>{s.getCell(rowOf(s,'Taiwan',2030),1).value='Mars';}),/市場必須是/);
 await assert.rejects(edit(s=>{s.getCell(rowOf(s,'Taiwan',2030),4).value='';}),/必須是文字|出處不可空白/);
 // Small tolerance accepted; change shows in the diff preview.
 const tweaked=await edit(s=>{const r=rowOf(s,'Other markets',2040);s.getCell(r,3).value=s.getCell(r,3).value+0.005;});
 const diff=osd.diffOurSolutionData(osd.seededOurSolutionData,tweaked);assert.equal(diff.length,1);assert.equal(diff[0].label,'Market Capacity · Other markets · 2040 · GW');
 const sourced=await edit(s=>{const r=rowOf(s,'Japan',2030);s.getCell(r,4).value='IEA PVPS';s.getCell(r,5).value=2026;});
 assert.equal(osd.diffOurSolutionData(osd.seededOurSolutionData,sourced)[0].after,'IEA PVPS (2026)');
 console.log('Market Capacity: seed equals pre-sheet chart, US IRENA history, legacy fallback, lossless round trip, validation and diff passed.');
 fs.rmSync(dir,{recursive:true,force:true});
})().catch(e=>{console.error(e);process.exit(1);});
