import { activeOurSolutionDataOrSeed } from '../../../../server/our-solution/store';
import { refreshMetalPrices } from '../../../../server/metal-prices/service';
import { metalPriceStore } from '../../../../server/metal-prices/store';
export const runtime='nodejs';
export const maxDuration=60;
export async function GET(request:Request){
  if(process.env.CRON_SECRET&&request.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return Response.json({error:'unauthorized'},{status:401});
  try{const {data}=await activeOurSolutionDataOrSeed();return Response.json(await refreshMetalPrices(data,metalPriceStore));}
  catch{return Response.json({error:'metal_prices_unavailable'},{status:503});}
}
