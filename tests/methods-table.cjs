// /solutions Methods/Materials tables: existing verified figures stay as-is (AGENTS.md content rules, Andrew t526u).
const assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('app/components/our-solution.tsx','utf8');
{const m=src.match(/.{0,80}(To be confirmed|No operating data).{0,40}/i);assert.equal(m,null,'placeholder: '+(m&&m[0]));}
assert.doesNotMatch(src,/pyroly|熱裂解|burn-off|burned off/i);
const row=label=>{const m=src.match(new RegExp(`\\{ label: "${label}", shredding: "([^"]*)", thermal: "([^"]*)", circulator: "([^"]*)" \\}`));assert.ok(m,label);return m.slice(1);};
assert.deepEqual(row('Footprint'),['~480 m²','160 m²','~30–40 m²']);
assert.deepEqual(row('Energy'),['~5 kWh / panel','—','<1 kWh / panel']);
assert.deepEqual(row('Throughput'),['~50–60 panels / h','~40 panels / h (~90 s per panel)','~60 panels / h']);
assert.deepEqual(row('Staff'),['5 / shift','—','1 direct + 2 indirect']);
assert.deepEqual(row('Secondary treatment'),['~54 t / MW','—','~0.5 t / MW']);
assert.match(src,/92–94% less footprint than shredding/);
assert.doesNotMatch(src,/~57 m²|three machines|hot[- ]knife|熱刀/i);
assert.match(src,/width: "33.3%"/);
assert.match(src,/thermal processing 160/);
assert.match(src,/75–81% less than thermal processing/);
assert.match(src,/~90 s per panel/);
assert.match(fs.readFileSync('AGENTS.md','utf8'),/Existing website content was already verified by Andrew/);
console.log('Methods table: existing figures kept, Thermal processing 160 m² / ~90 s, no "To be confirmed".');

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
