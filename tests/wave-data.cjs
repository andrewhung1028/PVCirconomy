const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const {capacity,wave:model,rows,seedWave:wave}=require('./helpers/market-capacity.cjs')();

// Model rules (t524u). 1) no waste in the installation year; 2) retired capacity is replaced and replacements retire again.
{
 const one=new Map([[2000,100]]);for(let y=2001;y<=2060;y++)one.set(y,100);
 const s=model.retirementSeries(one,18,model.WEIBULL_ALPHA.early);
 assert.equal(s.mass.get(2000),0);assert.equal(s.retiredMw.get(2000),0);assert.ok(s.retiredMw.get(2001)>0);
 const F=(a)=>a<=0?0:1-Math.exp(-((a/18)**model.WEIBULL_ALPHA.early));
 assert.ok(Math.abs(s.retiredMw.get(2001)-100*F(1))<1e-9,'age-1 retirement = F(1)');
 // Flat cumulative after 2000: every year's additions equal its retirements; brute-force recursion check.
 const added={2000:100},retired={};
 for(let t=2001;t<=2060;t++){retired[t]=0;for(let v=2000;v<t;v++)retired[t]+=added[v]*(F(t-v)-F(t-v-1));added[t]=retired[t];}
 for(let t=2001;t<=2060;t++){assert.ok(Math.abs(s.added.get(t)-added[t])<1e-6);assert.ok(Math.abs(s.retiredMw.get(t)-retired[t])<1e-6);}
 const totalRetired=[...s.retiredMw.values()].reduce((a,b)=>a+b,0);assert.ok(totalRetired>100,'replacements retire again');
 const mass=[...s.mass.entries()].find(([y])=>y===2010)[1];let expected=0;for(let v=2000;v<2010;v++)expected+=added[v]*(F(2010-v)-F(2010-v-1))*model.tonnesPerMw(v);assert.ok(Math.abs(mass-expected)<1e-6,'mass uses vintage t/MW');
}

assert.deepEqual(wave.years,Array.from({length:35},(_,i)=>2016+i));
for(const key of ['early_T18','regular_T18','early_T25','regular_T25','early_T15','regular_T15','early_T12','regular_T12']){assert.equal(wave[key].length,35);assert.ok(wave[key].every(x=>Number.isFinite(x)&&x>=0));}
for(const [threshold,early,regular] of [[100000,2023,2027],[500000,2030,2033],[1000000,2034,2037]]){assert.equal(wave.crossings.early_T18[threshold],early);assert.equal(wave.crossings.regular_T18[threshold],regular);}
assert.equal(wave.early_T18[wave.years.indexOf(2030)],576583);assert.equal(wave.regular_T18[wave.years.indexOf(2030)],281800);
assert.deepEqual(model.LIFETIMES,[25,18,15,12]);assert.equal(model.DEFAULT_LIFETIME,18);assert.deepEqual(model.WEIBULL_ALPHA,{regular:5.3759,early:2.4928});
for(const lifetime of model.LIFETIMES)for(const loss of ['early','regular'])for(const threshold of [100000,500000,1000000]){const i=wave[`${loss}_T${lifetime}`].findIndex(x=>x>=threshold);if(wave.years[i]>2016)assert.equal(wave.crossings[`${loss}_T${lifetime}`][threshold],wave.years[i]);}
console.log('T6 data: model rules (age ≥ 1, replacement recursion), Capacity History seed, 35 years × 8 series, thresholds and pinned 2030 values passed.');

