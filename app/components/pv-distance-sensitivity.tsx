"use client";

import { freightCostTrend, freightDistanceSteps } from "../../lib/our-solution/freight-cost-trends";
import { ourSolutionParameterMarkets, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { estimateAnnualFreight, transportUnits } from "../../lib/our-solution/transport";
import type { PVCirculatorReference, PVCirculatorTransportPricing } from "./pv-circulator-route-data";
import { EconomicLineChart } from "./economic-line-chart";

export function DistanceSensitivity({ annualPanels, reference, pricing, market, locale, t }: {
  annualPanels: number | null;
  reference?: PVCirculatorReference;
  pricing?: PVCirculatorTransportPricing;
  market: PublicSolutionMarket;
  locale: OurSolutionLocale;
  t: (english: string) => string;
}) {
  const { distance: distanceUnit, weight: weightUnit } = transportUnits(market);
  const currency = reference?.currency ?? ourSolutionParameterMarkets[market].currency;
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const whole = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const labelForDistance = (distance: number) => `${whole.format(distance)} ${distanceUnit}`;
  const panelWeight = weightUnit === "lb" ? reference?.panelWeightLb : reference?.panelWeightKg;
  const freightDetails = pricing && annualPanels !== null && panelWeight
    ? estimateAnnualFreight(pricing, annualPanels, panelWeight, freightDistanceSteps)
    : null;
  const annual = freightDetails !== null;
  const points = freightDetails
    ? freightDetails.map((row, index) => ({ distance: freightDistanceSteps[index], cost: row.total }))
    : freightCostTrend(market);

  return <section className="pvc2-distance-cost" aria-labelledby="pvc2-distance-title">
    <h3 id="pvc2-distance-title">{t("Owner cost = freight + recycling fee")}</h3>
    {annual && annualPanels !== null && reference && <p className="pv-note">
      {whole.format(annualPanels)} {t("panels/year")} · {number.format(reference.panelWeightKg)} kg / {t("panel")}
    </p>}
    <EconomicLineChart
      title={t(annual ? "One-way distance avoided vs. annual freight savings" : "One-way distance vs. freight per trip")}
      subtitle={t(annual ? "Thousands of {currency} per year" : "{currency} per trip").replace("{currency}", currency)}
      labels={points.map(({ distance }) => labelForDistance(distance))}
      positions={points.map(({ distance }) => distance)}
      ticks={freightDistanceSteps.map(value => ({ value, label: labelForDistance(value) }))}
      series={[{
        label: t(annual ? "Annual freight savings" : "Estimated freight per trip"),
        className: "is-circulator",
        values: points.map(({ cost }) => annual ? Math.round(cost / 100) / 10 : Math.round(cost)),
        pointLabels: annual ? undefined : "last",
      }]}
      numberLocale={locale}
    />
    <p className="pv-note">{t(annual
      ? "On-site processing at zero distance has no inbound freight."
      : "Illustrative trend. Freight varies by route and vehicle.")}</p>
  </section>;
}
