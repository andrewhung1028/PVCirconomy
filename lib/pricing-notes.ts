import {pricingMisc} from "./pricing-rules";
import type {BatchPricingPolicy,PricingRules} from './pricing-rules';
export const defaultPricingNoteTitle='價格計算邏輯與設定備註';
export function pricingLogic(r:PricingRules,batchPricing?:BatchPricingPolicy){return `計價範圍：美國；幣別：USD。N＝片數，W＝每片瓦數。

1. 瓦數級距
K＝max(0, 向上取整((W－${r.baseMaxWatts}) ÷ ${r.stepWatts}))。每增加不足一級，按完整一級計算。
Truck 基本單價＝${r.panelBase}＋K × ${r.panelIncrement} USD／片。
Trailer 基本單價＝${r.weightBase}＋K × ${r.weightIncrement} USD／lb。

2. 折扣級距
E＝floor(log10(N))；L＝max(0, E－${r.discountStartExponent}＋1)。第一個折扣級距從 10^${r.discountStartExponent}＝${10**r.discountStartExponent} 片開始。
折扣率＝min(${r.discountMaxPercent}%, L × ${r.discountPercentPerExponent}%)。目前每級折扣 ${r.discountPercentPerExponent}%，上限 ${r.discountMaxPercent}%。
${batchPricing?'按同一交付批次的總片數判斷；各級折扣僅適用達到該門檻起的片數。混合板型以整批的每片平均處理費計算折扣。':'折扣以各報價項目的片數個別計算。'}折扣僅適用狀態加價後的處理費。

3. Condition 狀態加價
破玻璃＋${r.brokenPercent}%；缺接線盒＋${r.missingBoxPercent}%；缺鋁框＋${r.missingFramePercent}%。
勾選比例相加、不連乘；完整且齊全不加價。
調整後單價＝基本單價 × (1＋狀態加價比例)。加價只套用受影響的板片處理費。

4. 重量與瓦數換算
面積(m²)＝長(mm) × 寬(mm) ÷ 1,000,000；英吋先乘 25.4 換成 mm。
面積係數(kg/m²)：雙玻 ${r.doubleGlassKgPerSqm}；單玻＋背板 ${r.backsheetKgPerSqm}；未知 ${r.unknownKgPerSqm}。
功率係數(g/W)：雙玻 ${r.doubleGlassGramsPerWatt}；單玻＋背板 ${r.backsheetGramsPerWatt}；未知 ${r.unknownGramsPerWatt??'未設定'}。
Dimensions：每片重量(kg)＝面積 × 面積係數；推估 W＝每片重量 × 1,000 ÷ 功率係數。
Watts：每片重量(kg)＝W × 功率係數 ÷ 1,000；推估面積＝每片重量 ÷ 面積係數。
重量取小數第 3 位；推估瓦數四捨五入至整數。未知功率係數未設定時，相關換算待確認。
Model 優先採資料庫已確認重量；無重量時依可用尺寸或瓦數推估。

5. 處理費與結算
Truck 處理費＝N × 調整後每片單價，依驗收片數結算。
Trailer 預估總重量(lb)＝每片重量(kg) × N × 2.2046226218。
Trailer 預估處理費＝預估總重量 × 調整後每磅單價；最終依過磅重量結算，包含棧板與包材，接受第三方過磅單。
${batchPricing?`先加總整批處理費，折扣後四捨五入至美分。每批最低 USD ${batchPricing.minimumProcessingUsd}。`:'各項處理費四捨五入至美分後加總。'}

6. 其他條件
運輸費、適用稅額另計。自行送達仍按適用處理費計價；實際車型與報價級距分開安排。
報價有效期為開立後 ${pricingMisc(r).quotationValidityDays} 天；產生報價單不代表訂單成立或已預約時段。`}
