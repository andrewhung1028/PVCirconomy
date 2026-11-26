import { defaultMouPolicy, validMouPolicy } from "../../lib/mou-policy";
import { freightCostTrend } from "../../lib/our-solution/freight-cost-trends";
import ExcelJS from 'exceljs';
import layout from '../../data/our-solution-workbook-layout.json';
import schema from '../../data/our-solution-parameter-schema.json';
import { markets, eu27Countries, type Parameters } from '../../lib/our-solution/parameters';
import { seededOurSolutionData } from '../../lib/our-solution-data';
import { ourSolutionParameterMarkets, parameterProfileForRegion, type AdditionalParameterMarket } from '../../lib/our-solution/market';
import { validateParameters } from '../../lib/our-solution/validation';
import { model, type EffectivePrices } from '../../lib/our-solution/model';
import { commonAssumptionSchema, sharedAssumptionKeys, sharedAssumptionValues, withSharedParameters, type SharedParameters } from '../../lib/our-solution/shared';
import { emptyMarketTransport, transportUnits, type MarketTransport } from '../../lib/our-solution/transport';
import { ourSolutionMarket } from '../../lib/our-solution/market';
import { japanFeeBenchmarkRows, retirementThresholdKeys, websiteAssumptionRows } from '../../lib/our-solution/public-data';
const baseSections:Record<string,Record<string,(string|number)[]>> = {...(schema as Record<string,Record<string,(string|number)[]>>),'12':websiteAssumptionRows};
const sectionsFor=(currency:string)=>{const out=structuredClone(baseSections);if(currency!=='USD'){out[11]['Processing fee steps']=out[11]['Processing fee steps (USD/lb)'];delete out[11]['Processing fee steps (USD/lb)'];}return out;};
const streamMaterial: Record<string,string>={'Glass':'Glass','Aluminium frame':'Aluminium','Junction box + cable':'Junction box','EVA':'EVA','Backsheet':'Backsheet','Silicon cell':'Silicon','Copper ribbon':'Copper','Other':'Residual / mixed fraction'};
const canonicalLabel = (value: string | number) => typeof value === 'string' ? value.replace(/hot[- ]knife/gi, match => match.includes('-') ? 'thermal-processing' : 'Thermal processing') : value;
const sharedScenarioKeys=['region_code','region','panels_per_month','operating_hours_per_day','working_weeks_per_year','working_days_per_week'];
const metricMetaKeys=['meta_currency','meta_locale','fx_local_per_usd'];
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
function appendWebsiteAssumptions(sheet:ExcelJS.Worksheet){
  if(rows(sheet)['12'])return;
  sheet.addRow([]);const heading=sheet.addRow(['12. Website data — public benchmarks and targets']);heading.getCell(1).font={bold:true,size:11};
  const header=sheet.addRow(['Field key','Value','Unit','Source','Section','Label']);header.font={bold:true,color:{argb:'FFFFFFFF'}};header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF151719'}};
  for(const [key,values] of Object.entries(websiteAssumptionRows))sheet.addRow([key,...values]);
}
const sharedSheets = ['Capacity History', 'Population', 'EU-27 Population'] as const;
const capacityYears = [...Array.from({length:25},(_,i)=>2000+i),2050];
const populationYears = Array.from({length:31},(_,i)=>2020+i);
const editable = {type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}} as const;
const commonSheetSections = {
  "3": ["Constants", "Value", "Unit"],
  "4": ["Solutions", "Shredding", "Thermal processing", "PV Circulator", "Unit"],
  "5": ["Materials", "Share of module mass"],
  "6": ["Recovery, realization and saleable", ...["Shredding", "Thermal processing", "PV Circulator"].flatMap(method =>
    ["Recovery", "Realization", "Saleable"].map(metric => `${method} · ${metric}`))],
  "7": ["Storage", "Value", "Unit"],
  "8": ["Silver-bearing stream membership", "Shredding mix", "Thermal-processing laminate", "PV Circulator cell powder"],
  "9": ["Cell powder scenarios", "Value", "Unit", "Source"],
  "10": ["Retirement model", "Value", "Unit"],
} satisfies Record<string, string[]>;