// Render the actual chart and panel functions with React.
const source=ts.createSourceFile('our-solution.tsx',fs.readFileSync('app/components/our-solution.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const sourceText=source.getFullText();
assert.match(sourceText,/const barGap = 0;/);assert.ok(sourceText.includes('NREL/TP-6A20-74124, p. 8 (PDF p. 19)'));assert.ok(sourceText.includes('an intermediate modeled case between 12 and 25 years'));
const compile=name=>{const node=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.ok(node,name);const js=ts.transpileModule('export '+node.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;const m={exports:{}};new Function('require','module','exports','defaultWaveAssumptions',js)(require,m,m.exports,{defaultLifetime:18,loss:'early',shapes:model.WEIBULL_ALPHA,panelWeightLb:45,panelRating:350,tonnesPerMw:model.tonnesPerMw()});return m.exports[name];};
const Chart=compile('RetirementLineChart'),Context=compile('RetirementContext');
const html=renderToStaticMarkup(React.createElement(Chart,{lifetime:18,onLifetimeChange:()=>{},wave}));
assert.equal((html.match(/<svg\b/g)||[]).length,1);assert.ok(html.includes('role="img"'));const lines=html.match(/<polyline\b[^>]*>/g)||[];assert.equal(lines.length,4);assert.equal(lines.filter(line=>line.includes('is-reference')).length,2);
for(const label of ['100 kt/yr','1 Mt/yr','Early-loss scenario','Regular-loss scenario','0.58m t','0.28m t'])assert.ok(html.includes(label),label);
for(const lifetime of [25,18,15,12]){
 const chartHtml=renderToStaticMarkup(React.createElement(Chart,{lifetime,onLifetimeChange:()=>{},wave}));
 const panelHtml=renderToStaticMarkup(React.createElement(Context,{lifetime,wave}));
 assert.ok(chartHtml.includes(`value="${lifetime}" selected=""`));assert.ok(chartHtml.includes(`${lifetime}-year EoL lifetime`));
 assert.equal((chartHtml.match(/<polyline\b/g)||[]).length,lifetime===25?2:4);
 assert.ok(!chartHtml.includes('NaN'));
 // Every plotted point stays inside the chart area (dynamic ceiling).
 for(const pts of chartHtml.match(/points="[^"]*"/g))for(const pair of pts.slice(8,-1).split(' ')){const y=Number(pair.split(',')[1]);assert.ok(y>=22&&y<=202,`y ${y} for T${lifetime}`);}
 assert.ok(panelHtml.includes('Scenario, not a forecast'));assert.ok(panelHtml.includes('Default: 18-year lifetime, IRENA early-loss scenario'));assert.ok(panelHtml.includes('Early loss (main)'));assert.ok(chartHtml.includes('class="is-early is-main"'));assert.ok(chartHtml.includes('IRENA early-loss scenario'));assert.ok(!panelHtml.includes('held at the 2025 level'));
 assert.ok(panelHtml.includes('no waste in the year they are installed'));assert.ok(panelHtml.includes('Retired panels are replaced'));
 for(const loss of ['early','regular'])for(const threshold of [100000,500000,1000000])assert.ok(panelHtml.includes(String(wave.crossings[`${loss}_T${lifetime}`][threshold])));
}
// Execute StoryDeck's actual timer effect with fake time and visibility.
const deck=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='StoryDeck');
const timerEffect=deck.body.statements.find(node=>ts.isExpressionStatement(node)&&node.expression.expression?.getText(source)==='useEffect'&&node.getText(source).includes('window.setTimeout'));
assert.ok(timerEffect);let elapsed=0,pending=null,current=0,cleared=false;
const fakeWindow={matchMedia:()=>({matches:false}),setTimeout:(fn,ms)=>{pending={fn,at:elapsed+ms};return 1},clearTimeout:()=>{pending=null;cleared=true}};
const effectJs=ts.transpileModule(timerEffect.getText(source),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
let cleanup;new Function('useEffect','autoAdvanceMs','isPaused','isVisible','window','document','setCurrent','slides','current',effectJs)(fn=>{cleanup=fn()},30000,false,true,fakeWindow,{visibilityState:'visible'},fn=>{current=fn(current)},[1,2,3],0);
elapsed=29999;assert.equal(current,0);assert.equal(pending.at,30000);elapsed++;pending.fn();assert.equal(current,1);cleanup();assert.ok(cleared);
assert.match(fs.readFileSync('app/components/our-solution.tsx','utf8'),/slides=\{waveSlides\} variant="split" autoAdvanceMs=\{30000\}/);
console.log('All four React chart/control/panel renders and actual 30-second timer effect passed.');
