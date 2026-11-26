import { seededOurSolutionData, type OurSolutionEconomics } from "./our-solution-data";
import { japanFeeBenchmarkRows } from "./our-solution/public-data";

export const USD_JPY = 158.01;
const usdPerMetricTonToJpyPerMetricTon = (value: number) => value * USD_JPY;
const usdPerLbToJpyPerKg = (value: number) => value * USD_JPY / 0.45359237;

/**
 * Initial Japan parameter master.
 *
 * Japan-native seed used to create the JP workbook template. Values are stored in
 * JPY and metric units; USD source benchmarks are converted once at the workbook
 * boundary using the explicit FX value retained in metadata.
 */
export const seededJapanOurSolutionData: OurSolutionEconomics = (() => {
  const data = structuredClone(seededOurSolutionData);
  Object.assign(data.assumptions[12], structuredClone(japanFeeBenchmarkRows));

  data.scenario = {
    ...data.scenario,
    region_code: "JP",
    region: "Japan",
    panels_per_month: 50_000_000 / 300 / 12,
    panel_weight_kg: 20,
  };
  delete data.scenario.panel_weight_lb;

  data.assumptions[1]["Hourly wage"] = [2062.5, "JPY/hour"];
  data.assumptions[1]["Base rent"] = [18 * USD_JPY * 10.7639104 / 12, "JPY/sq.m./month"];
  data.assumptions[1].CAM = [3.5 * USD_JPY * 10.7639104 / 12, "JPY/sq.m./month"];
  data.assumptions[1]["Electricity price"] = [26.73, "JPY/kWh"];
  data.assumptions[1]["Landfill cost"] = [26_250, "JPY/metric ton"];

  for (const label of ["Forklift / handling", "Insurance and compliance", "Facility utilities / admin"]) {
    data.assumptions[2][label][0] = Number(data.assumptions[2][label][0]) * USD_JPY;
    data.assumptions[2][label][1] = "JPY/year";
  }
  data.assumptions[2].Packaging = [Number(data.assumptions[2].Packaging[0]) * USD_JPY, "JPY/panel"];
  data.assumptions[4]["Capex per line"] = [...(data.assumptions[4]["Capex per line"].slice(0,3) as number[]).map(value=>value*USD_JPY), "JPY"];
  data.assumptions[4].Consumables = [...(data.assumptions[4].Consumables.slice(0,3) as number[]).map(value=>value*USD_JPY), "JPY/panel"];

  data.assumptions[5].Glass = [0.7, usdPerMetricTonToJpyPerMetricTon(100), "JPY/metric ton", "Japan draft: cement benchmark from supplied cost analysis"];
  data.assumptions[5].Aluminium = [0.17, usdPerMetricTonToJpyPerMetricTon(2995), "JPY/metric ton", "LME 3M aluminium, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5].Copper = [0.0105, usdPerMetricTonToJpyPerMetricTon(13730.5), "JPY/metric ton", "LME 3M copper, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5].Silicon = [0.035, usdPerMetricTonToJpyPerMetricTon(1350), "JPY/metric ton", "Recovered-silicon reference; supplied Japan cost analysis"];
  data.assumptions[5].Silver = [0.0005, 51.09 * USD_JPY, "JPY/troy oz", "Kitco silver bid, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5]["Junction box"] = [0.0075, usdPerLbToJpyPerKg(0.5), "JPY/kg", "Approved US-template benchmark converted using workbook FX"];
  data.assumptions[5].EVA = [0.05, 0, "JPY/metric ton", "Approved US-template value: no sale value"];
  data.assumptions[5].Backsheet = [0.025, 0, "JPY/metric ton", "Approved US-template value: no sale value"];

  for (const label of ["Sulfuric acid price", "Hydrogen peroxide price", "Nitric acid price"]) {
    data.assumptions[9][label][0] = Number(data.assumptions[9][label][0]) * USD_JPY;
    data.assumptions[9][label][1] = "JPY/metric ton as sold";
  }

  data.assumptions[10]["Panel rating"] = [300, "W"];
  data.assumptions[10]["Average lifetime T"] = [18, "years"];
  data.assumptions[10]["Loss scenario"] = ["Regular-loss"];
  data.assumptions[11]["Recovery fee"] = [100, "JPY/kg"];
  data.assumptions[11]["Processing fee steps"] = [0, 26.25, 50, 75, 100, 125, 150];
  delete data.assumptions[11]["Processing fee steps (USD/lb)"];

  data.meta = {
    currency: "JPY",
    locale: "ja-JP",
    localPerUSD: USD_JPY,
    extractedAt: "2026-11-23T00:00:00.000Z",
    sourceSite: "https://www.pvcirconomy.com/ja/solutions/",
    note: "Japan-native parameter master using JPY, kg, metric tonnes, square metres and kWh. FX is retained only to convert USD market feeds and global equipment assumptions. The IEA/IRENA Weibull model uses a 25-year regular-loss lifetime, the closest approved lifetime/shape pair to Japan's published 2024 collection observation; collected mass is not treated as total retired mass.",
  };
  return data;
})();

