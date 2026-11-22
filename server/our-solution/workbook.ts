import ExcelJS from "exceljs";
import { solutionCodes, validateOurSolutionData, type OurSolutionEconomics, type SolutionCode } from "../../lib/our-solution-data";

const editableSheets = ["Scenario", "Annual Summary", "Website Values", "Fee Sensitivity", "Silver Sensitivity"] as const;
const allSheets = ["Instructions", ...editableSheets, "Material Revenue"] as const;
const websiteKeys = ["opex_per_panel_electricity", "opex_per_panel_labor", "opex_per_panel_facility", "opex_per_panel_other", "opex_per_panel_total", "material_revenue_silver", "material_revenue_al_cu", "material_revenue_other", "material_revenue_total", "annual_opex", "annual_ebitda"] as const;

function value(cell: ExcelJS.Cell) {
  const raw = cell.value;
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number" || typeof raw === "string") return raw;
  throw Error(`欄位 ${cell.address} 不可使用公式、連結或複合格式。`);
}
function text(cell: ExcelJS.Cell) { const raw = value(cell); if (typeof raw !== "string" || !raw.trim()) throw Error(`欄位 ${cell.address} 必須是文字。`); return raw.trim(); }
function number(cell: ExcelJS.Cell) { const raw = value(cell); if (typeof raw !== "number" || !Number.isFinite(raw)) throw Error(`欄位 ${cell.address} 必須是數字。`); return raw; }
function headers(sheet: ExcelJS.Worksheet, expected: string[]) {
  const actual = expected.map((_, index) => String(value(sheet.getCell(1, index + 1))));
  if (actual.some((item, index) => item !== expected[index])) throw Error(`${sheet.name} 欄位名稱或順序不正確。請重新下載現行資料後修改。`);
}
function rowsByKey(sheet: ExcelJS.Worksheet, keyColumn = 1) {
  const map = new Map<string, ExcelJS.Row>();
  for (let index = 2; index <= sheet.actualRowCount; index++) {
    const row = sheet.getRow(index);
    const key = text(row.getCell(keyColumn));
    if (map.has(key)) throw Error(`${sheet.name} 包含重複欄位鍵 ${key}。`);
    map.set(key, row);
  }
  return map;
}
function requireExactKeys(sheet: ExcelJS.Worksheet, map: Map<string, ExcelJS.Row>, expected: readonly string[]) {
  const missing = expected.filter((key) => !map.has(key));
  const unknown = [...map.keys()].filter((key) => !expected.includes(key));
  if (missing.length || unknown.length) throw Error(`${sheet.name} 欄位鍵不符。缺少：${missing.join(", ") || "無"}；未知：${unknown.join(", ") || "無"}。`);
}

