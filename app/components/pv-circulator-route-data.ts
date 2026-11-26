import { marketNames, ourSolutionParameterMarkets, publicSolutionMarketForPage, type OurSolutionLocale } from "../../lib/our-solution/market";
import { model } from "../../lib/our-solution/model";
import { parameter, parameterCurrency, scenarioPanelWeightKg, scenarioPanelWeightLb, scenarioRecyclingFeeSteps } from "../../lib/our-solution/parameters";
import type { MarketTransport } from "../../lib/our-solution/transport";
import { resolveMarketTransport } from "../../server/our-solution/transport";
import { loadSolutionOperatingData } from "../../server/our-solution/public-view";

export type PVCirculatorTransportPricing = MarketTransport;

export async function loadPVCirculatorReference(requestedMarket: unknown, locale: OurSolutionLocale) {
  const market = publicSolutionMarketForPage(requestedMarket, locale);
  const source = await loadSolutionOperatingData(market);
  if (!source) return { market };
  const { data, prices } = source;
  const transportPricing = await resolveMarketTransport(market, data.transport, parameter(data, 7, "Pallet footprint"));
  const specificationFx = market === "JP" ? data.meta.localPerUSD : undefined;
  const result = model(data, prices);
  const feeUnit = String(data.assumptions[11]["Recovery fee"][1]);
  const region = data.scenario.region.trim();
  const california = market === "US" && /^California$/i.test(region);
  const countryScenario = region.toLowerCase() === ourSolutionParameterMarkets[market].region.toLowerCase();
  const californiaLabel = { "en-US": "California", "zh-TW": "加州", "ja-JP": "カリフォルニア州" }[locale];
  const routes = Object.values(result.solutions).map(solution => ({
    code: solution.code,
    materialRevenuePerMw: solution.perMw.materialRevenue,
    operatingCostsPerMw: Object.entries(solution.opex).map(([key, cost]) => ({
      key,
      amount: cost * result.panelsPerMw / result.annualPanels,
    })),
    landfillTPerMw: solution.residualTPerMw,
    co2eTPerMw: solution.co2eTPerMw,
    recoveryRate: solution.recoveryRate,
  }));
  const circulator = result.solutions.PVCIRCULATOR;
  return {
    market,
    routes,
    transportPricing,
    silverGrades: Object.values(result.solutions).map(({ code, silverUpperPct }) => ({
      code,
      silverUpperPct: Number.isFinite(silverUpperPct) ? silverUpperPct : null,
    })),
    recovery: {
      materials: circulator.materials.map(material => ({
        name: material.name,
        recoveredTonnesPerPanel: material.recoveredT / result.annualPanels,
        revenuePerPanel: material.revenue / result.annualPanels,
      })),
      residualTonnesPerPanel: circulator.residualT / result.annualPanels,
      residualCostPerPanel: circulator.opex.secondary / result.annualPanels,
    },
    specificationFx,
    reference: {
      region: california ? californiaLabel : countryScenario ? marketNames[locale][market] : region,
      panelWeightKg: scenarioPanelWeightKg(data),
      panelWeightLb: scenarioPanelWeightLb(data),
      panelWatts: parameter(data, 10, "Panel rating"),
      panelsPerMinute: parameter(data, 4, "Capacity", 2) / 60,
      staffPerShift: parameter(data, 12, "methods.circulator.total_staff_per_shift"),
      panelsPerMonth: data.scenario.panels_per_month,
      processingFee: parameter(data, 11, "Recovery fee"),
      currency: parameterCurrency(data),
      feeUnit,
      feeSteps: scenarioRecyclingFeeSteps(data),
    },
  };
}

export type PVCirculatorReference = NonNullable<Awaited<ReturnType<typeof loadPVCirculatorReference>>["reference"]>;

export type PVCirculatorRecovery = NonNullable<Awaited<ReturnType<typeof loadPVCirculatorReference>>["recovery"]>;
export type PVCirculatorSilverGrades = NonNullable<Awaited<ReturnType<typeof loadPVCirculatorReference>>["silverGrades"]>;

export type PVCirculatorProfitRoute = NonNullable<Awaited<ReturnType<typeof loadPVCirculatorReference>>["routes"]>[number];
