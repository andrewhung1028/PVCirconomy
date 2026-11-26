import type {DeliverySettings} from './delivery';

export const defaultDeliveryNoteTitle='運輸管理與運費計算邏輯';

export function deliveryLogic(settings:DeliverySettings){const t=settings.transport;return `計價範圍：美國；幣別：USD。Truck＝26' box truck；Trailer＝53' dry van。

1. 道路里程與基本運費
道路里程使用 Google Maps 計算。
每車基本運費＝max（最低運費，起始費＋道路英里×每英里費率）。
每英里費率已包含燃油附加費；多車依實際車數加總。
Truck：起始費 ${settings.rates.truck.base??'待設定'}、每英里 ${settings.rates.truck.perMile??'待設定'}、最低運費 ${settings.rates.truck.minimum??'待設定'} USD。
Trailer：起始費 ${settings.rates.trailer.base??'待設定'}、每英里 ${settings.rates.trailer.perMile??'待設定'}、最低運費 ${settings.rates.trailer.minimum??'待設定'} USD。

2. 光電板尺寸與重量
型號：優先採用型號的長、寬與已確認重量。
Dimensions：採用客戶輸入的長、寬；重量＝面積×結構面積係數。
Watts：重量＝瓦數×結構功率係數÷1,000；面積＝重量÷結構面積係數；估算寬度固定為 1,000 mm，估算長度 mm＝面積 m²×1,000。

3. 棧板估算
棧板不可上下堆疊。每棧板片數上限＝${t.maxPanelsPerPallet} 片；光電板預設厚度＝${t.panelThicknessMm} mm；每棧板、包材與損耗附加重量＝${t.palletTareLb} lb。
棧板數＝各同尺寸項目向上取整（片數÷${t.maxPanelsPerPallet}）後加總。
棧板毛重＝板材淨重＋${t.palletTareLb} lb；堆疊高度＝片數×${t.panelThicknessMm} mm。

4. 車輛裝載
26' box truck 可用車廂地板＝${t.truckInteriorLengthIn}×${t.truckInteriorWidthIn} in；最大毛重＝${t.truckMaxWeightLb??'待設定'} lb。
53' dry van 可用車廂地板＝${t.trailerInteriorLengthIn}×${t.trailerInteriorWidthIn} in；最大毛重＝${t.trailerMaxWeightLb??'待設定'} lb。
同尺寸棧板方向 A＝floor（車廂長÷棧板長）×floor（車廂寬÷棧板寬）。
方向 B＝floor（車廂長÷棧板寬）×floor（車廂寬÷棧板長）。
地板容量＝max（方向 A，方向 B）；不乘堆疊層數。
系統依每個棧板的實際長寬逐一排列，並同時檢查累計毛重。所需車數是可容納全部棧板的最少車數。混合尺寸不以總面積直接相除。

5. Residential、Truck、Trailer 處理費資格
Trailer 優惠最低交付片數＝${t.trailerMinimumPanels??'待設定'} 片。未達門檻時採 Truck 按片處理費；實際安排的車型不隨處理費率改變。

6. 其他條件
客戶填入實際棧板數、外部尺寸或總毛重時，裝載檢查優先使用實際資料。缺少可確認的尺寸、重量或費率時列為待人工確認，不當成零元或無限容量。附加服務依後台費率另計。`}