function readGlobalTables(w: ExcelJS.Workbook) {
  const capacityHistory = table(w.getWorksheet('Capacity History')!, [...markets], capacityYears) as Parameters['capacityHistory'];
  const population = table(w.getWorksheet('Population')!, markets.filter(m=>m!=='Europe'), populationYears) as unknown as Parameters['population'];
  population.eu27 = table(w.getWorksheet('EU-27 Population')!, [...eu27Countries], populationYears);
  population.Europe = Object.fromEntries(populationYears.map(y => [y, Object.values(population.eu27).reduce((sum, values) => sum + values[y], 0)]));
  return { capacityHistory, population };
}

function addLayoutSheet(w: ExcelJS.Workbook, template: typeof layout[number]) {
  const sheet = w.addWorksheet(template.name);
  sheet.columns = template.columns;
  template.rows.forEach((r,i)=>{const row=sheet.getRow(i+1);if(r.height)row.height=r.height;r.cells.forEach((c,j)=>{const cell=row.getCell(j+1);cell.value=structuredClone(c.value) as ExcelJS.CellValue;cell.style=structuredClone(c.style) as ExcelJS.Style;});});
  template.merges.forEach(m=>sheet.mergeCells(m));
}

function writeGlobalTables(w: ExcelJS.Workbook, data: Pick<Parameters, 'capacityHistory' | 'population'>) {
  for (const name of sharedSheets) {
    const sheet = w.getWorksheet(name);
    if (!sheet) continue;
    const columns = sheet.getRow(4);
    sheet.eachRow(row => {
      const year = row.getCell(1).value;
      if (typeof year !== 'number') return;
      columns.eachCell(cell => {
        if (Number(cell.col) === 1) return;
        const key = String(cell.value);
        const values = name === 'Capacity History' ? data.capacityHistory[key as keyof typeof data.capacityHistory]
          : name === 'Population' ? data.population[key as keyof typeof data.population] : data.population.eu27[key];
        row.getCell(cell.col).value = (values as Record<string,number>)[year];
      });
    });
  }
}

export async function createSharedParametersWorkbook(data: SharedParameters) {
  const w = new ExcelJS.Workbook();
  w.creator = 'PV Circonomy';
  for (const sheet of layout) if (sharedSheets.some(name => name === sheet.name)) addLayoutSheet(w, sheet);
  writeGlobalTables(w, data);
  const constants = w.addWorksheet('Shared Constants');
  constants.columns = [{width:42},{width:18},{width:24}];
  constants.addRow(['field_key', 'Value', 'Unit']);
  for (const [section, keys] of Object.entries(sharedAssumptionKeys)) {
    for (const key of keys) {
      const [value, unit] = data.assumptions[section][key];
      constants.addRow([`${section} · ${key}`, value, unit]).getCell(2).fill = editable;
    }
  }
  if (data.commonAssumptions) {
    const assumptions = w.addWorksheet('Assumptions');
    assumptions.columns = [{ width: 38 }, ...Array.from({ length: 9 }, () => ({ width: 26 }))];
    for (const [section, [title, ...headers]] of Object.entries(commonSheetSections)) {
      assumptions.addRow([`${section}. ${title}`]).font = { bold: true };
      assumptions.addRow(['Parameter', ...headers]).font = { bold: true };
      for (const [key, values] of Object.entries(data.commonAssumptions[section])) {
        const row = assumptions.addRow([key, ...values]);
        values.forEach((value, index) => { if (typeof value === 'number') row.getCell(index + 2).fill = editable; });
      }
    }
  }
  return Buffer.from(await w.xlsx.writeBuffer());
}

