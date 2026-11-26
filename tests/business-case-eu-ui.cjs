// Fixture-backed browser checks; no publication or database is needed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),ts=require('typescript');
module.exports=async function({browser,base}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bc-eu-ui-'));
 process.env.NODE_PATH=path.join(process.cwd(),'node_modules');require('module').Module._initPaths();
 try{
  for(const f of ['lib/business-case/units','lib/business-case/types','lib/business-case/defaults','lib/business-case/fallback','lib/business-case/input','lib/business-case/supported-countries','lib/business-case/calculator/engine','server/business-case/workbook']){
   const out=path.join(dir,f+'.js');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,ts.transpileModule(fs.readFileSync(f+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText);
  }
  const {parseWorkbook}=require(path.join(dir,'server/business-case/workbook.js'));
  const {calculationInput}=require(path.join(dir,'lib/business-case/input.js'));
  const {calculateBusinessCase}=require(path.join(dir,'lib/business-case/calculator/engine.js'));
  const data=await parseWorkbook(fs.readFileSync('tests/fixtures/business-case-master-v2.xlsx'));
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   try{
    // Prevent this page from making requests outside the local test server.
    await page.route('**/*',r=>new URL(r.request().url()).origin===base?r.continue():r.abort());
    await page.route('**/api/calculator-data{,/**}',r=>r.fulfill({json:{...data,source:'Offline EU fixture'}}));
    await page.route('**/api/calculate{,/**}',r=>r.fulfill({json:{success:true,result:calculateBusinessCase(data,calculationInput(r.request().postDataJSON(),data))}}));
    await page.goto(base+'/business-case/');
    const country=page.getByRole('combobox',{name:'Country',exact:true}),region=page.getByRole('combobox',{name:'Operating region',exact:true});
    await page.getByRole('status').filter({hasText:'Offline EU fixture'}).waitFor();assert.equal(await region.inputValue(),'US-CA');
    const fee=page.locator('input[type="number"][step="any"]');
    // Verify the original browser precision issue independently of default values.
    assert.equal(await page.evaluate(()=>{const input=document.createElement('input');input.type='number';input.step='0.01';input.value='6.175';return input.validity.stepMismatch;}),true);
    for(const code of 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE GB CH NO'.split(' ')){
     const r=data.regions.find(r=>r.countryCode===code);await country.selectOption(r.country);assert.equal(await region.inputValue(),r.code);assert.equal(await region.isDisabled(),r.region===r.country);await fee.fill(String(r.defaultFee));assert.equal(await fee.evaluate(input=>input.checkValidity()),true);
    }
    for(const value of ['99.25','6.175']){await fee.fill(value);assert.equal(await fee.evaluate(input=>input.checkValidity()),true);}
    await country.selectOption('Sweden');await page.getByRole('button',{name:/CALCULATE BUSINESS CASE/}).click();await page.waitForFunction(()=>document.querySelector('#business-case')?.textContent.includes('PV Circulator'));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    console.log(`Passed: ${width}px EU fixture selectors, US-CA default, 30 single-region countries, HUF/CZK fee precision and Swedish calculation rendering.`);
   }finally{await page.close();}
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
};
