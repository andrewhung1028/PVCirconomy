// /solutions Methods/Materials tables: existing verified figures stay as-is (AGENTS.md content rules, Andrew t526u).
const assert=require('node:assert/strict'),fs=require('node:fs');
require('./helpers/typescript.cjs');
const src=fs.readFileSync('app/components/our-solution.tsx','utf8');
const {websiteDataDefaults:data}=require('../lib/our-solution/public-data.ts');
{const m=src.match(/.{0,80}(To be confirmed|No operating data).{0,40}/i);assert.equal(m,null,'placeholder: '+(m&&m[0]));}
assert.doesNotMatch(src,/pyroly|熱裂解|burn-off|burned off/i);
assert.doesNotMatch(src,/label: "Process"/,'Methods comparison tables should not include a Process row');
assert.equal(data['methods.shredding.footprint_m2'].value,480);
assert.equal(data['methods.thermal.footprint_m2'].value,160);
assert.equal(data['methods.circulator.footprint_min_m2'].value,30);
assert.equal(data['methods.circulator.footprint_max_m2'].value,40);
assert.equal(data['methods.shredding.secondary_treatment_t_per_mw'].value,54);
assert.equal(data['methods.circulator.secondary_treatment_t_per_mw'].value,.5);
assert.match(src,/function technologyRows\(data:OurSolutionView\)/);
assert.match(src,/function materialRows\(data:OurSolutionView\)/);
assert.match(src,/reduction\(shredding,pvMax\)/);
assert.doesNotMatch(src,/~57 m²|three machines|hot[- ]knife|熱刀/i);
assert.doesNotMatch(src,/shredding: "~480 m²"|"~54 t \/ MW"/);
assert.match(fs.readFileSync('AGENTS.md','utf8'),/Existing website content was already verified by Andrew/);
console.log('Methods table: values come from published Website Data; no hard-coded comparison figures or Process row.');

// Check server-rendered visible text without browser automation or a database.
(async()=>{
 const {spawn}=require('node:child_process');
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3198'],{env:{...process.env,DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
 let output='';server.stdout.on('data',v=>output+=v);server.stderr.on('data',v=>output+=v);
 try {
  let ready=false;
  for(let i=0;i<100;i++){
   if(server.exitCode!==null)throw Error(output);
   try{const r=await fetch('http://127.0.0.1:3198/solutions/');if(r.ok){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,200));
  }
  assert.ok(ready,'production server ready: '+output);
  for(const route of ['/solutions/','/pv-circulator/']){
   const response=await fetch('http://127.0.0.1:3198'+route);assert.equal(response.status,200,route);
   const html=await response.text();
   const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<!--[^]*?-->/g,'').replace(/<[^>]*>/g,' ');
   assert.doesNotMatch(visible,/hot[- ]knife|熱刀/i,route+' visible text');
   assert.match(visible,/Thermal processing/,route+' renamed label');
  }
  console.log('Rendered /solutions/ and /pv-circulator/: no old visible names.');
 }finally{server.kill();await new Promise(resolve=>server.exitCode!==null?resolve():server.once('exit',resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
