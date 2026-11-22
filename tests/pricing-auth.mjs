import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {SignJWT} from 'jose';
const signing=randomBytes(48).toString('base64url');const tenant='11111111-1111-4111-8111-111111111111';const base='http://localhost:3106';
const env={...process.env,AUTH_SECRET:signing,MICROSOFT_TENANT_ID:tenant,MICROSOFT_CLIENT_ID:'22222222-2222-4222-8222-222222222222',MICROSOFT_CLIENT_SECRET:'test-only-client-secret',AUTH_ORIGIN:base,GOOGLE_CLIENT_ID:'test-google-client.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'test-google-secret'};delete env.DATABASE_URL;
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--port','3106'],{env,stdio:'ignore'});
try{
 let ready=false;for(let i=0;i<60;i++){try{await fetch(base+'/api/auth/session/');ready=true;break}catch{await new Promise(r=>setTimeout(r,200))}}assert.ok(ready,'test server ready');
 const deliveryGet=await fetch(base+'/api/admin/delivery/');assert.equal(deliveryGet.status,401);assert.equal((await fetch(base+'/api/admin/delivery/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 const get=await fetch(base+'/api/admin/pricing/');assert.equal(get.status,401);
 assert.equal((await fetch(base+'/api/admin/pricing/',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
 async function cookie(extra={}){return 'pv_staff_session='+await new SignJWT({kind:'staff-session',role:'staff',tenant,oid:'test-user',email:'staff@pvcirconomy.com',...extra}).setProtectedHeader({alg:'HS256'}).setIssuer('pv-circonomy').setAudience('pv-staff').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(signing))}
 for(const extra of[{role:'customer'},{tenant:'other'},{email:'staff@evil.com'},{email:'staff@pvcirconomy.com.evil.com'}])assert.equal((await fetch(base+'/api/admin/pricing/',{headers:{Cookie:await cookie(extra)}})).status,401);
 for(const email of['staff@pvcirconomy.com','staff@tsgc.com.tw'])assert.equal((await fetch(base+'/api/auth/session/',{headers:{Cookie:await cookie({email})}}).then(r=>r.json())).user.email,email);
 const staff=await cookie();assert.equal((await fetch(base+'/api/admin/pricing/',{method:'POST',headers:{Cookie:staff,Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
 assert.equal((await fetch(base+'/api/admin/pricing/',{method:'POST',headers:{Cookie:staff,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({rules:{},expectedVersion:tenant})})).status,400);
 const login=await fetch(base+'/api/auth/microsoft/login/',{redirect:'manual'});assert.equal(login.status,307);const location=new URL(login.headers.get('location'));assert.equal(location.hostname,'login.microsoftonline.com');assert.equal(location.searchParams.get('code_challenge_method'),'S256');assert.equal(location.searchParams.get('redirect_uri'),base+'/api/auth/microsoft/callback/');assert.ok(login.headers.get('set-cookie').includes('HttpOnly'));assert.ok(!location.href.includes('test-only-client-secret'));
 const signedIn=await fetch(base+'/api/auth/microsoft/login/',{redirect:'manual',headers:{Cookie:staff}});assert.equal(signedIn.status,307);assert.equal(signedIn.headers.get('location'),base+'/admin/pricing/');
 const callback=await fetch(base+'/api/auth/microsoft/callback/?state=bad&code=bad',{redirect:'manual'});assert.equal(callback.status,307);assert.match(callback.headers.get('location'),/company_login_failed/);assert.ok(!callback.headers.get('set-cookie').includes('pv_staff_session='));

 const googleLogin=await fetch(base+'/api/auth/google/login/',{redirect:'manual'});assert.equal(googleLogin.status,307);const googleLocation=new URL(googleLogin.headers.get('location'));assert.equal(googleLocation.hostname,'accounts.google.com');assert.equal(googleLocation.searchParams.get('code_challenge_method'),'S256');assert.equal(googleLocation.searchParams.get('redirect_uri'),base+'/api/auth/google/callback/');assert.ok(!googleLocation.href.includes('test-google-secret'));
 const badGoogle=await fetch(base+'/api/auth/google/callback/?state=bad&code=bad',{redirect:'manual'});assert.match(badGoogle.headers.get('location'),/google_login_failed/);assert.ok(!badGoogle.headers.get('set-cookie').includes('pv_customer_session='));
 const customer='pv_customer_session='+await new SignJWT({kind:'customer-session',role:'customer',sub:'test-customer',email:'customer@example.com',name:'Customer'}).setProtectedHeader({alg:'HS256'}).setIssuer('pv-circonomy').setAudience('pv-customer').setIssuedAt().setExpirationTime('1h').sign(new TextEncoder().encode(signing));assert.equal((await fetch(base+'/api/auth/session/',{headers:{Cookie:customer}}).then(r=>r.json())).user.role,'customer');for(const resource of ['pricing','orders','delivery','communications'])assert.equal((await fetch(base+'/api/admin/'+resource+'/',{headers:{Cookie:customer}})).status,401);
 assert.equal((await fetch(base+'/api/quotations/email/',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status,503);
 assert.equal((await fetch(base+'/api/pricing/')).status,503);
 console.log('Passed: unauthenticated writes blocked; tenant/domain/customer roles enforced; CSRF and rule validation; Microsoft PKCE redirect and callback state; pricing fails closed without database. No real Microsoft login or database write performed.');
}finally{server.kill('SIGTERM')}
