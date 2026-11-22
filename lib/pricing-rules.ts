import type {TransportLimits} from './pickup';
export type PricingRules = {baseMaxWatts:number;stepWatts:number;panelBase:number;panelIncrement:number;weightBase:number;weightIncrement:number;discountStartExponent:number;discountPercentPerExponent:number;discountMaxPercent:number;brokenPercent:number;missingBoxPercent:number;missingFramePercent:number;doubleGlassGramsPerWatt:number;backsheetGramsPerWatt:number;doubleGlassKgPerSqm:number;backsheetKgPerSqm:number;unknownGramsPerWatt:number|null;unknownKgPerSqm:number};
export type PricingSnapshot = {version:string;createdAt:string;rules:PricingRules;transport?:TransportLimits;transportVersion?:string};
export const initialRules:PricingRules={baseMaxWatts:300,stepWatts:50,panelBase:10,panelIncrement:1.25,weightBase:.18,weightIncrement:.025,discountStartExponent:2,discountPercentPerExponent:0,discountMaxPercent:100,brokenPercent:10,missingBoxPercent:5,missingFramePercent:25,doubleGlassGramsPerWatt:53.4,backsheetGramsPerWatt:50.3,doubleGlassKgPerSqm:12.25,backsheetKgPerSqm:10.76,unknownGramsPerWatt:null,unknownKgPerSqm:11.5};
export function validRules(value:unknown):value is PricingRules{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const r=value as Record<string,unknown>;const keys=Object.keys(initialRules);
 if(Object.keys(r).length!==keys.length||keys.some(k=>k==='unknownGramsPerWatt'&&r[k]===null?false:typeof r[k]!=='number'||!Number.isFinite(r[k])||Number(r[k])<0))return false;
 return (r.unknownGramsPerWatt===null||(Number(r.unknownGramsPerWatt)>0&&Number(r.unknownGramsPerWatt)<=1000))&&Number.isInteger(r.baseMaxWatts)&&Number(r.baseMaxWatts)>=1&&Number(r.baseMaxWatts)<=2000&&Number.isInteger(r.stepWatts)&&Number(r.stepWatts)>=1&&Number(r.stepWatts)<=2000&&Number.isInteger(r.discountStartExponent)&&Number(r.discountStartExponent)>=1&&Number(r.discountStartExponent)<=6&&Number(r.discountPercentPerExponent)<=100&&Number(r.discountMaxPercent)<=100&&Number(r.panelBase)<=100000&&Number(r.panelIncrement)<=100000&&Number(r.weightBase)<=100&&Number(r.weightIncrement)<=100&&['brokenPercent','missingBoxPercent','missingFramePercent'].every(k=>Number(r[k])<=1000)&&['doubleGlassGramsPerWatt','backsheetGramsPerWatt','doubleGlassKgPerSqm','backsheetKgPerSqm','unknownKgPerSqm'].every(k=>Number(r[k])>0&&Number(r[k])<=1000)&&keys.every(k=>r[k]===null||Math.abs(Number(r[k])*1e6-Math.round(Number(r[k])*1e6))<1e-5);
}
export type ConditionFlags={broken?:boolean;missingBox?:boolean;missingFrame?:boolean};
export function flagsFor(condition:string):ConditionFlags{return {broken:condition==='broken',missingBox:condition==='missing-box'||condition==='missing-both',missingFrame:condition==='missing-frame'||condition==='missing-both'}}
export function tierRate(watts:number,unit:'panel'|'lb',flags:ConditionFlags,r:PricingRules){
 if(!Number.isInteger(watts)||watts<1||watts>2000||!validRules(r))return null;
 const tier=Math.max(0,Math.ceil((watts-r.baseMaxWatts)/r.stepWatts));const base=(unit==='panel'?r.panelBase:r.weightBase)+tier*(unit==='panel'?r.panelIncrement:r.weightIncrement);
 const percent=(flags.broken?r.brokenPercent:0)+(flags.missingBox?r.missingBoxPercent:0)+(flags.missingFrame?r.missingFramePercent:0);
 return {tier,baseRate:Math.round(base*1e6)/1e6,surchargePercent:percent,rate:Math.round(base*(1+percent/100)*1e6)/1e6};
}
export function quantityDiscount(quantity:number,r:PricingRules){
 if(!Number.isInteger(quantity)||quantity<1||!validRules(r))return {exponent:null,levels:0,percent:0};
 const exponent=Math.floor(Math.log10(quantity));const levels=Math.max(0,exponent-r.discountStartExponent+1);return {exponent,levels,percent:Math.min(r.discountMaxPercent,Math.round(levels*r.discountPercentPerExponent*1e6)/1e6)};
}

// Upgrade only newly introduced coefficients. Existing price fields must be present and valid.
export const defaultWeightRules={doubleGlassGramsPerWatt:53.4,backsheetGramsPerWatt:50.3,doubleGlassKgPerSqm:12.25,backsheetKgPerSqm:10.76,unknownGramsPerWatt:null,unknownKgPerSqm:11.5};
export const defaultDiscountRules={discountStartExponent:2,discountPercentPerExponent:0,discountMaxPercent:100};
export function normalizeRules(value:unknown):PricingRules|null{if(validRules(value))return value;if(!value||typeof value!=='object'||Array.isArray(value))return null;const r=value as Record<string,unknown>;const optional={...defaultWeightRules,...defaultDiscountRules};const baseKeys=Object.keys(initialRules).filter(k=>!(k in optional));if(!baseKeys.every(k=>k in r)||!Object.keys(r).every(k=>k in initialRules))return null;const upgraded={...optional,...r};return validRules(upgraded)?upgraded:null}
