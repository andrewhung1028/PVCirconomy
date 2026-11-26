import ExcelJS from "exceljs";
import {
  equipmentConfigurationLabels, equipmentElectricalFields, equipmentSpecificationGroups, equipmentVariants,
  type EquipmentSettings,
} from "../../lib/equipment-configurations";
import { ourSolutionParameterMarkets, publicSolutionMarkets } from "../../lib/our-solution/market";
import { equipmentMarketAmount, equipmentPriceModules, equipmentUsdTotal, validateEquipmentModulePrices, validModuleAmount } from "../../lib/equipment-module-pricing";
import { equipmentClaimFields, equipmentFieldValue, equipmentMarketFields, equipmentMouFields, equipmentPricingFields, isSitePowerOption, validateEquipmentQuantitative } from "../../lib/equipment-quantitative";
import { loadEquipmentExchangeRates } from "./exchange-rates";
import { validateEquipmentConfigurations } from "./store";

const modelHeaders = equipmentVariants.map(variant => equipmentConfigurationLabels[variant]);
const columns = ["Key", "Parameter", ...modelHeaders];
const moduleSheet = "Module Prices";
const metadataName = "Workbook";
const schema = "PV Circulator equipment v4";
const priorSchema = "PV Circulator equipment v3";
const mouSheet = "MOU Parameters";
const powerSheet = "Site Power";
const powerColumns = ["Market", "Parameter", "Options"];
const claimsSheet = "Website Claims";
const defaultsSheet = "Calculator Defaults";
const pricingSettingsSheet = "Pricing Settings";
const valueColumns = ["Key", "Parameter", "Value"];
const marketColumns = ["Key", "Parameter", ...publicSolutionMarkets];

function decorate(sheet: ExcelJS.Worksheet) {
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
  [36, 48, 26, 26, 26, 26].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
}

