import ExcelJS from 'exceljs';
import {fallback} from '../../lib/business-case/fallback';
import type {MasterData} from '../../lib/business-case/types';
import {calculateBusinessCase} from '../../lib/business-case/calculator/engine';
export type BusinessCaseData = MasterData & {payable: {material:string;route:string;payable:number;source:string;note:string}[]};
export const seed:BusinessCaseData={...fallback,payable:[]};
type Sheet={name:string;key:keyof Omit<BusinessCaseData,'source'>;columns:string[];fields:string[]};
const sheet=(name:string,key:Sheet['key'],headers:string,fields:string):Sheet=>({name,key,columns:headers.split('|'),fields:fields.split('|')});
export const sheets:Sheet[]=[
 sheet('Operating Regions','regions','Region Code|Region|Country|Country Code|Currency|Fee Unit|Default Processing Fee|Hourly Wage|Base Rent|CAM / NNN|Rent Unit|Electricity Price|Electricity Unit|Landfill Cost|Landfill Unit|Active|Sort Order','code|region|country|countryCode|currency|feeUnit|defaultFee|hourlyWage|baseRent|cam|rentUnit|electricityPrice|electricityUnit|landfillCost|landfillUnit|active|sortOrder'),
 sheet('Processing Solutions','solutions','Solution Code|Solution Name|Provider|Technology Type|CAPEX (USD/line)|Capacity (panels/hour/line)|Direct Operators (FTE/shift)|Space Required (sq.ft.)|Electricity Consumption (kWh/panel)|Consumables (USD/panel)|Maintenance (% CAPEX/year)|Active|Sort Order','code|name|provider|technologyType|capexUSD|capacity|operators|spaceSqFt|kwhPerPanel|consumablesUSDPerPanel|maintenanceRate|active|sortOrder'),
 sheet('OPEX Parameters','opex','Country Code|OPEX Parameter Code|Value|Unit|Currency|Active','countryCode|parameter|value|unit|currency|active'),
 sheet('Currency Exchange','fx','Currency Code|Local per USD|Effective Date|Active','currency|localPerUSD|effectiveDate|active'),
 sheet('Materials','materials','Material Code|Material|Category|Default Composition|Benchmark Price|Currency|Price Unit|Active|Sort Order','code|name|category|composition|benchmarkPrice|currency|priceUnit|active|sortOrder'),
 sheet('Solution Material Recovery','recovery','Solution Code|Material Code|Recovery Rate|Realization vs Benchmark|Saleable|Recovered Material Treatment|Unrecovered Material Treatment|Active','solutionCode|materialCode|recoveryRate|realization|saleable|recoveredTreatment|unrecoveredTreatment|active'),
 sheet('Payable','payable','Material|Route/Solution|Payable %|Source|Note','material|route|payable|source|note'),
];
const numberFields=new Set('defaultFee hourlyWage baseRent cam electricityPrice landfillCost sortOrder capexUSD capacity operators spaceSqFt kwhPerPanel consumablesUSDPerPanel maintenanceRate value localPerUSD composition benchmarkPrice recoveryRate realization payable'.split(' '));
const nullable=new Set(['benchmarkPrice','recoveryRate','realization']);
const booleanFields=new Set(['active','saleable']);
export function validateData(input:unknown):BusinessCaseData {
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid dataset');
 const data=input as BusinessCaseData;
 if(Object.keys(data).some(k=>!['source',...sheets.map(s=>s.key)].includes(k)))throw Error('Unexpected data field');
 for(const s of sheets){const rows=data[s.key] as unknown as Record<string,unknown>[];if(!Array.isArray(rows)||rows.length>10000||(s.key!=='payable'&&!rows.length))throw Error('Missing or excessive rows: '+s.name);
 const keys=new Set<string>();
 for(const row of rows){if(!row||typeof row!=='object'||Object.keys(row).length!==s.fields.length||s.fields.some(f=>!Object.hasOwn(row,f)))throw Error('Invalid fields: '+s.name);
 for(const f of s.fields){const v=row[f];if(nullable.has(f)&&v===null)continue;if(numberFields.has(f)){if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw Error('Invalid nonnegative number: '+s.name+' / '+f);if(['composition','recoveryRate','realization','maintenanceRate'].includes(f)&&v>1)throw Error('Rate must be between 0 and 1: '+f);if(f==='payable'&&v>100)throw Error('Payable % must be 0–100');if(['capacity','localPerUSD'].includes(f)&&v===0)throw Error('Positive value required: '+f);}else if(booleanFields.has(f)){if(typeof v!=='boolean')throw Error('Boolean required: '+f);}else if(typeof v!=='string'||v.length>2000||v.includes('\0'))throw Error('Invalid text: '+f);}
 const identity=s.key==='opex'?row.countryCode+'|'+row.parameter:s.key==='recovery'?row.solutionCode+'|'+row.materialCode:s.key==='payable'?row.material+'|'+row.route:row.code??row.currency;
 if(!identity||keys.has(String(identity)))throw Error('Missing or duplicate key: '+s.name);keys.add(String(identity));
 }
 }
 const regionCodes=new Set(data.regions.map(r=>r.countryCode)), currencies=new Set(data.fx.filter(r=>r.active).map(r=>r.currency));
 for(const r of data.regions)if(r.active&&!currencies.has(r.currency))throw Error('Missing active FX: '+r.currency);
 for(const o of data.opex)if(!regionCodes.has(o.countryCode))throw Error('Unknown OPEX country');
 for(const r of data.recovery)if(!data.solutions.some(s=>s.code===r.solutionCode)||!data.materials.some(m=>m.code===r.materialCode))throw Error('Unknown recovery reference');
 for(const r of data.regions.filter(r=>r.active))calculateBusinessCase(data,{regionCode:r.code,panelsPerMonth:1000,processingFee:r.defaultFee,solutionCodes:data.solutions.filter(s=>s.active).map(s=>s.code)});
 return {...data,source:'master'};
}
export async function exportWorkbook(data:BusinessCaseData=seed){const book=new ExcelJS.Workbook();for(const s of sheets){const ws=book.addWorksheet(s.name);ws.addRow(s.columns);for(const row of data[s.key])ws.addRow(s.fields.map(f=>(row as unknown as Record<string,ExcelJS.CellValue>)[f]));ws.getRow(1).font={bold:true};ws.views=[{state:'frozen',ySplit:1}];ws.columns.forEach(c=>{c.width=28});}return Buffer.from(await book.xlsx.writeBuffer());}
export async function parseWorkbook(bytes:Buffer){if(bytes.length>3_000_000)throw Error('Workbook exceeds 3 MB');const book=new ExcelJS.Workbook();await book.xlsx.load(bytes as never);if(book.worksheets.length!==7)throw Error('Exactly seven sheets required');const data:Record<string,unknown>={source:'master'};
 for(const s of sheets){const ws=book.getWorksheet(s.name);if(!ws||ws.columnCount!==s.columns.length||ws.rowCount>10001)throw Error('Invalid sheet: '+s.name);ws.eachRow(row=>row.eachCell(cell=>{if(cell.type===ExcelJS.ValueType.Formula||typeof cell.value==='object'&&cell.value!==null)throw Error('Formulas and rich cell values are not allowed');}));if(s.columns.some((h,i)=>ws.getRow(1).getCell(i+1).value!==h))throw Error('Headers must match exactly: '+s.name);
 const rows:Record<string,unknown>[]=[];for(let i=2;i<=ws.rowCount;i++){const row=ws.getRow(i);if(!row.hasValues)continue;const value:Record<string,unknown>={};s.fields.forEach((f,j)=>{const v=row.getCell(j+1).value;value[f]=v===null||v===undefined?(nullable.has(f)?null:numberFields.has(f)?NaN:booleanFields.has(f)?null:''):v;});rows.push(value);}data[s.key]=rows;
 }return validateData(data);
}
export type DataDiff={field:string;label:string;before:string;after:string};
export function diffData(before:BusinessCaseData,after:BusinessCaseData):DataDiff[]{const changes:DataDiff[]=[];for(const s of sheets){const a=before[s.key],b=after[s.key];for(let i=0;i<Math.max(a.length,b.length);i++)for(const f of s.fields){const x=(a[i] as unknown as Record<string,unknown>)?.[f],y=(b[i] as unknown as Record<string,unknown>)?.[f];if(x!==y)changes.push({field:`${s.key}.${i}.${f}`,label:`${s.name} row ${i+2}: ${f}`,before:String(x??''),after:String(y??'')});}}return changes;}
