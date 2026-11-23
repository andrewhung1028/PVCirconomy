import seed from '../data/our-solution-parameters.json';
import { model, pricePerTonne, type EffectivePrices } from './our-solution/model';
import { validateParameters } from './our-solution/validation';
import { solutionCodes, type Parameters } from './our-solution/parameters';
import { normalizedWebsiteAssumptionRows, websiteAssumptionRows, websiteDataFromAssumptions } from './our-solution/public-data';
export { solutionCodes } from './our-solution/parameters';
export type { SolutionCode } from './our-solution/parameters';
export type OurSolutionEconomics = Parameters;
export const seededOurSolutionData = { ...(seed as Parameters), assumptions:{...(seed as Parameters).assumptions,'12':websiteAssumptionRows} } as Parameters;
export function effectiveParameters(value:unknown):Parameters {
  if ((value as Parameters)?.format !== 'parameters-v2') return seededOurSolutionData;
  const data=value as Parameters;
  const section4=Object.fromEntries(Object.entries(data.assumptions?.['4']??{}).filter(([key])=>key!=='Operators per shift').map(([key,row])=>[key,Array.isArray(row)?[...row]:row])) as Parameters['assumptions']['4'];
  const consumables=section4.Consumables;
  // Migrate only the superseded published baseline; preserve any independently edited value.
  if (Array.isArray(consumables)&&Number(consumables[1])===2.5) consumables[1]=1;
  const section12=normalizedWebsiteAssumptionRows(data.assumptions?.['12']);
  const approvedStaffing={
    'methods.shredding.total_staff_per_shift':[5,7],
    'methods.thermal.total_staff_per_shift':[4,5],
  } as const;
  for (const [key,[previous,current]] of Object.entries(approvedStaffing)) {
    const row=section12[key];
    if (row&&Number(row[0])===previous) row[0]=current;
  }
  return {...data,assumptions:{...data.assumptions,'4':section4,'12':section12}};
}
export function validateOurSolutionData(value:unknown):{valid:true;data:Parameters}|{valid:false;errors:string[]} { const errors=validateParameters(value);return errors.length?{valid:false,errors}:{valid:true,data:value as Parameters}; }
export function economicsView(p:Parameters,effective:EffectivePrices={}) {
  const result=model(p,effective),sc=p.scenario;
  const processingFeeUsdPerLb=Number(p.assumptions[11]['Recovery fee'][0]);
  const annualProcessingFeeRevenue=processingFeeUsdPerLb*result.annualPanels*sc.panel_weight_lb;
  const feeSteps=[...new Set([...(p.assumptions[11]['Processing fee steps (USD/lb)'] as number[]),processingFeeUsdPerLb])].sort((a,b)=>a-b);
  const productMaterials=Object.entries(p.assumptions[5]).map(([name,v])=>{
    const route=p.assumptions[6][name],valueFactor=name==='Silver'?1:Number(route?.[7]??0)*Number(route?.[8]??0);
    return {name,share:Number(v[0]),valueFactor,value:Number(v[0])*pricePerTonne(effective[name]?.price??Number(v[1]),effective[name]?.unit??String(v[2]),p)*valueFactor};
  });
  const totalProductValue=productMaterials.reduce((s,m)=>s+m.value,0);
  return {productMaterials:productMaterials.map(m=>({...m,valueShare:totalProductValue?m.value/totalProductValue:0})),thermalSecondaryTreatmentTPerMw:(Number(p.assumptions[5].EVA[0])+Number(p.assumptions[5].Backsheet[0]))*result.kgPerMw/1000,websiteData:websiteDataFromAssumptions(p.assumptions),meta:p.meta,scenario:{regionCode:sc.region_code,region:sc.region,panelsPerMonth:sc.panels_per_month,annualPanels:result.annualPanels,panelWeightLb:sc.panel_weight_lb,annualInputMetricTons:result.inputT,operatingDaysPerMonth:result.operatingDays,operatingHoursPerDay:sc.operating_hours_per_day,processingFeeUsdPerLb,annualProcessingFeeRevenue},
    solutions:solutionCodes.map(code=>{const s=result.solutions[code];return {code,label:s.label,annualMaterialRevenue:s.materialRevenue,annualOpex:s.opexTotal,annualEbitda:s.ebitda,annualEbitdaAtCurrentFee:s.ebitda+annualProcessingFeeRevenue,capexUsd:s.capex,recoveryRate:s.recoveryRate,residualMetricTons:s.residualT,silverUpperPct:s.silverUpperPct,materialRevenue:{silver:s.revenue.silver,aluminumAndCopper:s.revenue.alcu,other:s.revenue.other},opexPerPanel:{electricity:s.opex.electricity/result.annualPanels,laborAndBurden:(s.opex.labor+s.opex.burden)/result.annualPanels,facility:s.opex.facility/result.annualPanels,other:(s.opexTotal-s.opex.electricity-s.opex.labor-s.opex.burden-s.opex.facility)/result.annualPanels,total:s.perPanelOpex}};}),
    cellPowder:result.cellPowder,
    feeSensitivity:{feeUsdPerLb:feeSteps,annualEbitdaUsdThousands:Object.fromEntries(solutionCodes.map(c=>[c,feeSteps.map(f=>(result.solutions[c].ebitda+f*result.annualPanels*sc.panel_weight_lb)/1000)])) as Record<typeof solutionCodes[number],number[]>},
    silverSensitivity:{changePercent:(p.assumptions[11]['Silver price change steps'] as number[]).map(v=>v*100),annualEbitdaUsdThousands:Object.fromEntries(solutionCodes.map(c=>[c,result.solutions[c].silverSens.map(v=>v/1000)])) as Record<typeof solutionCodes[number],number[]>},
  };
}
export type EconomicsView=ReturnType<typeof economicsView>;
export type EconomicsDiff = {field:string;label:string;before:string;after:string};
export function diffOurSolutionData(before:Parameters,after:Parameters,effective:EffectivePrices={}):EconomicsDiff[] {
  const out:EconomicsDiff[]=[];
  const compare=(field:string,a:unknown,b:unknown)=>{if(JSON.stringify(a)!==JSON.stringify(b))out.push({field,label:field.replaceAll('.',' · '),before:String(a??'—'),after:String(b??'—')});};
  const walk=(a:unknown,b:unknown,path:string)=>{if(b!==null&&typeof b==='object'){for(const [k,v]of Object.entries(b))walk((a as Record<string,unknown>)?.[k],v,path?`${path}.${k}`:k);}else compare(path,a,b);};
  for(const k of ['scenario','assumptions','capacityHistory','population'] as const)walk(before[k],after[k],k);
  const a=model(before,effective),b=model(after,effective);
  for(const c of solutionCodes)for(const k of ['ebitda','recoveryRate','breakevenFeePerLb'] as const)compare(`Result.${b.solutions[c].label}.${k}`,a.solutions[c][k],b.solutions[c][k]);
  return out;
}
