import {type TransportLimits} from './pickup';
import { initialRules,pricingProfiles,quantityDiscount,flagsFor,type BatchPricingPolicy,type ConditionFlags,type PricingProfile,type PricingRules,type PricingSnapshot } from './pricing-rules';
import { panelWeight, type Construction } from './panel-weight';
import { recyclingQuote, type QuoteInput } from './recycling-quote';
export type ReferenceModel = {id:string;manufacturer:string;model:string;rated_watts:number|null;length_mm:number|null;width_mm:number|null;dimension_source:string|null;verified_weight_kg:number|null;estimated_weight_kg:number|null;source_url:string|null;dimension_category?:string|null;weight_category?:string|null;construction?:string|null;weight_method?:string|null};
export type QuoteLine = {id:string;mode:'watts'|'model'|'dimensions'|'ai';quantity:string;watts:string;condition:QuoteInput['condition'];scale:QuoteInput['scale']|'dropoff';modelQuery:string;selectedModel:ReferenceModel|null;length:string;width:string;dimensionUnit:'mm'|'in';construction:Construction;flags?:ConditionFlags};
export function newQuoteLine():QuoteLine{return {id:crypto.randomUUID(),mode:'watts',quantity:'',watts:'',condition:'complete',scale:'truck',modelQuery:'',selectedModel:null,length:'',width:'',dimensionUnit:'mm',construction:'unknown'}}
export const conditionLabels:Record<QuoteInput['condition'],string>={complete:'Intact & complete',broken:'Glass broken','missing-box':'Junction box missing','missing-frame':'Frame missing','missing-both':'Frame & junction box missing'};
export const shipmentLabels={truck:'Truck · per panel',trailer:'Trailer · per lb',dropoff:'Drop off'};
export const money=(n:number,profile:PricingProfile=pricingProfiles.US)=>new Intl.NumberFormat(profile.locale,{style:'currency',currency:profile.currency,minimumFractionDigits:profile.currency==='JPY'?0:undefined,maximumFractionDigits:profile.currency==='JPY'?0:2}).format(n);
export const rateMoney=(n:number,profile:PricingProfile=pricingProfiles.US)=>new Intl.NumberFormat(profile.locale,{style:'currency',currency:profile.currency,minimumFractionDigits:profile.currency==='JPY'?0:2,maximumFractionDigits:profile.currency==='JPY'?0:4}).format(n);
export type LinePrice = {total:number|null;reason:string;rate?:number;unit?:string;weight?:number;preDiscountTotal?:number;discountPercent?:number;processingScale?:string;qualificationNote?:string};
export function estimatedLineWeight(line:QuoteLine,rules:PricingRules=initialRules){
 const m=line.selectedModel;const factor=line.dimensionUnit==='in'?25.4:1;const factors={'glass-glass':rules.doubleGlassKgPerSqm,'glass-backsheet':rules.backsheetKgPerSqm,unknown:rules.unknownKgPerSqm};
 if(m){const result=panelWeight(m.length_mm,m.width_mm,m.construction??'unknown',m.verified_weight_kg,factors);if(result)return {...result,basis:result.estimated?'area':'verified',watts:null,gramsPerWatt:null};}
 if(line.mode==='dimensions'||(line.mode==='watts'&&line.length&&line.width)){const length=Number(line.length)*factor,width=Number(line.width)*factor;const result=length>=100&&length<=5000&&width>=100&&width<=5000?panelWeight(length,width,line.construction,null,factors):null;if(result)return {...result,basis:'area',watts:null,gramsPerWatt:null};}
 const watts=m?.rated_watts??Number(line.watts);const construction=m?.construction??line.construction;
 if(!Number.isInteger(watts)||Number(watts)<1||Number(watts)>2000)return null;
 const grams=construction==='glass-glass'?rules.doubleGlassGramsPerWatt:construction==='glass-backsheet'?rules.backsheetGramsPerWatt:rules.unknownGramsPerWatt??null;
 if(grams===null)return null;
 return {kg:Math.round(Number(watts)*grams)/1000,estimated:true,factor:null,area:null,basis:'power',watts,gramsPerWatt:grams};
}
export function resolvedPanelWatts(line:QuoteLine,rules:PricingRules=initialRules){
 const known=line.selectedModel?.rated_watts??(line.mode!=='dimensions'&&line.watts.trim()?Number(line.watts):null);
 if(known!==null)return {watts:known,estimated:false};
 if(line.mode!=='dimensions')return null;
 const weight=estimatedLineWeight(line,rules);const grams=line.construction==='glass-glass'?rules.doubleGlassGramsPerWatt:line.construction==='glass-backsheet'?rules.backsheetGramsPerWatt:rules.unknownGramsPerWatt??null;
 if(!weight||grams===null)return null;
 return {watts:Math.round(weight.kg*1000/grams),estimated:true};
}
export function estimatedLineArea(line:QuoteLine,rules:PricingRules=initialRules){const weight=estimatedLineWeight(line,rules);if(!weight)return null;if(weight.area!==null)return weight.area;const construction=line.selectedModel?.construction??line.construction;const factor=construction==='glass-glass'?rules.doubleGlassKgPerSqm:construction==='glass-backsheet'?rules.backsheetKgPerSqm:rules.unknownKgPerSqm;return factor?weight.kg/factor:null}
export function lineQuote(line:QuoteLine,rules:PricingRules=initialRules,transport?:TransportLimits,eligibleQuantity=Number(line.quantity),profile:PricingProfile=pricingProfiles.US,policy?:BatchPricingPolicy):LinePrice{
 if(line.scale==='dropoff')return {total:null,reason:'Contact PV Circonomy for drop-off processing charges.'};
 if(line.mode==='ai'&&!line.selectedModel)return {total:null,reason:'Use Model or Watts to calculate pricing while label recognition is not connected.'};
 if(line.mode==='model'&&!line.selectedModel)return {total:null,reason:'Select a model to calculate pricing.'};
 const weight=estimatedLineWeight(line,rules);if(line.mode==='dimensions'&&!weight)return {total:null,reason:'Enter valid panel dimensions to estimate weight.'};const watts=resolvedPanelWatts(line,rules)?.watts;
 if(line.mode==='dimensions'&&(!Number.isInteger(watts)||Number(watts)<1||Number(watts)>2000))return {total:null,reason:weight?(watts===undefined?'Unknown construction power coefficient is not configured. Choose a known construction or contact PV Circonomy.':'Estimated power is outside the supported 1–2,000 W range. Check the dimensions or construction.'):'Enter panel dimensions to estimate weight.'};
 const result=recyclingQuote({quantity:Number(line.quantity),watts:Number(watts),condition:line.condition,flags:line.flags??flagsFor(line.condition),scale:line.scale,weightUnit:profile.weightUnit,weightKg:weight?Number(line.quantity)*weight.kg:undefined,weightLb:weight?Number(line.quantity)*weight.kg*2.2046226218:undefined},rules,transport,eligibleQuantity,policy);
 return {...result,reason:result.total===null?result.reason:result.qualificationNote||result.reason};
}
export function describeCondition(l:QuoteLine){const f=l.flags??flagsFor(l.condition);return [f.broken?'Glass broken':'',f.missingBox?'Junction box missing':'',f.missingFrame?'Frame missing':''].filter(Boolean).join(' + ')||'Intact & complete'}
export function batchDiscountRate(quantity:number,rules:PricingRules){
 if(!Number.isSafeInteger(quantity)||quantity<1)return 0;
 const first=10**rules.discountStartExponent;
 let discountUnits=0;
 // Each tier adds its incremental discount only to units at or above its threshold.
 for(let threshold=first;threshold<=quantity;threshold*=10){
  const after=quantityDiscount(threshold,rules).percent;
  const before=quantityDiscount(threshold-1,rules).percent;
  discountUnits+=(quantity-threshold+1)*(after-before);
  if(after>=rules.discountMaxPercent)break;
 }
 return quantity>0?discountUnits/quantity:0;
}
const priceCents=(amount:number)=>Math.round((amount+Number.EPSILON)*100);
function batchChargeAmounts(gross:number,quantity:number,rules:PricingRules,policy:BatchPricingPolicy,pending:boolean){
 const grossCents=priceCents(gross);
 const discountedCents=pending?grossCents:priceCents(gross*(1-batchDiscountRate(quantity,rules)/100));
 const finalCents=pending?discountedCents:Math.max(discountedCents,priceCents(policy.minimumProcessingUsd));
 return {total:finalCents/100,discount:(grossCents-discountedCents)/100,minimumAdjustment:(finalCents-discountedCents)/100};
}
export function batchTotals(lines:QuoteLine[],rules:PricingRules=initialRules,transport?:TransportLimits,profile:PricingProfile=pricingProfiles.US,policy?:BatchPricingPolicy){
 const eligibleQuantity=lines.reduce((n,l)=>n+(Number(l.quantity)||0),0);
 const lineRules=policy?{...rules,discountPercentPerExponent:0}:rules;
 const prices=lines.map(line=>lineQuote(line,lineRules,transport,eligibleQuantity,profile,policy));
 const pending=prices.filter(price=>price.total===null).length;
 if(!policy){
  const subtotal=prices.reduce((n,p)=>n+(p.total??0),0);
  return {prices,pending,subtotal,total:pending?null:subtotal,discount:0,minimumAdjustment:0};
 }
 // Sum unrounded line charges before applying the batch policy so splitting a
 // line cannot change the charge through repeated cent rounding.
 const rawCharges=prices.map((price,index)=>price.total===null?0:(price.weight??Number(lines[index].quantity))*(price.rate??0));
 const gross=rawCharges.reduce((sum,amount)=>sum+amount,0);
 const grossCents=priceCents(gross);
 // Allocate rounding cents to the largest fractional line amounts so the
 // displayed items sum to the same gross subtotal used in the calculation.
 const lineCents=rawCharges.map(amount=>Math.floor(amount*100));
 const extraCents=grossCents-lineCents.reduce((sum,amount)=>sum+amount,0);
 const remainders=rawCharges.map((amount,index)=>({index,fraction:amount*100-lineCents[index]}));
 remainders.sort((a,b)=>b.fraction-a.fraction);
 for(const {index} of remainders.slice(0,extraCents)){
  lineCents[index]++;
 }
 const roundedPrices=prices.map((price,index)=>price.total===null?price:{...price,total:lineCents[index]/100,preDiscountTotal:lineCents[index]/100});
 const incomplete=pending>0||!lines.length;
 const charges=batchChargeAmounts(gross,eligibleQuantity,rules,policy,incomplete);
 return {prices:roundedPrices,pending,subtotal:charges.total,total:incomplete?null:charges.total,discount:charges.discount,minimumAdjustment:charges.minimumAdjustment};
}
export function estimateProcessing(input:QuoteInput,pricing:PricingSnapshot){
 if(!pricing.batchPricing)return recyclingQuote(input,pricing.rules,pricing.transport);
 const price=recyclingQuote(input,{...pricing.rules,discountPercentPerExponent:0},pricing.transport,input.quantity,pricing.batchPricing);
 if(price.total===null)return price;
 const charges=batchChargeAmounts((price.weight??input.quantity)*(price.rate??0),input.quantity,pricing.rules,pricing.batchPricing,false);
 return {...price,total:charges.total,discount:charges.discount,minimumAdjustment:charges.minimumAdjustment};
}
export function generateQuote(lines:QuoteLine[],now=new Date(),snapshot?:PricingSnapshot){
 const totals=batchTotals(lines,snapshot?.rules,snapshot?.transport,snapshot?.profile,snapshot?.batchPricing);const expires=new Date(now.getTime()+7*86400000);const id='PVC-'+now.toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomUUID().slice(0,8).toUpperCase();
 const text=['PV CIRCONOMY — RECYCLING QUOTATION',`Reference: ${id}`,`Issued: ${now.toISOString()} (UTC)`,`Valid until: ${expires.toISOString()} (UTC)`,`Validity: 7 days from issue`, 'Currency: USD',`Pricing version: ${snapshot?.version??'initial-rules'}`,`Pricing effective: ${snapshot?.createdAt??'initial configuration'}`,`Area-based weight coefficients: double glass ${(snapshot?.rules??initialRules).doubleGlassKgPerSqm} kg/m²; glass and backsheet ${(snapshot?.rules??initialRules).backsheetKgPerSqm} kg/m²; unknown ${(snapshot?.rules??initialRules).unknownKgPerSqm} kg/m².`,`Power-based weight coefficients: double glass ${(snapshot?.rules??initialRules).doubleGlassGramsPerWatt} g/W; glass and backsheet ${(snapshot?.rules??initialRules).backsheetGramsPerWatt} g/W; unknown ${(snapshot?.rules??initialRules).unknownGramsPerWatt??'not configured'} g/W.`,`Base tier: up to ${(snapshot?.rules??initialRules).baseMaxWatts} W; additional step: ${(snapshot?.rules??initialRules).stepWatts} W, rounded up.`, `Base rates: ${(snapshot?.rules??initialRules).panelBase} USD/panel; ${(snapshot?.rules??initialRules).weightBase} USD/lb.`, `Step additions: ${(snapshot?.rules??initialRules).panelIncrement} USD/panel; ${(snapshot?.rules??initialRules).weightIncrement} USD/lb.`, `Additive surcharges: broken ${(snapshot?.rules??initialRules).brokenPercent}%; missing box ${(snapshot?.rules??initialRules).missingBoxPercent}%; missing frame ${(snapshot?.rules??initialRules).missingFramePercent}%.`,totals.pending?'Status: INCOMPLETE — pricing review required':'Status: Processing quotation — subject to receiving verification','',...lines.flatMap((l,i)=>{const p=totals.prices[i];const m=l.selectedModel;const factor=l.dimensionUnit==='in'?25.4:1;const measuredWeight=estimatedLineWeight(l,snapshot?.rules);const resolved=resolvedPanelWatts(l,snapshot?.rules);const area=estimatedLineArea(l,snapshot?.rules);return [`Item ${i+1}`,`Identification: ${l.mode}${m?' — '+m.manufacturer+' '+m.model:l.modelQuery?' — '+l.modelQuery:''}`,`Rated watts: ${resolved?.watts??'unknown'}${resolved?.estimated?' (estimated from dimensions; rounded to nearest W)':''}`,`Dimensions: ${l.mode==='dimensions'?l.length||'unknown':m?.length_mm??'unknown'} × ${l.mode==='dimensions'?l.width||'unknown':m?.width_mm??'unknown'} ${l.mode==='dimensions'?l.dimensionUnit:'mm'}`,measuredWeight?`Weight ${measuredWeight.estimated?'estimate':'record'}: ${measuredWeight.kg} kg/panel (${measuredWeight.basis==='power'?measuredWeight.watts+' W × '+measuredWeight.gramsPerWatt+' g/W ÷ 1,000':measuredWeight.basis==='area'?measuredWeight.area+' m² × '+measuredWeight.factor+' kg/m²':'source-verified'}; ${m?.construction??l.construction})`:'',area!==null?`Estimated panel area: ${area.toFixed(4)} m² (does not establish length and width)`:'',`Panel count: ${l.quantity}`,`Condition: ${describeCondition(l)}`,`Requested pricing scale: ${shipmentLabels[l.scale]}`,`Processing basis: ${p.processingScale==='residential'?'Residential · per panel':p.processingScale==='truck'?'Truck · per panel':p.processingScale==='trailer'?'Trailer · per lb':shipmentLabels[l.scale]}`,p.qualificationNote||'',`Processing: ${p.total===null?'PENDING — '+p.reason:money(p.total)}`,p.rate!==undefined?`Calculation: ${p.unit==='lb'?p.weight+' lb':l.quantity+' panels'} × ${rateMoney(p.rate)} / ${p.unit}`:'',m?`Reference source: ${m.dimension_source||'not supplied'}; weight: ${m.verified_weight_kg!==null?m.verified_weight_kg+' kg (source-verified)':m.estimated_weight_kg!==null?m.estimated_weight_kg+' kg (estimated; '+(m.weight_method||'area-based')+')':'not supplied'}`:'',''];}),totals.discount?`Batch quantity discount: −${money(totals.discount)}`:'',totals.minimumAdjustment?`Minimum processing fee adjustment: ${money(totals.minimumAdjustment)}`:'',totals.pending?`Priced items subtotal: ${money(totals.subtotal)} — excludes ${totals.pending} pending item(s); NOT the complete batch price.`:`Processing total: ${money(totals.subtotal)}`,'Transport: arranged and priced separately from processing. Self-arranged delivery uses the same processing qualification rules.','Taxes: to be confirmed; not included.','Per-panel processing settlement: accepted panel count. Per-lb processing settlement: scale weight including pallets and packaging; third-party scale tickets accepted.','Weight priority: source-verified weight, then area estimate, then rated watts × construction-specific g/W. Unknown construction uses the configured g/W coefficient when available; otherwise power-based estimates require confirmation. Final settlement remains by scale weight.',snapshot?.batchPricing?'Condition surcharges apply per item. The total quantity determines the batch’s processing tier and quantity discount. Actual transport vehicles are arranged separately.':'Condition surcharges apply per item. All item quantities are combined to determine Residential, Truck or Trailer eligibility. Actual transport vehicles are arranged separately.','Unpriced items are not zero-cost items. A complete quotation requires all item rates to be confirmed.','Subject to verification of model, quantities and condition. Changes require a revised quotation.','This document does not reserve delivery, submit a request, take payment or confirm acceptance.','This quotation is generated for your records. No inquiry has been submitted.'].filter(x=>x!=='').join('\n');return {id,issued:now.toISOString(),expires:expires.toISOString(),text};
}
export function quoteHtml(text:string){const safe=text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PV Circonomy quotation</title><style>@font-face{font-family:Manrope;src:url('https://www.pvcirconomy.com/fonts/Manrope-Variable.ttf')}body{font-family:Manrope,sans-serif;font-weight:300;color:#151719;max-width:800px;margin:40px auto;padding:24px}pre{font:inherit;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}@media print{body{margin:0;padding:12mm}button{display:none}}</style><body><button onclick="window.print()">Print / Save as PDF</button><pre>${safe}</pre></body></html>`}
