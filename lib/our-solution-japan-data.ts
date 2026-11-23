import { seededOurSolutionData, type OurSolutionEconomics } from "./our-solution-data";

const USD_JPY = 158.01;
const jpyPerKgToUsdPerLb = (value: number) => value * 0.45359237 / USD_JPY;

/**
 * Initial Japan parameter master.
 *
 * The calculation contract stays identical to the approved US model. Japan-local
 * inputs are converted to the model's USD base currency so US and JP previews can
 * use the same engine until presentation-currency support is introduced.
 */
export const seededJapanOurSolutionData: OurSolutionEconomics = (() => {
  const data = structuredClone(seededOurSolutionData);

  data.scenario = {
    ...data.scenario,
    region_code: "JP",
    region: "Japan",
    panels_per_month: 50_000_000 / 300 / 12,
    panel_weight_lb: 20 / 0.45359237,
  };

  data.assumptions[1]["Hourly wage"] = [2062.5 / USD_JPY, "USD/hour"];
  data.assumptions[1]["Electricity price"] = [26.73 / USD_JPY, "USD/kWh"];
  data.assumptions[1]["Landfill cost"] = [26.25 * 907.18474 / USD_JPY, "USD/short ton"];

  data.assumptions[5].Glass = [0.7, 100, "USD/metric ton", "Japan draft: cement benchmark from supplied cost analysis"];
  data.assumptions[5].Aluminium = [0.17, 2995, "USD/metric ton", "LME 3M aluminium, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5].Copper = [0.0105, 13730.5, "USD/metric ton", "LME 3M copper, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5].Silicon = [0.035, 1350, "USD/metric ton", "Recovered-silicon reference; supplied Japan cost analysis"];
  data.assumptions[5].Silver = [0.0005, 51.09, "USD/troy oz", "Kitco silver bid, 10 Nov 2026; supplied Japan cost analysis"];
  data.assumptions[5].EVA = [0.05, 0, "USD/metric ton", "Approved US-template value: no sale value"];
  data.assumptions[5].Backsheet = [0.025, 0, "USD/metric ton", "Approved US-template value: no sale value"];

  data.assumptions[10]["Panel rating"] = [300, "W"];
  data.assumptions[11]["Recovery fee"] = [jpyPerKgToUsdPerLb(100), "USD/lb"];
  data.assumptions[11]["Processing fee steps (USD/lb)"] = [0, 26.25, 50, 75, 100, 125, 150].map(jpyPerKgToUsdPerLb);

  data.meta = {
    currency: "USD",
    extractedAt: "2026-11-23T00:00:00.000Z",
    sourceSite: "https://www.pvcirconomy.com/ja/solutions/",
    note: "Japan draft parameter master. US calculation template; Japan-local costs normalized to USD at 158.01 JPY/USD. IEA lifetime fit pending.",
  };
  return data;
})();