export async function parseSharedParametersWorkbook(buffer: Buffer, base: SharedParameters): Promise<SharedParameters> {
  const w = new ExcelJS.Workbook();
  await w.xlsx.load(buffer as never);
  const commonSheet = w.getWorksheet('Assumptions');
  if (w.worksheets.length !== (commonSheet ? 5 : 4) || !w.getWorksheet('Shared Constants') || sharedSheets.some(name => !w.getWorksheet(name))) {
    throw Error('請使用共用參數工作簿，其中須包含容量、人口、EU-27 人口及共用常數。');
  }
  const constants = rows(w.getWorksheet('Shared Constants')!)['0'];
  const expected = 1 + Object.values(sharedAssumptionKeys).reduce((sum, keys) => sum + keys.length, 0);
  if (constants.size !== expected || !constants.has('field_key')) throw Error('Shared Constants 欄位不符。');
  const assumptions = structuredClone(base.assumptions);
  for (const [section, keys] of Object.entries(sharedAssumptionKeys)) {
    for (const key of keys) {
      const row = get(constants, `${section} · ${key}`, 'Shared Constants');
      const value = raw(row.getCell(2));
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || (row.getCell(3).value ?? undefined) !== base.assumptions[section][key][1]) {
        throw Error(`Shared Constants · ${key} 必須為正數，且單位不得更改。`);
      }
      assumptions[section][key][0] = value;
    }
  }
  let commonAssumptions = base.commonAssumptions;
  if (commonSheet) {
    const groups = rows(commonSheet);
    if (!commonAssumptions || Object.keys(groups).length !== 1 + Object.keys(commonAssumptionSchema).length)
      throw Error('共用 Assumptions 格式不符，請下載現行版本。');
    commonAssumptions = structuredClone(commonAssumptions);
    for (const [section, definitions] of Object.entries(commonAssumptionSchema)) {
      if (groups[section]?.size !== Object.keys(definitions).length + 2)
        throw Error(`共用 Assumptions 區段 ${section} 欄位不符。`);
      for (const [key, expected] of Object.entries(definitions)) {
        const row = get(groups[section], key, 'Assumptions');
        commonAssumptions[section][key] = expected.map((definition, index) => {
          const cell = row.getCell(index + 2);
          const value = raw(cell);
          if (typeof value !== typeof definition || (typeof value === 'string' && value !== base.commonAssumptions?.[section][key][index])) {
            throw Error(`共用 Assumptions · ${key} 的欄位類型或固定單位不符。`);
          }
          return value;
        });
      }
    }
  }
  return { ...readGlobalTables(w), assumptions, ...(commonAssumptions && { commonAssumptions }) };
}

function transportRows(data: MarketTransport, market: NonNullable<ReturnType<typeof ourSolutionMarket>>) {
  const { distance, weight } = transportUnits(market);
  const currency = ourSolutionParameterMarkets[market].currency;
  return [
    ['max_panels_per_pallet', data.maxPanelsPerPallet, 'panels/pallet'],
    ['pallet_tare', data.palletTare, weight],
    ['pallet_length', data.palletLengthM, 'm'],
    ['pallet_width', data.palletWidthM, 'm'],
    ...(['truck', 'trailer'] as const).flatMap(vehicle => {
      const rate = data.vehicles[vehicle];
      return [
        [`${vehicle}_max_weight`, rate.maxWeight, weight],
        [`${vehicle}_interior_length`, rate.lengthM, 'm'],
        [`${vehicle}_interior_width`, rate.widthM, 'm'],
        [`${vehicle}_base`, rate.base, currency],
        [`${vehicle}_per_distance`, rate.perDistance, `${currency}/${distance}`],
        [`${vehicle}_minimum`, rate.minimum, currency],
      ] as const;
    }),
  ] as const;
}

const referenceSlots = Array.from({ length: 6 }, (_, index) => index + 1);

