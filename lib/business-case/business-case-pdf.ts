import {resolveReportTimeZone, reportDate} from './report-time';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** Build the complete annual case from the exact submitted result snapshot. */
export async function createBusinessCasePdf(result: any, reference: string, timeZone = 'UTC', generatedAt = new Date()) {
  timeZone = resolveReportTimeZone(timeZone);
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const primary = result.solutions.find((s: any) => s.code === 'PVCIRCULATOR') || result.solutions[0];
  const compare = result.solutions.find((s: any) => s.code !== primary.code);
  const currency = result.region.currency;
  const number = (v: number, digits = 0) => new Intl.NumberFormat('en-US', {maximumFractionDigits: digits}).format(v);
  const money = (v: number) => new Intl.NumberFormat('en-US', {style:'currency',currency,maximumFractionDigits:0}).format(v);
  // Standard PDF fonts cannot encode every possible name. Keep numbers/currency intact.
  const safe = (s: string) => String(s).replace(/[^\x20-\x7e\u00a0-\u00ff]/g, '-');
  let page = doc.addPage([595.28,841.89]);
  let y = 790;
  const text = (value: string, x = 40, size = 10, heavy = false, green = false) => {
    page.drawText(safe(value), {x,y,size,font:heavy?bold:regular,color:green?rgb(0,0.45,0.18):rgb(0.08,0.08,0.08)});
  };
  const line = (value: string, size = 11, heavy = false) => {text(value,40,size,heavy); y -= size+12;};
  const newPage = () => {page=doc.addPage([595.28,841.89]);y=790;};
  line('PV CIRCONOMY',12,true);
  line('BUSINESS CASE REPORT',25,true);
  line(`Reference: ${reference}`,9);
  line(`Generated: ${reportDate(generatedAt,timeZone)} (${timeZone})`,9);
  y-=15;
  line('BUSINESS CASE SUMMARY',12,true);
  line(`${money(primary.annualEbitda)} in annual EBITDA.`,25,true);
  line('See what your recycling operation could achieve.',15);
  line(`At ${number(result.input.panelsPerMonth)} panels/month:`,11);
  if(compare) line(`${money(primary.annualEbitda-compare.annualEbitda)} more annual EBITDA than ${compare.name}.`,12,true);
  line(`Estimated standalone simple payback: ${primary.simplePaybackYears>0?primary.simplePaybackYears.toFixed(1)+' years':'Not achieved'}.`);
  y-=16;
  line('OPERATING BASIS',12,true);
  line(`Region: ${result.region.region} (${result.region.code}) | Currency: ${currency}`);
  line(`Processing fee: ${number(result.input.processingFee,4)} ${result.region.feeUnit}`);
  line(`Panel weight: ${result.region.feeUnit.endsWith('/kg') ? `${number(result.input.panelWeightLb * 0.45359237,2)} kg (${number(result.input.panelWeightLb,2)} lb)` : `${number(result.input.panelWeightLb,2)} lb`} | Annual panels: ${number(result.input.annualPanels)}`);
  line(`Operating days/month: ${number(result.input.operatingDaysPerMonth,2)} | Hours/shift: ${number(result.input.operatingHoursPerDay,2)}`);
  line(`FX: ${number(result.fx.localPerUSD,6)} ${currency}/USD | Effective: ${result.fx.effectiveDate || 'Not specified'}`,9);
  if(compare) {
    y-=16;line(`${primary.name} vs. ${compare.name}`,13,true);
    const annualPanels=result.input.annualPanels;
    line(`Annual EBITDA advantage: ${money(primary.annualEbitda-compare.annualEbitda)}`);
    line(`Operating cost reduction: ${compare.annualOpex?number((1-primary.annualOpex/compare.annualOpex)*100)+'%':'N/A'}`);
    line(`Additional material value: ${annualPanels?moneyPerPanel((primary.materialRevenue-compare.materialRevenue)/annualPanels):'N/A'} / panel`);
    line(`Residual reduction: ${compare.residualMetricTons?number((1-primary.residualMetricTons/compare.residualMetricTons)*100)+'%':'N/A'}`);
  }
  function moneyPerPanel(value:number){return new Intl.NumberFormat('en-US',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(value);}
  newPage();
  line('ANNUAL BUSINESS CASE',19,true);
  line('See where the economics come from.',13);
  line('Same panel volume and processing fee for both approaches.',9);
  line(`Amounts in ${currency}; all material and OPEX details expanded.`,9);
  const header=()=>{text('ANNUAL RESULTS',40,8,true);text(compare?.name || 'Comparison',250,8,true);text(primary.name,360,8,true);text('PV ADVANTAGE',470,8,true);y-=24;};
  header();
  const row=(label:string,p:number|undefined,c:number|undefined,heavy=false,cost=false)=>{
    if(y<65){newPage();line('ANNUAL BUSINESS CASE - CONTINUED',15,true);header();}
    text(label.length>35?label.slice(0,34)+'.':label,40,8,heavy);
    const values=[c,p,compare&&p!=null&&c!=null?(cost?c-p:p-c):undefined];
    values.forEach((v,i)=>{const value=v==null?'--':(i===2&&v>0?'+':'')+money(cost&&i<2?-v:v);const font=heavy?bold:regular;const right=[345,455,555][i];text(value,right-font.widthOfTextAtSize(safe(value),8),8,heavy,i===2&&v!=null&&v>0);});
    y-=17;page.drawLine({start:{x:40,y:y+7},end:{x:555,y:y+7},thickness:0.3,color:rgb(0.8,0.8,0.8)});
  };
  row('Processing revenue',primary.processingRevenue,compare?.processingRevenue);
  row('Material revenue',primary.materialRevenue,compare?.materialRevenue,true);
  const materialCodes=[...new Set<string>([...(primary.materials||[]),...(compare?.materials||[])].map((m:any)=>m.code||m.materialCode))];
  for(const code of materialCodes){const p=primary.materials.find((m:any)=>(m.code||m.materialCode)===code);const c=compare?.materials.find((m:any)=>(m.code||m.materialCode)===code);row('  '+(p?.name||c?.name||code),p?.revenue??0,c?.revenue??0);}
  row('Total revenue',primary.annualRevenue,compare?.annualRevenue,true);
  row('OPEX',primary.annualOpex,compare?.annualOpex,true,true);
  const opexCodes=[...new Set<string>([...(primary.opexDetail||[]),...(compare?.opexDetail||[])].map((o:any)=>o.code))];
  for(const code of opexCodes){const p=primary.opexDetail.find((o:any)=>o.code===code);const c=compare?.opexDetail.find((o:any)=>o.code===code);row('  '+(p?.name||c?.name||code),p?.value??0,c?.value??0,false,true);}
  row('EBITDA / annual contribution',primary.annualEbitda,compare?.annualEbitda,true);

  if(y<110)newPage();
  y-=14;line('ASSUMPTIONS AND LIMITATIONS',9,true);
  line('Illustrative estimates; not a quotation or guarantee. Simple payback uses',8);
  line('equipment CAPEX / annual EBITDA and excludes financing, tax and depreciation.',8);
  for(const solution of result.solutions){if(solution.incompleteMaterials?.length){if(y<65)newPage();line(`Incomplete recovery assumptions (${solution.name}): ${solution.incompleteMaterials.join(', ')}`,8);}}
  const pages=doc.getPages();pages.forEach((p,i)=>{p.drawText(`${reference} | PV Circonomy | ${i+1} / ${pages.length}`,{x:40,y:25,size:8,font:regular,color:rgb(0.4,0.4,0.4)});});
  doc.setTitle(`PV Circonomy Business Case ${reference}`);doc.setAuthor('PV Circonomy');
  return doc.save();
}
