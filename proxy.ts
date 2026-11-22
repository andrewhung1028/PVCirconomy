import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from 'jose';
import {canAccess} from './server/auth/roles';
export async function proxy(request:NextRequest) {
  if((process.env.AUTH_SECRET||'').length<32)return new NextResponse('Authentication unavailable',{status:503});
  const token=request.cookies.get('pv_staff_session')?.value;
  if(!token)return NextResponse.redirect(new URL('/api/auth/microsoft/login/',request.url));
  try {
    const {payload:p}=await jwtVerify(token,new TextEncoder().encode(process.env.AUTH_SECRET||''),{algorithms:['HS256'],issuer:'pv-circonomy',audience:'pv-staff'});
    const resource=request.nextUrl.pathname.split('/')[2]||'system';
    if(p.kind!=='staff-session'||p.role!=='staff'||typeof p.oid!=='string'||p.tenant!==process.env.MICROSOFT_TENANT_ID?.toLowerCase()||typeof p.email!=='string'||!canAccess(p.email,resource))return new NextResponse('Forbidden',{status:403});
    return NextResponse.next();
  } catch {return new NextResponse('Unauthorized',{status:401});}
}
export const config={matcher:['/admin/:path*']};