function readTransport(sheet: ExcelJS.Worksheet, market: NonNullable<ReturnType<typeof ourSolutionMarket>>): MarketTransport {
  const fields = rows(sheet)['0'];
  const definitions = transportRows(emptyMarketTransport(), market);
  const referenceKeys = referenceSlots.flatMap(i => [`reference_${i}_distance`, `reference_${i}_cost`]);
  const hasReferences = referenceKeys.some(key => fields.has(key));
  if (!fields.has('field_key') || fields.size !== definitions.length + 1 + (hasReferences ? referenceKeys.length : 0)) throw Error('Transport 欄位不符。');
  const values = Object.fromEntries(definitions.map(([key,, unit]) => {
    const row = get(fields, key, 'Transport');
    const cell = row.getCell(2);
    const value = cell.value === null ? null : raw(cell);
    if ((value !== null && typeof value !== 'number') || row.getCell(3).value !== unit) throw Error(`Transport · ${key} 必須使用 ${unit}，並填入數字或留空。`);
    return [key, value];
  }));
  const { distance } = transportUnits(market);
  const currency = ourSolutionParameterMarkets[market].currency;
  const referencePoints = hasReferences ? referenceSlots.flatMap(i => {
    const distanceRow = get(fields, `reference_${i}_distance`, 'Transport');
    const costRow = get(fields, `reference_${i}_cost`, 'Transport');
    const distanceValue = distanceRow.getCell(2).value, cost = costRow.getCell(2).value;
    if (distanceRow.getCell(3).value !== distance || costRow.getCell(3).value !== currency)
      throw Error(`Transport · 運費參考點 ${i} 的單位不得更改。`);
    if (distanceValue == null && cost == null) return [];
    if (typeof distanceValue !== 'number' || typeof cost !== 'number')
      throw Error(`Transport · 運費參考點 ${i} 必須同時填寫距離與費用。`);
    return [{ distance: distanceValue, cost }];
  }) : undefined;
  return {
    ...(referencePoints?.length ? { referencePoints } : {}),
    maxPanelsPerPallet: values.max_panels_per_pallet, palletTare: values.pallet_tare,
    palletLengthM: values.pallet_length, palletWidthM: values.pallet_width,
    vehicles: Object.fromEntries((['truck', 'trailer'] as const).map(vehicle => [vehicle, {
      maxWeight: values[`${vehicle}_max_weight`], lengthM: values[`${vehicle}_interior_length`],
      widthM: values[`${vehicle}_interior_width`], base: values[`${vehicle}_base`],
      perDistance: values[`${vehicle}_per_distance`], minimum: values[`${vehicle}_minimum`],
    }])) as MarketTransport['vehicles'],
  };
}

