import type {CalcInput,MasterData} from './types';
import {isSupportedCountry} from './supported-countries';
/** Select validated inputs only; never trust client-supplied totals or assumptions. */
export function calculationInput(value:unknown,data:MasterData):CalcInput {
 if(!value||typeof value!=='object')throw Error('Invalid input');const v=value as Record<string,unknown>;
 const region=data.regions.find(r=>r.code===v.regionCode&&r.active);
 if(!region||!isSupportedCountry(region.countryCode))throw Error('Calculations are not available for this region.');
 const panels=Number(v.panelsPerMonth),fee=Number(v.processingFee),weight=v.panelWeightLb===undefined?undefined:Number(v.panelWeightLb);
 if(v.panelsPerMonth===null||v.processingFee===null||!Number.isFinite(panels)||panels<0||!Number.isFinite(fee)||fee<0||(weight!==undefined&&(!Number.isFinite(weight)||weight<=0))||!Array.isArray(v.solutionCodes)||!v.solutionCodes.length||v.solutionCodes.length>data.solutions.length||new Set(v.solutionCodes).size!==v.solutionCodes.length||v.solutionCodes.some(code=>typeof code!=='string'||!data.solutions.some(s=>s.code===code&&s.active)))throw Error('Invalid input');
 return {regionCode:region.code,panelsPerMonth:panels,processingFee:fee,solutionCodes:v.solutionCodes as string[],...(weight===undefined?{}:{panelWeightLb:weight})};
}
