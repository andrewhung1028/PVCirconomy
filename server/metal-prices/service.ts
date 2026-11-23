import { type EffectivePrices } from '../../lib/our-solution/model';
import { type Parameters } from '../../lib/our-solution/parameters';
export type PriceRow={metal:string;price:number;unit:string;source:string;as_of:string;fetched_at:string};
export type PriceStore={latest:()=>Promise<PriceRow[]>;save:(rows:PriceRow[])=>Promise<void>};
export const SILVER_URLS=['https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xag.json','https://latest.currency-api.pages.dev/v1/currencies/xag.json'];
export function parseSilver(value:unknown){const v=value as {date?:string;xag?:{usd?:number}};if(!/^\d{4}-\d{2}-\d{2}$/.test(v.date??'')||typeof v.xag?.usd!=='number'||!Number.isFinite(v.xag.usd)||v.xag.usd<=0)throw Error('invalid_silver');return {price:v.xag.usd,as_of:v.date!};}
export function parseWestmetall(html:string,metal:'Aluminium'|'Copper') {
  // Only rows with a date followed by numeric price columns are data rows.
  for(const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').replace(/&nbsp;|&#160;/g,' ').trim());
    const dateText=cells[0]??'';
    const numeric=dateText.match(/^(\d{1,2})[.](\d{1,2})[.](\d{4})$/);
    const timestamp=numeric?Date.UTC(Number(numeric[3]),Number(numeric[2])-1,Number(numeric[1])): /^\d{1,2}\. [A-Za-z]+ \d{4}$/.test(dateText)?Date.parse(dateText+' UTC'):NaN;
    if(!Number.isFinite(timestamp))continue;
    const text=cells[metal==='Aluminium'?1:2]??'';
    const price=Number(text.replace(/,/g,'').replace(/\s/g,''));
    if(!Number.isFinite(price)||price<=0)throw Error('invalid_westmetall_price');
    return {price,as_of:new Date(timestamp).toISOString().slice(0,10)};
  }throw Error('westmetall_data_missing');
}
export function workbookPrices(p:Parameters):EffectivePrices {
  return Object.fromEntries(['Silver','Aluminium','Copper','Silicon'].map(m=>{const v=p.assumptions[5][m];return [m,{price:v[1] as number,unit:v[2] as string,source:String(v[3]),workbookValue:true,asOf:p.meta.extractedAt.slice(0,10)}]}));
}
export function applyStoredPrices(p:Parameters,rows:PriceRow[]):EffectivePrices {
  const out=workbookPrices(p);
  for(const metal of ['Silver','Aluminium','Copper']){
    const row=rows.filter(r=>r.metal===metal&&Number.isFinite(r.price)&&r.price>0&&r.unit===out[metal].unit).sort((a,b)=>Date.parse(b.fetched_at)-Date.parse(a.fetched_at))[0];
    if(row)out[metal]={price:row.price,unit:row.unit,source:row.source,asOf:String(row.as_of).slice(0,10)};
  }return out;
}
export async function refreshMetalPrices(p:Parameters,store:PriceStore,fetcher:typeof fetch=fetch,now=new Date()) {
  const last=await store.latest();const newest=Math.max(...last.map(r=>Date.parse(r.fetched_at)));
  if(Number.isFinite(newest)&&now.getTime()-newest<6*86400000)return {skipped:true,status:{Silicon:'workbook value; no reliable free source'}};
  const current=applyStoredPrices(p,last),saved:PriceRow[]=[],status:Record<string,string>={Silicon:'workbook value; no reliable free source'};
  const get=async(url:string)=>{const r=await fetcher(url,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error(`http_${r.status}`);return r;};
  for(const metal of ['Silver','Aluminium','Copper'] as const){try{
    let quote:{price:number;as_of:string};let source:string;
    if(metal==='Silver'){
      let result;for(const url of SILVER_URLS){try{result=parseSilver(await (await get(url)).json());break;}catch{}}
      if(!result)throw Error('silver_sources_failed');quote=result;source='XAG/USD spot via currency-api';
    }else{quote=parseWestmetall(await (await get(`https://www.westmetall.com/en/markdaten.php?action=table&field=${metal==='Aluminium'?'LME_Al_cash':'LME_Cu_cash'}`)).text(),metal);source=metal==='Aluminium'?'LME aluminium cash via Westmetall':'LME copper 3-month via Westmetall';}
    const base=current[metal].price;
    if(quote.price<base*0.5||quote.price>base*2){status[metal]='rejected: outside 0.5–2× last good price';continue;}
    saved.push({metal,...quote,unit:current[metal].unit,source,fetched_at:now.toISOString()});status[metal]='updated';
  }catch{status[metal]='fetch failed; retained last good/workbook value';}}
  if(saved.length)await store.save(saved);
  return {skipped:false,updated:saved.length,status};
}
