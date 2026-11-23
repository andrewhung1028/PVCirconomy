import { capacityHistory } from './our-solution/model';
import type { Parameters } from './our-solution/parameters';
export type CapacityTrendPoint = { year:string;total:number;totalLabel:string;values:number[] };
export const capacityMarkets=['Europe','United States','Japan','Taiwan','Australia','China','Other markets','World'] as const;
export function capacityTrend(p:Parameters):CapacityTrendPoint[] {
  const cap=capacityHistory(p);
  return Array.from({length:26},(_,i)=>{const y=2025+i,total=cap.World[y];return {year:String(y),total,totalLabel:`${(total/1000).toFixed(1)} TW`,values:capacityMarkets.slice(0,7).map(m=>cap[m][y])};});
}
export function usCumulativeMw(p:Parameters):Map<number,number> {return new Map(Object.entries(capacityHistory(p)['United States']).map(([y,v])=>[Number(y),v*1000]));}
