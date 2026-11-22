import {customerCookie,googleStateCookie} from '../../../../server/auth/google';
import {NextResponse} from 'next/server';
import {cookieOptions,sessionCookie,trustedOrigin} from '../../../../server/auth/microsoft';
export const runtime='nodejs';export async function POST(request:Request){if(!trustedOrigin(request))return NextResponse.json({error:'invalid_origin'},{status:403});const r=NextResponse.json({ok:true});r.cookies.set(sessionCookie,'',{...cookieOptions,maxAge:0});r.cookies.set(customerCookie,'',{...cookieOptions,maxAge:0});r.cookies.set(googleStateCookie,'',{...cookieOptions,maxAge:0});r.headers.set('Cache-Control','no-store');return r;}
