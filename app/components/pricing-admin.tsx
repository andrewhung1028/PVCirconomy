'use client';
import {useEffect,useState} from 'react';
import {defaultMinimumProcessingUsd,maximumMinimumProcessingUsd,initialRules,pricingMisc,pricingMiscFields,validRules,type PricingMarket,type PricingRules,type PricingSnapshot} from '../../lib/pricing-rules';
import './pricing-admin.css';
import {pricingLogic,defaultPricingNoteTitle} from '../../lib/pricing-notes';
import {PricingPreview} from './pricing-preview';
import {AdminNavigation} from './admin-navigation';
type State={active:PricingSnapshot;history:Array<{id:string;rules:PricingRules;created_at:string;actor_email:string;note?:string;note_title?:string}>};
function pricingVersionNotes(state: State) {
 const current=state.history.find(item=>item.id===state.active.version);
 return {
  body: current?.note || pricingLogic(state.active.rules,state.active.batchPricing),
  title: current?.note_title || defaultPricingNoteTitle,
 };
}
const fields:Array<[keyof PricingRules,string,string]>=[['baseMaxWatts','起始級距上限','W'],['stepWatts','每級瓦數','W'],['panelBase','按片起始價格','USD / 片'],['panelIncrement','每級增加金額','USD / 片'],['weightBase','按重量起始價格','USD / lb'],['weightIncrement','每級增加金額','USD / lb'],['discountStartExponent','第一級折扣指數 n（10ⁿ）','整數'],['discountPercentPerExponent','每增加一個指數折扣','%'],['discountMaxPercent','折扣上限','%'],['brokenPercent','玻璃破裂','%'],['missingBoxPercent','缺接線盒','%'],['missingFramePercent','缺鋁框','%'],['doubleGlassGramsPerWatt','雙玻功率係數','g / W'],['backsheetGramsPerWatt','單玻＋背板功率係數','g / W'],['unknownGramsPerWatt','未知結構功率係數','g / W'],['doubleGlassKgPerSqm','雙玻面積係數','kg / m²'],['backsheetKgPerSqm','單玻＋背板面積係數','kg / m²'],['unknownKgPerSqm','未知結構面積係數','kg / m²']];
export function PricingAdmin(){const [market,setMarket]=useState<PricingMarket>('US');const [minimumProcessing,setMinimumProcessing]=useState(String(defaultMinimumProcessingUsd));const [session,setSession]=useState<{configured:boolean;user:{email:string;name:string;role:string}|null}|null>(null);const [data,setData]=useState<State|null>(null);const [draft,setDraft]=useState<Record<keyof PricingRules,string>>(()=>Object.fromEntries(Object.entries({...initialRules,...pricingMisc()}).map(([k,v])=>[k,v===null?'':String(v)])) as Record<keyof PricingRules,string>);const [note,setNote]=useState('');const [noteTitle,setNoteTitle]=useState(defaultPricingNoteTitle);const [status,setStatus]=useState('載入中…');const [saving,setSaving]=useState(false);
 const rules=Object.fromEntries(Object.entries(draft).map(([k,v])=>[k,v.trim()===''?(k==='unknownGramsPerWatt'?null:NaN):Number(v)])) as PricingRules;
 const minimum=minimumProcessing.trim()===''?NaN:Number(minimumProcessing);
 const batchPricing=data?.active.batchPricing&&{minimumProcessingUsd:minimum};
 if(batchPricing){
  rules.minimumProcessingUsd=minimum;
 }
 const valid=validRules(rules);
 const activeRules=data ? {
  ...data.active.rules,
  ...pricingMisc(data.active.rules),
  ...(data.active.batchPricing && {minimumProcessingUsd:data.active.batchPricing.minimumProcessingUsd}),
 } : null;
 const activeNotes=data ? pricingVersionNotes(data) : null;
 const dirty=Boolean(activeRules && activeNotes && (
  Object.entries(rules).some(([key,value])=>value!==activeRules[key as keyof PricingRules])
  || note.trim()!==activeNotes.body.trim() || noteTitle.trim()!==activeNotes.title.trim()
 ));
 function apply(r:PricingRules,minimumUsd=r.minimumProcessingUsd??defaultMinimumProcessingUsd){setMinimumProcessing(String(minimumUsd));setDraft(Object.fromEntries(Object.entries({...r,...pricingMisc(r)}).filter(([key])=>key!=='minimumProcessingUsd').map(([k,v])=>[k,v===null?'':String(v)])) as typeof draft)}
 function loadState(value:State){
  const notes=pricingVersionNotes(value);
  setData(value);
  apply(value.active.rules,value.active.batchPricing?.minimumProcessingUsd);
  setNote(notes.body);
  setNoteTitle(notes.title);
 }
 async function load(target:unknown=market){const selected:PricingMarket=target==='JP'||target==='US'?target:market;setStatus('載入中…');try{const r=await fetch('/api/auth/session/',{cache:'no-store'});if(!r.ok)throw Error();const s=await r.json();setSession(s);if(s.user?.role!=='staff'){setStatus(new URLSearchParams(location.search).has('error')?'登入未完成，請確認使用 pvcirconomy.com 或 tsgc.com.tw 公司帳號及正確 Microsoft 租戶。':'');return}const p=await fetch(`/api/admin/pricing/?market=${selected}`,{cache:'no-store'});if(!p.ok)throw Error();const value=await p.json();setMarket(selected);loadState(value);setStatus('')}catch{setStatus('無法讀取價格設定。請重試；尚未儲存的修改不會套用。')}}
 useEffect(()=>{void load(new URLSearchParams(location.search).get('market')==='JP'?'JP':'US')},[]);
 useEffect(()=>{
  if(!dirty)return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};
  addEventListener('beforeunload',warn);
  return()=>removeEventListener('beforeunload',warn);
 },[dirty]);
 async function save(){if(!data||!valid)return;setSaving(true);setStatus('儲存中…');try{const r=await fetch('/api/admin/pricing/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rules,expectedVersion:data.active.version,note,noteTitle,market})});if(r.status===409){setStatus('其他管理員已更新價格。你的修改仍保留，請重新載入最新版本後核對。');return}if(r.status===401){setStatus('登入已逾時。請重新登入；目前修改尚未儲存。');return}if(!r.ok)throw Error();const value=await r.json();loadState(value);try{localStorage.setItem(`pv-pricing-updated-${market}`,value.active.version)}catch{};setStatus(`已儲存並啟用 ${market} 價格。新的估價將使用此版本。`)}catch{setStatus('儲存失敗，修改仍保留。請重試。')}finally{setSaving(false)}}
 function resetAfterLogout(){
  setSession(current=>current?{...current,user:null}:current);
  setData(null);
  setStatus('已登出。');
 }

 return <main className="pa"><AdminNavigation active="pricing" onLogout={resetAfterLogout}/><div className="pa-heading pa-pricing-heading"><h1>回收價格規則</h1>{session?.user?.role==='staff'&&<details className="pa-price-note"><summary>{noteTitle||defaultPricingNoteTitle}<span aria-hidden="true">＋</span></summary><label>備註標題<input maxLength={160} value={noteTitle} disabled={saving||!data} onChange={e=>setNoteTitle(e.target.value)}/></label><label htmlFor="pa-note-body">本次調整備註</label><textarea id="pa-note-body" rows={18} maxLength={2000} value={note} disabled={saving||!data} onChange={e=>setNote(e.target.value)}/><button type="button" disabled={saving||!data||!valid} onClick={()=>setNote(pricingLogic(rules,batchPricing))}>填入目前欄位的計算邏輯</button><p>標題與內文隨「儲存並啟用價格」保存至版本紀錄，僅供公司後台查看。</p></details>}</div>
 {session?.user?.role!=='staff'?<section className="pa-login"><h2>Log in</h2><p>使用 pvcirconomy.com 或 tsgc.com.tw 的 Microsoft 公司帳號管理價格。</p>{session?.configured?<a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a>:session?<p>Microsoft 登入尚未設定完成。完成 Entra 應用程式與伺服器設定後即可登入；目前無法修改價格。</p>:<p>正在檢查登入狀態…</p>}<p role="status">{status}</p><button onClick={load}>重新檢查</button></section>:<><div className="pa-meta"><span>{session.user.email}</span><span>{data?'啟用時間：'+new Date(data.active.createdAt).toLocaleString('zh-TW'):'尚未讀取價格'}</span></div><div className="pa-workspace"><section><h2>價格設定</h2>{data?.active.batchPricing&&<fieldset className="pa-fields"><legend>批次最低回收處理費</legend><label>最低回收處理費<span>USD／批</span><input type="number" min="0" max={maximumMinimumProcessingUsd} step="0.01" value={minimumProcessing} disabled={saving} onChange={e=>setMinimumProcessing(e.target.value)} aria-describedby="pa-minimum-processing-help"/></label><p className="pa-full" id="pa-minimum-processing-help">整批處理費折扣後低於設定金額時補足差額。填 0 可取消最低費。運輸及取貨費另計。</p></fieldset>}{([['價格級距',0,6,'每增加不足一級的瓦數，按完整一級計算。'],['折扣級距',6,9,data?.active.batchPricing?'以整批總片數判斷折扣，達門檻後僅新增片數適用新一級折扣。':'片數 N 以 10 的指數分級；每跨一個指數增加一級折扣，並受折扣上限限制。'],['狀態加價',9,12,'狀態百分比相加，以基本處理費為基數；不連乘、不加在運輸費上。'],['重量與瓦數換算',12,18,'功率係數以 g/W 換算重量與瓦數；面積係數以 kg/m² 換算面積與重量。']] as const).map(([title,start,end,description])=><fieldset key={title} disabled={saving||!data} className="pa-price-group"><legend>{title}</legend><p>{description}</p><div className="pa-fields">{fields.slice(start,end).map(([key,label,unit])=><label key={key}>{label}<span>{unit}</span><input type="number" value={draft[key]} min={['baseMaxWatts','stepWatts','discountStartExponent'].includes(key)?1:['unknownGramsPerWatt','doubleGlassGramsPerWatt','backsheetGramsPerWatt','doubleGlassKgPerSqm','backsheetKgPerSqm','unknownKgPerSqm'].includes(key)?0.000001:0} max={key==='discountStartExponent'?6:undefined} step={['baseMaxWatts','stepWatts','discountStartExponent'].includes(key)?1:'0.000001'} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))}/></label>)}</div>{start===12&&<p>未知結構功率係數留空表示尚未設定；填入 g/W 並儲存後，Unknown 可依重量換算瓦數與價格。</p>}</fieldset>)}<fieldset disabled={saving||!data} className="pa-price-group"><legend>雜項設定</legend><div className="pa-fields">{pricingMiscFields.map(([key,label,unit,,min,max])=><label key={key}>{label}<span>{unit}</span><input type="number" value={draft[key]} min={min} max={max} step={key==='projectThresholdMw'?'any':1} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))}/></label>)}</div></fieldset>{!valid&&<p role="alert">請填寫有效數字。瓦數與折扣指數需為有效整數，價格及加價不可為負，折扣為 0–100%，重量係數須大於 0。</p>}<div className="pa-actions"><button className="pa-primary" disabled={!data||!valid||!dirty||saving} onClick={save}>{saving?'儲存中…':'儲存並啟用價格'}</button><button disabled={!data||saving} onClick={()=>{if(data){loadState(data)}}}>還原欄位</button><button disabled={saving} onClick={load}>讀取最新版本</button></div><p role="status" className="pa-status">{status}</p></section><PricingPreview market={market} rules={rules} valid={valid} transport={data?.active.transport} batchPricing={batchPricing}/></div><section className="pa-history"><h2>價格版本紀錄</h2><p>每次儲存保留版本與操作帳號。套用舊版內容後，仍需按「儲存並啟用價格」才會生效。</p>{data?.history.map(h=><div key={h.id}><span>{new Date(h.created_at).toLocaleString('zh-TW')} · {h.actor_email}{h.id===data.active.version?' · 使用中':''}{h.note&&<span className="pa-version-note">{h.note_title||'備註'}：{h.note}</span>}</span><button disabled={saving} onClick={()=>apply(h.rules)}>載入此版內容</button></div>)}</section></>}
 </main>
}
