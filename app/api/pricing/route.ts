import {activePricing} from '../../../server/pricing/store';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{return Response.json(await activePricing(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'pricing_unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}}