export async function parseOurSolutionWorkbook(buffer:Buffer, base?:Parameters, shared?:SharedParameters):Promise<Parameters> {
  const w=new ExcelJS.Workbook();await w.xlsx.load(buffer as never);
  if(w.getWorksheet('Annual Summary')||!w.getWorksheet('Assumptions'))throw Error('舊版結果格式工作簿不再支援，請下載現行參數範本後重新匯入。');
  for(const s of layout)if(!w.getWorksheet(s.name) && !(shared && sharedSheets.some(name => name === s.name)))throw Error(`缺少工作表：${s.name}。`);
  if(w.worksheets.some(s=>!['Transport','MOU'].includes(s.name) && !layout.some(l=>l.name===s.name)))throw Error('工作表格式不符，請下載現行範本。');
  const sr=rows(w.getWorksheet('Scenario')!)['0'];
  const regionCode=String(raw(get(sr,'region_code','Scenario').getCell(3)));
  const profile=parameterProfileForRegion(regionCode);
  const isJapan=profile?.currency==='JPY';
  const metric=Boolean(profile && profile.currency!=='USD');
  const scenarioKeys=[...sharedScenarioKeys,metric?'panel_weight_kg':'panel_weight_lb'];
  const expectedScenarioKeys=[...scenarioKeys,...(metric?metricMetaKeys:[])];
  const actual=[...sr.keys()].filter(k=>k!=='field_key');if(actual.length!==expectedScenarioKeys.length||actual.some(k=>!expectedScenarioKeys.includes(k)))throw Error('Scenario 欄位不符，請下載現行範本。');
  const currency=metric?String(raw(get(sr,'meta_currency','Scenario').getCell(3))) as Parameters['meta']['currency']:'USD';
  const sections=sectionsFor(currency);
  const a=w.getWorksheet('Assumptions')!,groups=rows(a),materialRows=groups['5'];
  if (isJapan && Object.keys(japanFeeBenchmarkRows).some(key => groups[12]?.has(key))) {
    Object.assign(sections[12], japanFeeBenchmarkRows);
  }
  if(!groups['12']&&(base||metric&&!isJapan))throw Error('Assumptions 缺少區段 12. Website data。請下載現行版本後再修改。');
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
    if(section==='12'&&!groups['12']){assumptions[section]=structuredClone(websiteAssumptionRows);continue;}
    assumptions[section]={};
    for(const [label,values] of Object.entries(defs)){
      const sharedValues = sharedAssumptionValues(shared, section, label);
      if (sharedValues?.length === values.length) {
        assumptions[section][label] = sharedValues;
        continue;
      }
      if (section === '12' && retirementThresholdKeys.some(key => key === label) && !groups[section]?.has(label)) {
        assumptions[section][label] = [...(base?.assumptions[section]?.[label] ?? values)];
        continue;
      }
      const row=get(groups[section],label,'Assumptions');
      assumptions[section][label]=values.map((base,i)=>{if(sharedValues && i<sharedValues.length)return sharedValues[i];const c=row.getCell(i+(section==='8'?3:2));const v=raw(c);if(typeof v!==typeof base)throw Error(`欄位 Assumptions!${c.address} 類型不正確。`);return v;});
      if(section==='8') {const c=row.getCell(2);if(c.type!==ExcelJS.ValueType.Formula&&raw(c)!==raw(get(materialRows,streamMaterial[label],'Assumptions').getCell(2)))throw Error(`欄位 Assumptions!${c.address} 必須與 Section 5 相符材料比例一致。`);}
    }
  }
  const scenario=Object.fromEntries(scenarioKeys.map(k=>[k,raw(get(sr,k,'Scenario').getCell(3))])) as Parameters['scenario'];
  const meta: Parameters['meta'] = metric ? {
    currency, locale: String(raw(get(sr,'meta_locale','Scenario').getCell(3))) as Parameters['meta']['locale'],
    localPerUSD: Number(raw(get(sr,'fx_local_per_usd','Scenario').getCell(3))),
    extractedAt: base?.meta.extractedAt ?? new Date().toISOString(),
    sourceSite: base?.meta.sourceSite ?? 'https://www.pvcirconomy.com/solutions/',
    note: base?.meta.note ?? `${profile?.region ?? regionCode} Our Solution parameter workbook.`,
  } : base?.meta ?? {currency:'USD',extractedAt:'2026-11-22T00:00:00.000Z',sourceSite:'https://businesscase.pvcirconomy.com/',note:'Illustrative business-case scenario; not a quotation or guarantee.'};
  const transportSheet = w.getWorksheet('Transport');
  const market = ourSolutionMarket(profile?.regionCode === 'GB' ? 'UK' : profile?.regionCode);
  const transport = transportSheet && market ? readTransport(transportSheet, market) : base?.transport;
  if (transport && !transport.referencePoints && !transportSheet?.getColumn(1).values.includes('reference_1_distance') && base?.transport?.referencePoints)
    transport.referencePoints = base.transport.referencePoints;
  const mouSheet = w.getWorksheet('MOU');
  const mouPolicy = mouSheet ? { validityDays: mouSheet.getCell('B2').value, confidentialityYears: mouSheet.getCell('B3').value } : base?.mouPolicy;
  if (mouSheet && (mouSheet.getCell('A2').value !== 'validity_days' || mouSheet.getCell('A3').value !== 'confidentiality_years' || !validMouPolicy(mouPolicy)))
    throw Error("MOU · 請保留欄位鍵並填寫有效年日數。");
  const marketData = { ...(validMouPolicy(mouPolicy) ? { mouPolicy } : {}), format: 'parameters-v2' as const, scenario, assumptions, meta, ...(transport ? { transport } : {}) };
  const data: Parameters = shared ? withSharedParameters(marketData, shared) : { ...marketData, ...readGlobalTables(w) };
  const errors=validateParameters(data);if(errors.length)throw Error(errors.join('\n'));return data;
}