export async function exportEquipmentWorkbook(settings: EquipmentSettings) {
  const book = new ExcelJS.Workbook();
  book.creator = "PV Circonomy";
  book.calcProperties.fullCalcOnLoad = true;
  const metadata = book.addWorksheet(metadataName);
  metadata.addRows([
    ["Schema", schema],
    ["Revision", settings.revision],
    ["Published at", settings.savedAt ?? "Initial data"],
    ["Instructions", "Edit model values. Keep worksheet names, keys and the revision as exported."],
  ]);
  metadata.getColumn(1).width = 25;
  metadata.getColumn(2).width = 86;
  for (const group of equipmentSpecificationGroups) {
    const sheet = book.addWorksheet(group.title);
    sheet.addRow(columns);
    for (const [label] of group.items)
      sheet.addRow([label, label, ...equipmentVariants.map(variant => settings.configurations[variant].values[label])]);
    decorate(sheet);
  }
  const electrical = book.addWorksheet("Electrical");
  electrical.addRow(columns);
  for (const { key, label } of equipmentElectricalFields)
    electrical.addRow([key, label, ...equipmentVariants.map(variant => settings.configurations[variant].electrical[key])]);
  decorate(electrical);
  const modules = book.addWorksheet(moduleSheet);
  modules.addRow(columns);
  for (const [key, label] of equipmentPriceModules)
    modules.addRow([key, label, ...equipmentVariants.map(variant => settings.modulePrices[key][variant])]);
  const usdRow = equipmentPriceModules.length + 2;
  modules.addRow(["TotalUSD", "美元合計（USD）", ...equipmentVariants.map((variant, column) => {
    const letter = String.fromCharCode(67 + column);
    return { formula: `ROUND(SUM(${letter}2:${letter}${usdRow - 1})*10000,2)`, result: equipmentUsdTotal(settings.modulePrices, variant) };
  })]);
  decorate(modules);
  metadata.addRow(["Module Prices", "Input in USD 10,000. Blank = not included. Only edit model input rows."]);

  const { quantitative } = settings;
  const claims = book.addWorksheet(claimsSheet);
  claims.addRow(valueColumns);
  for (const [key, label] of equipmentClaimFields) claims.addRow([key, label, quantitative.claims[key]]);
  decorate(claims);
  const defaults = book.addWorksheet(defaultsSheet);
  defaults.addRow(marketColumns);
  for (const [key, label] of equipmentMarketFields) defaults.addRow([key, label, ...publicSolutionMarkets.map(market => quantitative.markets[market][key])]);
  decorate(defaults);
  const pricingSettings = book.addWorksheet(pricingSettingsSheet);
  pricingSettings.addRow(valueColumns);
  for (const [key, label] of equipmentPricingFields) pricingSettings.addRow([key, label, quantitative.pricing[key]]);
  decorate(pricingSettings);
  metadata.addRow([defaultsSheet, "Capacity and inquiry defaults by market. Maintenance outside work is hours/month and in-shift maintenance is hours/week."]);

  const mou = book.addWorksheet(mouSheet);
  mou.addRow(valueColumns);
  for (const [key, label] of equipmentMouFields) mou.addRow([key, label, quantitative.mou[key]]);
  decorate(mou);

  const sitePower = book.addWorksheet(powerSheet);
  sitePower.addRow(powerColumns);
  for (const market of publicSolutionMarkets)
    sitePower.addRow([market, "場址三相供電選項", quantitative.sitePower[market].join("\n")]);
  decorate(sitePower);
  sitePower.getColumn(3).width = 32;
  sitePower.getColumn(3).alignment = { wrapText: true };
  metadata.addRow([powerSheet, "One voltage and frequency per line, e.g. 208 V · 60 Hz."]);

  const fx = await loadEquipmentExchangeRates();
  const pricing = book.addWorksheet("MSRP");
  pricing.addRow(["Market", "Currency", "Local per USD", "Factor", "ECB rate date", ...modelHeaders]);
  for (const market of publicSolutionMarkets) {
    const currency = ourSolutionParameterMarkets[market].currency;
    const rate = currency === "USD" ? 1 : fx?.rates[currency] ?? null;
    const factor = currency === "USD" ? 1 : quantitative.pricing.nonUsdFactor;
    const row = pricing.rowCount + 1;
    pricing.addRow([market, currency, rate, currency === "USD" ? factor : {
      formula: `'${pricingSettingsSheet}'!C2`, result: factor,
    }, currency === "USD" || rate === null ? null : fx?.date,
      ...equipmentVariants.map((variant, column) => {
        const handle = `'${moduleSheet}'!${String.fromCharCode(67 + column)}${usdRow}`;
        const amount = equipmentUsdTotal(settings.modulePrices, variant);
        const result = amount > 0 ? equipmentMarketAmount(amount, currency, rate ?? undefined, factor) : null;
        return {
          formula: `IF(AND(ISNUMBER(C${row}),${handle}>0),ROUND(${handle}*C${row}*D${row},IF(B${row}="JPY",0,2)),"")`,
          result: result ?? "",
        };
      }),
    ]);
  }
  pricing.getRow(1).font = { bold: true };
  pricing.views = [{ state: "frozen", ySplit: 1 }];
  pricing.columns.forEach(column => { column.width = 21; });
  metadata.addRow(["MSRP", "Calculated totals only. PLUS is the add-on price. Download the workbook again to refresh the reference exchange rates."]);
  return Buffer.from(await book.xlsx.writeBuffer());
}

function readRows(book: ExcelJS.Workbook, name: string, keys: readonly string[], ignoredKey?: string, headers = columns) {
  const sheet = book.getWorksheet(name);
  if (!sheet || headers.some((value, index) => sheet.getRow(1).getCell(index + 1).value !== value))
    throw Error(`${name}：找不到工作表或欄名不符，請使用目前下載的工作簿。`);
  const rows = new Map<string, ExcelJS.Row>();
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const key = row.getCell(1).value;
    if (ignoredKey && key === ignoredKey) return;
    if (typeof key !== "string" || !keys.includes(key) || rows.has(key))
      throw Error(`${name} 第 ${index} 列：參數鍵缺漏、重複或不在範本中。`);
    rows.set(key, row);
  });
  if (rows.size !== keys.length) throw Error(`${name}：缺少必要的參數列。`);
  return rows;
}

