import {NextRequest, NextResponse} from 'next/server';
import {jwtVerify} from 'jose';
import {canAccess} from './server/auth/roles';
import { localizedPublicPath, publicSolutionMarkets } from './lib/our-solution/market';
import { parsePublicPreference, publicMarketFromCountry, publicPreferenceCookie } from './lib/our-solution/public-preference';

function publicDefaults(request: NextRequest) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return NextResponse.next();
  const url = request.nextUrl.clone();
  if (publicSolutionMarkets.some(market => market === url.searchParams.get('market'))) return NextResponse.next();
  const preference = parsePublicPreference(request.cookies.get(publicPreferenceCookie)?.value);
  const country = request.headers.get('x-vercel-ip-country');
  const japanesePath = url.pathname.startsWith('/ja/');
  const localizedPath = japanesePath || url.pathname.startsWith('/zh/');
  const market = preference?.market ?? (country ? publicMarketFromCountry(country) : japanesePath ? 'JP' : 'US');
  const locale = preference?.locale ?? (country?.toUpperCase() === 'JP' ? 'ja-JP' : 'en-US');
  if (url.pathname === '/') {
    if (locale === 'en-US' && market === 'US') return NextResponse.next();
    url.pathname = localizedPublicPath(locale, '/solutions/');
  } else if (!localizedPath && locale !== 'en-US') {
    url.pathname = localizedPublicPath(locale, url.pathname as `/${string}`);
  } else if (market === (japanesePath ? 'JP' : 'US')) {
    return NextResponse.next();
  }
  url.searchParams.set('market', market);
  return NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function proxy(request:NextRequest) {
  if (request.nextUrl.pathname !== '/admin' && !request.nextUrl.pathname.startsWith('/admin/')) return publicDefaults(request);
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
export const config={matcher:[
  '/admin/:path*',
  '/',
  '/:page(solutions|pv-circulator|business-case|support|easycycle|material-upcycling)',
  '/:locale(ja|zh)/:page(solutions|pv-circulator|business-case|support|easycycle|material-upcycling)',
]};
