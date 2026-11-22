import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {SignJWT} from 'jose';
const base='http://localhost:3117',secret=randomBytes(48).toString('base64url'),tenant='11111111-1111-4111-8111-111111111111';
const env={...process.env,AUTH_SECRET:secret,MICROSOFT_TENANT_ID:tenant,MICROSOFT_CLIENT_ID:'22222222-2222-4222-8222-222222222222',MICROSOFT_CLIENT_SECRET:'local-test-only',AUTH_ORIGIN:base,MICROSOFT_MAIL_ENABLED:'false'};delete env.DATABASE_URL;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3117'],{env,stdio:'ignore'});
let checks=0;const check=(actual,expected,label)=>{assert.equal(actual,expected,label);checks++;};
async function cookie(email){return 'pv_staff_session='+await new SignJWT({kind:'staff-session',role:'staff',tenant,oid:'local-test',email}).setProtectedHeader({alg:'HS256'}).setIssuer('pv-circonomy').setAudience('pv-staff').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(secret));}
try{let ready=false;for(let i=0;i<100;i++){try{await fetch(base+'/api/auth/session/');ready=true;break;}catch{await new Promise(r=>setTimeout(r,100));}}assert.ok(ready);
 const resources=['pricing','delivery','communications','our-solution-data','our-solution-data/import','our-solution-data/export','business-case-data','business-case-data/import','business-case-data/export','orders','quotations'];
 for(const email of ['ANDREW@TSGC.COM.TW','terry.ko@pvcirconomy.com','emily.cheng@tsgc.com.tw','emily.cheng@pvcirconomy.com','other@tsgc.com.tw']){
 const Cookie=await cookie(email),admin=email.startsWith('ANDREW'),viewer=!admin&&!email.startsWith('other');
 for(const resource of resources){const method=resource.endsWith('/import')?'POST':'GET';const allowed=admin||(viewer&&['orders','quotations'].includes(resource));const r=await fetch(base+'/api/admin/'+resource+'/',{method,headers:{Cookie,Origin:base}});if(allowed){assert.ok(![401,403].includes(r.status),`${email} ${resource} ${r.status}`);checks++;}else check(r.status,403,email+' '+resource);
 if(!resource.includes('/')&&resource!=='quotations'){const w=await fetch(base+'/api/admin/'+resource+'/',{method:'POST',headers:{Cookie,Origin:base,'Content-Type':'application/json'},body:'{}'});if(admin){assert.ok(![401,403].includes(w.status));checks++;}else check(w.status,403,email+' POST '+resource);}}
 for(const page of ['system','pricing','delivery','orders','quotations'])check((await fetch(base+'/admin/'+page+'/',{headers:{Cookie},redirect:'manual'})).status,admin||(viewer&&['orders','quotations'].includes(page))?200:403,email+' page '+page);
 }
 check((await fetch(base+'/api/admin/business-case-data/')).status,401);
 check((await fetch(base+'/business-case/')).status,200);const page=await fetch(base+'/business-case/').then(r=>r.text());assert.ok(page.includes('Built-in fallback'));checks++;
 const data=await fetch(base+'/api/calculator-data/').then(r=>r.json());check(data.source,'Built-in fallback');const input={regionCode:'US-CA',panelsPerMonth:1000,processingFee:.2,solutionCodes:['PVCIRCULATOR','CONVENTIONAL']};
 const calculation=await fetch(base+'/api/calculate/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});check(calculation.status,200);const result=(await calculation.json()).result;assert.ok(result.solutions.length===2);checks++;
 for(const invalid of [{...input,solutionCodes:['MISSING']},{...input,panelsPerMonth:-1},{...input,panelWeightLb:-1},{...input,regionCode:'UNKNOWN'}])check((await fetch(base+'/api/calculate/',{method:'POST',body:JSON.stringify(invalid)})).status,400);
 check((await fetch(base+'/api/follow-up/',{method:'POST',body:'{}'})).status,400);
 check((await fetch(base+'/api/follow-up/',{method:'POST',body:JSON.stringify({name:'Local Test',email:'test@example.com',result})})).status,503);
 console.log(`Passed: ${checks} local HTTP role/page/API/calculator/follow-up checks; no database credentials or external mail calls.`);
}finally{server.kill('SIGTERM');}
