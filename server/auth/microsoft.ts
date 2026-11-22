import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';
import { cookies } from 'next/headers';
export const staffDomains=['pvcirconomy.com','tsgc.com.tw'];
export function companyEmail(email:string){return staffDomains.includes(email.toLowerCase().split('@')[1]||'')}
export const authPath='/api/auth';
export const sessionCookie='pv_staff_session';
export const stateCookie='pv_microsoft_state';
export const cookieOptions={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/'};
export function authConfig(){const tenant=(process.env.MICROSOFT_TENANT_ID||'').toLowerCase();const client=(process.env.MICROSOFT_CLIENT_ID||'').toLowerCase();const secret=process.env.MICROSOFT_CLIENT_SECRET||'';const signing=process.env.AUTH_SECRET||'';if(!/^[\da-f-]{36}$/i.test(tenant)||!/^[\da-f-]{36}$/i.test(client)||!secret||signing.length<32)return null;return {tenant,client,secret,key:new TextEncoder().encode(signing),origin:process.env.AUTH_ORIGIN||'https://www.pvcirconomy.com'};}
export async function sign(payload:Record<string,unknown>,kind:string,expires:string){const c=authConfig();if(!c)throw Error('auth_not_configured');return new SignJWT({...payload,kind}).setProtectedHeader({alg:'HS256'}).setIssuer('pv-circonomy').setAudience('pv-staff').setIssuedAt().setExpirationTime(expires).sign(c.key)}
export async function verify(token:string,kind:string){const c=authConfig();if(!c)return null;try{const {payload}=await jwtVerify(token,c.key,{algorithms:['HS256'],issuer:'pv-circonomy',audience:'pv-staff'});return payload.kind===kind?payload:null}catch{return null}}
export async function staffSession(){const token=(await cookies()).get(sessionCookie)?.value;if(!token)return null;const p=await verify(token,'staff-session');const c=authConfig();if(!p||!c||p.tenant!==c.tenant||p.role!=='staff'||typeof p.oid!=='string'||typeof p.email!=='string'||!companyEmail(p.email))return null;return {oid:p.oid,email:p.email,name:typeof p.name==='string'?p.name:p.email};}
export function trustedOrigin(request:Request){const c=authConfig();try{return !!c&&new URL(request.headers.get('origin')||'').origin===new URL(c.origin).origin}catch{return false}}
const microsoftKeys=createRemoteJWKSet(new URL('https://login.microsoftonline.com/common/discovery/v2.0/keys'));
export async function microsoftIdentity(token:string,nonce:string){const c=authConfig();if(!c)throw Error('auth_not_configured');const {payload:p}=await jwtVerify(token,microsoftKeys,{issuer:`https://login.microsoftonline.com/${c.tenant}/v2.0`,audience:c.client,algorithms:['RS256']});const email=typeof p.preferred_username==='string'?p.preferred_username:typeof p.email==='string'?p.email:'';if(p.nonce!==nonce||p.tid!==c.tenant||typeof p.oid!=='string'||!companyEmail(email))throw Error('company_access_required');return {tenant:c.tenant,oid:p.oid,email:email.toLowerCase(),name:typeof p.name==='string'?p.name:email,role:'staff'};}
