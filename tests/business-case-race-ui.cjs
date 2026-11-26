// Regression: changing country while a Calculate request is in flight must not
// leave the button on CALCULATING… or render a stale region's result, and a
// Calculate click right after a country change must send that country's fee.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
module.exports=async function({browser,base}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bc-race-ui-'));
 process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
 try{
  for(const f of ['lib/business-case/units','lib/business-case/types','lib/business-case/defaults','lib/business-case/fallback','lib/business-case/input','lib/business-case/supported-countries','lib/business-case/calculator/engine','server/business-case/workbook']){
   const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
  }
  const {parseWorkbook}=require(path.join(dir,'server/business-case/workbook.js'));
  const {calculationInput}=require(path.join(dir,'lib/business-case/input.js'));
  const {calculateBusinessCase}=require(path.join(dir,'lib/business-case/calculator/engine.js'));
  const data=await parseWorkbook(fs.readFileSync('tests/fixtures/business-case-master-v2.xlsx'));
  const se=data.regions.find(r=>r.code==='SE'),de=data.regions.find(r=>r.code==='DE');
  const page=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});
  const bodies=[];let mode='normal';
  try{
   await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
   await page.route('**/api/calculator-data{,/**}',r=>r.fulfill({json:{...data,source:'Offline race fixture'}}));
   await page.route('**/api/calculate{,/**}',async r=>{
    const input=r.request().postDataJSON();bodies.push(input);
    const reply=()=>r.fulfill({json:{source:'Offline race fixture',result:calculateBusinessCase(data,calculationInput(input,data))}}).catch(()=>{});
    if(mode==='hang')return; // never answers
    if(mode==='slow'){await new Promise(x=>setTimeout(x,2500));return reply();}
    return reply();
   });
   await page.goto(base+'/business-case/');
   await page.getByRole('status').filter({hasText:'Offline race fixture'}).waitFor();
   const country=page.getByRole('combobox',{name:'Country',exact:true});
   const button=page.locator('.calculateButton');
   const hasResult=()=>page.evaluate(()=>!!document.querySelector('#business-case')?.textContent.includes('PV Circulator'));

   // 1. Change country and click Calculate immediately: request uses the new region and its default fee.
   await country.selectOption('Sweden');await button.click();
   await page.waitForFunction(()=>document.querySelector('#business-case')?.textContent.includes('PV Circulator'));
   assert.equal(bodies.at(-1).regionCode,'SE');assert.equal(bodies.at(-1).processingFee,Number(se.defaultFee));
   assert.match(await button.innerText(),/CALCULATE BUSINESS CASE/);

   // 2. Slow Sweden response, then switch to Germany: button is released at once and the stale result never appears.
   mode='slow';await button.click();await page.waitForFunction(()=>/CALCULATING/.test(document.querySelector('.calculateButton').innerText));
   await country.selectOption('Germany');
   await page.waitForFunction(()=>/CALCULATE BUSINESS CASE/.test(document.querySelector('.calculateButton').innerText),null,{timeout:1000});
   assert.equal(await button.isEnabled(),true);
   await page.waitForTimeout(3000);assert.equal(await hasResult(),false,'stale Sweden result rendered after switching to Germany');
   mode='normal';await button.click();
   await page.waitForFunction(()=>document.querySelector('#business-case')?.textContent.includes('PV Circulator'));
   assert.equal(bodies.at(-1).regionCode,'DE');assert.equal(bodies.at(-1).processingFee,Number(de.defaultFee));

   // 3. A request that never answers is released by changing the country, and Calculate works again.
   mode='hang';await button.click();await page.waitForFunction(()=>/CALCULATING/.test(document.querySelector('.calculateButton').innerText));
   await country.selectOption('Sweden');
   await page.waitForFunction(()=>/CALCULATE BUSINESS CASE/.test(document.querySelector('.calculateButton').innerText),null,{timeout:1000});
   mode='normal';await button.click();
   await page.waitForFunction(()=>document.querySelector('#business-case')?.textContent.includes('PV Circulator'));
   assert.equal(bodies.at(-1).regionCode,'SE');
   console.log('Passed: Business Case calculate race (immediate click after country change, slow stale response, hung request).');
  }finally{await page.close();}
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
};
