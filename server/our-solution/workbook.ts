import ExcelJS from 'exceljs';
import layout from '../../data/our-solution-workbook-layout.json';
import schema from '../../data/our-solution-parameter-schema.json';
import { markets, type Parameters } from '../../lib/our-solution/parameters';
import { validateParameters } from '../../lib/our-solution/validation';
import { model, type EffectivePrices } from '../../lib/our-solution/model';
const sections = schema as Record<string,Record<string,(string|number)[]>>;
const streamMaterial: Record<string,string>={'Glass':'Glass','Aluminium frame':'Aluminium','Junction box + cable':'Junction box','EVA':'EVA','Backsheet':'Backsheet','Silicon cell':'Silicon','Copper ribbon':'Copper','Other':'Residual / mixed fraction'};
const canonicalLabel = (value: string | number) => typeof value === 'string' ? value.replace(/hot[- ]knife/gi, match => match.includes('-') ? 'thermal-processing' : 'Thermal processing') : value;
const scenarioKeys=['region_code','region','panels_per_month','panel_weight_lb','operating_hours_per_day','working_weeks_per_year','working_days_per_week'];
function raw(c:ExcelJS.Cell):string|number {
  if(typeof c.value==='number'||typeof c.value==='string') return c.value;
  throw Error(`欄位 ${c.worksheet.name}!${c.address} 必須是數值或文字，不可使用公式、連結或複合格式。`);
}
function rows(sheet:ExcelJS.Worksheet) {
  const groups:Record<string,Map<string,ExcelJS.Row>>={}; let section='0';groups[section]=new Map();
  sheet.eachRow(row=>{const key=row.getCell(1).value;if(typeof key!=='string')return;
    if(sheet.name==='Assumptions'&&/^\d+\./.test(key)){section=key.split('.')[0];if(groups[section])throw Error(`${sheet.name} 區段 ${section} 重複。`);groups[section]=new Map();}
    if(groups[section].has(key))throw Error(`${sheet.name} 包含重複欄位 ${key}。`);groups[section].set(key,row);
  });return groups;
}
function get(map:Map<string,ExcelJS.Row>|undefined,label:string,sheet:string){const row=map?.get(label);if(!row)throw Error(`${sheet} 缺少欄位 ${label}。`);return row;}
function table(sheet:ExcelJS.Worksheet, headers:string[], years:number[]) {
  const matches:ExcelJS.Row[]=[];sheet.eachRow(row=>{if(row.getCell(1).value==='Year')matches.push(row)});
  if(matches.length!==1)throw Error(`${sheet.name} 必須有且只有一個 Year 標題列。`);
  const header=matches[0], columns=new Map<string,number>();header.eachCell(c=>{const v=String(c.value);if(columns.has(v))throw Error(`${sheet.name} 標題 ${v} 重複。`);columns.set(v,Number(c.col))});
  if(columns.size!==headers.length+1||headers.some(h=>!columns.has(h)))throw Error(`${sheet.name} 標題不符。`);
  const out=Object.fromEntries(headers.map(h=>[h,{} as Record<string,number>]));const seen=new Set<number>();
  sheet.eachRow(row=>{if(row.number<=header.number)return;const y=row.getCell(1).value;if(y==null)return;
    if(typeof y!=='number'||!years.includes(y)||seen.has(y))throw Error(`${sheet.name} 年份無效或重複：${y}。`);seen.add(y);
    for(const h of headers){const c=row.getCell(columns.get(h)!);const v=raw(c);if(typeof v!=='number'||!Number.isFinite(v))throw Error(`欄位 ${sheet.name}!${c.address} 必須是有限數字。`);out[h][y]=v;}
  });for(const y of years)if(!seen.has(y))throw Error(`${sheet.name} 缺少年份 ${y}。`);return out;
}
export async function parseOurSolutionWorkbook(buffer:Buffer, _base?:Parameters):Promise<Parameters> {
  const w=new ExcelJS.Workbook();await w.xlsx.load(buffer as never);
  if(w.getWorksheet('Annual Summary')||!w.getWorksheet('Assumptions'))throw Error('舊版結果格式工作簿不再支援，請下載現行參數範本後重新匯入。');
  for(const s of layout)if(!w.getWorksheet(s.name))throw Error(`缺少工作表：${s.name}。`);
  if(w.worksheets.some(s=>!layout.some(l=>l.name===s.name)))throw Error('工作表格式不符，請下載現行範本。');
  const a=w.getWorksheet('Assumptions')!,groups=rows(a),materialRows=groups['5'];
  // A formula is allowed only in Product Value, or the designated Section 8 cells.
  for(const s of w.worksheets)s.eachRow(row=>row.eachCell(c=>{
    if(c.type!==ExcelJS.ValueType.Formula)return;
    if(s.name==='Product Value')return;
    const key=String(row.getCell(1).value),in8=groups['8']?.get(key)?.number===row.number;
    if(s.name==='Assumptions'&&in8){
      if(['Theoretical silver content upper limit (%)','Theoretical silver content upper limit (g/t)'].includes(key)&&Number(c.col)>=3&&Number(c.col)<=5)return;
      if(Number(c.col)===2&&streamMaterial[key]){
        const expected=`B${get(materialRows,streamMaterial[key],'Assumptions').number}`;
        const formula=c.formula.replace(/\$/g,'').replace(/^=?('Assumptions'|Assumptions)!/,'').trim();
        if(formula===expected)return;
        throw Error(`欄位 Assumptions!${c.address} 公式必須參照相符材料的 Section 5 ${expected}。`);
      }
    }
    throw Error(`欄位 ${s.name}!${c.address} 不可使用公式。`);
  }));
  // Header rows are located by their labels, never by their row numbers.
  for(const [section,label,expected] of [
    ['4','Parameter',['Shredding','Thermal processing','PV Circulator','Unit']],
    ['5','Material',['Share of module mass','Benchmark price','Price unit','Price source']],
    ['6','Material',['Recovery','Realization','Saleable','Recovery','Realization','Saleable','Recovery','Realization','Saleable']],
    ['8','Component',['Mass share of module','In shredding mix','In thermal-processing laminate','In PV Circulator cell powder']],
  ] as [string,string,string[]][]){const header=get(groups[section],label,'Assumptions');expected.forEach((v,i)=>{if(canonicalLabel(raw(header.getCell(i+2)))!==v)throw Error(`欄位 Assumptions!${header.getCell(i+2).address} 標題必須是 ${v}。`);});}
  const recoveryHeader=get(groups['6'],'Material','Assumptions');
  const recoveryTitles=a.getRow(recoveryHeader.number-1);
  ['Shredding','Thermal processing','PV Circulator'].forEach((label,i)=>{const c=recoveryTitles.getCell(2+i*3);if(canonicalLabel(raw(c))!==label)throw Error(`欄位 Assumptions!${c.address} 方案標題必須是 ${label}。`);});
  for(const section of ['8'])for(const label of ['Theoretical silver content upper limit (%)','Theoretical silver content upper limit (g/t)'])get(groups[section],label,'Assumptions');
  const assumptions:Parameters['assumptions']={};
  for(const [section,defs] of Object.entries(sections)){
    assumptions[section]={};
    for(const [label,values] of Object.entries(defs)){
      const row=get(groups[section],label,'Assumptions');
      assumptions[section][label]=values.map((base,i)=>{const c=row.getCell(i+(section==='8'?3:2));const v=raw(c);if(typeof v!==typeof base)throw Error(`欄位 Assumptions!${c.address} 類型不正確。`);return v;});
      if(section==='8') {const c=row.getCell(2);if(c.type!==ExcelJS.ValueType.Formula&&raw(c)!==raw(get(materialRows,streamMaterial[label],'Assumptions').getCell(2)))throw Error(`欄位 Assumptions!${c.address} 必須與 Section 5 相符材料比例一致。`);}
    }
  }
  const sr=rows(w.getWorksheet('Scenario')!)['0'];
  const actual=[...sr.keys()].filter(k=>k!=='field_key');if(actual.length!==scenarioKeys.length||actual.some(k=>!scenarioKeys.includes(k)))throw Error('Scenario 欄位不符，請下載現行範本。');
  const scenario=Object.fromEntries(scenarioKeys.map(k=>[k,raw(get(sr,k,'Scenario').getCell(3))])) as Parameters['scenario'];
  const cap=table(w.getWorksheet('Capacity History')!,[...markets],[...Array.from({length:25},(_,i)=>2000+i),2050]) as Parameters['capacityHistory'];
  const years=Array.from({length:31},(_,i)=>2020+i),euLayout=layout.find(s=>s.name==='EU-27 Population')!;
  const euHeaders=euLayout.rows.find(r=>r.cells[0]?.value==='Year')!.cells.slice(1).map(c=>String(c.value));
  const population=table(w.getWorksheet('Population')!,markets.filter(m=>m!=='Europe'),years) as unknown as Parameters['population'];
  population.eu27=table(w.getWorksheet('EU-27 Population')!,euHeaders,years);population.Europe=Object.fromEntries(years.map(y=>[y,Object.values(population.eu27).reduce((s,v)=>s+v[y],0)]));
  const data:Parameters={format:'parameters-v2',scenario,assumptions,capacityHistory:cap,population,meta:{currency:'USD',extractedAt:'2026-11-22T00:00:00.000Z',sourceSite:'https://businesscase.pvcirconomy.com/',note:'Illustrative business-case scenario; not a quotation or guarantee.'}};
  const errors=validateParameters(data);if(errors.length)throw Error(errors.join('\n'));return data;
}

