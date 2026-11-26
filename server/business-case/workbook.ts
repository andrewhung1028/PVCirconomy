import { businessCasePositiveInteger, defaultPanelsParameter, shiftsPerLineParameter } from "../../lib/business-case/defaults";
import {checkRegionUnit, checkMaterialUnit, REGION_UNIT_SUFFIXES, unitCurrency} from '../../lib/business-case/units';
import ExcelJS from 'exceljs';
import {fallback} from '../../lib/business-case/fallback';
import type {MasterData} from '../../lib/business-case/types';
import {calculateBusinessCase} from '../../lib/business-case/calculator/engine';
export type BusinessCaseData = MasterData;
export const seed:BusinessCaseData=fallback;
type Sheet={name:string;key:keyof Omit<BusinessCaseData,'source'>;columns:string[];fields:string[]};
const sheet=(name:string,key:Sheet['key'],headers:string,fields:string):Sheet=>({name,key,columns:headers.split('|'),fields:fields.split('|')});
export const sheets:Sheet[]=[
 sheet('Operating Regions','regions','Region Code|Region|Country|Country Code|Currency|Fee Unit|Default Processing Fee|Hourly Wage|Wage Unit|Base Rent|CAM / NNN|Rent Unit|Electricity Price|Electricity Unit|Landfill Cost|Landfill Unit|Active|Sort Order','code|region|country|countryCode|currency|feeUnit|defaultFee|hourlyWage|wageUnit|baseRent|cam|rentUnit|electricityPrice|electricityUnit|landfillCost|landfillUnit|active|sortOrder'),
 sheet('Processing Solutions','solutions','Solution Code|Solution Name|Provider|Technology Type|CAPEX (USD/line)|Capacity (panels/hour/line)|Direct Operators (FTE/shift)|Space Required (sq.ft.)|Electricity Consumption (kWh/panel)|Consumables (USD/panel)|Maintenance (% CAPEX/year)|Active|Sort Order','code|name|provider|technologyType|capexUSD|capacity|operators|spaceSqFt|kwhPerPanel|consumablesUSDPerPanel|maintenanceRate|active|sortOrder'),
 sheet('OPEX Parameters','opex','Country Code|OPEX Parameter Code|Value|Unit|Currency|Active','countryCode|parameter|value|unit|currency|active'),
 sheet('Currency Exchange','fx','Currency Code|Local per USD|Effective Date|Active','currency|localPerUSD|effectiveDate|active'),
 sheet('Materials','materials','Material Code|Material|Category|Default Composition|Benchmark Price|Currency|Price Unit|Active|Sort Order','code|name|category|composition|benchmarkPrice|currency|priceUnit|active|sortOrder'),
 sheet('Solution Material Recovery','recovery','Solution Code|Material Code|Recovery Rate|Realization vs Benchmark|Saleable|Recovered Material Treatment|Unrecovered Material Treatment|Active','solutionCode|materialCode|recoveryRate|realization|saleable|recoveredTreatment|unrecoveredTreatment|active'),
];
const numberFields=new Set('defaultFee hourlyWage baseRent cam electricityPrice landfillCost sortOrder capexUSD capacity operators spaceSqFt kwhPerPanel consumablesUSDPerPanel maintenanceRate value localPerUSD composition benchmarkPrice recoveryRate realization'.split(' '));
const nullable=new Set(['benchmarkPrice','recoveryRate','realization']);
const booleanFields=new Set(['active','saleable']);
export function validateData(input:unknown):BusinessCaseData {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Workbook row 1, cell A1: Invalid dataset');
 // Stored v1 JSON remains valid; normalize without mutating the caller.
 const {payable: _legacyPayable, ...raw}=input as BusinessCaseData & {payable?:unknown};
 const data={...raw,regions:Array.isArray(raw.regions)?raw.regions.map(r=>r && typeof r==='object' && !Object.hasOwn(r,'wageUnit')?{...r,wageUnit:`${r.currency}/hour`}:r):raw.regions} as BusinessCaseData;
 if(Object.keys(data).some(k=>!['source',...sheets.map(s=>s.key)].includes(k)))throw Error('Workbook row 1, cell A1: Unexpected data field');
 for(const s of sheets){const rows=data[s.key] as unknown as Record<string,unknown>[];if(!Array.isArray(rows)||rows.length>10000||!rows.length)throw Error(s.name+' row 1, cell A1: Missing or excessive rows');
 const keys=new Set<string>();
 for(const [index,row] of rows.entries()){
 const fail=(message:string,field=s.fields[0]):Error=>{return Error(`${s.name} row ${index+2}, column ${s.columns[s.fields.indexOf(field)]} (${field}): ${message}`);};if(!row||typeof row!=='object'||Object.keys(row).length!==s.fields.length||s.fields.some(f=>!Object.hasOwn(row,f)))throw fail('Invalid fields');
 for(const f of s.fields){const v=row[f];if(nullable.has(f)&&v===null)continue;if(numberFields.has(f)){if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw fail('Invalid nonnegative number',f);if(['composition','recoveryRate','realization','maintenanceRate'].includes(f)&&v>1)throw fail('Rate must be between 0 and 1',f);if(['capacity','localPerUSD'].includes(f)&&v===0)throw fail('Positive value required',f);}else if(booleanFields.has(f)){if(typeof v!=='boolean')throw fail('Boolean required',f);}else if(typeof v!=='string'||v.length>2000||v.includes('\0'))throw fail('Invalid text',f);}
 const identity=s.key==='opex'?row.countryCode+'|'+row.parameter:s.key==='recovery'?row.solutionCode+'|'+row.materialCode:row.code??row.currency;
 if(!identity||keys.has(String(identity)))throw fail('Missing or duplicate key');keys.add(String(identity));
 }
 }
 const regionCodes=new Set(data.regions.map(r=>r.countryCode)), currencies=new Set(data.fx.filter(r=>r.active).map(r=>r.currency));
 for(const r of data.regions)if(r.active&&!currencies.has(r.currency))throw Error(`Operating Regions row ${data.regions.indexOf(r)+2}, column Currency: Missing active FX ${r.currency}`);
 for(const [index,r] of data.regions.entries())if(r.active){
  for(const field of Object.keys(REGION_UNIT_SUFFIXES) as (keyof typeof REGION_UNIT_SUFFIXES)[]){
   const fail=(message:string)=>Error(`Operating Regions row ${index+2}, column ${sheets[0].columns[sheets[0].fields.indexOf(field)]} (${field}): ${message}`);
   try{checkRegionUnit(field,r[field],r.currency);}catch(error){throw fail((error as Error).message);}
   if(!currencies.has(unitCurrency(r[field])))throw fail(`Missing active FX ${unitCurrency(r[field])}`);
  }
  for(const [i,o] of data.opex.entries())if(o.active&&o.countryCode===r.countryCode&&o.currency!==r.currency)throw Error(`OPEX Parameters row ${i+2}, column Currency: Must equal region currency ${r.currency} (${r.code})`);
 }
 for(const [i,m] of data.materials.entries())if(m.active){try{checkMaterialUnit(m.priceUnit);}catch(error){throw Error(`Materials row ${i+2}, column Price Unit: ${(error as Error).message}`);}}
 for(const o of data.opex)if(!regionCodes.has(o.countryCode))throw Error(`OPEX Parameters row ${data.opex.indexOf(o)+2}, column Country Code: Unknown OPEX country`);
 for(const [index,row] of data.opex.entries()){
  const code=row.parameter.trim().toUpperCase();
  const prefix=`${row.countryCode}-`;
  const key=code.startsWith(prefix)?code.slice(prefix.length):code;
  if((key===defaultPanelsParameter||key===shiftsPerLineParameter)
   && (!businessCasePositiveInteger(row.value)||(key===shiftsPerLineParameter&&row.value>24)))
   throw Error(`OPEX Parameters row ${index+2}, column Value: ${key} requires a positive integer`);
 }

 for(const r of data.recovery)if(!data.solutions.some(s=>s.code===r.solutionCode)||!data.materials.some(m=>m.code===r.materialCode))throw Error(`Solution Material Recovery row ${data.recovery.indexOf(r)+2}, columns Solution Code / Material Code: Unknown recovery reference`);
 for(const r of data.regions.filter(r=>r.active)){try{calculateBusinessCase(data,{regionCode:r.code,panelsPerMonth:1000,processingFee:r.defaultFee,solutionCodes:data.solutions.filter(s=>s.active).map(s=>s.code)});}catch{throw Error(`Operating Regions row ${data.regions.indexOf(r)+2}, column Region Code: Calculation validation failed for ${r.code}; check linked OPEX, FX and recovery data`);}}
 return {...data,source:'master'};
}
export async function exportWorkbook(data:BusinessCaseData=seed){const book=new ExcelJS.Workbook();for(const s of sheets){const ws=book.addWorksheet(s.name);ws.addRow(s.columns);for(const row of data[s.key])ws.addRow(s.fields.map(f=>f==='wageUnit'?((row as any).wageUnit??`${(row as any).currency}/hour`):(row as unknown as Record<string,ExcelJS.CellValue>)[f]));ws.getRow(1).font={bold:true};ws.views=[{state:'frozen',ySplit:1}];ws.columns.forEach(c=>{c.width=28});}return Buffer.from(await book.xlsx.writeBuffer());}
/** Keys are shared by validation and diffing; row position is never an identity. */
function rowKey(s:Sheet,row:Record<string,unknown>):string {
 return JSON.stringify((s.key==='opex'?['countryCode','parameter']:s.key==='recovery'?['solutionCode','materialCode']:s.key==='fx'?['currency']:['code']).map(f=>row[f]));
}
export async function parseWorkbook(bytes:Buffer){
 if(bytes.length>3_000_000)throw Error('Workbook row 1, cell A1: Workbook exceeds 3 MB');
 const book=new ExcelJS.Workbook();
 try{await book.xlsx.load(bytes as never);}catch{throw Error('Workbook row 1, cell A1: Unable to read XLSX');}
 if(book.worksheets.filter(sheet=>sheet.name!=='Payable').length!==sheets.length)throw Error('Workbook row 1, cell A1: Exactly six supported sheets required');
 const data:Record<string,unknown>={source:'master'};
 for(const s of sheets){
  const ws=book.getWorksheet(s.name);
  const legacy=s.key==='regions'&&ws?.columnCount===17;
  const columns=legacy?s.columns.filter(h=>h!=='Wage Unit'):s.columns;
  const fields=legacy?s.fields.filter(f=>f!=='wageUnit'):s.fields;
  if(!ws||ws.columnCount!==columns.length||ws.rowCount>10001)throw Error(`${s.name} row 1, cell A1: Missing sheet, unexpected columns or excessive rows`);
  ws.eachRow(row=>row.eachCell(cell=>{
   if(cell.type===ExcelJS.ValueType.Formula||(typeof cell.value==='object'&&cell.value!==null&&!(cell.value instanceof Date)))throw Error(`${s.name} row ${row.number}, cell ${cell.address}: Formulas and rich cell values are not allowed`);
  }));
  columns.forEach((h,i)=>{if(ws.getRow(1).getCell(i+1).value!==h)throw Error(`${s.name} row 1, cell ${ws.getRow(1).getCell(i+1).address}: Expected header ${h}`);});
  const rows:Record<string,unknown>[]=[];
  for(let i=2;i<=ws.rowCount;i++){
   const row=ws.getRow(i);if(!row.hasValues)continue;
   const value:Record<string,unknown>={};
   fields.forEach((f,j)=>{
    let v:unknown=row.getCell(j+1).value;
    if(v instanceof Date){if(!Number.isFinite(v.getTime()))throw Error(`${s.name} row ${i}, cell ${row.getCell(j+1).address}: Invalid date`);v=v.toISOString().slice(0,10);}
    if(numberFields.has(f)&&typeof v==='string'){
     const text=v.trim();
     v=/^[+]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)||/^[+]?\.\d+$/.test(text)?Number(text.replaceAll(',','')):NaN;
    }
    value[f]=v===null||v===undefined?(nullable.has(f)?null:numberFields.has(f)?NaN:booleanFields.has(f)?null:''):v;
   });
   // Validate without losing original worksheet row numbers when there are blank rows.
   rows.push(value);
  }
  data[s.key]=rows;
 }
 try{return validateData(data);}catch(error){
  let message=error instanceof Error?error.message:'Invalid dataset';
  for(const s of sheets){message=message.replace(new RegExp(`^${s.name} row (\\d+)`),(_,n)=>{const ws=book.getWorksheet(s.name)!;const populated:number[]=[];for(let i=2;i<=ws.rowCount;i++)if(ws.getRow(i).hasValues)populated.push(i);return `${s.name} row ${populated[Number(n)-2]??n}`;});}
  throw Error(message);
 }
}
export type DataDiff={field:string;label:string;sheet:string;key:string;kind:'added'|'removed'|'changed';before:string;after:string};
export function diffData(before:BusinessCaseData,after:BusinessCaseData):DataDiff[]{
 const changes:DataDiff[]=[];
 for(const s of sheets){
  const index=(data:BusinessCaseData)=>new Map((data[s.key] as unknown as Record<string,unknown>[]).map(row=>[rowKey(s,row),s.key==='regions'?{...row,wageUnit:row.wageUnit??`${row.currency}/hour`}:row]));
  const a=index(before),b=index(after);
  for(const key of new Set([...a.keys(),...b.keys()])){
   const x=a.get(key),y=b.get(key);if(x&&y&&s.fields.every(f=>x[f]===y[f]))continue;
   const kind=!x?'added':!y?'removed':'changed';
   const fields=s.fields.filter(f=>x?.[f]!==y?.[f]);
   changes.push({field:`${s.key}.${key}`,label:`${key}: ${fields.join(', ')}`,sheet:s.name,key,kind,before:x?JSON.stringify(Object.fromEntries(fields.map(f=>[f,x[f]]))):'',after:y?JSON.stringify(Object.fromEntries(fields.map(f=>[f,y[f]]))):''});
  }
 }
 return changes;
}
