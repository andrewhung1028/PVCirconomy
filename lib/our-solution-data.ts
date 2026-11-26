import { emptyMarketTransport } from "./our-solution/transport";
import type { SharedParameters } from "./our-solution/shared";
import seed from '../data/our-solution-parameters.json';
import { model, pricePerTonne, type EffectivePrices } from './our-solution/model';
import { validateParameters } from './our-solution/validation';
import { parameterCurrency, scenarioPanelWeightKg, scenarioPanelWeightLb, scenarioRecyclingFeeSteps, solutionCodes, type Parameters } from './our-solution/parameters';
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
  const meta=data.meta?.currency==='JPY'?{...data.meta,locale:data.meta.locale??'ja-JP',localPerUSD:data.meta.localPerUSD??1}:data.meta;
  return {...data,meta,assumptions:{...data.assumptions,'4':section4,'12':section12}};
}
export function validateOurSolutionData(value:unknown):{valid:true;data:Parameters}|{valid:false;errors:string[]} { const errors=validateParameters(value);return errors.length?{valid:false,errors}:{valid:true,data:value as Parameters}; }
export function economicsView(p:Parameters,effective:EffectivePrices={}) {
  const result=model(p,effective),sc=p.scenario;
  const processingFee=Number(p.assumptions[11]['Recovery fee'][0]),processingFeeUnit=String(p.assumptions[11]['Recovery fee'][1]);
  const panelWeightKg=scenarioPanelWeightKg(p),panelWeightLb=scenarioPanelWeightLb(p),feeWeight=processingFeeUnit.endsWith('/kg')?panelWeightKg:panelWeightLb;
  const annualProcessingFeeRevenue=processingFee*result.annualPanels*feeWeight;
  const feeSteps = scenarioRecyclingFeeSteps(p);
  const productMaterials=Object.entries(p.assumptions[5]).map(([name,v])=>{
    const route=p.assumptions[6][name],valueFactor=name==='Silver'?1:Number(route?.[7]??0)*Number(route?.[8]??0);
    return {name,share:Number(v[0]),valueFactor,value:Number(v[0])*pricePerTonne(effective[name]?.price??Number(v[1]),effective[name]?.unit??String(v[2]),p)*valueFactor};
  });
  const totalProductValue=productMaterials.reduce((s,m)=>s+m.value,0);
  const currency=parameterCurrency(p);
  const annualEbitdaThousands=Object.fromEntries(solutionCodes.map(c=>[c,feeSteps.map(f=>(result.solutions[c].ebitda+f*result.annualPanels*feeWeight)/1000)])) as Record<typeof solutionCodes[number],number[]>;
  return {productMaterials:productMaterials.map(m=>({...m,valueShare:totalProductValue?m.value/totalProductValue:0})),thermalSecondaryTreatmentTPerMw:(Number(p.assumptions[5].EVA[0])+Number(p.assumptions[5].Backsheet[0]))*result.kgPerMw/1000,websiteData:websiteDataFromAssumptions(p.assumptions),meta:p.meta,scenario:{regionCode:sc.region_code,region:sc.region,currency,panelsPerMonth:sc.panels_per_month,annualPanels:result.annualPanels,panelWeightKg,panelWeightLb,annualInputMetricTons:result.inputT,operatingDaysPerMonth:result.operatingDays,operatingHoursPerDay:sc.operating_hours_per_day,processingFee,processingFeeUnit,processingFeeUsdPerLb:processingFeeUnit.endsWith('/lb')?processingFee:processingFee*Number(p.assumptions[3]['Kilograms per pound'][0]),annualProcessingFeeRevenue},
    solutions:solutionCodes.map(code=>{const s=result.solutions[code];return {code,label:s.label,annualMaterialRevenue:s.materialRevenue,annualOpex:s.opexTotal,facilityFootprint:{equipmentM2:s.equipmentM2,storageM2:s.storageM2},annualEbitda:s.ebitda,annualEbitdaAtCurrentFee:s.ebitda+annualProcessingFeeRevenue,capexUsd:s.capex,recoveryRate:s.recoveryRate,residualMetricTons:s.residualT,silverUpperPct:s.silverUpperPct,materialRevenue:{silver:s.revenue.silver,aluminumAndCopper:s.revenue.alcu,other:s.revenue.other},opexPerPanel:{electricity:s.opex.electricity/result.annualPanels,laborAndBurden:(s.opex.labor+s.opex.burden)/result.annualPanels,facility:s.opex.facility/result.annualPanels,other:(s.opexTotal-s.opex.electricity-s.opex.labor-s.opex.burden-s.opex.facility)/result.annualPanels,total:s.perPanelOpex}};}),
    cellPowder:result.cellPowder,
    feeSensitivity:{feeSteps,annualEbitdaThousands,feeUsdPerLb:feeSteps,annualEbitdaUsdThousands:annualEbitdaThousands},
    silverSensitivity:{changePercent:(p.assumptions[11]['Silver price change steps'] as number[]).map(v=>v*100),annualEbitdaThousands:Object.fromEntries(solutionCodes.map(c=>[c,result.solutions[c].silverSens.map(v=>v/1000)])) as Record<typeof solutionCodes[number],number[]>,annualEbitdaUsdThousands:Object.fromEntries(solutionCodes.map(c=>[c,result.solutions[c].silverSens.map(v=>v/1000)])) as Record<typeof solutionCodes[number],number[]>},
  };
}
export type EconomicsView=ReturnType<typeof economicsView>;
export type EconomicsDiff = {field:string;label:string;before:string;after:string};
function diffFields(out: EconomicsDiff[], before: unknown, after: unknown, field: string) {
  if (after !== null && typeof after === "object") {
    for (const [key, value] of Object.entries(after)) {
      diffFields(out, (before as Record<string, unknown>)?.[key], value, field ? `${field}.${key}` : key);
    }
  } else if (before !== after) {
    out.push({ field, label: field.replaceAll(".", " · "), before: String(before ?? "—"), after: String(after ?? "—") });
  }
}