export async function createOurSolutionWorkbook(data:Parameters, _template=false, effective:EffectivePrices={}, blankLocalInputs=false, marketOnly=false) {
  const w=new ExcelJS.Workbook();w.creator='PV Circonomy';w.calcProperties.fullCalcOnLoad=true;
  for (const template of layout) {
    if (!marketOnly || !sharedSheets.some(name => name === template.name)) addLayoutSheet(w, template);
  }
  const {currency}=data.meta;
  const isJapan=currency==='JPY', metric=currency!=='USD', additional=metric&&!isJapan;
  const a=w.getWorksheet('Assumptions')!;
  const legacyOperators=a.getRows(1,a.rowCount)?.find(row=>row.getCell(1).value==='Operators per shift');
  if(legacyOperators)a.spliceRows(legacyOperators.number,1);
  appendWebsiteAssumptions(a);
  if (isJapan) {
    for (const key of Object.keys(japanFeeBenchmarkRows)) {
      const values = data.assumptions[12]?.[key];
      if (values) a.addRow([key, ...values]);
    }
  }
  if(metric){const legacy=rows(a)['11']?.get('Processing fee steps (USD/lb)');if(legacy)legacy.getCell(1).value='Processing fee steps';}
  const groups=rows(a);
  for (const [section, definitions] of Object.entries(data.assumptions)) {
    const sharedKeys: readonly string[] = sharedAssumptionKeys[section as keyof typeof sharedAssumptionKeys] ?? [];
    for (const [label, values] of Object.entries(definitions)) {
      const row = get(groups[section], label, 'Assumptions');
      values.forEach((value, index) => {
        const cell = row.getCell(index + (section === '8' ? 3 : 2));
        cell.value = value;
        if (marketOnly && (sharedKeys.includes(label) || index < (commonAssumptionSchema[section]?.[label]?.length ?? 0))) cell.fill = {type:'pattern',pattern:'none'};
        else if (section !== '12' || index === 0 || index === 2) cell.fill = editable;
      });
    }
  }
  for(const [name,v] of Object.entries(effective)) {if(v.workbookValue)continue;const row=groups['5'].get(name);if(row){row.getCell(3).value=v.price;row.getCell(4).value=v.unit;row.getCell(5).value=`${v.source}; as of ${v.asOf}`;}}
  const scenarioSheet=w.getWorksheet('Scenario')!;
  if(metric){const weight=rows(scenarioSheet)['0'].get('panel_weight_lb');if(weight){weight.getCell(1).value='panel_weight_kg';weight.getCell(4).value='kg/panel';}
    for(const [key,label,value,unit] of [['meta_currency','Meta currency',data.meta.currency,'ISO 4217'],['meta_locale','Meta locale',data.meta.locale??'ja-JP','BCP 47'],['fx_local_per_usd','FX local per USD',data.meta.localPerUSD??1,`${data.meta.currency}/USD`]] as [string,string,string|number,string][])scenarioSheet.addRow([key,label,value,unit]);
  }
  const sr=rows(scenarioSheet)['0'];for(const [k,v] of Object.entries(data.scenario))get(sr,k,'Scenario').getCell(3).value=v;
  writeGlobalTables(w, data);
  if (marketOnly || data.transport || data.mouPolicy) {
    const profile = parameterProfileForRegion(data.scenario.region_code);
    const market = ourSolutionMarket(profile?.regionCode === 'GB' ? 'UK' : profile?.regionCode);
    if (market) {
      const sheet = w.addWorksheet('Transport');
      sheet.columns = [{width:32},{width:18},{width:20}];
      sheet.addRow(['field_key', 'Value', 'Unit']);
      for (const [key, value, unit] of transportRows(data.transport ?? emptyMarketTransport(), market)) {
        sheet.addRow([key,value,unit]).getCell(2).fill = editable;
      }
      const points = data.transport?.referencePoints ?? freightCostTrend(market);
      const { distance } = transportUnits(market);
      for (const i of referenceSlots) {
        sheet.addRow([`reference_${i}_distance`,points[i-1]?.distance ?? null,distance]).getCell(2).fill = editable;
        sheet.addRow([`reference_${i}_cost`,points[i-1]?.cost ?? null,currency]).getCell(2).fill = editable;
      }
      const mou = w.addWorksheet('MOU');
      mou.columns = [{width:34},{width:18},{width:20}];
      const policy = data.mouPolicy ?? defaultMouPolicy;
      mou.addRow(['field_key','Value','Unit']);
      mou.addRow(['validity_days',policy.validityDays,'days']).getCell(2).fill = editable;
      mou.addRow(['confidentiality_years',policy.confidentialityYears,'years']).getCell(2).fill = editable;
    }
  }
  const instructions=rows(w.getWorksheet('Instructions')!)['0'];
  get(instructions,'Contents','Instructions').getCell(2).value='Assumptions, Scenario, Capacity History, Population and EU-27 Population are the single sources for every editable market, operating, technical and benchmark value shown on Our Solution. Assumptions section 12 holds externally sourced public benchmarks, targets and their sources.';
  get(instructions,'Sheets','Instructions').getCell(2).value='Assumptions (model parameters plus section 12 public benchmarks) · Scenario (volume and schedule) · Product Value (live formulas) · Capacity History · Population · EU-27 Population.';
  get(instructions,'Edit rule','Instructions').getCell(2).value='Change yellow cells only. In Assumptions section 12, edit Value and Source only. Do not rename sheets, field keys, labels or units.';
  // Product Value and Section 8 formulas retain the template's live references.
  const result=blankLocalInputs ? null : model(data,effective);
  for(const [label,mat] of Object.entries(streamMaterial))get(groups['8'],label,'Assumptions').getCell(2).value={formula:`B${get(groups['5'],mat,'Assumptions').number}`,result:data.assumptions[5][mat][0] as number};
  for(const [i,code] of ['SHREDDING','HOT_KNIFE','PVCIRCULATOR'].entries()){
    for(const [label,mult] of [['Theoretical silver content upper limit (%)',1],['Theoretical silver content upper limit (g/t)',10000]] as const){const cell=get(groups['8'],label,'Assumptions').getCell(i+3);cell.value={formula:cell.formula,...(result ? {result:result.solutions[code as keyof typeof result.solutions].silverUpperPct*mult} : {})};}
  }
  if (additional) {
    const value = w.getWorksheet('Product Value')!;
    value.getCell('A1').value = `Product value per panel (${currency})`;
    value.getCell('A2').value = `Calculated from the ${currency} prices, metric panel weight and recovery assumptions in this workbook.`;
    value.getCell('B3').value = {formula: `Scenario!${get(sr,'panel_weight_kg','Scenario').getCell(3).address}/1000`};
    value.getCell('B4').value = `Price (${currency}/t)`;
    let rowNumber = 5;
    for (const key of Object.keys(baseSections[5])) {
      const material = get(groups[5],key,'Assumptions').number;
      const recovery = get(groups[6],key,'Assumptions').number;
      const ounce = get(groups[9],'Grams per troy ounce','Assumptions').getCell(2).address;
      const row = value.getRow(rowNumber++);
      row.getCell(1).value = key;
      const unit = `Assumptions!D${material}`, price = `Assumptions!C${material}`;
      row.getCell(2).value = {formula:`IF(${unit}="N/A",0,IF(${unit}="${currency}/kg",${price}*1000,IF(${unit}="${currency}/troy oz",${price}*1000000/Assumptions!${ounce},${price})))`};
      for (const [index,columns] of ['BCD','EFG','HIJ'].entries()) {
        row.getCell(index+3).value = {formula:`$B$3*Assumptions!B${material}*B${row.number}*${[...columns].map(c=>`Assumptions!${c}${recovery}`).join('*')}`};
      }
    }
    // Replace the imported US summary and stale cached results with native-currency formula totals.
    for (const row of value.getRows(rowNumber, value.rowCount-rowNumber+1) ?? []) row.values = [];
    const total = value.getRow(rowNumber);
    total.getCell(1).value = `Total per panel (${currency})`;
    for (const [index, column] of ['C','D','E'].entries()) total.getCell(index+3).value = {formula:`SUM(${column}5:${column}${rowNumber-1})`};
  }
  if (blankLocalInputs) {
    function clear(row: ExcelJS.Row, column: number) {
      row.getCell(column).value = null;
      row.getCell(column).fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFFFF2CC'}};
    }
    for (const section of [1,2,4,9]) {
      for (const [key,values] of Object.entries(data.assumptions[section])) {
        const unitColumn = values.findIndex(value => typeof value === 'string' && value.startsWith(currency));
        for (let i=0;i<unitColumn;i++) clear(get(groups[section],key,'Assumptions'),i+2);
        if (section === 9 && unitColumn >= 0) clear(get(groups[section],key,'Assumptions'),4);
      }
    }
    for (const [key,values] of Object.entries(data.assumptions[5])) if (values[2] !== 'N/A') {
      clear(get(groups[5],key,'Assumptions'),3);
      clear(get(groups[5],key,'Assumptions'),5);
    }
    const fees = get(groups[11],'Processing fee steps','Assumptions');
    for (let index=0;index<data.assumptions[11]['Processing fee steps'].length;index++) clear(fees,index+2);
    clear(get(groups[11],'Recovery fee','Assumptions'),2);
    const grid = get(groups[12],'impact.grid_kg_co2e_per_kwh','Assumptions');
    grid.getCell(6).value = `${data.scenario.region} grid emissions factor`;
    clear(grid,2);clear(grid,4);
    for (const key of ['Labor burden', "Workers' compensation"]) clear(get(groups[2],key,'Assumptions'),2);
    for (const key of ['fx_local_per_usd','operating_hours_per_day','working_weeks_per_year','working_days_per_week']) {
      clear(get(sr,key,'Scenario'),3);
    }
    const reference = currency === 'AUD' ? ' NSW may be used as a source for rent, wages, and electricity prices.' : '';
    get(instructions,'Edit rule','Instructions').getCell(2).value=`Fill the blank yellow cells with confirmed local inputs and sources before upload.${reference} Shared engineering and global assumptions are included for review. Scenario contains the ${currency} per USD exchange rate. Do not rename sheets, field keys, labels or units.`;
  }
  if (marketOnly) {
    get(instructions,'Contents','Instructions').getCell(2).value='Market-specific calculations use Assumptions, Scenario and Transport. Shared engineering assumptions, constants, capacity history and population are managed in the shared workbook. Unhighlighted shared cells in Assumptions are references for the formulas.';
    get(instructions,'Sheets','Instructions').getCell(2).value='Assumptions · Scenario · Product Value · Transport · MOU. Leave all entries for an unavailable vehicle blank, or provide the full rate and loading inputs.';
  }
  // Silicon is deliberately workbook-only; no claim of an automated SMM feed.
  w.getWorksheet('Instructions')!.getCell('B12').value=additional ? `This market uses the ${currency} benchmark prices entered in the workbook.` : 'Weekly prices: silver XAG/USD spot via currency-api; LME aluminium cash and LME copper 3-month via Westmetall. Silicon SMM #553 remains the workbook value (no reliable free feed).';
  return Buffer.from(await w.xlsx.writeBuffer());
}

