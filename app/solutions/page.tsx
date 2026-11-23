import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { OurSolution } from '../components/our-solution';
import { activeOurSolutionDataOrSeed } from '../../server/our-solution/store';
import { effectiveMetalPrices } from '../../server/metal-prices/store';
import { economicsView } from '../../lib/our-solution-data';
import { model } from '../../lib/our-solution/model';
import { capacityTrend } from '../../lib/market-capacity';
const manrope=Manrope({subsets:['latin'],weight:['300','800']});
export const metadata:Metadata={title:'Our Solution | PV Circonomy',description:'A connected solar circularity solution for panel owners, recyclers and recovered-material partners.'};
export const dynamic='force-dynamic';
export default async function SolutionsPage(){
  const {data}=await activeOurSolutionDataOrSeed(),prices=await effectiveMetalPrices(data),result=model(data,prices);
  const sc=data.scenario;
  const breakeven={region:sc.region,feeUnit:'USD/lb',currency:'USD',panelsPerMonth:sc.panels_per_month,panelWeightLb:sc.panel_weight_lb,source:'Our Solution parameter master',fees:Object.values(result.solutions).map(s=>({code:s.code,breakevenFee:s.breakevenFeePerLb}))};
  return <div className={manrope.className}><OurSolution economicsData={economicsView(data,prices)} capacityTrend={capacityTrend(data)} retirementWave={result.retirementWave} waveAssumptions={{defaultLifetime:result.defaultLifetime as 25|18|15|12,loss:result.loss,shapes:result.shapes,panelWeightLb:sc.panel_weight_lb,panelRating:Number(data.assumptions[10]['Panel rating'][0]),tonnesPerMw:result.kgPerMw/1000}} pressureData={Object.entries(result.perCapitaKg.World).map(([year])=>({year,values:['World','Europe','United States','Japan','Taiwan','China','Australia'].map(m=>result.perCapitaKg[m][Number(year)])}))} routeMetrics={Object.values(result.solutions).map(s=>({code:s.code,landfillTPerMw:s.residualTPerMw,co2eTPerMw:s.co2eTPerMw}))} breakeven={breakeven} priceSources={Object.entries(prices).map(([metal,v])=>`${metal}: ${v.source}${v.workbookValue ? "" : `, ${v.asOf}`}`).join(' · ')} /></div>;
}
