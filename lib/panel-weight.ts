import { panelAreaWeightFactors } from "./pricing-rules";
export type Construction = 'glass-glass'|'glass-backsheet'|'unknown';
export const weightFactors:Record<Construction,number>=panelAreaWeightFactors();
// Input dimensions in millimeters; area in m²; weight in kg. Never promote an estimate to a measured weight.
export function panelWeight(lengthMm:number|null,widthMm:number|null,construction:string|null,verifiedKg:number|null,factors:Record<Construction,number>=weightFactors){
 if(verifiedKg!==null&&Number.isFinite(verifiedKg)&&verifiedKg>0)return {kg:verifiedKg,estimated:false,factor:null,area:null};
 if(lengthMm===null||widthMm===null||!Number.isFinite(lengthMm)||!Number.isFinite(widthMm)||lengthMm<=0||widthMm<=0)return null;
 const kind:Construction=construction==='glass-glass'||construction==='glass-backsheet'?construction:'unknown';
 const factor=factors[kind];const area=lengthMm*widthMm/1e6;
 return {kg:Math.round(area*factor*1000)/1000,estimated:true,factor,area};
}