export async function createInitialOurSolutionTemplate(market: AdditionalParameterMarket, shared?: SharedParameters) {
  const {regionCode,region,currency,locale}=ourSolutionParameterMarkets[market];
  const data=structuredClone(seededOurSolutionData);
  data.scenario={...data.scenario,region_code:regionCode,region,panel_weight_kg:20,panels_per_month:50_000_000/300/12};
  delete data.scenario.panel_weight_lb;
  data.meta={...data.meta,currency,locale};
  data.assumptions[10]['Panel rating'][0]=300;
  data.assumptions[6].EVA[3]=0;
  data.assumptions[6].Backsheet[3]=0;
  for(const section of [1,2,4,5,9,11]) {
    for(const values of Object.values(data.assumptions[section])) {
      const index=values.findIndex(value=>typeof value==='string'&&/^USD(?:$|\/)/.test(value));
      if(index<0) continue;
      values[index]=String(values[index]).replace(/^USD/,currency).replace('/sq.ft./year','/sq.m./month').replace('/short ton','/metric ton').replace(/\/lb$/,'/kg');
    }
  }
  data.assumptions[11]['Processing fee steps']=data.assumptions[11]['Processing fee steps (USD/lb)'];
  delete data.assumptions[11]['Processing fee steps (USD/lb)'];
  return createOurSolutionWorkbook(shared ? withSharedParameters(data, shared) : data,true,{},true,Boolean(shared));
}