export async function parseOurSolutionWorkbook(buffer: Buffer, base: OurSolutionEconomics) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  for (const name of allSheets) if (!workbook.getWorksheet(name)) throw Error(`缺少工作表：${name}。`);
  const data = structuredClone(base);

  const scenario = workbook.getWorksheet("Scenario")!;
  headers(scenario, ["field_key", "label", "value", "unit"]);
  const scenarioRows = rowsByKey(scenario);
  const scenarioKeys = ["region_code", "region", "panels_per_month", "annual_panels", "panel_weight_lb", "annual_input_metric_tons", "processing_fee_usd_per_lb", "operating_days_per_month", "operating_hours_per_day"] as const;
  requireExactKeys(scenario, scenarioRows, scenarioKeys);
  data.scenario.regionCode = text(scenarioRows.get("region_code")!.getCell(3));
  data.scenario.region = text(scenarioRows.get("region")!.getCell(3));
  data.scenario.panelsPerMonth = number(scenarioRows.get("panels_per_month")!.getCell(3));
  data.scenario.annualPanels = number(scenarioRows.get("annual_panels")!.getCell(3));
  data.scenario.panelWeightLb = number(scenarioRows.get("panel_weight_lb")!.getCell(3));
  data.scenario.annualInputMetricTons = number(scenarioRows.get("annual_input_metric_tons")!.getCell(3));
  data.scenario.processingFeeUsdPerLb = number(scenarioRows.get("processing_fee_usd_per_lb")!.getCell(3));
  data.scenario.operatingDaysPerMonth = number(scenarioRows.get("operating_days_per_month")!.getCell(3));
  data.scenario.operatingHoursPerDay = number(scenarioRows.get("operating_hours_per_day")!.getCell(3));

  const annual = workbook.getWorksheet("Annual Summary")!;
  headers(annual, ["solution_code", "solution", "material_revenue_usd", "annual_opex_usd", "annual_ebitda_usd", "capex_usd", "recovery_rate", "residual_metric_tons"]);
  const annualRows = rowsByKey(annual);
  requireExactKeys(annual, annualRows, solutionCodes);
  for (const code of solutionCodes) {
    const row = annualRows.get(code)!;
    const item = data.solutions.find((solution) => solution.code === code)!;
    if (text(row.getCell(2)) !== item.label) throw Error(`Annual Summary 的 ${code} 顯示名稱不可修改。`);
    item.annualMaterialRevenue = number(row.getCell(3));
    item.annualOpex = number(row.getCell(4));
    item.annualEbitda = number(row.getCell(5));
    item.capexUsd = number(row.getCell(6));
    item.recoveryRate = number(row.getCell(7));
    item.residualMetricTons = number(row.getCell(8));
  }

  const website = workbook.getWorksheet("Website Values")!;
  headers(website, ["field_key", "label", "unit", ...solutionCodes]);
  const websiteRows = rowsByKey(website);
  requireExactKeys(website, websiteRows, websiteKeys);
  const setByKey = (item: OurSolutionEconomics["solutions"][number], key: typeof websiteKeys[number], next: number) => {
    if (key === "opex_per_panel_electricity") item.opexPerPanel.electricity = next;
    else if (key === "opex_per_panel_labor") item.opexPerPanel.laborAndBurden = next;
    else if (key === "opex_per_panel_facility") item.opexPerPanel.facility = next;
    else if (key === "opex_per_panel_other") item.opexPerPanel.other = next;
    else if (key === "opex_per_panel_total") item.opexPerPanel.total = next;
    else if (key === "material_revenue_silver") item.materialRevenue.silver = next;
    else if (key === "material_revenue_al_cu") item.materialRevenue.aluminumAndCopper = next;
    else if (key === "material_revenue_other") item.materialRevenue.other = next;
    else if (key === "material_revenue_total") item.annualMaterialRevenue = next;
    else if (key === "annual_opex") item.annualOpex = next;
    else item.annualEbitda = next;
  };
  websiteKeys.forEach((key) => solutionCodes.forEach((code, index) => setByKey(data.solutions.find((item) => item.code === code)!, key, number(websiteRows.get(key)!.getCell(index + 4)))));

  const fee = workbook.getWorksheet("Fee Sensitivity")!;
  headers(fee, ["processing_fee_usd_lb", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"]);
  if (fee.actualRowCount !== 8) throw Error("Fee Sensitivity 必須保留 7 個資料列。");
  data.feeSensitivity.feeUsdPerLb = [];
  solutionCodes.forEach((code) => { data.feeSensitivity.annualEbitdaUsdThousands[code] = []; });
  for (let row = 2; row <= 8; row++) {
    data.feeSensitivity.feeUsdPerLb.push(number(fee.getCell(row, 1)));
    solutionCodes.forEach((code, index) => data.feeSensitivity.annualEbitdaUsdThousands[code].push(number(fee.getCell(row, index + 2))));
  }

  const silver = workbook.getWorksheet("Silver Sensitivity")!;
  headers(silver, ["silver_price_change_percent", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"]);
  if (silver.actualRowCount !== 6) throw Error("Silver Sensitivity 必須保留 5 個資料列。");
  data.silverSensitivity.changePercent = [];
  solutionCodes.forEach((code) => { data.silverSensitivity.annualEbitdaUsdThousands[code] = []; });
  for (let row = 2; row <= 6; row++) {
    data.silverSensitivity.changePercent.push(number(silver.getCell(row, 1)) * 100);
    solutionCodes.forEach((code, index) => data.silverSensitivity.annualEbitdaUsdThousands[code].push(number(silver.getCell(row, index + 2))));
  }
  const checked = validateOurSolutionData(data);
  if (!checked.valid) throw Error(checked.errors.join("\n"));
  return checked.data;
}

function addHeader(sheet: ExcelJS.Worksheet, columns: string[]) {
  sheet.addRow(columns);
  const row = sheet.getRow(1);
  row.height = 24;
  row.eachCell((cell) => { cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF151719" } }; });
  sheet.views = [{ state: "frozen", ySplit: 1, showGridLines: false }];
}
function widths(sheet: ExcelJS.Worksheet, values: number[]) { values.forEach((width, index) => { sheet.getColumn(index + 1).width = width; }); }
function money(sheet: ExcelJS.Worksheet, columns: number[], start = 2) { columns.forEach((column) => { for (let row = start; row <= sheet.rowCount; row++) sheet.getCell(row, column).numFmt = "$#,##0.00;[Red]-$#,##0.00"; }); }

export async function createOurSolutionWorkbook(data: OurSolutionEconomics, blank = false) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PV Circonomy";
  workbook.subject = "Our Solution USD data import";
  const numeric = (next: number) => blank ? null : next;
  const instructions = workbook.addWorksheet("Instructions");
  addHeader(instructions, ["PV Circonomy · Our Solution USD data workbook", "Value"]);
  [["Purpose", "Single reviewable source for the Our Solution USD charts and tables."], ["Source", data.meta.sourceSite], ["Scenario", `${data.scenario.region} · ${data.scenario.panelsPerMonth.toLocaleString()} panels/month`], ["Currency", "USD"], ["Editing", "Edit value cells only. Do not rename sheets, field keys, units or solution codes."], ["Import workflow", "Upload → validate → preview differences → publish. Uploading never changes the live website."], ["Disclosure", data.meta.note]].forEach((row) => instructions.addRow(row));
  widths(instructions, [24, 110]);

  const scenario = workbook.addWorksheet("Scenario");
  addHeader(scenario, ["field_key", "label", "value", "unit"]);
  [["region_code", "Region code", data.scenario.regionCode, ""], ["region", "Region", data.scenario.region, ""], ["panels_per_month", "Panels per month", numeric(data.scenario.panelsPerMonth), "panels/month"], ["annual_panels", "Annual panels", numeric(data.scenario.annualPanels), "panels/year"], ["panel_weight_lb", "Panel weight", numeric(data.scenario.panelWeightLb), "lb/panel"], ["annual_input_metric_tons", "Annual input", numeric(data.scenario.annualInputMetricTons), "metric tons/year"], ["processing_fee_usd_per_lb", "Base processing fee", numeric(data.scenario.processingFeeUsdPerLb), "USD/lb"], ["operating_days_per_month", "Operating days", numeric(data.scenario.operatingDaysPerMonth), "days/month"], ["operating_hours_per_day", "Operating hours", numeric(data.scenario.operatingHoursPerDay), "hours/day"]].forEach((row) => scenario.addRow(row));
  widths(scenario, [34, 26, 20, 24]);

  const annual = workbook.addWorksheet("Annual Summary");
  addHeader(annual, ["solution_code", "solution", "material_revenue_usd", "annual_opex_usd", "annual_ebitda_usd", "capex_usd", "recovery_rate", "residual_metric_tons"]);
  data.solutions.forEach((item) => annual.addRow([item.code, item.label, numeric(item.annualMaterialRevenue), numeric(item.annualOpex), numeric(item.annualEbitda), numeric(item.capexUsd), numeric(item.recoveryRate), numeric(item.residualMetricTons)]));
  widths(annual, [22, 22, 24, 22, 24, 18, 18, 24]); money(annual, [3, 4, 5, 6]); for (let row = 2; row <= annual.rowCount; row++) annual.getCell(row, 7).numFmt = "0.00%";

  const website = workbook.addWorksheet("Website Values");
  addHeader(website, ["field_key", "label", "unit", ...solutionCodes]);
  const getters: Record<typeof websiteKeys[number], (item: OurSolutionEconomics["solutions"][number]) => number> = {
    opex_per_panel_electricity: (item) => item.opexPerPanel.electricity, opex_per_panel_labor: (item) => item.opexPerPanel.laborAndBurden, opex_per_panel_facility: (item) => item.opexPerPanel.facility, opex_per_panel_other: (item) => item.opexPerPanel.other, opex_per_panel_total: (item) => item.opexPerPanel.total,
    material_revenue_silver: (item) => item.materialRevenue.silver, material_revenue_al_cu: (item) => item.materialRevenue.aluminumAndCopper, material_revenue_other: (item) => item.materialRevenue.other, material_revenue_total: (item) => item.annualMaterialRevenue, annual_opex: (item) => item.annualOpex, annual_ebitda: (item) => item.annualEbitda,
  };
  const labels: Record<typeof websiteKeys[number], [string, string]> = { opex_per_panel_electricity: ["Electricity", "USD/panel"], opex_per_panel_labor: ["Labor + burden", "USD/panel"], opex_per_panel_facility: ["Facility / rent", "USD/panel"], opex_per_panel_other: ["Other operating costs", "USD/panel"], opex_per_panel_total: ["Total operating cost", "USD/panel"], material_revenue_silver: ["Material revenue — silver", "USD/year"], material_revenue_al_cu: ["Material revenue — Al, Cu", "USD/year"], material_revenue_other: ["Other recovered materials", "USD/year"], material_revenue_total: ["Total material revenue", "USD/year"], annual_opex: ["Operating cost", "USD/year"], annual_ebitda: ["Annual EBITDA", "USD/year"] };
  websiteKeys.forEach((key) => website.addRow([key, ...labels[key], ...solutionCodes.map((code) => numeric(getters[key](data.solutions.find((item) => item.code === code)!)))]));
  widths(website, [34, 32, 18, 20, 20, 20]); money(website, [4, 5, 6]);

  const materials = workbook.addWorksheet("Material Revenue");
  addHeader(materials, ["solution_code", "solution", "silver_usd_year", "aluminum_copper_usd_year", "other_usd_year", "total_usd_year"]);
  data.solutions.forEach((item) => materials.addRow([item.code, item.label, numeric(item.materialRevenue.silver), numeric(item.materialRevenue.aluminumAndCopper), numeric(item.materialRevenue.other), numeric(item.annualMaterialRevenue)]));
  widths(materials, [22, 22, 22, 30, 22, 22]); money(materials, [3, 4, 5, 6]);

  const fee = workbook.addWorksheet("Fee Sensitivity");
  addHeader(fee, ["processing_fee_usd_lb", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"]);
  data.feeSensitivity.feeUsdPerLb.forEach((amount, index) => fee.addRow([numeric(amount), ...solutionCodes.map((code) => numeric(data.feeSensitivity.annualEbitdaUsdThousands[code][index]))]));
  widths(fee, [28, 38, 38, 40]);

  const silver = workbook.addWorksheet("Silver Sensitivity");
  addHeader(silver, ["silver_price_change_percent", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"]);
  data.silverSensitivity.changePercent.forEach((amount, index) => silver.addRow([numeric(amount / 100), ...solutionCodes.map((code) => numeric(data.silverSensitivity.annualEbitdaUsdThousands[code][index]))]));
  widths(silver, [30, 38, 38, 40]); for (let row = 2; row <= silver.rowCount; row++) silver.getCell(row, 1).numFmt = "0%";

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
