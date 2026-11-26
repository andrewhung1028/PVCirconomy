import {activePricing} from '../../../server/pricing/store';
import {pricingMarket} from '../../../lib/pricing-rules';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){const market=pricingMarket(new URL(request.url).searchParams.get('market'));try{return Response.json(await activePricing(market),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'pricing_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}}
