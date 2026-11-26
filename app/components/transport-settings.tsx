'use client';
import type {DeliverySettings} from '../../lib/delivery';

export function TransportSettings({settings,onChange,disabled}:{settings:DeliverySettings;onChange:(change:Partial<DeliverySettings>)=>void;disabled:boolean}){const update=(key:keyof DeliverySettings['transport'],value:string,nullable=false)=>onChange({transport:{...settings.transport,[key]:value===''&&nullable?null:Number(value)}});return <>
 <fieldset className="pa-fields" disabled={disabled}><legend>Trailer 處理費資格</legend><label>Trailer 優惠最低交付片數<input type="number" min="1" step="1" placeholder="待設定" value={settings.transport.trailerMinimumPanels??''} onChange={e=>update('trailerMinimumPanels',e.target.value,true)}/></label></fieldset>
 <p>此門檻只決定回收處理費採 Truck 按片或 Trailer 按重量計價；不決定實際安排的運輸車型。</p>
 <fieldset className="pa-fields" disabled={disabled}><legend>車型、可用車廂與載重</legend>{([
  ['truckInteriorLengthIn',"26' box truck 可用內長",'in',false],['truckInteriorWidthIn',"26' box truck 可用內寬",'in',false],['truckMaxWeightLb',"26' box truck 最大毛重",'lb',true],
  ['trailerInteriorLengthIn',"53' dry van 可用內長",'in',false],['trailerInteriorWidthIn',"53' dry van 可用內寬",'in',false],['trailerMaxWeightLb',"53' dry van 最大毛重",'lb',true]
 ] as const).map(([key,label,unit,nullable])=><label key={key}>{label}<span>{unit}</span><input type="number" min="1" step="0.01" placeholder={nullable?'待設定':undefined} value={settings.transport[key]??''} onChange={e=>update(key,e.target.value,nullable)}/></label>)}</fieldset>
 <fieldset className="pa-fields" disabled={disabled}><legend>其他設定</legend>{([
  ['maxPanelsPerPallet','每棧板片數上限','片','1'],['panelThicknessMm','光電板預設厚度','mm','0.01'],['palletTareLb','每棧板＋包材＋損耗重量','lb','0.01']
 ] as const).map(([key,label,unit,step])=><label key={key}>{label}<span>{unit}</span><input type="number" min="0.01" step={step} value={settings.transport[key]} onChange={e=>update(key,e.target.value)}/></label>)}<p className="pa-full">棧板不可上下堆疊。瓦數估算尺寸時，寬度固定為 1,000 mm，長度由估算面積換算。</p></fieldset>
 <div className="pa-formula"><p>裝載公式</p><p>棧板數＝各同尺寸項目 ceil（片數 ÷ 每棧板片數上限）後加總。每棧毛重＝板材淨重＋棧板與包材重量。</p><p>同尺寸地板容量＝max［floor（車廂長÷棧板長）×floor（車廂寬÷棧板寬），floor（車廂長÷棧板寬）×floor（車廂寬÷棧板長）］。</p><p>系統依各棧板實際長寬逐一排列，並同時檢查累計毛重；棧板不疊放。所需車數為可容納全部棧板的最少車數，混合尺寸不以總面積直接相除。</p></div>
 <fieldset className="pa-fields" disabled={disabled}><legend>Pickup 附加服務費 · USD</legend>{([['handlingMinimum','人工搬運最低出勤費'],['laborPerPersonHour','人工每人每小時'],['packingPerPallet','整理／上棧板每棧費'],['materialsPerPallet','包材每棧費'],['liftgate','尾門服務費'],['residential','住宅取貨費'],['limitedAccess','有限通道費'],['appointment','預約／通知費']] as const).map(([key,label])=><label key={key}>{label}<input type="number" min="0" step="0.01" placeholder="待設定" value={settings.pickupFees[key]??''} onChange={e=>onChange({pickupFees:{...settings.pickupFees,[key]:e.target.value===''?null:Number(e.target.value)}})}/></label>)}</fieldset>
 <p>固定服務費以每張訂單一次計算，棧板服務依棧數計算。人工費＝max（最低出勤費，人數×小時×每人時薪）。尚無工時、人數或費率時明列待核價。無月台但有適用堆高機時，不自動加尾門費。</p>
 </>}