function importQuantitative(book: ExcelJS.Workbook) {
  function read(fields: typeof equipmentClaimFields | typeof equipmentMarketFields | typeof equipmentMouFields | typeof equipmentPricingFields, rows: Map<string, ExcelJS.Row>, column: number, name: string) {
    return Object.fromEntries(fields.map(field => {
      const cell = rows.get(field[0])!.getCell(column);
      if (!equipmentFieldValue(field, cell.value))
        throw Error(`${name} ${cell.address}：請依欄位單位輸入有效數值。`);
      return [field[0], cell.value];
    }));
  }
  const claims = readRows(book, claimsSheet, equipmentClaimFields.map(([key]) => key), undefined, valueColumns);
  const pricing = readRows(book, pricingSettingsSheet, equipmentPricingFields.map(([key]) => key), undefined, valueColumns);
  const defaults = readRows(book, defaultsSheet, equipmentMarketFields.map(([key]) => key), undefined, marketColumns);
  const mou = readRows(book, mouSheet, equipmentMouFields.map(([key]) => key), undefined, valueColumns);
  const powerRows = readRows(book, powerSheet, publicSolutionMarkets, undefined, powerColumns);
  const sitePower = Object.fromEntries([...powerRows].map(([key, row]) => {
    const cell = row.getCell(3);
    const options = typeof cell.value === "string" ? cell.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean) : [];
    if (!options.length || options.length > 12 || !options.every(isSitePowerOption) || new Set(options).size !== options.length)
      throw Error(`${powerSheet} ${cell.address}：請每行填寫一組電壓和頻率，例如 208 V · 60 Hz。`);
    return [key, options];
  }));
  const value = validateEquipmentQuantitative({
    sitePower,
    mou: read(equipmentMouFields, mou, 3, mouSheet),
    claims: read(equipmentClaimFields, claims, 3, claimsSheet),
    pricing: read(equipmentPricingFields, pricing, 3, pricingSettingsSheet),
    markets: Object.fromEntries(publicSolutionMarkets.map((market, index) => [
      market, read(equipmentMarketFields, defaults, index + 3, defaultsSheet),
    ])),
  });
  if (!value) throw Error("Calculator Defaults：請確認每日班次與工時不超過 24 小時，維護時間未超出可用工時，以及 MOU 厚度下限未超出上限。");
  return value;
}

export async function importEquipmentWorkbook(bytes: Buffer) {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(bytes as never);
  const metadata = book.getWorksheet(metadataName);
  const expectedRevision = metadata?.getCell("B2").value;
  const workbookSchema = metadata?.getCell("B1").value;
  if ((workbookSchema !== schema && workbookSchema !== priorSchema) || typeof expectedRevision !== "number"
    || !Number.isInteger(expectedRevision) || expectedRevision < 0 || expectedRevision >= 2_147_483_647)
    throw Error("Workbook：版本資料無效，請重新下載現行工作簿。");

  const configurations = Object.fromEntries(equipmentVariants.map(variant => [variant, {
    values: {} as Record<string, string>, electrical: {} as Record<string, number | null>,
  }]));
  for (const { title, items } of equipmentSpecificationGroups) {
    const rows = readRows(book, title, items.map(([label]) => label));
    for (const [key, row] of rows) {
      equipmentVariants.forEach((variant, index) => {
        const cell = row.getCell(index + 3);
        const value = cell.value;
        if (value !== null && typeof value !== "string" && typeof value !== "number")
          throw Error(`${title} ${cell.address}：請輸入文字或數值。`);
        configurations[variant].values[key] = value === null ? "—" : String(value);
      });
    }
  }
  const rows = readRows(book, "Electrical", equipmentElectricalFields.map(({ key }) => key));
  for (const { key, min, max } of equipmentElectricalFields) {
    const row = rows.get(key)!;
    equipmentVariants.forEach((variant, index) => {
      const cell = row.getCell(index + 3);
      const value = cell.value;
      if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max))
        throw Error(`Electrical ${cell.address}：請輸入 ${min} 至 ${max} 的數值，或保留空白。`);
      configurations[variant].electrical[key] = value;
    });
  }
  const checked = validateEquipmentConfigurations(configurations);
  if (!checked) throw Error("規格文字最多 160 字。輸入電流時，請一併填寫三相線電壓及功率因數。");
  const modules = readRows(book, moduleSheet, equipmentPriceModules.map(([key]) => key), "TotalUSD");
  const modulePrices = Object.fromEntries([...modules].map(([key, row]) => [key, Object.fromEntries(equipmentVariants.map((variant, index) => {
    const cell = row.getCell(index + 3);
    if (cell.value !== null && !validModuleAmount(cell.value))
      throw Error(`${moduleSheet} ${cell.address}：金額請以萬美元輸入非負數，最多六位小數。`);
    return [variant, cell.value];
  }))]));
  const checkedPrices = validateEquipmentModulePrices(modulePrices);
  if (!checkedPrices) throw Error("模組價格資料無效。");
  return { expectedRevision, configurations: checked, modulePrices: checkedPrices,
    quantitative: workbookSchema === schema ? importQuantitative(book) : undefined };
}
