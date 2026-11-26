import { defaultMouPolicy, defaultMouSalesAgents } from "../../lib/mou-policy";
import { activeOurSolutionParameterData } from "../our-solution/store";
import { equipmentMouHasSalesAgent, otherSitePowerSupply, type EquipmentMouAgent, type EquipmentMouInput, type EquipmentMouTerms } from "../../lib/equipment-mou";

import { configuredEquipmentMarkets } from "../equipment-configurations/pricing";
import { defaultEquipmentConfigurations, equipmentLineRating, integratedEquipmentThroughput } from "../../lib/equipment-configurations";
import { defaultEquipmentQuantitative } from "../../lib/equipment-quantitative";
import { equipmentMarketAmount, equipmentUsdTotal } from "../../lib/equipment-module-pricing";
import { ourSolutionParameterMarkets, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { equipmentSettingsForInquiry } from "../equipment-configurations/store";
import { loadEquipmentExchangeRates } from "../equipment-configurations/exchange-rates";
import { equipmentMouGoverningLaw } from "../../lib/equipment-mou-articles";

function text(value: unknown, max = 240) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max || /[\x00-\x1f]/.test(value)) return undefined;
  return value.trim();
}

export async function equipmentMouSalesTerms(market: PublicSolutionMarket) {
  const configuredAgent = configuredEquipmentMarkets()[market]?.agent;
  let agent: EquipmentMouAgent | null = null;
  if (configuredAgent) {
    const company = text(configuredAgent.company, 160);
    if (!company) throw new Error("invalid_mou_agent");
    agent = {
      company,
      address: text(configuredAgent.address),
      representative: text(configuredAgent.representative, 120),
      title: text(configuredAgent.title, 120),
      email: text(configuredAgent.email, 254),
    };
  }
  const marketParameters = await activeOurSolutionParameterData(market).catch(() => null);
  const policy = marketParameters?.data.mouPolicy ?? defaultMouPolicy;
  const agentCandidates = agent ? [] : policy.salesAgents ?? defaultMouSalesAgents(market);
  return { agent, agentCandidates, policy, marketAvailable: marketParameters !== null };
}

export async function equipmentMouMarket(input: EquipmentMouInput): Promise<{ terms: EquipmentMouTerms; msrpPerLine: number | null } | null> {
  const market = input.installationMarket;
  const governingLaw = equipmentMouGoverningLaw(input);
  const currency = ourSolutionParameterMarkets[market].currency;
  const [settings, fx, sales] = await Promise.all([
    equipmentSettingsForInquiry().catch(() => null),
    currency === "USD" ? Promise.resolve(null) : loadEquipmentExchangeRates(),
    equipmentMouSalesTerms(market),
  ]);
  const prices = settings?.modulePrices;
  const quantitative = settings?.quantitative ?? defaultEquipmentQuantitative;
  if (input.sitePowerSupply && input.sitePowerSupply !== otherSitePowerSupply && !quantitative.sitePower[market].includes(input.sitePowerSupply)) return null;
  const configurations = settings?.configurations ?? defaultEquipmentConfigurations;
  const configuration = input.configuration === "plus" ? input.baseConfiguration : input.configuration;
  const variant = configuration ?? "basic";
  const specification = configurations[variant].values;
  const mou = quantitative.mou;
  const specifications = {
    ratedThroughput: input.configuration === "plus" ? integratedEquipmentThroughput(configurations, variant) : equipmentLineRating(configurations, variant).panelsPerMinute,
    standardCells: mou.standardCells,
    energyPerPanel: specification["Energy consumption"],
    compressedAirLpm: mou.compressedAirLpm,
    compressedAirBar: mou.compressedAirBar,
    installedKw: mou[`${variant}InstalledKw`],
    footprint: specification["Recommended footprint"],
    moduleLength: specification["Module length"],
    moduleWidth: specification["Module width"],
    moduleWeight: specification["Module max. weight"],
    frameThickness: `${mou.frameMinMm}–${mou.frameMaxMm} mm`,
    glassThickness: `${mou.glassMinMm}–${mou.glassMaxMm} mm`,
  };
  const selected = prices ? equipmentUsdTotal(prices, input.configuration) : 0;
  const base = prices && input.baseConfiguration ? equipmentUsdTotal(prices, input.baseConfiguration) : 0;
  const usd = input.configuration === "plus" ? selected > 0 && base > 0 ? base + selected : 0 : selected;
  const msrpPerLine = market !== "JP" && sales.marketAvailable && !equipmentMouHasSalesAgent(sales) && usd > 0
    ? equipmentMarketAmount(usd, currency, fx?.rates[currency], quantitative.pricing.nonUsdFactor) : null;
  const seller = market === "JP" ? "東建安股份有限公司" : "PV Circonomy Company";
  const { agent, agentCandidates, policy } = sales;
  return { terms: { seller, agent, agentCandidates, governingLaw, specifications, policy }, msrpPerLine };
}