export async function createOurSolutionWorkbook(data:Parameters, _template=false, effective:EffectivePrices={}) {
  const w=new ExcelJS.Workbook();w.creator='PV Circonomy';w.calcProperties.fullCalcOnLoad=true;
  for(const template of layout){const s=w.addWorksheet(template.name);s.columns=template.columns;
    template.rows.forEach((r,i)=>{const row=s.getRow(i+1);if(r.height)row.height=r.height;r.cells.forEach((c,j)=>{const cell=row.getCell(j+1);cell.value=structuredClone(c.value) as ExcelJS.CellValue;cell.style=structuredClone(c.style) as ExcelJS.Style;});});
    template.merges.forEach(m=>s.mergeCells(m));
  }
  const a=w.getWorksheet('Assumptions')!,groups=rows(a);
  for(const [section,defs] of Object.entries(data.assumptions))for(const [label,vals] of Object.entries(defs)){
    const row=get(groups[section],label,'Assumptions');vals.forEach((v,i)=>{const cell=row.getCell(i+(section==='8'?3:2));cell.value=v;cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}};});
  }
  for(const [name,v] of Object.entries(effective)) {if(v.workbookValue)continue;const row=groups['5'].get(name);if(row){row.getCell(3).value=v.price;row.getCell(4).value=v.unit;row.getCell(5).value=`${v.source}; as of ${v.asOf}`;}}
  const sr=rows(w.getWorksheet('Scenario')!)['0'];for(const [k,v] of Object.entries(data.scenario))get(sr,k,'Scenario').getCell(3).value=v;
  for(const name of ['Capacity History','Population','EU-27 Population']){
    const s=w.getWorksheet(name)!;const header=s.getRow(4);s.eachRow(row=>{const y=row.getCell(1).value;if(typeof y!=='number')return;header.eachCell(c=>{if(Number(c.col)===1)return;const key=String(c.value);const values=name==='Capacity History'?data.capacityHistory[key as keyof typeof data.capacityHistory]:name==='Population'?data.population[key as keyof typeof data.population]:data.population.eu27[key];row.getCell(c.col).value=(values as Record<string,number>)[y];});});
  }
  // Product Value and Section 8 formulas retain the template's live references.
  const result=model(data,effective);
  for(const [label,mat] of Object.entries(streamMaterial))get(groups['8'],label,'Assumptions').getCell(2).value={formula:`B${get(groups['5'],mat,'Assumptions').number}`,result:data.assumptions[5][mat][0] as number};
  for(const [i,code] of ['SHREDDING','HOT_KNIFE','PVCIRCULATOR'].entries()){
    for(const [label,mult] of [['Theoretical silver content upper limit (%)',1],['Theoretical silver content upper limit (g/t)',10000]] as const){const cell=get(groups['8'],label,'Assumptions').getCell(i+3);cell.value={formula:cell.formula,result:result.solutions[code as keyof typeof result.solutions].silverUpperPct*mult};}
  }
  // Silicon is deliberately workbook-only; no claim of an automated SMM feed.
  w.getWorksheet('Instructions')!.getCell('B12').value='Weekly prices: silver XAG/USD spot via currency-api; LME aluminium cash and LME copper 3-month via Westmetall. Silicon SMM #553 remains the workbook value (no reliable free feed).';
  return Buffer.from(await w.xlsx.writeBuffer());
}
