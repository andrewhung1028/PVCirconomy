import {initialRules,tierRate,quantityDiscount,flagsFor,type PricingRules,type ConditionFlags} from './pricing-rules';
export type QuoteInput = { quantity:number;watts:number;scale:'truck'|'trailer';condition:'complete'|'broken'|'missing-box'|'missing-frame'|'missing-both';flags?:ConditionFlags;weightLb?:number };
export function recyclingQuote(input:QuoteInput,rules:PricingRules=initialRules):{total:number|null;reason:string;rate?:number;unit?:string;weight?:number;preDiscountTotal?:number;discountPercent?:number}{
 const {quantity,watts,scale}=input;
 if(!Number.isInteger(quantity)||quantity<1||quantity>1000000)return {total:null,reason:'Enter a valid panel count.'};
 const unit=scale==='truck'?'panel':'lb';const rate=tierRate(watts,unit,input.flags??flagsFor(input.condition),rules);
 if(!rate)return {total:null,reason:'Enter rated watts between 1 and 2,000.'};
 if(unit==='lb'&&(!Number.isFinite(input.weightLb)||Number(input.weightLb)<=0))return {total:null,rate:rate.rate,unit,reason:'Rate calculated. Provide a model weight or measured dimensions to estimate the total; final settlement uses scale weight.'};
 const weight=unit==='lb'?input.weightLb:undefined;const preDiscountTotal=Math.round((weight??quantity)*rate.rate*100)/100;const discountPercent=quantityDiscount(quantity,rules).percent;return {total:Math.round(preDiscountTotal*(1-discountPercent/100)*100)/100,preDiscountTotal,discountPercent,rate:rate.rate,unit,weight,reason:''};
}
