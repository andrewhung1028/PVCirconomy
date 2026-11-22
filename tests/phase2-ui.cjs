const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{spawn}=require('node:child_process'),{randomBytes}=require('node:crypto');
const base='http://localhost:3128',enabled=process.env.PHASE2_EXPECT_PROFIT==='true';
const env={...process.env,DATABASE_URL:'',AUTH_SECRET:randomBytes(48).toString('base64url'),MICROSOFT_TENANT_ID:'11111111-1111-4111-8111-111111111111',MICROSOFT_CLIENT_ID:'22222222-2222-4222-8222-222222222222',MICROSOFT_CLIENT_SECRET:'local-test',AUTH_ORIGIN:base,MICROSOFT_MAIL_ENABLED:'false'};
const log=fs.openSync('/tmp/phase2-server.log','a');const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3128'],{env,stdio:['ignore',log,log]});
(async()=>{let browser;try{
 let ready=false;for(let i=0;i<150;i++){try{await fetch(base+'/api/auth/session/');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready,'local server ready');
 const guardFailures=[];
 const html=await fetch(base+'/pv-circulator/').then(r=>r.text());assert.ok(html.includes('59,221'));
 for(const value of ['29,050','29,810','23,191','25,904'])assert.equal(html.includes(value),enabled,`T4 ${value}`);
 console.log(`T4 rendered HTML: competitor financials ${enabled?'shown':'hidden'}, PV Circulator $59,221 present.`);if(enabled)return;
 for(const route of ['/','/solutions/','/pv-circulator/','/business-case/']){const html=await fetch(base+route).then(r=>r.text());const match=html.match(route==='/business-case/'?/SDG&E|IRR\b|valuation|Elkem(?!-measured)|Comstock|LME|GAP-\d|businesscase\.pvcirconomy\.com/i:/SDG&E|payback|IRR\b|valuation|Elkem(?!-measured)|Comstock|LME|GAP-\d|businesscase\.pvcirconomy\.com/i);/* Andrew t514u: payback is intentionally shown on /business-case so visitors can compare economics. */if(match)guardFailures.push(`T7 ${route}: ${match[0]} in built HTML`);assert.equal(/0\.0784%|\b2\.19%|2-26-00631-002/ /* 1.5% Elkem-measured silver is published (Andrew t519u). */.test(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ")),false,`T7 excluded figures ${route}`);}
 console.log(guardFailures.length ? `T7 BLOCKED by protected existing calculator: ${guardFailures.join('; ')}` : 'T7: four built public HTML pages passed content guards.');
 for(const [route,status] of [['/',200],['/recycling-estimate/',200],['/business-case/',200],['/admin/system/',307]]){const r=await fetch(base+route,{redirect:'manual'});assert.equal(r.status,status);if(status===307)assert.equal(r.headers.get('location'),'/api/auth/microsoft/login/');}
 console.log('T8: baseline statuses preserved (200/200/200/307, Microsoft login redirect).');
 const executablePath=process.env.PV_TEST_BROWSER_PATH || (!fs.existsSync(chromium.executablePath()) && fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome") ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : undefined);
 browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true});fs.mkdirSync('exports/phase2',{recursive:true});
 for(const [width,height] of [[1440,900],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.goto(base+'/solutions/');await page.locator('#overview').waitFor();
  assert.equal(await page.locator('.pv-topnav').getByRole('link',{name:'Business Case',exact:true}).count(),0);
  if(width<760){await page.getByRole('button',{name:'Open account menu',exact:true}).click();assert.equal(await page.locator('.pv-mobile-company').getByRole('link',{name:'Business Case',exact:true}).count(),0);await page.locator('.pv-mobile-company').getByRole('button',{name:'PV Circulator',exact:true}).click();}
  else await page.getByRole('navigation',{name:'Company navigation',exact:true}).getByRole('button',{name:'PV Circulator',exact:true}).click();
  const panel=page.getByRole('navigation',{name:'PV Circulator information',exact:true});await panel.waitFor();assert.deepEqual(await panel.getByRole('link').allTextContents(),['Our Solution','Business Case','PV Circulator','Upcycling','EasyCycle']);
  const link=panel.getByRole('link',{name:'Business Case',exact:true});assert.equal(await link.getAttribute('href'),'/business-case/');await link.hover();await page.locator('.pv-company-content').getByText(/Model the economics of a PV recycling line/).waitFor();await link.focus();await page.locator('.pv-company-content').getByRole('heading',{name:'Business Case',exact:true}).waitFor();await page.screenshot({path:`exports/phase2/navigation-${width}.png`});await link.click();await page.waitForURL(/\/business-case\/$/);await page.locator('.bc-calculator').waitFor();
  // The deck reads prefers-reduced-motion when its timer effect starts, so allow motion before loading the page.
  await page.emulateMedia({reducedMotion:"no-preference"});await page.goto(base+'/solutions/#wave');const deck=page.locator('#wave-deck');await deck.scrollIntoViewIfNeeded();
  // Pointer and focus outside the deck permit its normal auto-advance timer.
  await page.mouse.move(1,1);await page.evaluate(()=>document.activeElement?.blur());
  await page.emulateMedia({reducedMotion:"no-preference"});await deck.locator(".os-slide-stage").scrollIntoViewIfNeeded();
  // Freeze the page clock, then restart the deck timer from a known instant by selecting a slide and moving focus/pointer away.
  await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now())+500));await deck.getByRole('button',{name:'Show slide 2: Retirement volume',exact:true}).click();await page.mouse.move(1,1);await page.evaluate(()=>document.activeElement?.blur());
  const first=await deck.locator('button[aria-pressed=true]').getAttribute('aria-label');await page.clock.fastForward(29999);assert.equal(await deck.locator('button[aria-pressed=true]').getAttribute('aria-label'),first);await page.clock.fastForward(1);await page.waitForFunction(first=>document.querySelector('#wave-deck button[aria-pressed=true]')?.getAttribute('aria-label')!==first,first,{timeout:15000});
  await deck.getByRole('button',{name:'Show slide 2: Retirement volume',exact:true}).click();await page.locator('.os-retirement-chart').waitFor();
  assert.equal(await page.locator('.os-retirement-chart polyline:not(.is-reference)').count(),2);assert.equal(await page.locator('.os-retirement-chart polyline.is-reference').count(),2);
  const selector=deck.getByLabel('EoL lifetime',{exact:true});assert.equal(await selector.inputValue(),'18');
  assert.equal(await deck.getByRole('button',{name:/Show slide/}).count(),3);
  for(const lifetime of [25,18,15,12]){
   await selector.selectOption(String(lifetime));const wave=require('./helpers/market-capacity.cjs')().seedWave;
   const context=deck.locator('.os-retirement-context');assert.ok((await context.innerText()).includes(`${lifetime}-year`));
   for(const loss of ['early','regular'])for(const threshold of [100000,500000,1000000])assert.ok((await context.innerText()).includes(String(wave.crossings[`${loss}_T${lifetime}`][threshold])));
   const source={25:'IRENA 2026',18:'PV Circonomy conservative assumption',15:'Jean, Woodhouse & Bulović',12:'NREL/TP-6A20-74124 p.8'}[lifetime];assert.ok((await context.innerText()).includes(source));
   assert.equal(await deck.locator('polyline.is-reference').count(),lifetime===25?0:2);
   assert.ok((await context.innerText()).includes('Scenario, not a forecast'));
  }
  await selector.selectOption('18');await page.clock.resume();await page.screenshot({path:`exports/phase2/solutions-wave-${width}.png`});
  await page.locator('#regulation').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.pv-dots a[href="#regulation"]')?.getAttribute('aria-current')==='step');await page.screenshot({path:`exports/phase2/solutions-regulation-${width}.png`});
  await page.locator('#silver-trend').scrollIntoViewIfNeeded();await page.screenshot({path:`exports/phase2/solutions-silver-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'solutions overflow');
  await page.goto(base+'/pv-circulator/#routes');await page.locator('#routes').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.pv-dots a[href="#routes"]')?.getAttribute('aria-current')==='step');assert.ok((await page.locator('#routes').innerText()).includes('59,221'));await page.screenshot({path:`exports/phase2/pv-circulator-routes-${width}.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'circulator overflow');assert.deepEqual(errors,[]);await page.close();console.log(`T5/T6/T8: ${width}×${height}, nav order/hover/focus/mobile, SVG series/method, wave auto-advance, active dots, no overflow or JS errors; screenshots saved.`);
 }
assert.deepEqual(guardFailures,[], 'T7 content guards (calculator is off-limits; report existing conflicts)');
}finally{if(browser)await browser.close();server.kill('SIGTERM');fs.closeSync(log);}})().catch(e=>{console.error(e);process.exitCode=1;});