export function diffOurSolutionData(before:Parameters|null,after:Parameters,effective:EffectivePrices={}):EconomicsDiff[] {
  const out:EconomicsDiff[]=[];
  const sections = before ? ['scenario','assumptions','capacityHistory','population'] as const : ['scenario','assumptions'] as const;
  for (const key of sections) diffFields(out, before?.[key], after[key], key);
  if (before?.transport || after.transport) {
    diffFields(out, before?.transport ?? emptyMarketTransport(), after.transport ?? emptyMarketTransport(), 'transport');
  }
  if (after.mouPolicy) diffFields(out, before?.mouPolicy, after.mouPolicy, 'mouPolicy');
  const previousPoints = before?.transport?.referencePoints ?? [];
  const nextPoints = after.transport?.referencePoints ?? [];
  for (let index = nextPoints.length; index < previousPoints.length; index++) {
    const { distance, cost } = previousPoints[index];
    diffFields(out, `${distance} / ${cost}`, undefined, `transport.referencePoints.${index}`);
  }
  if (!before || before.meta.localPerUSD !== after.meta.localPerUSD) diffFields(out, before?.meta.localPerUSD, after.meta.localPerUSD, 'meta.localPerUSD');
  const a = before ? model(before,effective) : null;
  const b = model(after,effective);
  for (const code of solutionCodes) for (const key of ['ebitda','recoveryRate','breakevenFeePerLb'] as const) {
    diffFields(out, a?.solutions[code][key], b.solutions[code][key], `Result.${b.solutions[code].label}.${key}`);
  }
  return out;
}

export function diffSharedParameters(before: SharedParameters, after: SharedParameters): EconomicsDiff[] {
  const out: EconomicsDiff[] = [];
  diffFields(out, before, after, "");
  return out;
}
