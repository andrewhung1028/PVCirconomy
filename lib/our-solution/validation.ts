import schema from '../../data/our-solution-parameter-schema.json';
import { eu27Countries, markets, parameter as n, type Parameters } from './parameters';
import { parameterProfileForRegion } from './market';
import { japanFeeBenchmarkRows, websiteAssumptionRows } from './public-data';
import { validateMarketTransport } from "./transport";
const baseParameterSchema:Record<string,Record<string,(string|number)[]>>={...(schema as Record<string,Record<string,(string|number)[]>>),'12':websiteAssumptionRows};
const schemaFor=(p:Parameters)=>{const out=structuredClone(baseParameterSchema);if(p.meta?.currency && p.meta.currency!=='USD'){out[11]['Processing fee steps']=out[11]['Processing fee steps (USD/lb)'];delete out[11]['Processing fee steps (USD/lb)'];}return out;};
export function validateParameters(value: unknown):string[] {
  const errors:string[]=[];
  const fail=(s:string)=>errors.push(s);
  try {
    const p=value as Parameters;
    if(p?.format!=='parameters-v2')return ['舊版結果格式不再支援，請下載現行參數範本。'];
    const parameterSchema=schemaFor(p);
    if (p.transport !== undefined) errors.push(...validateMarketTransport(p.transport));
    const japanFeeKeys = Object.keys(japanFeeBenchmarkRows);
    const feeRows = p.assumptions?.[12] ?? {};
    const productRecovery = Number(feeRows['methods.circulator.product_recovery_percent']?.[0]);
    if (productRecovery > 100) fail('PV Circulator 產品回收率不得超過 100%。');
    if (p.scenario?.region_code === 'JP' && japanFeeKeys.some(key => key in feeRows)) {
      Object.assign(parameterSchema[12], japanFeeBenchmarkRows);
      for (const key of japanFeeKeys) {
        if (!(Number(feeRows[key]?.[0]) > 0) || feeRows[key]?.[1] !== 'JPY/kW') fail(`${key} 必須為正值，單位 JPY/kW。`);
      }
      if (Number(feeRows['stakes.jp.recycling_low']?.[0]) > Number(feeRows['stakes.jp.recycling_high']?.[0])) fail('日本回收費下限不得高於上限。');
    }
    for(const [section,values] of Object.entries(p.assumptions??{})){
      const expected=parameterSchema[section];
      if(!expected||Object.keys(values).some(k=>!(k in expected)))fail(`Assumptions ${section} 包含未知欄位。`);
    }
    for(const [section,defs] of Object.entries(parameterSchema))for(const [label,expected] of Object.entries(defs)){
      const v=p.assumptions?.[section]?.[label];
      if(!Array.isArray(v)||v.length!==expected.length){fail(`Assumptions ${section} · ${label} 欄位不完整。`);continue;}
      for(let i=0;i<v.length;i++) {
        if(typeof expected[i]==='number'){
          if(typeof v[i]!=='number'||!Number.isFinite(v[i])||(Number(v[i])<0&&label!=='Silver price change steps'))fail(`Assumptions ${section} · ${label} 必須是非負有限數字。`);
        }else if(typeof v[i]!=='string'||!String(v[i]).trim())fail(`Assumptions ${section} · ${label} 必須是文字。`);
      }
    }
    for(const [k,v] of Object.entries(p.scenario)){
      if(['region_code','region'].includes(k)){if(typeof v!=='string'||!v.trim())fail(`Scenario ${k} 必須是文字。`);}
      else if(typeof v!=='number'||!Number.isFinite(v)||v<=0)fail(`Scenario ${k} 必須是正有限數字。`);
    }
    for(const k of ['region_code','region','panels_per_month','operating_hours_per_day','working_weeks_per_year','working_days_per_week'])if(!(k in p.scenario))fail(`Scenario 缺少 ${k}。`);
    const weightKeys=['panel_weight_lb','panel_weight_kg'].filter(k=>k in p.scenario);
    if(weightKeys.length!==1)fail('Scenario 必須且只能包含 panel_weight_lb 或 panel_weight_kg 其中一項。');
    const profile = parameterProfileForRegion(p.scenario.region_code);
    const currency = p.meta?.currency;
    const expectedCurrency = profile?.currency ?? 'USD';
    const metric = expectedCurrency !== 'USD';
    if (currency !== expectedCurrency) fail(`Scenario 幣別必須為 ${expectedCurrency}。`);
    if (weightKeys[0] !== (metric ? 'panel_weight_kg' : 'panel_weight_lb')) {
      fail(`Scenario 必須使用 ${metric ? 'panel_weight_kg' : 'panel_weight_lb'}。`);
    }
    const materialRows=Object.values(p.assumptions[5]);
    if(Math.abs(materialRows.reduce((s,v)=>s+Number(v[0]),0)-1)>1e-6)fail('材料質量比例總和必須等於 1。');
    const allowedMaterialUnits = [`${expectedCurrency}/metric ton`, `${expectedCurrency}/troy oz`, `${expectedCurrency}/${metric ? 'kg' : 'lb'}`, 'N/A'];
    for (const [name, values] of Object.entries(p.assumptions[5])) {
      if (!allowedMaterialUnits.includes(String(values[2]))) fail(`${name} 價格單位無效。`);
    }
    const expectedUnits = metric ? {
      'Hourly wage': `${expectedCurrency}/hour`, 'Base rent': `${expectedCurrency}/sq.m./month`, CAM: `${expectedCurrency}/sq.m./month`,
      'Electricity price': `${expectedCurrency}/kWh`, 'Landfill cost': `${expectedCurrency}/metric ton`,
    } : {'Hourly wage':'USD/hour','Base rent':'USD/sq.ft./year','CAM':'USD/sq.ft./year','Electricity price':'USD/kWh','Landfill cost':'USD/short ton'};
    for(const [label,unit] of Object.entries(expectedUnits))if(String(p.assumptions[1]?.[label]?.[1])!==unit)fail(`Assumptions 1 · ${label} 單位必須是 ${unit}。`);
    const feeUnit = `${expectedCurrency}/${metric ? 'kg' : 'lb'}`;
    if (p.assumptions[11]?.['Recovery fee']?.[1] !== feeUnit) fail(`Recovery fee 單位必須是 ${feeUnit}。`);
    if (metric && expectedCurrency !== 'JPY') {
      for (const [section, key, column, unit] of [
        [2, 'Forklift / handling', 1, `${expectedCurrency}/year`], [2, 'Insurance and compliance', 1, `${expectedCurrency}/year`],
        [2, 'Facility utilities / admin', 1, `${expectedCurrency}/year`], [2, 'Packaging', 1, `${expectedCurrency}/panel`],
        [4, 'Capex per line', 3, expectedCurrency], [4, 'Consumables', 3, `${expectedCurrency}/panel`],
        [9, 'Sulfuric acid price', 1, `${expectedCurrency}/metric ton as sold`], [9, 'Hydrogen peroxide price', 1, `${expectedCurrency}/metric ton as sold`],
        [9, 'Nitric acid price', 1, `${expectedCurrency}/metric ton as sold`],
      ] as const) if (p.assumptions[section]?.[key]?.[column] !== unit) fail(`Assumptions ${section} · ${key} 單位必須是 ${unit}。`);
    }
    for(const [name,v] of Object.entries(p.assumptions[6]))v.forEach((x,i)=>{if(i%3===2?x!==0&&x!==1:typeof x!=='number'||x<0||x>1)fail(`${name} 回收率／實現率須介於 0 與 1，可銷售旗標須為 0 或 1。`)});
    for(const [name,v] of Object.entries(p.assumptions[8]))if(v.some(x=>x!==0&&x!==1))fail(`${name} 物流旗標須為 0 或 1。`);
    for(const [label,v] of Object.entries(p.assumptions[9]))if(/concentration|purity|recovery|Realization|efficiency/.test(label)&&Number(v[0])>1)fail(`${label} 必須介於 0 與 1。`);
    for(const [sec,label] of [[3,'Shifts per equipment line (limit)'],[3,'Kilograms per pound'],[3,'Pounds per metric ton'],[7,'Panels per pallet'],[7,'Pallet stack levels'],[9,'Grams per troy ounce'],[9,'Sulfuric acid concentration'],[9,'Hydrogen peroxide concentration'],[9,'Nitric acid concentration'],[9,'Electrorefining current efficiency'],[9,'Molar mass Ag'],[9,'Molar mass Cu'],[9,'Molar mass Al'],[10,'Panel rating'],[10,'Average lifetime T'],[10,'Shape, early-loss'],[10,'Shape, regular-loss']] as const)if(n(p,sec,label)<=0)fail(`${label} 必須大於零。`);
    for(let i=0;i<3;i++)if(n(p,4,'Capacity',i)<=0)fail('Capacity 必須大於零。');
    if(![25,18,15,12].includes(n(p,10,'Average lifetime T')))fail('Average lifetime T 必須是 25、18、15 或 12。');
    if(!['Early-loss','Regular-loss'].includes(String(p.assumptions[10]['Loss scenario'][0])))fail('Loss scenario 必須是 Early-loss 或 Regular-loss。');
    for(const y of [...Array.from({length:25},(_,i)=>2000+i),2050]){
      for(const m of markets){const v=p.capacityHistory[m]?.[y];if(typeof v!=='number'||!Number.isFinite(v)||v<0)fail(`Capacity History ${m} 缺少年份 ${y} 或數值無效。`);}
      if(p.capacityHistory.World[y]+1e-9<markets.slice(1).reduce((s,m)=>s+p.capacityHistory[m][y],0))fail(`Capacity History ${y} World 不得小於六個市場總和。`);
    }
    for(const m of markets)if(p.capacityHistory[m][2024]<=0)fail(`Capacity History ${m} 2024 必須大於零以計算成長率。`);
    if(Object.keys(p.population.eu27).length!==27||eu27Countries.some(c=>!p.population.eu27[c]))fail('EU-27 Population 必須有 27 個國家。');
    for(let y=2020;y<=2050;y++){
      for(const [m,values] of [...markets.map(m=>[m,p.population[m]] as const),...Object.entries(p.population.eu27)])if(typeof values?.[y]!=='number'||!Number.isFinite(values[y])||values[y]<=0)fail(`Population ${m} ${y} 必須是正有限數字。`);
      const europe=Object.values(p.population.eu27).reduce((s,v)=>s+v[y],0);if(Math.abs(europe-p.population.Europe[y])>1e-6)fail(`Population Europe ${y} 必須等於 EU-27 總和。`);
    }
    if (metric) {
      const locale = profile?.locale;
      if (p.meta?.locale !== locale || typeof p.meta.localPerUSD !== 'number' || !Number.isFinite(p.meta.localPerUSD) || p.meta.localPerUSD <= 0) {
        fail(`Scenario meta 必須包含 locale ${locale} 與正值 localPerUSD。`);
      }
    }
  }catch {fail('參數資料格式不完整。');}
  return errors;
}
