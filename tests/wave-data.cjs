const assert=require('node:assert/strict'),wave=require('../data/us-retirement-wave.json');
assert.deepEqual(wave.years,Array.from({length:35},(_,i)=>2016+i));
for(const key of ['early_T18','regular_T18','early_T25','regular_T25','early_T15','regular_T15','early_T12','regular_T12']){assert.equal(wave[key].length,35);assert.ok(wave[key].every(x=>Number.isFinite(x)&&x>=0));}
for(const [threshold,early,regular] of [[100000,2021,2025],[500000,2029,2031],[1000000,2035,2036]]){assert.equal(wave.years[wave.early_T18.findIndex(x=>x>=threshold)],early);assert.equal(wave.years[wave.regular_T18.findIndex(x=>x>=threshold)],regular);}
assert.equal(wave.early_T18[wave.years.indexOf(2030)],629067);assert.equal(wave.regular_T18[wave.years.indexOf(2030)],429602);
console.log('T6 data: 35 years, eight complete series, threshold years and exact 2030 values passed.');
// Render the actual chart function with React, without requiring a browser or changing its source.
const fs=require('node:fs'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const source=ts.createSourceFile('our-solution.tsx',fs.readFileSync('app/components/our-solution.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const chart=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='RetirementLineChart');assert.ok(chart);
const js=ts.transpileModule('export '+chart.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const renderedModule={exports:{}};new Function('require','module','exports','retirementWave',js)(require,renderedModule,renderedModule.exports,wave);
const html=renderToStaticMarkup(React.createElement(renderedModule.exports.RetirementLineChart,{lifetime:18,onLifetimeChange:()=>{}}));
assert.equal((html.match(/<svg\b/g)||[]).length,1);assert.ok(html.includes('role="img"'));const lines=html.match(/<polyline\b[^>]*>/g)||[];assert.equal(lines.length,4);assert.equal(lines.filter(line=>line.includes('is-reference')).length,2);assert.equal(lines.filter(line=>!line.includes('is-reference')).length,2);assert.ok(html.includes('IRENA 2026: 25 yrs'));
for(const label of ['100 kt/yr','1 Mt/yr','Early-loss scenario','Regular-loss scenario','0.63m t','0.43m t'])assert.ok(html.includes(label),label);
console.log('T6 React render: SVG role/series aria, two basis lines, two 25-year references, guide labels and 2030 values passed.');

assert.deepEqual(wave.meta.lifetimes,[25,18,15,12]);
for(const lifetime of wave.meta.lifetimes)for(const loss of ['early','regular'])for(const threshold of [100000,500000,1000000])assert.equal(wave.crossings[`${loss}_T${lifetime}`][threshold],wave.years[wave[`${loss}_T${lifetime}`].findIndex(x=>x>=threshold)]);
const {execFileSync}=require('node:child_process');const before=fs.readFileSync('data/us-retirement-wave.json','utf8');execFileSync('python3',['scripts/wave.py']);assert.equal(fs.readFileSync('data/us-retirement-wave.json','utf8'),before);
console.log('All lifetime thresholds and reproducible model generation passed.');

const context=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='RetirementContext');
const contextJs=ts.transpileModule('export '+context.getText(source),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const contextModule={exports:{}};new Function('require','module','exports','retirementWave',contextJs)(require,contextModule,contextModule.exports,wave);
for(const lifetime of [25,18,15,12]){
 const chartHtml=renderToStaticMarkup(React.createElement(renderedModule.exports.RetirementLineChart,{lifetime,onLifetimeChange:()=>{}}));
 const panelHtml=renderToStaticMarkup(React.createElement(contextModule.exports.RetirementContext,{lifetime}));
 assert.ok(chartHtml.includes(`value="${lifetime}" selected=""`));assert.ok(chartHtml.includes(`${lifetime}-year EoL lifetime`));
 assert.equal((chartHtml.match(/<polyline\b/g)||[]).length,lifetime===25?2:4);
 assert.ok(!chartHtml.includes('NaN'));assert.ok(panelHtml.includes('Scenario, not a forecast'));
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
