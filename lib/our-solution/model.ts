import { economicRecovery, standardRecoveryRates } from "../circulator-recovery";
import { labels, localPerUSD, markets, parameter as n, parameterCurrency, scenarioPanelWeightKg, scenarioPanelWeightLb, solutionCodes, type Parameters } from './parameters';
import { retirementThresholds, websiteDataFromAssumptions, websiteNumber } from './public-data';
import { retirementSeries, computeRetirementWave } from '../us-retirement-wave';
export type EffectivePrice = { price: number; unit: string; source: string; asOf: string; workbookValue?:boolean };
export type EffectivePrices = Record<string, EffectivePrice>;
const unitCurrency=(unit:string)=>unit==='N/A'?'':unit.split('/')[0].toUpperCase();
const unitSuffix=(unit:string)=>unit.includes('/')?unit.slice(unit.indexOf('/')):'';
function localMoney(value:number,unit:string,p:Parameters){const from=unitCurrency(unit);if(!from||from===parameterCurrency(p))return value;if(from==='USD')return value*localPerUSD(p);throw Error(`Unsupported ${from} to ${parameterCurrency(p)} conversion`);}
export function pricePerTonne(price: number, unit: string, p: Parameters) {
  if(unit==='N/A')return 0;const local=localMoney(price,unit,p),suffix=unitSuffix(unit);
  return suffix==='/troy oz' ? local * 1e6 / n(p,9,'Grams per troy ounce') : suffix==='/lb' ? local * n(p,3,'Pounds per metric ton') : suffix==='/kg' ? local*1000 : local;
}
export function capacityHistory(p: Parameters) {
  const cap: Record<string, Record<number, number>> = structuredClone(p.capacityHistory);
  for (const m of markets) for (let y=2025;y<2050;y++) cap[m][y] = cap[m][2024] * (cap[m][2050] / cap[m][2024]) ** ((y-2024)/26);
  cap['Other markets'] = {};
  for(let y=2000;y<=2050;y++) cap['Other markets'][y] = cap.World[y] - markets.slice(1).reduce((s,m)=>s+cap[m][y],0);
  return cap;
}
export function model(p: Parameters, effective: EffectivePrices = {}, options: { circulatorLines?: number; economic?: boolean } = {}) {
  const websiteData=websiteDataFromAssumptions(p.assumptions);
  const gridKgCo2ePerKwh=websiteNumber(websiteData,'impact.grid_kg_co2e_per_kwh');
  const sc=p.scenario, panelWeightKg=scenarioPanelWeightKg(p),panelWeightLb=scenarioPanelWeightLb(p),annualPanels=sc.panels_per_month*12, inputT=annualPanels*panelWeightKg/1000;
  const operatingDays=sc.working_weeks_per_year*sc.working_days_per_week/12;
  const panelsPerMw=1e6/n(p,10,'Panel rating'), kgPerMw=panelWeightKg*panelsPerMw;
  const materials=Object.entries(p.assumptions[5]).map(([name,v])=>({name,share:v[0] as number, price:effective[name]?.price ?? v[1] as number, unit:effective[name]?.unit ?? v[2] as string, source:effective[name]?.source ?? v[3] as string}));
  const material=(name:string)=>materials.find(m=>m.name===name)!;
  const streamNames: Record<string,string> = {'Glass':'Glass','Aluminium frame':'Aluminium','Junction box + cable':'Junction box','EVA':'EVA','Backsheet':'Backsheet','Silicon cell':'Silicon','Copper ribbon':'Copper','Other':'Residual / mixed fraction'};
  const solutions=Object.fromEntries(solutionCodes.map((code,i)=>{
    const s=(label:string)=>n(p,4,label,i);
    const staffPrefix=code==='SHREDDING'?'methods.shredding':code==='HOT_KNIFE'?'methods.thermal':'methods.circulator';
    const staffPerShift=websiteNumber(websiteData,`${staffPrefix}.total_staff_per_shift`);
    const shifts=Math.max(1,Math.ceil(sc.panels_per_month/(s('Capacity')*sc.operating_hours_per_day*operatingDays)));
    const requiredLines=Math.max(1,Math.ceil(shifts/n(p,3,'Shifts per equipment line (limit)')));
    const lines=code==='PVCIRCULATOR'?Math.max(requiredLines,options.circulatorLines??0):requiredLines;
    const labor=staffPerShift*n(p,1,'Hourly wage')*sc.operating_hours_per_day*operatingDays*12*shifts;
    const burden=labor*(n(p,2,'Labor burden')+n(p,2,"Workers' compensation"));
    const storageM2=Math.ceil(annualPanels/sc.working_weeks_per_year*n(p,7,'Storage time')/n(p,7,'Panels per pallet'))*n(p,7,'Pallet footprint')*(1+n(p,7,'Aisle space added per pallet'))/n(p,7,'Pallet stack levels');
    const equipmentM2=s('Equipment space per line')*lines;
    const standardRates = code === 'PVCIRCULATOR' && !options.economic
      ? standardRecoveryRates(materials.map(m => ({ ...m, rate: n(p, 6, m.name, i * 3) }))) : undefined;
    const rows=materials.map(m=>{const recovery=code === 'PVCIRCULATOR' && options.economic
      ? economicRecovery(m.name) : standardRates?.get(m.name) ?? n(p,6,m.name,i*3);
      const realization=n(p,6,m.name,i*3+1),saleable=n(p,6,m.name,i*3+2);const input=inputT*m.share,recovered=input*recovery;return {...m,inputT:input,recoveredT:recovered,residualT:input-recovered,revenue:recovered*pricePerTonne(m.price,m.unit,p)*realization*saleable};});
    const revenue={silver:0,alcu:0,other:0};
    for(const m of rows) revenue[m.name==='Silver'?'silver':['Aluminium','Copper'].includes(m.name)?'alcu':'other']+=m.revenue;
    const residualT=rows.reduce((s,m)=>s+m.residualT,0),recoveredT=rows.reduce((s,m)=>s+m.recoveredT,0);
    const rentUnit=String(p.assumptions[1]['Base rent'][1]),rentRate=n(p,1,'Base rent')+n(p,1,'CAM'),areaM2=equipmentM2+storageM2;
    const facility=rentUnit.endsWith('/sq.m./month')?areaM2*rentRate*12:rentUnit.endsWith('/sq.m./year')?areaM2*rentRate:areaM2*n(p,3,'Square feet per square metre')*rentRate;
    const landfillUnit=String(p.assumptions[1]['Landfill cost'][1]),secondary=residualT*n(p,1,'Landfill cost')*(landfillUnit.endsWith('/short ton')?n(p,3,'Short tons per metric ton'):1);
    const opex={labor,burden,facility,electricity:annualPanels*s('Electricity')*n(p,1,'Electricity price'),consumables:annualPanels*s('Consumables'),maintenance:s('Capex per line')*lines*s('Maintenance'),packaging:annualPanels*n(p,2,'Packaging'),handling:n(p,2,'Forklift / handling'),insurance:n(p,2,'Insurance and compliance'),admin:n(p,2,'Facility utilities / admin'),secondary};
    const opexTotal=Object.values(opex).reduce((a,b)=>a+b,0),materialRevenue=Object.values(revenue).reduce((a,b)=>a+b,0),ebitda=materialRevenue-opexTotal;
    const flagged=Object.entries(p.assumptions[8]).reduce((sum,[label,v])=>sum+material(streamNames[label]).share*(v[i] as number),0);
    const feeUnit=String(p.assumptions[11]['Recovery fee'][1]),feeWeight=feeUnit.endsWith('/kg')?panelWeightKg:panelWeightLb;
    const perPanel={materialRevenue:materialRevenue/annualPanels,opex:opexTotal/annualPanels,ebitda:ebitda/annualPanels,residualT:residualT/annualPanels,processingRevenue:n(p,11,'Recovery fee')*feeWeight};
    const perMw=Object.fromEntries(Object.entries(perPanel).map(([k,v])=>[k,v*panelsPerMw]));
    return [code,{perPanel,perMw,code,label:labels[i],shifts,lines,storageM2,equipmentM2,opex,opexTotal,revenue,materialRevenue,ebitda,capex:s('Capex per line')*lines,recoveredT,residualT,recoveryRate:recoveredT/inputT,materials:rows,
      feeSens:(p.assumptions[11]['Processing fee steps']??p.assumptions[11]['Processing fee steps (USD/lb)']).map(f=>ebitda+(f as number)*annualPanels*feeWeight),silverSens:p.assumptions[11]['Silver price change steps'].map(c=>ebitda+(c as number)*revenue.silver),breakevenFee:Math.max(0,-ebitda/(annualPanels*feeWeight)),breakevenFeePerLb:feeUnit.endsWith('/lb')?Math.max(0,-ebitda/(annualPanels*feeWeight)):Math.max(0,-ebitda/(annualPanels*feeWeight))*n(p,3,'Kilograms per pound'),feeUnit,perPanelOpex:opexTotal/annualPanels,residualTPerMw:residualT/annualPanels*panelsPerMw,kwh:s('Electricity'),co2eTPerMw:s('Electricity')*panelsPerMw*gridKgCo2ePerKwh/1000,silverUpperPct:material('Silver').share/(flagged+material('Silver').share)*100}];
  })) as unknown as Record<typeof solutionCodes[number], {code:typeof solutionCodes[number];label:string;perPanel:{materialRevenue:number;opex:number;ebitda:number;residualT:number;processingRevenue:number};perMw:Record<string,number>;shifts:number;lines:number;storageM2:number;equipmentM2:number;opex:Record<string,number>;opexTotal:number;revenue:{silver:number;alcu:number;other:number};materialRevenue:number;ebitda:number;capex:number;recoveredT:number;residualT:number;recoveryRate:number;materials: {name:string;share:number;price:number;unit:string;source:string;inputT:number;recoveredT:number;residualT:number;revenue:number}[];feeSens:number[];silverSens:number[];breakevenFee:number;breakevenFeePerLb:number;feeUnit:string;perPanelOpex:number;residualTPerMw:number;kwh:number;co2eTPerMw:number;silverUpperPct:number}>;
  const powderMaterials = solutions.PVCIRCULATOR.materials;
  const ag=powderMaterials.find(m => m.name === 'Silver')!.recoveredT,si=powderMaterials.find(m => m.name === 'Silicon')!.recoveredT,agp=pricePerTonne(material('Silver').price,material('Silver').unit,p),sip=pricePerTonne(material('Silicon').price,material('Silicon').unit,p);
  const cp=(l:string)=>n(p,9,l),MAg=cp('Molar mass Ag'),MCu=cp('Molar mass Cu'),MAl=cp('Molar mass Al');
  const reagentsT={h2so4:ag*cp('Molar mass H2SO4')/(2*MAg),h2o2:ag*cp('Molar mass H2O2')/(2*MAg)*(1+cp('H2O2 excess over stoichiometric')),cu:ag*MCu/(2*MAg),al:ag*MCu/(2*MAg)*2*MAl/(3*MCu),hno3:ag*4*cp('Molar mass HNO3')/(3*MAg)};
  const reagentCost=reagentsT.h2so4/cp('Sulfuric acid concentration')*cp('Sulfuric acid price')+reagentsT.h2o2/cp('Hydrogen peroxide concentration')*cp('Hydrogen peroxide price')+reagentsT.hno3/cp('Nitric acid concentration')*cp('Nitric acid price')+reagentsT.cu*pricePerTonne(material('Copper').price,material('Copper').unit,p)+reagentsT.al*pricePerTonne(material('Aluminium').price,material('Aluminium').unit,p);
  const electroKwh=ag*1e6/MAg*cp('Faraday constant')/3600/cp('Electrorefining current efficiency')*cp('Electrorefining cell voltage')/1000,electroCost=electroKwh*n(p,1,'Electricity price');
  const scenario2Revenue=(ag*cp('Silver recovery in refining')*agp+si*cp('Silicon recovery in refining')*sip)*cp('Realization of 99% silver and 99% silicon');
  const directSaleRealization = { silver: n(p,6,'Silver',7), silicon: n(p,6,'Silicon',7) };
  const directSaleRevenue = ag * agp * directSaleRealization.silver + si * sip * directSaleRealization.silicon;
  const cellPowder={silverT:ag,siliconT:si,powderT:ag+si,directSaleRealization,scenario1:directSaleRevenue,scenario2Revenue,reagentCost,electroKwh,electroCost,scenario2Net:scenario2Revenue-reagentCost-electroCost,reagentsT,silverPurity:cp('Silver product purity'),siliconPurity:cp('Silicon product purity')};
  const capacity=capacityHistory(p),T=n(p,10,'Average lifetime T'),shapes={early:n(p,10,'Shape, early-loss'),regular:n(p,10,'Shape, regular-loss')},loss: 'early'|'regular'=String(p.assumptions[10]['Loss scenario'][0]).toLowerCase().startsWith('early')?'early':'regular';
  const toMw=(m:string)=>new Map(Object.entries(capacity[m]).map(([y,v])=>[Number(y),v*1000]));
  const retirementWave=computeRetirementWave(toMw('United States'),kgPerMw/1000,shapes,retirementThresholds(websiteData));
  const perCapitaKg=Object.fromEntries(markets.map(m=>{const {mass}=retirementSeries(toMw(m),T,shapes[loss],kgPerMw/1000);return [m,Object.fromEntries([2025,2030,2035,2040,2045,2050].map(y=>[y,mass.get(y)!/p.population[m][y]]))];}));
  return {annualPanels,inputT,operatingDays,panelsPerMw,kgPerMw,solutions,cellPowder,capacity,retirementWave,perCapitaKg,defaultLifetime:T,loss,shapes};
}
export type Model = ReturnType<typeof model>;


export function impactRouteMetrics(parameters: Parameters, result: ReturnType<typeof model>) {
  const websiteData = websiteDataFromAssumptions(parameters.assumptions);
  const circulatorRecovery = websiteNumber(websiteData, 'methods.circulator.product_recovery_percent');
  return Object.values(result.solutions).map(solution => ({
    code: solution.code,
    residueTPerMw: solution.code === 'PVCIRCULATOR'
      ? (result.kgPerMw / 1000) * (1 - circulatorRecovery / 100)
      : solution.residualTPerMw,
    co2eTPerMw: solution.co2eTPerMw,
  }));
}

export type ImpactRouteMetric = ReturnType<typeof impactRouteMetrics>[number];
