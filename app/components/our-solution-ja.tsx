/* Japanese edition of Our Solution. Keep its market behavior in sync with the English edition. */
"use client";
import { defaultEquipmentQuantitative, type EquipmentClaims } from "../../lib/equipment-quantitative";
import { EconomicLineChart, type EconomicSeries } from "./economic-line-chart";
import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { PublicHeader } from "./public-header";
import { californiaPvRule } from "./california-pv-rule";
import { FacilityRentArea } from "./facility-rent-area";
import { chineseEconomicCopy } from "./economic-copy-zh";
import { DirectCellPowderSale } from "./direct-cell-powder-sale";
import { JapanFeeBenchmark } from "./japan-fee-benchmark";
import { MarketOperatingCostChart } from "./market-operating-cost-chart";
import { businessCaseHref, localizedPublicPath, marketNames, solutionDemandMarket, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { ProcessPlaylist } from "./pv-circulator-page";
import { capacityTrend as buildCapacityTrend, usCumulativeMw, type CapacityTrendPoint } from "../../lib/market-capacity";
import type { RetirementWave } from "../../lib/us-retirement-wave";
import { seededOurSolutionData, economicsView } from "../../lib/our-solution-data";
import { model } from "../../lib/our-solution/model";
import type { ImpactRouteMetric } from "../../lib/our-solution/model";
import type { EconomicsView } from "../../lib/our-solution-data";
import { websiteNumber } from "../../lib/our-solution/public-data";
import { scenarioPanelWeightKg } from "../../lib/our-solution/parameters";
import { formatCurrency } from "../../lib/region-format";
import { initialJapanRules, tierRate, type PricingRules } from "../../lib/pricing-rules";
import { defaultTransportLimits } from "../../lib/pickup";
import "./review-home.css";
export type BreakevenView = {
    region: string;
    feeUnit: string;
    currency: string;
    panelsPerMonth: number;
    panelWeightKg: number; panelWeightLb?: number; weightUnit?: "kg" | "lb";
    source: string;
    fees: {
        code: string;
        breakevenFee: number | null;
    }[];
} | null;
const webNum = (data: OurSolutionView, key: string) => websiteNumber(data.websiteData, key);
const compactNumber = (value: number) => Number.isInteger(value) ? String(value) : value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
const panelCount = new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 });
// Only fields used by the public story cross the server/client boundary.
export type OurSolutionView = EconomicsView;
type WaveAssumptions = {
    defaultLifetime: 25 | 18 | 15 | 12;
    loss: "early" | "regular";
    shapes: {
        early: number;
        regular: number;
    };
    panelWeightKg: number; panelWeightLb?: number; weightUnit?: "kg" | "lb";
    panelRating: number;
    tonnesPerMw: number;
};
const defaultModel = model(seededOurSolutionData);
const defaultWaveAssumptions: WaveAssumptions = { defaultLifetime: defaultModel.defaultLifetime as 25 | 18 | 15 | 12, loss: defaultModel.loss, shapes: defaultModel.shapes, panelWeightKg: scenarioPanelWeightKg(seededOurSolutionData), panelRating: Number(seededOurSolutionData.assumptions[10]["Panel rating"][0]), tonnesPerMw: defaultModel.kgPerMw / 1000 };
const sections = [
    ["overview", "\u6982\u8981"],
    ["wave", "\u5EC3\u68C4\u306E\u6CE2"],
    ["stakes", "\u4E3B\u8981\u8AB2\u984C"],
    ["system", "\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3"],
    ["first-principles", "\u539F\u7406"],
    ["conventional", "\u65B9\u6CD5"],
    ["regulation", "\u5F71\u97FF"],
    ["materials", "\u6750\u6599"],
    ["value", "\u4FA1\u5024"],
    ["economic", "経済性"],
    ["evidence", "\u30D1\u30B9\u30DD\u30FC\u30C8"],
    ["scale", "\u898F\u6A21"],
    ["pathways", "\u30A2\u30AF\u30B7\u30E7\u30F3"],
] as const;
type SectionId = (typeof sections)[number][0];
type DeckSlide = {
    label: string;
    navigationLabel?: string;
    visual: ReactNode;
    noteTitle: string;
    note: ReactNode;
};
function Arrow({ direction = "right" }: {
    direction?: "left" | "right";
}) {
    return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d={direction === "right" ? "M3 9h11M10 5l4 4-4 4" : "M15 9H4m4-4L4 9l4 4"} stroke="currentColor" strokeWidth="1.3"/></svg>;
}
function CostBenchmarkChart({ data, rules, residentialSurchargePct }: {
    data: OurSolutionView;
    rules: PricingRules;
    residentialSurchargePct: number;
}) {
    const watts = webNum(data, "stakes.cost.reference_panel_watts"), panelsPerMw = 1e6 / watts, weightLb = data.scenario.panelWeightLb;
    const truckRate = tierRate(watts, "panel", {}, rules)?.rate ?? 0, utilityRate = tierRate(watts, "lb", {}, rules)?.rate ?? 0;
    const residential = truckRate * (1 + residentialSurchargePct / 100) * panelsPerMw, utility = utilityRate * weightLb * panelsPerMw;
    const landfillLow = webNum(data, "stakes.cost.nrel_landfill_low_usd_per_panel") * panelsPerMw, landfillHigh = webNum(data, "stakes.cost.nrel_landfill_high_usd_per_panel") * panelsPerMw;
    const { conventional, hotKnife } = economicsSolutions(data), pvCirconomy = (residential + utility) / 2, landfill = (landfillLow + landfillHigh) / 2;
    const shredding = conventional.opexPerPanel.total * panelsPerMw, thermal = hotKnife.opexPerPanel.total * panelsPerMw;
    const bars = [
        { label: "\u57CB\u7ACB", value: landfill, className: "is-landfill" },
        { label: "PV Circonomy", value: pvCirconomy, className: "is-pv-circonomy" },
        { label: THREE_METHODS[0], value: shredding, className: "is-shredding" },
        { label: THREE_METHODS[1], value: thermal, className: "is-thermal" },
    ];
    const max = Math.max(...bars.map(bar => bar.value)) * 1.16, money = (value: number) => `$${Math.round(value).toLocaleString("ja-JP")}`, percentage = (value: number) => `${value / max * 100}%`;
    return <figure className="os-cost-benchmark">
    <figcaption><strong>1 MW 当たりのリサイクル費用</strong><span>{compactNumber(watts)} W モジュール・住宅用／大規模発電用の現行料金と試算運営費</span></figcaption>
    <div className="os-cost-plot" role="img" aria-label={`1 MW 当たりの費用：埋立の中央値 ${money(landfill)}、PV Circonomy の住宅用／大規模発電用の現行料金の平均 ${money(pvCirconomy)}、${THREE_METHODS[0]} ${money(shredding)}、${THREE_METHODS[1]} ${money(thermal)}。`}>
      <div className="os-cost-columns">{bars.map(bar => <div className={`os-cost-column ${bar.className}`} style={{ "--bar": percentage(bar.value) } as CSSProperties} key={bar.label}><strong>{money(bar.value)}</strong><i aria-hidden="true"/><span>{bar.label}</span></div>)}</div>
    </div>
    <small>PV Circonomy は住宅用と大規模発電用の現行処理料金の平均、埋立は NREL の推計範囲の中央値です。{THREE_METHODS[0]}と{THREE_METHODS[1]}はカリフォルニア州の試算運営費です。輸送費、税金、設備投資、減価償却費は含みません。NREL の推計にも輸送費は含まれません。</small>
  </figure>;
}
function GlobalDeploymentMap() {
    const markets = [
        { name: "米国", left: "20.5%", top: "38%" },
        { name: "オーストラリア", left: "84%", top: "70.5%" },
        { name: "日本", left: "89.5%", top: "34%" },
        { name: "欧州", left: "52.5%", top: "31.5%" },
        { name: "台湾", left: "86.5%", top: "45%" },
    ];
    return <div className="os-global-map" role="img" aria-label="米国、オーストラリア、日本、欧州、台湾における PV Circulator の商用化を示す世界地図">
    <img src="/images/world-map-low.svg" alt="" aria-hidden="true"/>
    {markets.map((market, index) => <span className="os-map-market" key={market.name} style={{ left: market.left, top: market.top }}><i>{index + 1}</i><b>{market.name}</b></span>)}
  </div>;
}
function StoryDeck({ id, title, slides, variant, autoAdvanceMs }: {
    id: string;
    title: string;
    slides: DeckSlide[];
    variant: "split" | "band";
    autoAdvanceMs?: number;
}) {
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const deckRef = useRef<HTMLDivElement>(null);
    const touchStart = useRef<number | null>(null);
    const slide = slides[current];
    function move(direction: -1 | 1) { setCurrent((value) => Math.min(slides.length - 1, Math.max(0, value + direction))); }
    useEffect(() => {
        if (!autoAdvanceMs || !deckRef.current)
            return;
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.45 });
        observer.observe(deckRef.current);
        return () => observer.disconnect();
    }, [autoAdvanceMs]);
    useEffect(() => {
        if (!autoAdvanceMs || isPaused || !isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        const timer = window.setTimeout(() => {
            if (document.visibilityState === "visible")
                setCurrent((value) => (value + 1) % slides.length);
        }, autoAdvanceMs);
        return () => window.clearTimeout(timer);
    }, [autoAdvanceMs, current, isPaused, isVisible, slides.length]);
    return <div ref={deckRef} id={id} className={`os-story-deck os-story-${variant} os-deck-${id}${autoAdvanceMs ? " is-auto" : ""}${autoAdvanceMs && (isPaused || !isVisible) ? " is-paused" : ""}`} style={autoAdvanceMs ? ({ "--deck-duration": `${autoAdvanceMs}ms` } as CSSProperties) : undefined} role="region" aria-label={title} tabIndex={0} onFocusCapture={() => setIsPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setIsPaused(false); }} onKeyDown={(event) => { if ((event.target as HTMLElement).closest("select, input, textarea"))
        return; if (event.key === "ArrowLeft")
        move(-1); if (event.key === "ArrowRight")
        move(1); }} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current === null)
        return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 55)
        move(distance < 0 ? 1 : -1); touchStart.current = null; }}>
    <div className="os-slide-stage" aria-live="polite"><div key={`${id}-${current}`} className="os-slide-frame">{slide.visual}</div>{slides.length > 1 && <div className="os-slide-counter" aria-hidden="true">{String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</div>}</div>
    <aside className="os-speaker-notes" aria-label="スライドの文脈"><div>{variant === "split" && slide.noteTitle && <h3>{slide.noteTitle}</h3>}<div className="os-note-copy">{slide.note}</div></div>{slides.length > 1 && <div className="os-deck-navigation" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}><div className="os-deck-progress" aria-label="スライドを選択">{slides.map((item, index) => <button key={item.label} type="button" aria-label={`スライド${index + 1}「${item.label}」を表示`} aria-pressed={current === index} onClick={() => setCurrent(index)}><span />{item.navigationLabel && <small>{item.navigationLabel}</small>}</button>)}</div></div>}</aside>
  </div>;
}
const stakeSolutions = {
    cost: {
        label: "\u30B3\u30B9\u30C8",
        heading: "\u51E6\u7406\u8CBB\u304C\u306A\u304F\u3066\u3082\u5229\u76CA\u3092\u751F\u3080\u30EA\u30B5\u30A4\u30AF\u30EB",
        summary: "\u30B3\u30B9\u30C8\u3092\u4E0B\u3052\u3001\u56DE\u53CE\u6750\u6599\u306E\u4FA1\u5024\u3092\u9AD8\u3081\u307E\u3059\u3002",
        stakeholders: [
            ["\u4E0A\u6D41\u306E\u6240\u6709\u8005", "\u30EA\u30B5\u30A4\u30AF\u30EB\u30B3\u30B9\u30C8\u3092\u4E0B\u3052\u3001\u3088\u308A\u591A\u304F\u306E\u4FA1\u5024\u3092\u9084\u5143\u3057\u307E\u3059\u3002"],
            ["\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005", "\u8A2D\u5099\u6295\u8CC7\uFF08CAPEX\uFF09\u3068\u904B\u55B6\u30B3\u30B9\u30C8\uFF08OPEX\uFF09\u3092\u4E0B\u3052\u3001\u6750\u6599\u53CE\u76CA\u3092\u9AD8\u3081\u307E\u3059\u3002"],
            ["\u4E0B\u6D41\u306E\u5229\u7528\u8005", "\u518D\u751F\u539F\u6599\u3092\u30D0\u30FC\u30B8\u30F3\u6750\u3088\u308A\u4F4E\u4FA1\u683C\u3067\u63D0\u4F9B\u3057\u307E\u3059\u3002"],
            ["\u793E\u4F1A", "\u30B7\u30B9\u30C6\u30E0\u5168\u4F53\u306E\u5EC3\u68C4\u7269\u3068\u74B0\u5883\u30B3\u30B9\u30C8\u3092\u524A\u6E1B\u3057\u307E\u3059\u3002"],
            ["PV Circonomy", "\u5229\u76CA\u3092\u751F\u3080\u30E2\u30C7\u30EB\u3067\u3001\u8CAC\u4EFB\u3042\u308B\u30EA\u30B5\u30A4\u30AF\u30EB\u3092\u62E1\u5927\u3057\u307E\u3059\u3002"],
        ],
        intro: "PV Circonomy \u306F\u3001\u4E0D\u8981\u306A\u51E6\u7406\u5DE5\u7A0B\u3092\u6E1B\u3089\u3057\u3001\u56DE\u53CE\u6750\u6599\u306E\u4FA1\u5024\u3092\u30B7\u30B9\u30C6\u30E0\u5185\u306B\u7DAD\u6301\u3059\u308B\u3053\u3068\u3067\u3001\u30EA\u30B5\u30A4\u30AF\u30EB\u306E\u7DCF\u30B3\u30B9\u30C8\u3092\u524A\u6E1B\u3057\u307E\u3059\u3002",
        goal: "\u57CB\u7ACB\u3068\u540C\u3058\u4FA1\u683C\u3067\u3059\u3002",
        drivers: [
            ["\u56DE\u907F\u53EF\u80FD\u306A\u51E6\u7406\u3092\u524A\u6E1B", "\u5E38\u6E29\u306E\u7269\u7406\u51E6\u7406\u306B\u3088\u308A\u3001\u5316\u5B66\u51E6\u7406\u3001\u71B1\u51E6\u7406\u3001\u6C34\u51E6\u7406\u306E\u8CA0\u62C5\u3092\u56DE\u907F\u3057\u307E\u3059\u3002"],
            ["\u53CD\u5FA9\u4F5C\u696D\u3092\u81EA\u52D5\u5316", "AI \u652F\u63F4\u306E\u81EA\u52D5\u5316\u306B\u3088\u308A\u3001\u4E00\u4EBA\u306E\u30AA\u30DA\u30EC\u30FC\u30BF\u30FC\u3067\u4E00\u8CAB\u3057\u305F\u5DE5\u7A0B\u3092\u904B\u7528\u3067\u304D\u307E\u3059\u3002"],
            ["\u6750\u6599\u4FA1\u5024\u3092\u7DAD\u6301", "\u5C64\u3054\u3068\u306E\u5206\u96E2\u306B\u3088\u308A\u3001\u6E05\u6D44\u306A\u6750\u6599\u3092\u5EC3\u68C4\u305B\u305A\u3001\u8CA9\u58F2\u3084\u30A2\u30C3\u30D7\u30B5\u30A4\u30AF\u30EB\u306B\u3064\u306A\u3052\u307E\u3059\u3002"],
            ["\u51E6\u7406\u80FD\u529B\u3092\u8FD1\u304F\u306B\u914D\u7F6E", "\u30B3\u30F3\u30D1\u30AF\u30C8\u306A\u30E2\u30B8\u30E5\u30FC\u30EB\u8A2D\u8A08\u3092\u63A1\u7528\u3057\u3001\u73FE\u5834\u307E\u305F\u306F\u8FD1\u96A3\u3067\u306E\u51E6\u7406\u306B\u3088\u308A\u3001\u65BD\u8A2D\u3068\u7269\u6D41\u306E\u8CA0\u62C5\u3092\u8EFD\u6E1B\u3057\u307E\u3059\u3002"],
            ["\u56DE\u53CE\u6750\u6599\u306E\u4FA1\u5024\u3092\u5171\u6709", "\u6750\u6599\u53CE\u76CA\u3067\u51E6\u7406\u30B3\u30B9\u30C8\u3092\u76F8\u6BBA\u3057\u3001\u6240\u6709\u8005\u3068\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005\u306E\u7D4C\u6E08\u6027\u3092\u9AD8\u3081\u307E\u3059\u3002"],
        ],
        conclusion: "当社のカリフォルニア州の事業収支\u306E\u30B7\u30CA\u30EA\u30AA\u3067\u306F\u3001\u74B0\u5883\u5F71\u97FF\u304C\u6700\u3082\u5C0F\u3055\u3044\u5DE5\u7A0B\u304C\u3001\u6700\u3082\u9AD8\u3044\u55B6\u696D\u5229\u76CA\u3082\u751F\u307F\u51FA\u3057\u307E\u3059\u3002",
        note: "\u74B0\u5883\u6027\u80FD\u304C\u904B\u55B6\u4E0A\u306E\u512A\u4F4D\u6027\u306B\u3064\u306A\u304C\u308A\u307E\u3059\u3002",
    },
    compliance: {
        label: "\u6CD5\u4EE4\u9075\u5B88",
        heading: "\u65B0\u305F\u306A\u51E6\u7406\u3092\u8981\u3059\u308B\u554F\u984C\u3092\u751F\u307E\u306A\u3044",
        summary: "\u51E6\u7406\u3068\u5F15\u304D\u6E21\u3057\u3092\u8A3C\u660E\u3067\u304D\u307E\u3059\u3002",
        stakeholders: [
            ["\u4E0A\u6D41\u306E\u6240\u6709\u8005", "\u8CAC\u4EFB\u3042\u308B\u51E6\u7406\u3068\u6700\u7D42\u7684\u306A\u884C\u304D\u5148\u3092\u8A3C\u660E\u3057\u307E\u3059\u3002"],
            ["\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005", "\u518D\u73FE\u53EF\u80FD\u306A\u5DE5\u7A0B\u3067\u3001\u5831\u544A\u306E\u8CA0\u62C5\u3092\u8EFD\u6E1B\u3057\u307E\u3059\u3002"],
            ["\u4E0B\u6D41\u306E\u5229\u7528\u8005", "\u51FA\u6240\u3092\u8FFD\u8DE1\u3067\u304D\u308B\u9069\u683C\u306A\u539F\u6599\u3067\u3059\u3002"],
            ["\u793E\u4F1A", "\u7BA1\u7406\u306E\u9023\u9396\u5168\u4F53\u3067\u8CAC\u4EFB\u3092\u660E\u78BA\u306B\u3057\u307E\u3059\u3002"],
            ["PV Circonomy", "\u62E1\u5927\u751F\u7523\u8005\u8CAC\u4EFB\uFF08EPR\uFF09\u3001ESG\u3001DPP\u3001\u304A\u5BA2\u69D8\u5411\u3051\u5831\u544A\u3092\u652F\u3048\u308B\u8A3C\u62E0\u3067\u3059\u3002"],
        ],
        intro: "PV Circonomy \u306F\u3001\u5404\u30D1\u30CD\u30EB\u3001\u51E6\u7406\u5DE5\u7A0B\u3001\u6750\u6599\u306E\u884C\u304D\u5148\u3092\u7D50\u3073\u3001\u6CD5\u4EE4\u9075\u5B88\u3092\u696D\u52D9\u30D5\u30ED\u30FC\u306B\u7D44\u307F\u8FBC\u307F\u307E\u3059\u3002",
        goal: "\u6C5A\u67D3\u30BC\u30ED\u3092\u76EE\u6307\u3057\u307E\u3059\u3002",
        drivers: [
            ["\u5FC5\u8981\u306A\u8A3C\u62E0\u3092\u5B9A\u7FA9", "\u6240\u6709\u8005\u3001\u898F\u5236\u5F53\u5C40\u3001\u6750\u6599\u8CFC\u5165\u8005\u304C\u53D7\u3051\u53D6\u308B\u5FC5\u8981\u306E\u3042\u308B\u8A18\u9332\u304B\u3089\u59CB\u3081\u307E\u3059\u3002"],
            ["\u53D7\u3051\u5165\u308C\u6642\u306B\u8A18\u9332", "\u51E6\u7406\u958B\u59CB\u524D\u306B\u3001\u51FA\u6240\u3001\u72B6\u614B\u3001\u6570\u91CF\u3001\u30D0\u30C3\u30C1\u8B58\u5225\u60C5\u5831\u3092\u7D50\u3073\u4ED8\u3051\u307E\u3059\u3002"],
            ["\u5DE5\u7A0B\u3092\u8A18\u9332", "\u51E6\u7406\u7D4C\u8DEF\u3092\u8A18\u9332\u3057\u3001\u6295\u5165\u7269\u3068\u5206\u96E2\u3055\u308C\u305F\u7523\u51FA\u7269\u3092\u7167\u5408\u3057\u307E\u3059\u3002"],
            ["\u3059\u3079\u3066\u306E\u5F15\u304D\u6E21\u3057\u3092\u8FFD\u8DE1", "\u5404\u7523\u51FA\u7269\u3092\u3001\u53D7\u53D6\u5148\u3001\u4ED5\u69D8\u3001\u4E88\u5B9A\u3059\u308B\u6B21\u306E\u7528\u9014\u306B\u7D50\u3073\u4ED8\u3051\u307E\u3059\u3002"],
            ["\u6D3B\u7528\u3067\u304D\u308B\u8A18\u9332\u306B\u96C6\u7D04", "EasyCycle \u3067\u8A3C\u62E0\u3092\u6574\u7406\u3057\u3001\u5831\u544A\u3001\u76E3\u67FB\u3001\u30C7\u30E5\u30FC\u30C7\u30EA\u30B8\u30A7\u30F3\u30B9\u306B\u6D3B\u7528\u3057\u307E\u3059\u3002"],
        ],
        conclusion: "\u6CD5\u4EE4\u9075\u5B88\u304C\u3001\u4E8B\u5F8C\u306B\u8FFD\u52A0\u3059\u308B\u66F8\u985E\u4F5C\u696D\u3067\u306F\u306A\u304F\u3001\u8CAC\u4EFB\u3042\u308B\u51E6\u7406\u306E\u8A3C\u660E\u306B\u306A\u308A\u307E\u3059\u3002",
        note: "\u51E6\u7406\u5185\u5BB9\u3001\u6750\u6599\u306E\u884C\u304D\u5148\u3001\u53D7\u53D6\u5148\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002",
    },
    circularity: {
        label: "\u5FAA\u74B0\u6027",
        heading: "\u6750\u6599\u3092\u74B0\u5883\u3078\u6D41\u51FA\u3055\u305B\u305A\u3001\u7523\u696D\u3078\u623B\u3059",
        summary: "\u3059\u3079\u3066\u306E\u6750\u6599\u3092\u6709\u52B9\u306B\u4F7F\u3044\u7D9A\u3051\u307E\u3059\u3002",
        stakeholders: [
            ["\u4E0A\u6D41\u306E\u6240\u6709\u8005", "\u6750\u6599\u3092\u5EC3\u68C4\u8CAC\u4EFB\u3067\u306F\u306A\u304F\u3001\u8CC7\u7523\u3068\u3057\u3066\u7DAD\u6301\u3057\u307E\u3059\u3002"],
            ["\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005", "\u6E05\u6D44\u306A\u7523\u51FA\u6750\u6599\u304C\u3001\u3088\u308A\u9AD8\u3044\u5E02\u5834\u4FA1\u5024\u3092\u751F\u307F\u307E\u3059\u3002"],
            ["\u4E0B\u6D41\u306E\u5229\u7528\u8005", "\u30D0\u30FC\u30B8\u30F3\u6750\u306B\u4EE3\u308F\u308B\u4FE1\u983C\u3067\u304D\u308B\u6750\u6599\u3067\u3059\u3002"],
            ["\u793E\u4F1A", "\u3088\u308A\u591A\u304F\u306E\u8CC7\u6E90\u3092\u4F7F\u3044\u7D9A\u3051\u3001\u57CB\u7ACB\u91CF\u3092\u6E1B\u3089\u3057\u307E\u3059\u3002"],
            ["PV Circonomy", "\u30A8\u30CD\u30EB\u30AE\u30FC\u8EE2\u63DB\u3092\u652F\u3048\u308B\u30AF\u30ED\u30FC\u30BA\u30C9\u30EB\u30FC\u30D7\u5E02\u5834\u3067\u3059\u3002"],
        ],
        intro: "PV Circonomy \u306F\u3001\u6A5F\u68B0\u304B\u3089\u51FA\u3066\u304F\u308B\u6750\u6599\u306E\u5272\u5408\u3060\u3051\u3067\u306A\u304F\u3001\u5404\u6750\u6599\u306E\u6B21\u306E\u7528\u9014\u3092\u8EF8\u306B\u56DE\u53CE\u3092\u8A2D\u8A08\u3057\u307E\u3059\u3002",
        goal: "100% \u518D\u5229\u7528\u53EF\u80FD\u3067\u3059\u3002",
        drivers: [
            ["\u6B21\u306E\u7528\u9014\u304B\u3089\u8A2D\u8A08", "\u4E0B\u6D41\u306E\u4ED5\u69D8\u3092\u8D77\u70B9\u306B\u3001\u5FC5\u8981\u306A\u7523\u51FA\u7269\u3092\u9006\u7B97\u3057\u307E\u3059\u3002"],
            ["\u6750\u6599\u3092\u5206\u5225\u7DAD\u6301", "\u5C64\u3054\u3068\u306E\u5206\u96E2\u306B\u3088\u308A\u3001\u6709\u4FA1\u7269\u304C\u6DF7\u5408\u5EC3\u68C4\u7269\u306B\u306A\u308B\u306E\u3092\u9632\u304E\u307E\u3059\u3002"],
            ["\u5404\u6750\u6599\u306E\u9069\u5408\u6027\u3092\u78BA\u8A8D", "\u6750\u6599\u8CFC\u5165\u8005\u5411\u3051\u306B\u3001\u7D44\u6210\u3001\u54C1\u8CEA\u3001\u524D\u51E6\u7406\u306E\u8981\u4EF6\u3092\u5B9A\u3081\u307E\u3059\u3002"],
            ["\u30A2\u30C3\u30D7\u30B5\u30A4\u30AF\u30EB\u7D4C\u8DEF\u3092\u69CB\u7BC9", "\u30AC\u30E9\u30B9\u3001\u30B7\u30EA\u30B3\u30F3\u3001\u30DD\u30EA\u30DE\u30FC\u3001\u91D1\u5C5E\u3092\u3001\u30D0\u30FC\u30B8\u30F3\u8CC7\u6E90\u306B\u4EE3\u308F\u308B\u7528\u9014\u306B\u3064\u306A\u3052\u307E\u3059\u3002"],
            ["\u5E02\u5834\u306E\u58F0\u3092\u9084\u5143", "\u4E0B\u6D41\u3067\u306E\u4F7F\u7528\u5B9F\u7E3E\u3092\u751F\u304B\u3057\u3001\u5206\u96E2\u6027\u80FD\u3068\u7523\u51FA\u7269\u306E\u54C1\u8CEA\u3092\u7D99\u7D9A\u7684\u306B\u6539\u5584\u3057\u307E\u3059\u3002"],
        ],
        conclusion: "\u5206\u96E2\u3055\u308C\u305F\u6750\u6599\u306F\u8CC7\u7523\u3068\u306A\u308A\u3001\u6DF7\u5408\u3055\u308C\u305F\u6750\u6599\u306F\u5EC3\u68C4\u7269\u306B\u306A\u308A\u307E\u3059\u3002",
        note: "\u56DE\u53CE\u7387\u306F\u5DE5\u7A0B\u304B\u3089\u51FA\u308B\u6750\u6599\u3092\u3001\u5FAA\u74B0\u6027\u306F\u518D\u3073\u5229\u7528\u3055\u308C\u308B\u6750\u6599\u3092\u6E2C\u308A\u307E\u3059\u3002",
    },
    reputation: {
        label: "\u8A55\u5224",
        heading: "\u6210\u679C\u3092\u53EF\u8996\u5316\u3057\u3001\u691C\u8A3C\u53EF\u80FD\u306B",
        summary: "\u53EF\u8996\u5316\u3055\u308C\u3001\u6839\u62E0\u3092\u793A\u305B\u308B\u6210\u679C\u3067\u3059\u3002",
        stakeholders: [
            ["\u4E0A\u6D41\u306E\u6240\u6709\u8005", "\u8CAC\u4EFB\u3042\u308B\u7BA1\u7406\u306E\u6210\u679C\u3092\u3001\u6839\u62E0\u3092\u3082\u3063\u3066\u793A\u3057\u307E\u3059\u3002"],
            ["\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005", "\u4FE1\u983C\u3067\u304D\u308B\u3001\u4E00\u8CAB\u3057\u305F\u6210\u679C\u3092\u63D0\u4F9B\u3057\u307E\u3059\u3002"],
            ["\u4E0B\u6D41\u306E\u5229\u7528\u8005", "\u6D88\u8CBB\u8005\u304C\u4FE1\u983C\u3067\u304D\u308B\u3001\u8CAC\u4EFB\u3042\u308B\u8ABF\u9054\u306E\u8868\u660E\u3067\u3059\u3002"],
            ["\u793E\u4F1A", "\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306E\u4F7F\u7528\u7D42\u4E86\u5F8C\u306E\u7BA1\u7406\u306B\u5B89\u5FC3\u3092\u3082\u305F\u3089\u3057\u307E\u3059\u3002"],
            ["PV Circonomy", "\u900F\u660E\u3067\u691C\u8A3C\u53EF\u80FD\u306A\u6210\u679C\u3092\u901A\u3058\u3066\u3001\u4FE1\u983C\u3092\u7BC9\u304D\u307E\u3059\u3002"],
        ],
        intro: "\u4FE1\u983C\u306F\u8A3C\u62E0\u304B\u3089\u751F\u307E\u308C\u307E\u3059\u3002\u8CAC\u4EFB\u3042\u308B\u4F7F\u7528\u7D42\u4E86\u5F8C\u306E\u7BA1\u7406\u6210\u679C\u306F\u3001\u53EF\u8996\u5316\u3055\u308C\u3001\u72EC\u7ACB\u3057\u305F\u691C\u8A3C\u304C\u53EF\u80FD\u3067\u3001\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u30FC\u3078\u306E\u5831\u544A\u306B\u6D3B\u7528\u3067\u304D\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002",
        goal: "\u66F8\u985E\u3067\u306F\u306A\u304F\u3001\u8A3C\u62E0\u3092\u793A\u3057\u307E\u3059\u3002",
        drivers: [
            ["\u8868\u660E\u306E\u524D\u306B\u6E2C\u5B9A", "\u74B0\u5883\u306B\u95A2\u3059\u308B\u8868\u660E\u3092\u884C\u3046\u524D\u306B\u3001\u56DE\u53CE\u7387\u3001\u30A8\u30CD\u30EB\u30AE\u30FC\u3001\u70AD\u7D20\u306E\u30C7\u30FC\u30BF\u3092\u8A18\u9332\u3057\u307E\u3059\u3002"],
            ["\u72EC\u7ACB\u3057\u305F\u691C\u8A3C", "\u56DE\u53CE\u6027\u80FD\u3068\u6750\u6599\u54C1\u8CEA\u306B\u3064\u3044\u3066\u3001\u7B2C\u4E09\u8005\u306B\u3088\u308B\u691C\u8A3C\u3092\u6D3B\u7528\u3057\u307E\u3059\u3002"],
            ["\u4E8C\u6B21\u7684\u306A\u60AA\u5F71\u97FF\u3092\u9632\u6B62", "\u5316\u5B66\u85AC\u54C1\u3001\u71B1\u3001\u6C34\u306E\u4F7F\u7528\u3092\u907F\u3051\u3001\u30EA\u30B5\u30A4\u30AF\u30EB\u306B\u3088\u308B\u65B0\u305F\u306A\u6C5A\u67D3\u554F\u984C\u3092\u9632\u304E\u307E\u3059\u3002"],
            ["\u6B21\u306E\u7528\u9014\u3092\u660E\u793A", "\u56DE\u53CE\u6750\u6599\u304C\u4F55\u306B\u306A\u308B\u304B\u3092\u793A\u3057\u3001\u56DE\u907F\u3067\u304D\u308B\u5F71\u97FF\u3092\u5B9A\u91CF\u5316\u3057\u307E\u3059\u3002"],
            ["\u5168\u54E1\u3067\u540C\u3058\u8A18\u9332\u3092\u5171\u6709", "EasyCycle \u3067\u51FA\u6240\u3001\u5DE5\u7A0B\u3001\u884C\u304D\u5148\u306E\u30C7\u30FC\u30BF\u3092\u4FDD\u5B58\u3057\u3001\u30B9\u30C6\u30FC\u30AF\u30DB\u30EB\u30C0\u30FC\u3084 ESG \u5831\u544A\u306B\u6D3B\u7528\u3057\u307E\u3059\u3002"],
        ],
        conclusion: "\u8A55\u5224\u304C\u3001\u88CF\u4ED8\u3051\u306E\u306A\u3044\u8868\u660E\u3067\u306F\u306A\u304F\u3001\u6839\u62E0\u3092\u793A\u305B\u308B\u6210\u679C\u306B\u306A\u308A\u307E\u3059\u3002",
        note: "\u900F\u660E\u306A\u8A3C\u62E0\u304C\u3001\u8CAC\u4EFB\u3042\u308B\u4F7F\u7528\u7D42\u4E86\u5F8C\u306E\u7BA1\u7406\u3092\u9577\u671F\u7684\u306A\u4FE1\u983C\u306B\u3064\u306A\u3052\u307E\u3059\u3002",
    },
} as const;
type StakeTopic = keyof typeof stakeSolutions;
function StakeIcon({ topic }: {
    topic: StakeTopic;
}) {
    const paths = {
        cost: <><path d="M5 7h9M5 12h14M5 17h7"/><path d="m15 15 3 3 4-6"/></>,
        compliance: <><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h4M10 14l2 2 4-5"/></>,
        circularity: <><path d="M8 5a8 8 0 0 1 11 3l1-4M20 8h-4"/><path d="M18 19a8 8 0 0 1-11-3l-1 4M6 16h4"/></>,
        reputation: <><path d="M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    } as const;
    return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[topic]}</g></svg>;
}
const systemTopics = {
    process: ["PV Circulator", "\u4F7F\u7528\u6E08\u307F\u30D1\u30CD\u30EB\u3092\u3001\u3088\u308A\u4F4E\u3044\u30B3\u30B9\u30C8\u3068\u74B0\u5883\u5F71\u97FF\u3067\u500B\u5225\u306E\u6750\u6599\u306B\u5206\u96E2\u3057\u307E\u3059\u3002\u56DE\u53CE\u6750\u6599\u3092\u8CC7\u7523\u306B\u5909\u3048\u306A\u304C\u3089\u3001\u30EA\u30B5\u30A4\u30AF\u30EB\u30B3\u30B9\u30C8\u3092\u524A\u6E1B\u3057\u307E\u3059\u3002"],
    upcycle: ["材料のアップサイクル", "\u30AC\u30E9\u30B9\u3001\u30B7\u30EA\u30B3\u30F3\u3001\u30DD\u30EA\u30DE\u30FC\u3001\u91D1\u5C5E\u3092\u3088\u308A\u9AD8\u4ED8\u52A0\u4FA1\u5024\u306E\u7528\u9014\u306B\u3064\u306A\u3052\u3001\u30EA\u30B5\u30A4\u30AF\u30EB\u306B\u3088\u308B\u53CE\u76CA\u5275\u51FA\u3092\u652F\u63F4\u3057\u307E\u3059\u3002"],
    trace: ["EasyCycle", "\u6750\u6599\u306E\u51FA\u6240\u3001\u51E6\u7406\u3001\u56DE\u53CE\u7D50\u679C\u3001\u6700\u7D42\u7684\u306A\u884C\u304D\u5148\u3092\u691C\u8A3C\u53EF\u80FD\u306A\u8A18\u9332\u3067\u7D50\u3073\u3001\u6240\u6709\u8005\u306B\u4ED8\u52A0\u4FA1\u5024\u3068\u30EA\u30B5\u30A4\u30AF\u30EB\u3078\u306E\u3088\u308A\u5F37\u3044\u52D5\u6A5F\u3092\u63D0\u4F9B\u3057\u307E\u3059\u3002"],
} as const;
type SystemTopic = keyof typeof systemTopics;
const systemVisuals: Record<SystemTopic, {
    src: string;
    alt: string;
}> = {
    process: { src: "/images/system-pv-circulator-hd.png", alt: "AI \u3092\u642D\u8F09\u3057\u3001CES Innovation Awards \u3067\u8A55\u4FA1\u3055\u308C\u305F PV Circulator \u81EA\u52D5\u30EA\u30B5\u30A4\u30AF\u30EB\u8A2D\u5099" },
    upcycle: { src: "/images/system-upcycling-hd.png", alt: "PV Circulator \u304B\u3089\u6C34\u7D20\u3092\u7D4C\u3066\u71C3\u6599\u96FB\u6C60\u767A\u96FB\u3078\u3064\u306A\u304C\u308B\u30DE\u30C6\u30EA\u30A2\u30EB\u30FB\u30A2\u30C3\u30D7\u30B5\u30A4\u30AF\u30EB\u306E\u5FAA\u74B0" },
    trace: { src: "/images/system-easycycle-hd.png", alt: "EasyCycle \u30C7\u30B8\u30BF\u30EB\u30EA\u30B5\u30A4\u30AF\u30EB\u30D1\u30B9\u30DD\u30FC\u30C8\u3068\u5B89\u5168\u306A\u30D6\u30ED\u30C3\u30AF\u30C1\u30A7\u30FC\u30F3\u8A18\u9332" },
};
const staticSystemCardContent: Record<SystemTopic, {
    tagline: string;
    bullets: readonly string[];
}> = {
    process: {
        tagline: "\u30AF\u30EA\u30FC\u30F3 \u00D7 \u6CD5\u4EE4\u9075\u5B88 \u00D7 \u4F4E\u70AD\u7D20",
        bullets: [
            "\u5316\u5B66\u85AC\u54C1\u3001\u52A0\u71B1\u3001\u5DE5\u7A0B\u7528\u6C34\u3092\u4F7F\u308F\u305A\u3001\u4E8C\u6B21\u6C5A\u67D3\u3092\u751F\u307F\u307E\u305B\u3093\u3002",
            "\u88FD\u54C1\u56DE\u53CE\u7387\u3001\u51E6\u7406\u80FD\u529B\u3001\u30A8\u30CD\u30EB\u30AE\u30FC\u4F7F\u7528\u91CF\u306F\u3001\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u306E\u30DE\u30B9\u30BF\u30FC\u30C7\u30FC\u30BF\u304B\u3089\u516C\u958B\u3055\u308C\u307E\u3059\u3002",
            "\u73FE\u5834\u304A\u3088\u3073\u8FD1\u96A3\u3078\u306E\u8A2D\u7F6E\u306B\u5BFE\u5FDC\u3057\u305F\u30E2\u30B8\u30E5\u30FC\u30EB\u8A2D\u8A08\u3067\u3059\u3002",
        ],
    },
    upcycle: {
        tagline: "\u8CA0\u50B5\u304B\u3089\u8CC7\u7523\u3078",
        bullets: [
            "\u30AC\u30E9\u30B9 \u2192 \u30DD\u30BE\u30E9\u30F3\u6750\u3078\u8EE2\u63DB\u3057\u3001\u30B3\u30F3\u30AF\u30EA\u30FC\u30C8\u306E\u30BB\u30E1\u30F3\u30C8\u4F7F\u7528\u91CF\u3092\u524A\u6E1B\u3057\u307E\u3059\u3002",
            "EVA \u2192 \u9774\u3084\u30E8\u30AC\u30DE\u30C3\u30C8\u7528\u306E PCR \u30D7\u30E9\u30B9\u30C1\u30C3\u30AF\u3078\u8EE2\u63DB\u3057\u307E\u3059\u3002",
            "\u30B7\u30EA\u30B3\u30F3 \u2192 \u30A8\u30CD\u30EB\u30AE\u30FC\u5229\u7528\u30FB\u8CAF\u8535\u5411\u3051\u306E\u6C34\u7D20\u3078\u8EE2\u63DB\u3057\u3001\u30B1\u30A4\u9178\u5869\u306F\u70AD\u7D20\u56FA\u5B9A\u3092\u652F\u3048\u307E\u3059\u3002",
        ],
    },
    trace: {
        tagline: "\u8FFD\u8DE1\u53EF\u80FD\u3001\u4FE1\u983C\u53EF\u80FD\u3001\u53CE\u76CA\u5316\u53EF\u80FD",
        bullets: [
            "\u51FA\u6240\u3001\u51E6\u7406\u65B9\u6CD5\u3001\u6700\u7D42\u7528\u9014\u306E\u7D4C\u8DEF\u3092\u8FFD\u8DE1\u3067\u304D\u307E\u3059\u3002",
            "ESG\u3001\u62E1\u5927\u751F\u7523\u8005\u8CAC\u4EFB\uFF08EPR\uFF09\u3001\u30C7\u30B8\u30BF\u30EB\u88FD\u54C1\u30D1\u30B9\u30DD\u30FC\u30C8\uFF08DPP\uFF09\u306E\u5831\u544A\u3092\u652F\u63F4\u3057\u307E\u3059\u3002",
            "\u6750\u6599\u5E02\u5834\u3001\u53D6\u5F15\u3001\u8CC7\u91D1\u8ABF\u9054\u30C4\u30FC\u30EB\u3001\u91D1\u878D\u5411\u3051\u306E\u30C7\u30FC\u30BF\u3067\u3059\u3002",
        ],
    },
};
function systemCardContent(data: OurSolutionView): Record<SystemTopic, {
    tagline: string;
    bullets: readonly string[];
}> {
    const recovery = webNum(data, "methods.circulator.product_recovery_percent");
    const minutesPerPanel = 60 / webNum(data, "methods.circulator.throughput_panels_per_hour");
    const energy = webNum(data, "methods.circulator.energy_max_kwh_per_panel");
    const energyText = energy === 1 ? "1 kWh未満" : `${compactNumber(energy)} kWh以下`;
    return { ...staticSystemCardContent, process: { ...staticSystemCardContent.process, bullets: [
                staticSystemCardContent.process.bullets[0],
                `回収率は${compactNumber(recovery)}％${recovery > 99 ? "超" : ""}、処理能力は1枚あたり${compactNumber(minutesPerPanel)}分、消費電力量は1枚あたり${energyText}`,
                staticSystemCardContent.process.bullets[2],
            ] } };
}
const audienceTopics = {
    owner: ["\u6240\u6709\u8005\uFF0FEPC\uFF0F\u65BD\u5DE5\u696D\u8005", "\u4F7F\u7528\u6E08\u307F\u30D1\u30CD\u30EB\u3092\u3088\u308A\u4F4E\u30B3\u30B9\u30C8\u3067\u51E6\u7406\u3057\u3001\u8A3C\u660E\u3067\u304D\u308B\u8A18\u9332\u3092\u6B8B\u3057\u307E\u3059\u3002", "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306E\u6982\u7B97\u3092\u4F5C\u6210", "/#pricing", "\u6570\u91CF\u3001\u72B6\u614B\u3001\u7269\u6D41\u3001\u5831\u544A\u8981\u4EF6\u3092\u8A08\u753B\u3057\u307E\u3059\u3002"],
    recycler: ["\u30EA\u30B5\u30A4\u30AF\u30EB\u4E8B\u696D\u8005", "\u51E6\u7406\u80FD\u529B\u3092\u5897\u3084\u3057\u3001\u6750\u6599\u4FA1\u5024\u3092\u7DAD\u6301\u3057\u307E\u3059\u3002", "PV Circulator \u3092\u8A55\u4FA1", "/ja/pv-circulator/", "\u6295\u5165\u539F\u6599\u3001\u69CB\u6210\u3001\u7523\u51FA\u7269\u306E\u54C1\u8CEA\u3001\u8A2D\u7F6E\u3001\u63D0\u643A\u306E\u9078\u629E\u80A2\u3092\u691C\u8A0E\u3057\u307E\u3059\u3002"],
    investor: ["\u6295\u8CC7\u5BB6\uFF0F\u6226\u7565\u7684\u30D1\u30FC\u30C8\u30CA\u30FC", "\u592A\u967D\u5149\u306E\u5FAA\u74B0\u5229\u7528\u3092\u652F\u3048\u308B\u30A4\u30F3\u30D5\u30E9\u3065\u304F\u308A\u306B\u53C2\u753B\u3057\u307E\u3059\u3002", "\u5E02\u5834\u62E1\u5927\u3092\u5354\u8B70", "/contact/?interest=investment", "\u5E02\u5834\u306E\u30BF\u30A4\u30DF\u30F3\u30B0\u3001\u6280\u8853\u306E\u88CF\u4ED8\u3051\u3001\u4E8B\u696D\u4E0A\u306E\u30DE\u30A4\u30EB\u30B9\u30C8\u30FC\u30F3\u3001\u60F3\u5B9A\u3055\u308C\u308B\u53CE\u76CA\u30E2\u30C7\u30EB\u3092\u691C\u8A0E\u3057\u307E\u3059\u3002"],
} as const;
type AudienceTopic = keyof typeof audienceTopics;
const trendRegions = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;
const waveMarketLabels = {
    World: "世界", Europe: "欧州", "United States": "米国", Japan: "日本",
    Taiwan: "台湾", Australia: "オーストラリア", China: "中国", "Other markets": "その他の市場",
} as const;
const waveLossLabels = { early: "早期廃棄", regular: "通常廃棄" } as const;
type TrendPoint = {
    year: string;
    total: number;
    totalLabel: string;
    values: readonly number[];
};
// Defaults for callers without published data; /solutions passes values computed from the published Capacity History parameters.
const seededCapacityRows = seededOurSolutionData;
const defaultCapacityTrend: CapacityTrendPoint[] = buildCapacityTrend(seededCapacityRows);
const defaultRetirementWave: RetirementWave = defaultModel.retirementWave;
const retirementStackMarkets = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;
const retirementMarkets = ["United States", "Japan", "Europe", "Australia"] as const;
type RetirementStackMarket = (typeof retirementStackMarkets)[number];
type RetirementMarket = (typeof retirementMarkets)[number];
type RetirementMarketWaves = Record<RetirementStackMarket | "World", RetirementWave>;
type DemandMarket = "World" | "United States" | "Europe" | "Japan" | "Australia" | "Taiwan";
const demandMarkets: {
    key: DemandMarket;
    label: string;
}[] = [
    { key: "United States", label: "米国" },
    { key: "Europe", label: "欧州" },
    { key: "Japan", label: "日本" },
    { key: "Australia", label: "オーストラリア" },
    { key: "Taiwan", label: "台湾" },
];
type RetirementSeriesKey = Exclude<keyof RetirementWave, "years" | "crossings">;
const defaultRetirementMarketWaves: RetirementMarketWaves = {
    World: defaultRetirementWave,
    "United States": defaultRetirementWave,
    Japan: defaultRetirementWave,
    Europe: defaultRetirementWave,
    Australia: defaultRetirementWave,
    Taiwan: defaultRetirementWave,
    China: defaultRetirementWave,
    "Other markets": defaultRetirementWave,
};
const pressureSeries = [
    { label: "World", className: "is-world" },
    { label: "Europe", className: "is-europe" },
    { label: "United States", className: "is-us" },
    { label: "Japan", className: "is-japan" },
    { label: "Taiwan", className: "is-taiwan" },
    { label: "China", className: "is-china" },
    { label: "Australia", className: "is-australia" },
] as const;
const defaultPressureData = Object.keys(defaultModel.perCapitaKg.World).map(year => ({ year, values: pressureSeries.map(s => defaultModel.perCapitaKg[s.label][Number(year)]) }));
function PressureTrendChart({ data: pressureTrendData = defaultPressureData }: {
    data?: {
        year: string;
        values: number[];
    }[];
}) {
    const breakAt = 20, lowerRangeShare = 70;
    const ceiling = Math.max(30, Math.ceil(Math.max(...pressureTrendData.flatMap(p => p.values)) / 10) * 10);
    const compressedMidpoint = (breakAt + ceiling) / 2;
    const pressureTicks = [
        { value: 0, position: 0 },
        { value: breakAt / 2, position: lowerRangeShare / 2 },
        { value: breakAt, position: lowerRangeShare },
        { value: compressedMidpoint, position: lowerRangeShare + (100 - lowerRangeShare) / 2 },
        { value: ceiling, position: 100 },
    ];
    const pressureHeight = (value: number) => value <= breakAt
        ? value / breakAt * lowerRangeShare
        : lowerRangeShare + (value - breakAt) / (ceiling - breakAt) * (100 - lowerRangeShare);
    return <div className="os-pressure-trend" role="img" aria-label="世界、欧州、米国、日本、台湾、中国、オーストラリアの一人当たり年間処理負荷の推計（2025～2050年）">
    <div className="os-pressure-plot">
      <div className="os-pressure-axis" aria-hidden="true">{pressureTicks.map((tick) => <span className={tick.value === 20 ? "is-break-tick" : undefined} key={tick.value} style={{ bottom: `${tick.position}%` }}>{tick.value}</span>)}</div>
      <div className="os-pressure-canvas">
        <div className="os-pressure-guides" aria-hidden="true">{pressureTicks.map((tick) => <i key={tick.value} style={{ bottom: `${tick.position}%` }}/>)}</div>
        <div className="os-pressure-groups">{pressureTrendData.map((point) => <div className="os-pressure-group" key={point.year}>{pressureSeries.map((series, index) => { const pressure = point.values[index]; return <i className={series.className} style={{ height: `${Math.max(1.5, pressureHeight(pressure))}%` }} title={`${waveMarketLabels[series.label]}、${point.year}年：${pressure.toFixed(1)} kg／人`} key={series.label}/>; })}<small>{point.year}</small></div>)}</div>
        <div className="os-pressure-break" aria-hidden="true"><span>{breakAt}～{ceiling} は目盛りを圧縮</span></div>
      </div>
    </div>
    <div className="os-pressure-legend" aria-hidden="true">{pressureSeries.map((series) => <span key={series.label}><i className={series.className}/>{waveMarketLabels[series.label]}</span>)}</div>
  </div>;
}
function StackedTrendChart({ data, max, label, tone }: {
    data: TrendPoint[];
    max: number;
    label: string;
    tone: "neutral" | "negative";
}) {
    const [highlightedRegion, setHighlightedRegion] = useState<number | null>(null);
    const ceiling = Math.max(5000, Math.ceil(max / 5000) * 5000);
    const yTicks = Array.from({ length: ceiling / 5000 + 1 }, (_, index) => index * 5000);
    const width = 900, height = 600, left = 66, right = 18, top = 34, bottom = 54, plotWidth = width - left - right, plotHeight = height - top - bottom;
    const barWidth = plotWidth / data.length;
    const x = (index: number) => left + (index + .5) * barWidth, y = (value: number) => top + (1 - value / ceiling) * plotHeight;
    const majorPoints = data.map((point, index) => ({ point, index })).filter(({ point }) => Number(point.year) % 5 === 0);
    return <figure className={`os-stacked-chart is-${tone}${highlightedRegion === null ? "" : " has-highlight"}`} aria-label={label}>
    <figcaption>太陽光の累積導入容量・世界推計</figcaption>
    <svg className="os-stacked-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <g className="os-stacked-grid" aria-hidden="true">{yTicks.map(tick => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)}/><text x={left - 12} y={y(tick) + 4} textAnchor="end">{tick === 0 ? "0" : `${tick / 1000} TW`}</text></g>)}</g>
      <g className="os-stacked-svg-bars">{data.map((point, index) => { let running = 0; return <g key={point.year}><title>{`${point.year}: ${point.totalLabel}`}</title>{point.values.map((value, regionIndex) => { const bottomValue = running; running += value; return <rect className={`is-region-${regionIndex + 1}${highlightedRegion === regionIndex ? " is-highlighted" : ""}`} key={`${point.year}-${trendRegions[regionIndex]}`} x={left + index * barWidth} y={y(running)} width={barWidth} height={y(bottomValue) - y(running)}/>; })}</g>; })}</g>
      <g className="os-stacked-totals" aria-hidden="true">{majorPoints.map(({ point, index }) => <text key={point.year} x={x(index)} y={y(point.total) - 9} textAnchor="middle">{point.totalLabel}</text>)}</g>
      <g className="os-stacked-years" aria-hidden="true">{majorPoints.map(({ point, index }) => <text key={point.year} x={x(index)} y={height - 18} textAnchor="middle">{point.year}</text>)}</g>
      <text className="os-stacked-unit" x="0" y="12">テラワット（TW）</text>
    </svg>
    <div className="os-stacked-legend" aria-label="市場を強調表示" onMouseLeave={() => setHighlightedRegion(null)}>{trendRegions.map((region, index) => <button type="button" key={region} aria-pressed={highlightedRegion === index} onMouseEnter={() => setHighlightedRegion(index)} onFocus={() => setHighlightedRegion(index)} onBlur={() => setHighlightedRegion(null)} onClick={() => setHighlightedRegion(index)}><i className={`is-region-${index + 1}`} aria-hidden="true"/><span>{waveMarketLabels[region]}</span></button>)}</div>
  </figure>;
}
function GlobalCumulativeRetirementChart({ waves, assumptions }: {
    waves: RetirementMarketWaves;
    assumptions: WaveAssumptions;
}) {
    const cumulative = retirementStackMarkets.map(() => 0);
    let cumulativeWorld = 0;
    const seriesKey = `${assumptions.loss}_T${assumptions.defaultLifetime}` as RetirementSeriesKey;
    const data = waves.World.years.flatMap((year, waveIndex) => {
        if (year < 2025)
            return [];
        cumulativeWorld += waves.World[seriesKey][waveIndex] / 1e6;
        const rawValues = retirementStackMarkets.map((market, marketIndex) => {
            cumulative[marketIndex] += waves[market][seriesKey][waveIndex] / 1e6;
            return cumulative[marketIndex];
        });
        const rawTotal = rawValues.reduce((sum, value) => sum + value, 0);
        const values = rawValues.map((value) => rawTotal > 0 ? value * cumulativeWorld / rawTotal : 0);
        return [{ year, values, total: cumulativeWorld }];
    });
    const width = 960, height = 640, left = 62, right = 22, top = 34, bottom = 54;
    const last = data.at(-1)!;
    const max = Math.max(1, Math.ceil(last.total / 50) * 50);
    const x = (index: number) => left + (index + .5) / data.length * (width - left - right);
    const y = (value: number) => top + (1 - value / max) * (height - top - bottom);
    const plotWidth = width - left - right;
    const barGap = 0;
    const barWidth = plotWidth / data.length - barGap;
    const yTicks = Array.from({ length: 5 }, (_, index) => max / 4 * index);
    const majorYears = data.filter((point) => point.year % 5 === 0);
    return <figure className="os-wave-global-chart">
    <figcaption>使用済みパネルの累積重量・世界推計</figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`2025～2050年の世界の使用済み太陽光パネル累積重量は、推計で${last.total.toFixed(0)}百万トン。市場別の内訳を表示。`}>
      <g className="os-wave-grid" aria-hidden="true">{yTicks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)}/><text x={left - 12} y={y(tick) + 4} textAnchor="end">{tick.toFixed(0)}</text></g>)}</g>
      <g className="os-wave-bars">{data.map((point, index) => { let running = 0; return <g key={point.year}><title>{`${point.year}: ${point.total.toFixed(1)}百万トン`}</title>{point.values.map((value, marketIndex) => { const bottomValue = running; running += value; return <rect className={`is-region-${marketIndex + 1}`} key={retirementStackMarkets[marketIndex]} x={left + index / data.length * plotWidth + barGap / 2} y={y(running)} width={barWidth} height={y(bottomValue) - y(running)}/>; })}</g>; })}</g>
      <g className="os-wave-years" aria-hidden="true">{majorYears.map((point) => <text key={point.year} x={x(data.indexOf(point))} y={height - 18} textAnchor="middle">{point.year}</text>)}</g>
      <g className="os-wave-endpoint" transform={`translate(${x(data.length - 1)} ${y(last.total)})`}><circle r="6"/><text x="-12" y="-14" textAnchor="end">{last.total.toFixed(0)}百万トン</text></g>
      <text className="os-wave-unit" x="0" y="12">百万トン</text>
    </svg>
    <div className="os-wave-stack-legend" aria-label="累積廃棄量の棒グラフに表示する市場">{retirementStackMarkets.map((market, index) => <span key={market}><i className={`is-region-${index + 1}`}/>{waveMarketLabels[market]}</span>)}</div>
    <small>推計条件：パネル寿命 {assumptions.defaultLifetime}年、{waveLossLabels[assumptions.loss]}シナリオ。出典：公開版 Our Solution ワークブックの導入容量履歴と前提条件。</small>
  </figure>;
}
function CountryRetirementExplorer({ waves, assumptions }: {
    waves: RetirementMarketWaves;
    assumptions: WaveAssumptions;
}) {
    const [country, setCountry] = useState<RetirementMarket>("Japan");
    const [lifetime, setLifetime] = useState<25 | 18 | 15 | 12>(assumptions.defaultLifetime);
    const series = (market: RetirementMarket, loss: "early" | "regular") => {
        const key = `${loss}_T${lifetime}` as RetirementSeriesKey;
        return waves[market].years.map((year, index) => ({ year, tonnes: waves[market][key][index] })).filter((point) => point.year >= 2025);
    };
    const early = series(country, "early"), regular = series(country, "regular");
    const width = 520, height = 300, left = 48, right = 18, top = 25, bottom = 42;
    const peak = Math.max(...early.map((point) => point.tonnes), ...regular.map((point) => point.tonnes)) / 1e6;
    const roughStep = Math.max(0.02, peak * 1.08 / 5);
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalizedStep = roughStep / magnitude;
    const niceFactor = normalizedStep <= 1 ? 1 : normalizedStep <= 1.25 ? 1.25 : normalizedStep <= 2 ? 2 : normalizedStep <= 2.5 ? 2.5 : normalizedStep <= 5 ? 5 : 10;
    const axisStep = niceFactor * magnitude;
    const max = axisStep * 5;
    const tickDigits = axisStep < 0.1 ? 2 : axisStep < 1 || !Number.isInteger(axisStep) ? 1 : 0;
    const x = (index: number) => left + index / (early.length - 1) * (width - left - right);
    const y = (tonnes: number) => top + (1 - tonnes / 1e6 / max) * (height - top - bottom);
    const path = (data: {
        year: number;
        tonnes: number;
    }[]) => `M ${data.map((point, index) => `${x(index)},${y(point.tonnes)}`).join(" L ")}`;
    const lastEarly = early.at(-1)!, lastRegular = regular.at(-1)!;
    const majorYears = early.filter((point) => point.year % 5 === 0);
    return <div className="os-wave-country-explorer">
    <div className="os-wave-country-copy" aria-live="polite"><h3>{waveMarketLabels[country]}の太陽光パネルはいつ寿命を迎えるか</h3><p>{waveMarketLabels[country]}の使用済み太陽光パネルの年間廃棄重量</p></div>
    <div className="os-wave-country-controls">
      <div className="os-wave-country-tabs" role="group" aria-label="市場を選択">{retirementMarkets.map((market) => <button type="button" key={market} aria-pressed={country === market} onClick={() => setCountry(market)}>{waveMarketLabels[market]}</button>)}</div>
      <div className="os-wave-lifetime" role="group" aria-label="モデル上のパネル寿命を選択"><span>パネル寿命</span>{([25, 18, 15, 12] as const).map((years) => <button type="button" key={years} aria-pressed={lifetime === years} onClick={() => setLifetime(years)}>{years}年</button>)}</div>
      <p className="os-wave-lifetime-basis">寿命別のシナリオ分析です。<strong>12年</strong>：<a href="https://docs.nrel.gov/docs/fy21osti/74124.pdf">NREL/TP-6A20-74124 の8ページ（PDFの19ページ）</a>。一部の商業・大規模発電事業で10～12年ごとにモジュールを交換する事例に基づきます。<strong>15年</strong>：<a href="https://doi.org/10.1016/j.joule.2019.08.012">Jean, Woodhouse &amp; Bulović（2019年）</a>。<strong>18年</strong>：12年と25年の中間ケース。<strong>25年</strong>：IRENA（2026年）の基準寿命。ワイブル分布の形状係数は早期廃棄 {assumptions.shapes.early}、通常廃棄 {assumptions.shapes.regular} です。</p>
    </div>
    <figure className="os-wave-country-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${waveMarketLabels[country]}、パネル寿命${lifetime}年の場合、2050年の年間廃棄重量は早期廃棄シナリオで${(lastEarly.tonnes / 1e6).toFixed(2)}百万トン、通常廃棄シナリオで${(lastRegular.tonnes / 1e6).toFixed(2)}百万トン。`}>
        <g className="os-wave-country-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => axisStep * index).map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick * 1e6)} y2={y(tick * 1e6)}/><text x={left - 10} y={y(tick * 1e6) + 4} textAnchor="end">{tick.toFixed(tickDigits)}</text></g>)}</g>
        <path className="os-wave-country-line is-regular" d={path(regular)}/>
        <path className="os-wave-country-line is-early" d={path(early)}/>
        <g className="os-wave-country-years" aria-hidden="true">{majorYears.map((point) => <text key={point.year} x={x(early.indexOf(point))} y={height - 14} textAnchor="middle">{point.year}</text>)}</g>
        <g className="os-wave-country-endpoint is-regular" transform={`translate(${x(regular.length - 1)} ${y(lastRegular.tonnes)})`}><circle r="4"/><text x="-10" y="16" textAnchor="end">{(lastRegular.tonnes / 1e6).toFixed(2)}百万トン</text></g>
        <g className="os-wave-country-endpoint is-early" transform={`translate(${x(early.length - 1)} ${y(lastEarly.tonnes)})`}><circle r="5"/><text x="-10" y="-12" textAnchor="end">{(lastEarly.tonnes / 1e6).toFixed(2)}百万トン</text></g>
        <text className="os-wave-country-unit" x="0" y="12">百万トン／年</text>
      </svg>
      <figcaption className="os-wave-country-legend"><span className="is-early">{waveLossLabels.early}</span><span className="is-regular">{waveLossLabels.regular}</span></figcaption>
    </figure>
    <p className="os-wave-country-note">両方の曲線に、選択した寿命を適用します。縦軸の目盛りは、選択した市場とシナリオに応じて調整されます。値は推計であり、実測の廃棄量ではありません。</p>
  </div>;
}
type MethodRow = {
    label: string;
    shredding: string;
    thermal: string;
    circulator: string;
};
const THREE_METHODS = ["破砕法", "熱処理法", "PV Circulator"] as const;
function MethodTable({ caption, rows, columns = THREE_METHODS }: {
    caption: string;
    rows: MethodRow[];
    columns?: readonly string[];
}) {
    return <div className="os-method-detail-table"><table><caption className="pv-sr-only">{caption}</caption><thead><tr><th scope="col">項目</th>{columns.map((column, index) => <th scope="col" key={column} className={index === columns.length - 1 ? "is-circulator" : undefined}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.shredding}</td><td>{row.thermal}</td><td>{row.circulator}</td></tr>)}</tbody></table></div>;
}
const methodSourceLabels: Record<string, string> = {
    "160 kWh/hour ÷ 60 panels/hour": "160 kWh／時 ÷ 60枚／時",
    "TNO 2022 R10860 (Späth et al.), pp. 8, 12, 19": "TNO 2022 R10860（Späth ほか）、8・12・19ページ",
    "TNO 2022 R10860 (Späth et al.)": "TNO 2022 R10860（Späth ほか）",
    "NEDO 2026 A1-2-14 (MRI), p. 8": "NEDO 2026 A1-2-14（MRI）、8ページ",
    "TNO 2022 App. D.1, pp. 25–26": "TNO 2022 付録 D.1、25～26ページ",
    "PV Circulator product specification": "PV Circulator 製品仕様",
    "PV Circonomy staffing comparison": "PV Circonomy の人員体制比較",
    "Thermal processing operating configuration": "熱処理法の運転条件",
    "PV Circulator operating configuration": "PV Circulator の運転条件",
    "PV Circonomy comparison threshold": "PV Circonomy の比較基準",
};
function methodSources(data: OurSolutionView) {
    const sources = Object.entries(data.websiteData)
        .filter(([key]) => key.startsWith("methods."))
        .map(([, row]) => row.source)
        .filter(source => !source.startsWith("No public") && source !== "SGS verification")
        .map(source => methodSourceLabels[source] ?? source);
    return `出典：${[...new Set(sources)].join("；")}。製品回収率は、純度に基づき販売可能と判断された回収物の割合です。「—」は公開データなしを示します。`;
}
function technologyRows(data: OurSolutionView): MethodRow[] {
    const n = (key: string) => webNum(data, key);
    const shredMin = n("methods.shredding.throughput_min_panels_per_hour"), shredMax = n("methods.shredding.throughput_max_panels_per_hour");
    const pv = n("methods.circulator.footprint_m2");
    return [
        { label: "\u8A2D\u7F6E\u9762\u7A4D", shredding: `${compactNumber(n("methods.shredding.footprint_m2"))} m²`, thermal: `${compactNumber(n("methods.thermal.footprint_m2"))} m²`, circulator: `${compactNumber(pv)} m²` },
        { label: "\u30A8\u30CD\u30EB\u30AE\u30FC", shredding: `${compactNumber(n("methods.shredding.energy_kwh_per_panel"))} kWh／枚`, thermal: `${compactNumber(n("methods.thermal.energy_kwh_per_panel"))} kWh／枚`, circulator: `<${compactNumber(n("methods.circulator.energy_max_kwh_per_panel"))} kWh／枚` },
        { label: "\u51E6\u7406\u80FD\u529B", shredding: `~${compactNumber(shredMin)}–${compactNumber(shredMax)}枚／時`, thermal: `~${compactNumber(n("methods.thermal.throughput_panels_per_hour"))}枚／時 (~${compactNumber(n("methods.thermal.seconds_per_panel"))}秒／枚)`, circulator: `~${compactNumber(n("methods.circulator.throughput_panels_per_hour"))}枚／時` },
        { label: "\u4EBA\u54E1", shredding: `${compactNumber(n("methods.shredding.total_staff_per_shift"))}人／シフト`, thermal: `${compactNumber(n("methods.thermal.total_staff_per_shift"))}人／シフト`, circulator: `${compactNumber(n("methods.circulator.total_staff_per_shift"))}人／シフト` },
        { label: "\u88FD\u54C1\u56DE\u53CE\u7387", shredding: `<${compactNumber(n("methods.shredding.product_recovery_percent"))}%`, thermal: `~${compactNumber(n("methods.thermal.product_recovery_percent"))}%`, circulator: `${compactNumber(n("methods.circulator.product_recovery_percent"))}%` },
        { label: "\u526F\u7523\u7269", shredding: "\u6DF7\u5408\u7834\u7247\u306F\u8FFD\u52A0\u51E6\u7406\u304C\u5FC5\u8981\u3067\u3059", thermal: "\u30BB\u30EB\u30E9\u30DF\u30CD\u30FC\u30C8\uFF08EVA\u3001\u30D0\u30C3\u30AF\u30B7\u30FC\u30C8\u3001\u30BB\u30EB\uFF09\u306F\u8FFD\u52A0\u51E6\u7406\u304C\u5FC5\u8981\u3067\u3059", circulator: "\u6392\u30AC\u30B9\u3084\u6392\u6C34\u306F\u767A\u751F\u3057\u307E\u305B\u3093" },
    ];
}
const marketMoney = (currency: string, digits = 0) => (value: number, precision = digits) =>
  formatCurrency(value, { currency }, { minimumFractionDigits: precision, maximumFractionDigits: precision });
function displayWeight(basis: { panelWeightKg: number; panelWeightLb?: number; weightUnit?: "kg" | "lb" }, fractionDigits?: number) {
  const pounds = basis.weightUnit === "lb" ? basis.panelWeightLb : undefined;
  const weight = pounds ?? basis.panelWeightKg;
  const unit = pounds === undefined ? "kg" : "lb";
  return `${fractionDigits === undefined ? weight : weight.toFixed(fractionDigits)} ${unit}`;
}
function economicsRegionLabel(scenario: { region: string; regionCode?: string }) {
    if (scenario.regionCode === "JP" || scenario.region === "Japan") return "日本";
    return scenario.region === "California" ? "カリフォルニア州" : scenario.region;
}
function economicsSolutions(data: OurSolutionView) {
    return {
        conventional: data.solutions.find((solution) => solution.code === "SHREDDING")!,
        hotKnife: data.solutions.find((solution) => solution.code === "HOT_KNIFE")!,
        circulator: data.solutions.find((solution) => solution.code === "PVCIRCULATOR")!,
    };
}
function materialRows(data: OurSolutionView): MethodRow[] {
    return [
        { label: "ガラス", shredding: "\u6DF7\u5408\u30AC\u30E9\u30B9\u30AB\u30EC\u30C3\u30C8", thermal: "\u5C01\u6B62\u6750\u304B\u3089\u5206\u96E2", circulator: "\u7C92\u5F84\u3068\u7D14\u5EA6\u306B\u3088\u308B\u7B49\u7D1A\u5206\u3051" },
        { label: "銀", shredding: "\u7834\u7247\u5185\u306B\u6DF7\u5728", thermal: "\u30BB\u30EB\u30E9\u30DF\u30CD\u30FC\u30C8\u5185\u306B\u6B8B\u7559", circulator: "\u30B7\u30EA\u30B3\u30F3\uFF08\u30BB\u30EB\uFF09\u7C89\u672B\u306B\u79FB\u884C" },
        { label: "EVA / \u30D0\u30C3\u30AF\u30B7\u30FC\u30C8", shredding: "\u7834\u7247\u306B\u6DF7\u5165", thermal: "\u30BB\u30EB\u30E9\u30DF\u30CD\u30FC\u30C8\u306B\u4ED8\u7740\u3057\u305F\u307E\u307E", circulator: "\u5206\u96E2\u30FB\u56DE\u53CE" },
        { label: "\u526F\u7523\u7269", shredding: "\u8FFD\u52A0\u306E\u9078\u5225\u30FB\u51E6\u7406", thermal: "\u30BB\u30EB\u30E9\u30DF\u30CD\u30FC\u30C8\u306F\u8FFD\u52A0\u51E6\u7406\u304C\u5FC5\u8981\u3067\u3059", circulator: "\u6392\u30AC\u30B9\u3084\u6392\u6C34\u306F\u767A\u751F\u3057\u307E\u305B\u3093" },
        { label: "二次処理", shredding: `~${compactNumber(webNum(data, "methods.shredding.secondary_treatment_t_per_mw"))} t / MW`, thermal: `~${compactNumber(data.thermalSecondaryTreatmentTPerMw)} t / MW`, circulator: `~${compactNumber(webNum(data, "methods.circulator.secondary_treatment_t_per_mw"))} t / MW` },
    ];
}
function FootprintMethodVisual({ data }: {
    data: OurSolutionView;
}) {
    const shredding = webNum(data, "methods.shredding.footprint_m2"), thermal = webNum(data, "methods.thermal.footprint_m2"), pv = webNum(data, "methods.circulator.footprint_m2");
    const reduction = (base: number, value: number) => Math.round((1 - value / base) * 100), pvLabel = `${compactNumber(pv)} m²`;
    return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>モジュール式の PV Circulator の設置面積はわずか {pvLabel} で、破砕法より約 {reduction(shredding, pv)}％、熱処理法より約 {reduction(thermal, pv)}％小さくなります。省スペースの乾式処理設備なので、現場やその近くに設置できます。</p></div><div className="os-method-bars is-footprint" role="img" aria-label={`設置面積の比較：破砕法 ${shredding} m²、熱処理法 ${thermal} m²、PV Circulator ${pv} m²`}><div><span>破砕法</span><i style={{ width: "100%" }}/><strong>{compactNumber(shredding)} m²</strong></div><div><span>熱処理法</span><i style={{ width: `${thermal / shredding * 100}%` }}/><strong>{compactNumber(thermal)} m²</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{ width: `${pv / shredding * 100}%` }}/><strong>{pvLabel}</strong></div></div></div><MethodTable caption="リサイクル技術の比較" rows={technologyRows(data)}/><p className="os-chart-source">{methodSources(data)}</p></div>;
}
function OperatingCostMethodVisual({ economicsData }: {
    economicsData: OurSolutionView;
}) {
    const scenario = economicsData.scenario;
    const { currency, processingFeeUnit, panelWeightKg, panelWeightLb } = scenario;
    const monthlyPanels = panelCount.format(scenario.panelsPerMonth);
    const annualPanels = panelCount.format(scenario.annualPanels);
    const operatingCostDescription = scenario.regionCode === "JP"
        ? `PV Circulator の定格処理能力を基に、年間処理能力を ${annualPanels} 枚（月間 ${monthlyPanels} 枚）と想定し、パネル1枚当たりの運営コストを比較します（${currency}）。`
        : `${economicsRegionLabel(scenario)} のビジネスケース（月間 ${monthlyPanels} 枚）に基づく、処理パネル1枚当たりの運営コスト（${currency}）。`;
    const money = marketMoney(currency, currency === "JPY" ? 0 : 2);
    const weightUnit = processingFeeUnit.endsWith("/kg") ? "kg" : "lb";
    const panelWeight = weightUnit === "kg" ? panelWeightKg : panelWeightLb;
    const { conventional, hotKnife, circulator } = economicsSolutions(economicsData);
    const operatingCostRows: MethodRow[] = [
        { label: "電力費", shredding: money(conventional.opexPerPanel.electricity), thermal: money(hotKnife.opexPerPanel.electricity), circulator: money(circulator.opexPerPanel.electricity) },
        { label: "\u4EBA\u4EF6\u8CBB\uFF0B\u4ED8\u968F\u8CBB\u7528", shredding: money(conventional.opexPerPanel.laborAndBurden), thermal: money(hotKnife.opexPerPanel.laborAndBurden), circulator: money(circulator.opexPerPanel.laborAndBurden) },
        { label: "\u65BD\u8A2D / \u8CC3\u6599", shredding: money(conventional.opexPerPanel.facility), thermal: money(hotKnife.opexPerPanel.facility), circulator: money(circulator.opexPerPanel.facility) },
        { label: "\u305D\u306E\u4ED6\u306E\u904B\u55B6\u30B3\u30B9\u30C8\uFF08OPEX\uFF09", shredding: money(conventional.opexPerPanel.other), thermal: money(hotKnife.opexPerPanel.other), circulator: money(circulator.opexPerPanel.other) },
        { label: "\u5408\u8A08 / \u679A", shredding: money(conventional.opexPerPanel.total), thermal: money(hotKnife.opexPerPanel.total), circulator: money(circulator.opexPerPanel.total) },
        { label: `合計 / ${weightUnit}`, shredding: money(conventional.opexPerPanel.total / panelWeight), thermal: money(hotKnife.opexPerPanel.total / panelWeight), circulator: money(circulator.opexPerPanel.total / panelWeight) },
    ];
    const peak = Math.max(conventional.opexPerPanel.total, hotKnife.opexPerPanel.total, circulator.opexPerPanel.total);
    const operatingBars = [
        { label: "破砕法", total: money(conventional.opexPerPanel.total), width: `${conventional.opexPerPanel.total / peak * 100}%`, values: [conventional.opexPerPanel.electricity, conventional.opexPerPanel.laborAndBurden, conventional.opexPerPanel.facility, conventional.opexPerPanel.other], className: "" },
        { label: "熱処理法", total: money(hotKnife.opexPerPanel.total), width: `${hotKnife.opexPerPanel.total / peak * 100}%`, values: [hotKnife.opexPerPanel.electricity, hotKnife.opexPerPanel.laborAndBurden, hotKnife.opexPerPanel.facility, hotKnife.opexPerPanel.other], className: "" },
        { label: "PV Circulator", total: money(circulator.opexPerPanel.total), width: `${circulator.opexPerPanel.total / peak * 100}%`, values: [circulator.opexPerPanel.electricity, circulator.opexPerPanel.laborAndBurden, circulator.opexPerPanel.facility, circulator.opexPerPanel.other], className: "is-circulator" },
    ];
    return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>{operatingCostDescription}</p><small>年間 OPEX を {annualPanels} 枚で除算。人件費はワークブックの前提条件にあるシフト当たりの総人員数から算出します。設備投資（CAPEX）と減価償却を除き、保守費用を含みます。</small></div><div className="os-cost-bars" role="img" aria-label={`パネル当たり運営コスト：破砕法 ${operatingBars[0].total}、熱処理法 ${operatingBars[1].total}、PV Circulator ${operatingBars[2].total}`}>{operatingBars.map((bar) => <div className={bar.className} key={bar.label}><span>{bar.label}</span><div className="os-cost-track"><div className="os-cost-stack" style={{ width: bar.width }}>{bar.values.map((value, index) => <i className={`is-part-${index + 1}`} style={{ flexGrow: value }} key={index}/>)}</div></div><strong>{bar.total}</strong></div>)}</div><div className="os-cost-legend" aria-label="運営コスト（OPEX）の分類">{["電力", "\u4EBA\u4EF6\u8CBB\uFF0B\u4ED8\u968F\u8CBB\u7528", "\u65BD\u8A2D / \u8CC3\u6599", "\u305D\u306E\u4ED6\u306E\u904B\u55B6\u30B3\u30B9\u30C8\uFF08OPEX\uFF09"].map((item, index) => <span key={item}><i className={`is-part-${index + 1}`}/>{item}</span>)}</div></div><MethodTable caption={`パネル当たり運営コスト（OPEX）の内訳（${currency}）`} rows={operatingCostRows} columns={THREE_METHODS}/></div>;
}
function MaterialMethodVisual({ data }: {
    data: OurSolutionView;
}) {
    const shredding = webNum(data, "methods.shredding.secondary_treatment_t_per_mw"), thermal = data.thermalSecondaryTreatmentTPerMw, circulator = webNum(data, "methods.circulator.secondary_treatment_t_per_mw");
    return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>MW 当たりの二次処理が必要な材料量です。棒が短いほど、追加処理や処分が必要な材料が少ないことを示します。</p></div><div className="os-method-bars is-secondary" role="img" aria-label={`1 MW当たりの二次処理が必要な材料量：破砕法 約${compactNumber(shredding)}トン、熱処理法 約${compactNumber(thermal)}トン、PV Circulator 約${compactNumber(circulator)}トン`}><div><span>破砕法</span><i style={{ width: "100%" }}/><strong>~{compactNumber(shredding)} t</strong></div><div><span>熱処理法</span><i style={{ width: `${thermal / shredding * 100}%` }}/><strong>~{compactNumber(thermal)} t</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{ width: `${circulator / shredding * 100}%` }}/><strong>~{compactNumber(circulator)} t</strong></div></div></div><MethodTable caption="技術別の回収材料比較" rows={materialRows(data)}/><p className="os-chart-source">{methodSources(data)}</p></div>;
}
function SilverValueVisual({ economicsData }: {
    economicsData: OurSolutionView;
}) {
    const items = economicsData.productMaterials;
    const mat = (name: string) => items.find(m => m.name === name)!;
    const pct = (n: number, digits = 0) => (n * 100).toFixed(digits) + "%";
    const ag = mat("Silver"), al = mat("Aluminium"), glass = mat("Glass"), cu = mat("Copper");
    return <div className="os-data-slide os-silver-value-slide"><div className="os-value-intro"><h2 id="value-title">銀はパネル重量のわずか {pct(ag.share, 2)}、材料価値では {pct(ag.valueShare)}</h2><span className="os-value-thesis">銀は回収価値を高める最も直接的な手段です。</span><p>アルミニウムとガラスを大規模にアップサイクルするには、相応の下流インフラが必要です。銀は濃縮されたセル材料流から比較的容易に精製できます。PV Circonomy はこの精製技術を有しており、同等のインフラ負担を伴わずに、銀の回収による利益向上が可能です。</p></div>
    <div className="os-silver-value-chart" role="img" aria-label={`銀は重量の ${pct(ag.share, 2)}、基準価格で算出した材料価値の ${pct(ag.valueShare)} です。`}>
      <div className="os-silver-chart-row"><span>パネル1枚当たりの重量構成</span><div className="os-silver-weight-bar"><i className="is-silver" style={{ flexGrow: ag.share, flexBasis: 0 }} title={`銀 · ${pct(ag.share, 2)}`}/><i className="is-frame" style={{ flexGrow: al.share, flexBasis: 0 }}><b>アルミ枠</b><small>{pct(al.share)}</small></i><i className="is-glass" style={{ flexGrow: glass.share, flexBasis: 0 }}><b>ガラス</b><small>{pct(glass.share)}</small></i><i className="is-other" style={{ flexGrow: 1 - ag.share - al.share - glass.share, flexBasis: 0 }}><b>その他</b><small>{pct(1 - ag.share - al.share - glass.share, 2)}</small></i></div></div>
      <div className="os-silver-chart-row"><span>材料価値の構成・銀の価値を100％計上</span><div className="os-silver-value-bar">{([[ag, "is-silver", "銀"], [al, "is-frame", "アルミ"], [cu, "is-copper", "銅"]] as const).map(([m, cls, label]) => { return <i key={m.name} className={cls} style={{ flexGrow: m.valueShare, flexBasis: 0 }}><b>{label}</b><small>{pct(m.valueShare)}</small></i>; })}<i className="is-rest" style={{ flexGrow: 1 - ag.valueShare - al.valueShare - cu.valueShare, flexBasis: 0 }}><b>その他</b><small>{pct(1 - ag.valueShare - al.valueShare - cu.valueShare)}</small></i></div><small className="os-silver-value-method">算出方法：モジュール内の重量比率 × 基準価格 × 採用した価値係数。銀は100％、アルミニウムと銅は LME 価格の50％、ガラスはセメントの基準価格を使用します。EVA とバックシートの価値はゼロとし、シリコンおよびジャンクションボックス・ケーブルはワークブックの設定に従います。濃縮された銀は比較的精製しやすく、材料価値に占める割合も最も大きいため、回収材料の収益を高めやすくなります。</small></div>
    </div></div>;
}
function SilverGradeTable({ economicsData }: {
    economicsData: OurSolutionView;
}) {
    const upper = (code: string, digits: number) => economicsData.solutions.find(s => s.code === code)!.silverUpperPct.toFixed(digits) + "%";
    const silverRows = [
        { method: THREE_METHODS[0], fraction: "破片内に混在", silver: upper("SHREDDING", 4), recovery: `<${compactNumber(webNum(economicsData, "methods.shredding.product_recovery_percent"))}%` },
        { method: THREE_METHODS[1], fraction: "セルラミネート内に残留", silver: upper("HOT_KNIFE", 3), recovery: `~${compactNumber(webNum(economicsData, "methods.thermal.product_recovery_percent"))}%` },
        { method: "PV Circulator", fraction: <strong>シリコン（セル）粉末に移行</strong>, silver: upper("PVCIRCULATOR", 3), recovery: `${compactNumber(webNum(economicsData, "methods.circulator.product_recovery_percent"))}%` }
    ];
    return <div className="os-method-detail-table os-silver-grade-table"><table><caption className="pv-sr-only">方法別の銀の行き先、銀濃度の理論上限、製品回収率</caption><thead><tr><th scope="col">方法</th><th scope="col">銀の行き先</th><th scope="col">銀濃度の理論上限</th><th scope="col">製品回収率</th></tr></thead><tbody>{silverRows.map(row => <tr key={row.method} className={row.method === "PV Circulator" ? "is-circulator" : undefined}><th scope="row">{row.method}</th><td>{row.fraction}</td><td>{row.silver}</td><td>{row.recovery}</td></tr>)}</tbody></table></div>;
}
function SilverTechnologyTrend({ data }: {
    data: OurSolutionView;
}) {
    const industry = webNum(data, "value.silver_industry_2024_mg_per_w");
    const topcon = [webNum(data, "value.silver_topcon_2025_mg_per_w"), webNum(data, "value.silver_topcon_2035_mg_per_w")];
    const hjt = [webNum(data, "value.silver_hjt_2025_mg_per_w"), webNum(data, "value.silver_hjt_2035_mg_per_w")];
    const top = 15, left = 36, right = 420, y = (value: number) => 24 + (top - value) / top * 126;
    return <figure className="os-silver-intensity-chart">
    <figcaption><strong>セル技術別に見た銀使用量の減少</strong><span>mg／W</span></figcaption>
    <div className="os-silver-intensity-legend" aria-hidden="true"><span className="is-topcon"><i />TOPCon</span><span className="is-hjt"><i />HJT</span><span className="is-industry"><i />2024年の業界平均</span></div>
    <svg viewBox="0 0 460 188" role="img" aria-label={`銀使用量（mg／W）：2024年の業界平均は ${industry}。TOPCon は2025年の ${topcon[0]} から2035年の ${topcon[1]}、HJT は ${hjt[0]} から ${hjt[1]} へ減少する見通しです。`}>
      {[0, 5, 10, 15].map(value => <g key={value}><line className="os-silver-intensity-grid" x1={left} x2="438" y1={y(value)} y2={y(value)}/><text x="27" y={y(value) + 3} textAnchor="end">{value}</text></g>)}
      <g className="is-industry"><circle cx="54" cy={y(industry)} r="4"/><text x="64" y={y(industry) - 7}>2024年平均 · {compactNumber(industry)}</text></g>
      <g className="is-topcon"><polyline points={`128,${y(topcon[0])} ${right},${y(topcon[1])}`}/><circle cx="128" cy={y(topcon[0])} r="4"/><circle cx={right} cy={y(topcon[1])} r="4"/><text x="128" y={y(topcon[0]) - 8} textAnchor="middle">{compactNumber(topcon[0])}</text><text x={right - 8} y={y(topcon[1]) - 9} textAnchor="end">TOPCon · {compactNumber(topcon[1])}</text></g>
      <g className="is-hjt"><polyline points={`128,${y(hjt[0])} ${right},${y(hjt[1])}`}/><circle cx="128" cy={y(hjt[0])} r="4"/><circle cx={right} cy={y(hjt[1])} r="4"/><text x="128" y={y(hjt[0]) - 8} textAnchor="middle">{compactNumber(hjt[0])}</text><text x={right - 8} y={y(hjt[1]) + 15} textAnchor="end">HJT · {compactNumber(hjt[1])}</text></g>
      <text className="os-silver-intensity-year" x="54" y="178" textAnchor="middle">2024</text><text className="os-silver-intensity-year" x="128" y="178" textAnchor="middle">2025</text><text className="os-silver-intensity-year" x={right} y="178" textAnchor="middle">2035</text>
    </svg>
  </figure>;
}
function ValueSection({ economicsData }: {
    economicsData: OurSolutionView;
}) {
    const industry = webNum(economicsData, "value.silver_industry_2024_mg_per_w");
    const topconNow = webNum(economicsData, "value.silver_topcon_2025_mg_per_w"), topconFuture = webNum(economicsData, "value.silver_topcon_2035_mg_per_w");
    const hjtNow = webNum(economicsData, "value.silver_hjt_2025_mg_per_w"), hjtFuture = webNum(economicsData, "value.silver_hjt_2035_mg_per_w");
    return <section id="value" className="pv-screen os-value-section" aria-labelledby="value-title">
    <div className="os-value-visual"><SilverValueVisual economicsData={economicsData}/></div>
    <aside className="os-value-explanation">
      <div className="os-value-grade"><h3>銀の濃度を維持し、その価値を保持</h3><p>パネルの各層を分離することで、銀を混合ガラス中に分散させず、濃縮されたセル材料流を追加回収に向けて保持できます。</p>
        <SilverGradeTable economicsData={economicsData}/>
        <p className="os-chart-source">理論上限 = 銀 ÷（銀＋製品に移行するモジュール構成材）で、モジュール内の銀がすべて製品に含まれると仮定しています。PV Circulator のシリコン（セル）粉末中の銀濃度は、実測で {compactNumber(webNum(economicsData, "value.circulator_measured_silver_percent"))}% です。</p></div>
      <div id="silver-trend" className="os-silver-trend">
        <h3>パネル当たりの銀が減少。回収技術にも進化が必要</h3>
        <SilverTechnologyTrend data={economicsData}/>
        <p>パネルメーカーはコストを抑えるため、銀の使用量を減らし続けています。2024年の太陽光パネルの銀使用量は1 kW 当たり約 {compactNumber(industry)} g で、2014年の半分未満でした（IRENA、2026年）。2025年の TOPCon セルの中央値は1 W 当たり約 {compactNumber(topconNow)} mg で、業界ロードマップでは10年以内に約 {compactNumber(topconFuture)} mg まで減る見通しです。ヘテロ接合型（HJT）セルは {compactNumber(hjtNow)} mg から {compactNumber(hjtFuture)} mg へ減少すると見込まれています（ITRPV 第17版、2026年）。</p>
        <p>今後廃棄されるパネルに含まれる銀は、以前より少なくなります。リサイクルで利益を維持するには、より多くの銀を回収し、精錬業者が対価を支払う濃縮材料流にする必要があります。銀を混合ガラスに粉砕混入させたり、ポリマー層内に残したりする方法は、まずこの価値を失います。</p>
        <p className="os-chart-source">出典：<a href="https://www.irena.org/Publications">IRENA（2026年）</a> · <a href="https://www.vdma.eu/documents/d/group-34568/en-press-release-itrpv-17-edition">ITRPV 第17版（2026年）</a>.</p>
      </div>
    </aside>
  </section>;
}
function RetirementLineChart({ lifetime, onLifetimeChange, wave: retirementWave, assumptions = defaultWaveAssumptions }: {
    assumptions?: WaveAssumptions;
    lifetime: 25 | 18 | 15 | 12;
    onLifetimeChange: (value: 25 | 18 | 15 | 12) => void;
    wave: RetirementWave;
}) {
    const SHOW_LIFETIME_REFERENCE = lifetime !== 25;
    const x = (year: number) => 48 + (year - 2016) / 34 * 500;
    const peak = Math.max(...retirementWave[`early_T${lifetime}`], ...retirementWave[`regular_T${lifetime}`], ...(SHOW_LIFETIME_REFERENCE ? [...retirementWave.early_T25, ...retirementWave.regular_T25] : []));
    const tickStep = peak > 5e6 ? 2 : 1;
    const ceilingMt = Math.max(4, Math.ceil(peak / 1e6 / tickStep) * tickStep);
    const ceiling = ceilingMt * 1e6;
    const ticks = Array.from({ length: ceilingMt / tickStep + 1 }, (_, index) => index * tickStep);
    const y = (value: number) => 202 - value / ceiling * 180;
    const basis = [
        { label: `Early-loss scenario (IRENA, ${assumptions.loss === "early" ? "main" : "comparison"})`, values: retirementWave[`early_T${lifetime}`], className: assumptions.loss === "early" ? "is-early is-main" : "is-regular is-comparison" },
        { label: `Regular-loss scenario (${assumptions.loss === "regular" ? "main" : "comparison"})`, values: retirementWave[`regular_T${lifetime}`], className: assumptions.loss === "regular" ? "is-early is-main" : "is-regular is-comparison" },
    ];
    const references = [retirementWave.early_T25, retirementWave.regular_T25];
    const points = (values: number[]) => retirementWave.years.map((year, i) => `${x(year)},${y(values[i])}`).join(" ");
    const ariaLabel = basis.map(series => `${series.label}: ${retirementWave.years.flatMap((year, i) => year % 5 === 0 ? [`${year}: ${series.values[i].toLocaleString("ja-JP")} tonnes`] : []).join("; ")}`).join(". ");
    return <figure className="os-economic-chart os-retirement-chart"><figcaption>Annual end-of-life PV panel mass, United States, 2016–2050: IRENA {assumptions.loss}-loss scenario, {lifetime}-year EoL lifetime (modelled; the other shape shown for comparison).</figcaption>
    <div className="os-economic-legend">{basis.map(series => <span className={series.className} key={series.label}><i />{series.label}</span>)}{SHOW_LIFETIME_REFERENCE && <span className="is-reference"><i />IRENA 2026：25 年</span>}</div>
    <svg viewBox="0 0 600 240" role="img" aria-label={ariaLabel}>
      <text x="48" y="12">百万 t</text>
      {ticks.map(tick => <g key={tick}><line className="os-economic-grid" x1="48" x2="548" y1={y(tick * 1e6)} y2={y(tick * 1e6)}/><text x="40" y={y(tick * 1e6) + 3} textAnchor="end">{tick.toFixed(1)}</text></g>)}
      {[2020, 2025, 2030, 2035, 2040, 2045, 2050].map(year => <text className="os-economic-axis-label" key={year} x={x(year)} y="225" textAnchor="middle">{year}</text>)}
      {[{ value: 1e5, label: "100 kt/yr" }, { value: 1e6, label: "1 Mt/yr" }].map(guide => <g key={guide.value}><line className="os-retirement-guide" x1="48" x2="548" y1={y(guide.value)} y2={y(guide.value)}/><text x="552" y={y(guide.value) + 3}>{guide.label}</text></g>)}
      {SHOW_LIFETIME_REFERENCE && references.map((values, i) => <polyline className={`is-reference ${i === 0 ? "is-early" : "is-regular"}`} key={i} points={points(values)}/>)}
      {basis.map((series, seriesIndex) => <g key={series.label} className={series.className}><polyline points={points(series.values)}/>{[2030, 2035, 2040, 2050].map(year => { const value = series.values[retirementWave.years.indexOf(year)]; return <text key={year} x={x(year)} y={y(value) + (seriesIndex === 0 ? -9 : 14)} textAnchor="middle">{(value / 1e6).toFixed(2)}m t</text>; })}</g>)}
    </svg>
    <label className="os-lifetime-control">EoL 寿命
      <select aria-label="EoL 寿命" value={lifetime} onChange={event => onLifetimeChange(Number(event.target.value) as 25 | 18 | 15 | 12)}>{[25, 18, 15, 12].map(value => <option key={value} value={value}>{value} years{value === assumptions.defaultLifetime ? " (default)" : ""}</option>)}</select>
    </label>
  </figure>;
}
function RetirementContext({ lifetime, wave: retirementWave, assumptions = defaultWaveAssumptions }: {
    assumptions?: WaveAssumptions;
    lifetime: 25 | 18 | 15 | 12;
    wave: RetirementWave;
}) {
    const sources = {
        25: <>IRENA 2026 (25-year lifetime){assumptions.defaultLifetime === 25 ? " (default)" : ""}.</>,
        18: <>Intermediate modeled case between the 12- and 25-year scenarios{assumptions.defaultLifetime === 18 ? " (default)" : ""}.</>,
        15: <><a href="https://doi.org/10.1016/j.joule.2019.08.012">Jean, Woodhouse &amp; Bulović, Joule 2019</a> (initial life under 15 years).</>,
        12: <><a href="https://docs.nrel.gov/docs/fy21osti/74124.pdf">NREL/TP-6A20-74124, p. 8 (PDF p. 19)</a> (industry observations of possible 10–12-year commercial and utility-scale repowering).</>,
    };
    return <div className="os-retirement-context" aria-live="polite">
    <p><strong>{lifetime}-year EoL lifetime, IRENA {assumptions.loss}-loss scenario.</strong> {sources[lifetime]}</p>
    <p>Default: {assumptions.defaultLifetime}-year lifetime, IRENA {assumptions.loss}-loss scenario. In {retirementWave.years[retirementWave.years.length - 1]}, early-loss retirements reach {(retirementWave[`early_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t; regular loss, for comparison, {(retirementWave[`regular_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t.</p>
    <table><caption>First year annual retirements cross each threshold ({assumptions.loss} loss is the main scenario)</caption><thead><tr><th scope="col">年間質量</th><th scope="col">Early loss ({assumptions.loss === "early" ? "main" : "comparison"})</th><th scope="col">Regular loss ({assumptions.loss === "regular" ? "main" : "comparison"})</th></tr></thead><tbody>{retirementWave.thresholds.map(threshold => <tr key={threshold}><th scope="row">{threshold >= 1000000 ? `${threshold / 1000000} Mt` : `${threshold / 1000} kt`}</th><td>{retirementWave.crossings[`early_T${lifetime}`][threshold]}</td><td>{retirementWave.crossings[`regular_T${lifetime}`][threshold]}</td></tr>)}</tbody></table>
    <p className="os-chart-source">予測ではなくシナリオです。IRENA Weibull 形状係数：早期損失 {assumptions.shapes.early}、通常損失 {assumptions.shapes.regular}。パネル質量は {displayWeight(assumptions)}、定格 {assumptions.panelRating} W（MW 当たり約 {assumptions.tonnesPerMw.toFixed(1)} t）。</p>
  </div>;
}
function RegulationSection({ metrics, assumptions, data, locale }: {
    metrics: ImpactRouteMetric[];
    assumptions: WaveAssumptions;
    data: OurSolutionView;
    locale: OurSolutionLocale;
}) {
    const rules = [
        ["\u7C73\u56FD\uFF08\u9023\u90A6\u3001RCRA\uFF09\u3002", "\u5EC3\u68C4\u3055\u308C\u308B\u4F7F\u7528\u6E08\u307F\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306F\u56FA\u5F62\u5EC3\u68C4\u7269\u3067\u3059\u3002\u925B\u307E\u305F\u306F\u30AB\u30C9\u30DF\u30A6\u30E0\u306E\u6BD2\u6027\u8A66\u9A13\uFF08TCLP\uFF09\u306B\u4E0D\u5408\u683C\u3068\u306A\u3063\u305F\u5834\u5408\u306F\u6709\u5BB3\u5EC3\u68C4\u7269\u306B\u8A72\u5F53\u3057\u3001\u6392\u51FA\u8005\u304C\u305D\u306E\u5224\u5B9A\u3092\u884C\u3046\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306F\u307E\u3060\u9023\u90A6\u306E\u30E6\u30CB\u30D0\u30FC\u30B5\u30EB\u5EC3\u68C4\u7269\u306B\u306F\u6307\u5B9A\u3055\u308C\u3066\u304A\u3089\u305A\u3001EPA \u304C\u898F\u5247\u5236\u5B9A\u3092\u9032\u3081\u3066\u3044\u307E\u3059\u3002", "https://www.epa.gov/hw/solar-panel-frequent-questions", "EPA \u3088\u304F\u3042\u308B\u8CEA\u554F"],
        californiaPvRule(locale),
        ["\u30CE\u30FC\u30B9\u30AB\u30ED\u30E9\u30A4\u30CA\u5DDE\u3002", "2026 \u5E74\u5341\u4E8C\u6708 1 \u65E5\u3088\u308A\u3001\u592A\u967D\u5149\u30E2\u30B8\u30E5\u30FC\u30EB\u306F\u3001\u5EFA\u8A2D\u30FB\u89E3\u4F53\u5EC3\u68C4\u7269\u57CB\u7ACB\u5730\u3092\u542B\u3080\u906E\u6C34\u30E9\u30A4\u30CA\u30FC\u306E\u306A\u3044\u57CB\u7ACB\u5730\u306B\u51E6\u5206\u3067\u304D\u307E\u305B\u3093\u3002", "https://www.deq.nc.gov/north-carolina-landfill-disposal-bans", "NC DEQ"],
        ["\u6B27\u5DDE\u9023\u5408\uFF08WEEE Directive 2012/19/EU\uFF09\u3002", "\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306F\u5927\u578B\u6A5F\u5668\u306B\u5206\u985E\u3055\u308C\u3001\u5C11\u306A\u304F\u3068\u3082 85% \u3092\u56DE\u53CE\u51E6\u7406\u3057\u300180% \u3092\u518D\u4F7F\u7528\u306E\u6E96\u5099\u304A\u3088\u3073\u518D\u751F\u5229\u7528\u306B\u5145\u3066\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u3002", "https://eur-lex.europa.eu/eli/dir/2012/19/oj", "EUR-Lex"],
        ["\u65E5\u672C\u3002", "\u4F7F\u7528\u6E08\u307F\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306F\u5EC3\u68C4\u7269\u51E6\u7406\u6CD5\u306B\u57FA\u3065\u304D\u9069\u6B63\u306B\u7BA1\u7406\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059\u300210 kW \u4EE5\u4E0A\u306E FIT/FIP \u4E8B\u696D\u7528\u30B7\u30B9\u30C6\u30E0\u306F\u3001\u518D\u751F\u53EF\u80FD\u30A8\u30CD\u30EB\u30AE\u30FC\u7279\u5225\u63AA\u7F6E\u6CD5\u306B\u57FA\u3065\u304F\u5EC3\u68C4\u7B49\u8CBB\u7528\u7A4D\u7ACB\u5236\u5EA6\u306E\u5BFE\u8C61\u3067\u3059\u3002", "https://www.env.go.jp/content/000378443.pdf", "MOE / METI"],
        ["\u30AA\u30FC\u30B9\u30C8\u30E9\u30EA\u30A2\uFF08\u30D3\u30AF\u30C8\u30EA\u30A2\u5DDE\uFF09\u3002", "Environment Protection Regulations 2021 \u306B\u3088\u308A\u3001\u592A\u967D\u5149\u30D1\u30CD\u30EB\u306F\u96FB\u5B50\u5EC3\u68C4\u7269\u306B\u8A72\u5F53\u3057\u307E\u3059\u3002\u30D3\u30AF\u30C8\u30EA\u30A2\u5DDE\u306E\u57CB\u7ACB\u5730\u306F\u96FB\u5B50\u5EC3\u68C4\u7269\u3092\u53D7\u3051\u5165\u308C\u3089\u308C\u305A\u3001\u6392\u51FA\u8005\u3001\u904B\u642C\u8005\u3001\u53D7\u5165\u8005\u306B\u306F Environment Protection Act 2017 \u306B\u57FA\u3065\u304F\u7FA9\u52D9\u304C\u3042\u308A\u307E\u3059\u3002", "https://www.epa.vic.gov.au/electronic-waste", "EPA Victoria"],
    ];
    return <section id="regulation" className="pv-screen os-regulation" aria-labelledby="regulation-title"><div className="os-regulation-main">
    <h2 id="regulation-title">埋立量を削減し、処理工程の炭素排出も削減</h2>
    <p>使用済みパネル 1 MW 当たり（{assumptions.panelRating} W、1枚 {displayWeight(assumptions, locale === "zh-TW" ? 1 : undefined)}、約 {assumptions.tonnesPerMw.toFixed(1)} t）。工程 CO2e は工程電力のみを対象とします。</p>
    <EnvironmentalEvidenceChart metrics={metrics}/>
    <p className="os-chart-source">残さは埋立または追加処理の対象です。PV Circulator は公表製品回収率、ほかの方式は材料別の回収率を基に算出しています。工程の CO₂e はパネル1枚当たりの工程電力（kWh）に電力の排出係数を掛けて算出します。排出係数： {compactNumber(webNum(data, "impact.grid_kg_co2e_per_kwh"))} kg CO₂e／kWh（<a href="https://www.epa.gov/egrid/summary-data">EPA eGRID2023</a>）。輸送、下流の精製、回避排出量は含みません。熱処理法では封止材とセルが一体で残るため、金属の回収には追加処理が必要です。</p>
  </div><div className="os-regulation-rules">{rules.map(([title, copy, href, source]) => <article key={title}><h3>{title}</h3><p>{copy}</p><a href={href}>{source} <Arrow /></a></article>)}</div></section>;
}
function EnvironmentalEvidenceChart({ metrics }: {
    metrics: ImpactRouteMetric[];
}) {
    const ordered = ["SHREDDING", "HOT_KNIFE", "PVCIRCULATOR"].map(code => metrics.find(item => item.code === code));
    const items = ordered.map((item, index) => ({ label: THREE_METHODS[index], residue: item?.residueTPerMw ?? 0, co2: item?.co2eTPerMw ?? 0, available: Boolean(item) }));
    const peak = Math.max(1, ...items.flatMap(item => [item.residue, item.co2])), format = (value: number) => value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
    return <figure className="os-impact-mini-chart"><figcaption><strong>1 MW 当たりの残さと工程排出量</strong><span>トン／MW</span></figcaption><div className="os-impact-mini-legend" aria-hidden="true"><span><i className="is-landfill"/>埋立・追加処理の対象</span><span><i className="is-carbon"/>工程の CO₂e</span></div><div className="os-impact-mini-bars" role="img" aria-label={items.map(item => `${item.label}：${item.available ? `1 MW 当たりの埋立・追加処理対象の残さ ${format(item.residue)} トン、工程排出量 ${format(item.co2)} トン（CO₂e）` : "\u30C7\u30FC\u30BF\u306A\u3057"}`).join(". ")}>{items.map(item => <article key={item.label}><div><i className="is-landfill" style={{ height: `${item.residue / peak * 100}%` }}><b>{item.available ? format(item.residue) : "—"}</b></i><i className="is-carbon" style={{ height: `${item.co2 / peak * 100}%` }}><b>{item.available ? format(item.co2) : "—"}</b></i></div><strong>{item.label}</strong></article>)}</div></figure>;
}
function EquipmentDemandChart({ years, early, regular, lineCapacityMw, marketLabel }: {
    years: number[];
    early: number[];
    regular: number[];
    lineCapacityMw: number;
    marketLabel: string;
}) {
    const width = 560, height = 240, left = 48, right = 18, top = 38, bottom = 34, peak = Math.max(1, ...early, ...regular) * 1.12;
    const x = (index: number) => left + index * ((width - left - right) / (years.length - 1)), y = (value: number) => top + (peak - value) / peak * (height - top - bottom), points = (values: number[]) => values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
    return <figure className="os-equipment-demand-chart"><figcaption><strong>{marketLabel}の年間設備需要</strong><span>{lineCapacityMw.toFixed(0)} MW／ライン・年</span></figcaption><div className="os-economic-legend" aria-hidden="true"><span className="is-regular"><i />通常廃棄</span><span className="is-early"><i />早期廃棄</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${marketLabel}の設備需要の試算。通常廃棄：${years.map((year, index) => `${year}年 ${regular[index]}台`).join("、")}。早期廃棄：${years.map((year, index) => `${year}年 ${early[index]}台`).join("、")}。`}>
    {[0, .25, .5, .75, 1].map(ratio => <line className="os-economic-grid" x1={left} x2={width - right} y1={top + ratio * (height - top - bottom)} y2={top + ratio * (height - top - bottom)} key={ratio}/>)}
    <g className="is-regular"><polyline points={points(regular)}/>{regular.map((value, index) => <g key={years[index]}><circle cx={x(index)} cy={y(value)} r="3"/><text x={x(index)} y={y(value) + 15} textAnchor="middle">{value}</text></g>)}</g>
    <g className="is-early"><polyline points={points(early)}/>{early.map((value, index) => <g key={years[index]}><circle cx={x(index)} cy={y(value)} r="3"/><text x={x(index)} y={y(value) - 9} textAnchor="middle">{value}</text></g>)}</g>
    {years.map((year, index) => <text className="os-economic-axis-label" x={x(index)} y={height - 9} textAnchor="middle" key={year}>{year}</text>)}
  </svg></figure>;
}
function PublishedCapacityGap({ data, market }: {
    data: OurSolutionView;
    market: DemandMarket;
}) {
    if (market !== "Japan")
        return null;
    const capacity = webNum(data, "scale.japan_recycling_capacity_t_per_year"), peak = webNum(data, "scale.japan_peak_discard_t_per_year"), gap = Math.max(0, peak - capacity), collected = webNum(data, "scale.japan_2024_collected_t"), respondents = webNum(data, "scale.japan_2024_survey_respondents");
    const compact = (value: number) => `${Math.round(value / 1000).toLocaleString("ja-JP")}千トン／年`;
    return <figure className="os-capacity-gap"><figcaption><strong>公表資料に基づく処理能力の不足</strong><span>日本・太陽光パネル専用のリサイクル設備</span></figcaption><div className="os-capacity-gap-bar" role="img" aria-label={`日本の太陽光パネル専用設備の処理能力は年間約 ${capacity.toLocaleString("ja-JP")} トンです。推計ピークの年間約 ${peak.toLocaleString("ja-JP")} トンに対し、約 ${gap.toLocaleString("ja-JP")} トン分の処理能力が不足します。`}><i className="is-existing" style={{ flexGrow: capacity }}><b>既存 {compact(capacity)}</b></i><i className="is-gap" style={{ flexGrow: gap }}><b>不足 {compact(gap)}</b></i></div><small>ピーク時の処理需要：{compact(peak)}。2024年の調査では、回答した {respondents.toLocaleString("ja-JP")} 者の回収量は {collected.toLocaleString("ja-JP")} トンでした。 <a href="https://www.env.go.jp/content/000378443.pdf">環境省（2026年1月23日）、1・6・19ページ</a>.</small></figure>;
}
function PurificationUpliftChart({ directSale, purifiedNet, currency }: {
    directSale: number;
    purifiedNet: number;
    currency: string;
}) {
  const money = marketMoney(currency);
    const peak = Math.max(directSale, purifiedNet), values = [{ label: "\u30BB\u30EB\u7C89\u672B\u306E\u76F4\u63A5\u8CA9\u58F2", value: directSale, className: "is-direct" }, { label: "\u30E2\u30C7\u30EB\u4E0A\u306E\u7CBE\u88FD\u5F8C\u7D14\u4FA1\u5024", value: purifiedNet, className: "is-purified" }];
    return <figure className="os-purification-chart"><figcaption>セル材料流の年間価値 · {currency}</figcaption><div role="img" aria-label={`セル粉末の直接販売 ${money(directSale)}、精製後純額 ${money(purifiedNet)}`}>{values.map(item => <div className={item.className} key={item.label}><span>{item.label}</span><i><b style={{ width: `${item.value / peak * 100}%` }}/></i><strong>{money(item.value)}</strong></div>)}</div></figure>;
}
function ProfitPerMwChart({ data }: {
    data: OurSolutionView;
}) {
    const { conventional, hotKnife, circulator } = economicsSolutions(data), watts = webNum(data, "stakes.cost.reference_panel_watts");
    const annualMw = data.scenario.annualPanels * watts / 1e6;
    const perMw = (value: number) => value / annualMw;
    const short = (value: number) => data.scenario.currency === "JPY"
        ? `${Math.round(value / 1000).toLocaleString("ja-JP")}千円`
        : `${value < 0 ? "−" : ""}${Math.abs(value / 1000).toFixed(1)}k`;
    const direct = [
        { label: "PV Circulator", revenue: perMw(circulator.annualMaterialRevenue), cost: perMw(circulator.annualOpex) },
        { label: THREE_METHODS[0], revenue: perMw(conventional.annualMaterialRevenue), cost: perMw(conventional.annualOpex) },
        { label: THREE_METHODS[1], revenue: perMw(hotKnife.annualMaterialRevenue), cost: perMw(hotKnife.annualOpex) },
    ];
    const refinedRevenue = circulator.annualMaterialRevenue - data.cellPowder.scenario1 + data.cellPowder.scenario2Revenue;
    const refinedCost = circulator.annualOpex + data.cellPowder.reagentCost + data.cellPowder.electroCost;
    const refined = [{ label: "PV Circulator", revenue: perMw(refinedRevenue), cost: perMw(refinedCost) }];
    const axisMax = Math.max(...[...direct, ...refined].flatMap(item => [item.revenue, item.cost])) * 1.15;
    const group = (title: string, items: typeof direct, className: string) => <section className={className}><h4>{title}</h4><div>{items.map(item => { const profit = item.revenue - item.cost; return <article key={item.label}><div className="os-profit-pair"><i className="is-revenue" style={{ height: `${item.revenue / axisMax * 100}%` }}><b>{short(item.revenue)}</b></i><i className="is-cost" style={{ height: `${item.cost / axisMax * 100}%` }}><b>{short(item.cost)}</b></i></div><strong>{item.label}</strong><span className={profit > 0 ? "is-positive" : profit < 0 ? "is-negative" : undefined}>差引 {short(profit)}</span></article>; })}</div></section>;
    return <figure className="os-profit-per-mw"><figcaption><strong>1 MW 当たりのリサイクル利益</strong><span>処理料金なし・{compactNumber(watts)} W モジュール</span></figcaption><div className="os-profit-legend" aria-hidden="true"><span><i className="is-revenue"/>材料売却収入</span><span><i className="is-cost"/>運営コスト（OPEX）</span></div><div className="os-profit-groups" role="img" aria-label={`1 MW 当たりの差引利益。銀精製なし：PV Circulator ${short(direct[0].revenue - direct[0].cost)}、${THREE_METHODS[0]} ${short(direct[1].revenue - direct[1].cost)}、${THREE_METHODS[1]} ${short(direct[2].revenue - direct[2].cost)}。銀精製あり：PV Circulator ${short(refined[0].revenue - refined[0].cost)}（試算）。`}>{group("\u9280\u7CBE\u932C\u306A\u3057", direct, "is-direct")}{group("\u9280\u7CBE\u932C\u3042\u308A", refined, "is-refined")}</div><small>銀精製費に含むのは、試算上の試薬費と電解精錬の電力費のみです。追加人件費、減価償却費、許認可費、排水処理費、資金調達費、製品適格性評価費は含みません。</small></figure>;
}
function EconomicSection({ economicsData, breakeven, priceSources, calculatorHref, locale }: {
    economicsData: OurSolutionView;
    breakeven: BreakevenView;
    priceSources: string;
    calculatorHref?: string;
    locale: OurSolutionLocale;
}) {
    const { conventional, hotKnife, circulator } = economicsSolutions(economicsData);
  const { currency, processingFee: currentFee, processingFeeUnit, annualProcessingFeeRevenue: feeRevenue, panelWeightKg, panelWeightLb } = economicsData.scenario;
  const scenarioRegion = economicsRegionLabel(economicsData.scenario);
  const money = marketMoney(currency, 2);
  const feeSuffix = processingFeeUnit.replace(/^[A-Z]{3}/, "");
  const scenarioWeight = feeSuffix === "/kg" ? `${panelWeightKg} kg` : `${panelWeightLb} lb`;
  const currentFeeLabel = `${money(currentFee)}${feeSuffix}`;
    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);
    const feeSeries: EconomicSeries[] = [
        { label: THREE_METHODS[0], values: economicsData.feeSensitivity.annualEbitdaThousands.SHREDDING, className: "is-shredding" },
        { label: THREE_METHODS[1], values: economicsData.feeSensitivity.annualEbitdaThousands.HOT_KNIFE, className: "is-thermal" },
        { label: "PV Circulator", values: economicsData.feeSensitivity.annualEbitdaThousands.PVCIRCULATOR, className: "is-circulator" },
    ];
    const currentFeeIndex = economicsData.feeSensitivity.feeSteps.findIndex(value => Math.abs(value - currentFee) < 1e-9);
    const breakevenFee = (code: string) => breakeven?.fees.find(item => item.code === code)?.breakevenFee;
    const feeText = (value: number | null | undefined) => value == null || !breakeven ? null : `${money(value, 3)}${breakeven.feeUnit.replace(/^[A-Z]{3}/, "")}`;
    const shreddingBreakeven = feeText(breakevenFee("SHREDDING")), hotKnifeBreakeven = feeText(breakevenFee("HOT_KNIFE"));
    const feeRange = `${money(Math.min(...economicsData.feeSensitivity.feeSteps))}–${money(Math.max(...economicsData.feeSensitivity.feeSteps))}${feeSuffix}`;
    const scenarioDetail = `${scenarioRegion}の運転条件（月間 ${panelCount.format(economicsData.scenario.panelsPerMonth)} 枚）。設備投資と減価償却費は除外し、保守費は含みます。`;
    const breakevenDetail = breakeven && shreddingBreakeven && hotKnifeBreakeven ? `${breakeven.source} による損益分岐処理費：${economicsRegionLabel(breakeven)}、月間 ${panelCount.format(breakeven.panelsPerMonth)} 枚、1枚 ${displayWeight(breakeven)}。CAPEX と減価償却は除外し、保守費用は含みます。` : null;
    const chineseCopy = locale === "zh-TW"
        ? chineseEconomicCopy(economicsData, scenarioRegion, breakeven, breakeven ? economicsRegionLabel(breakeven) : scenarioRegion)
        : null;
    const slides = [
        { label: "MW \u5F53\u305F\u308A\u5229\u76CA", heading: "\u30BB\u30EB\u7C89\u672B\u306E\u76F4\u63A5\u8CA9\u58F2\u3067\u57FA\u672C\u30B1\u30FC\u30B9\u3092\u9ED2\u5B57\u5316", copy: `\u30B0\u30E9\u30D5\u3067\u306F\u76F4\u63A5\u8CA9\u58F2\u30B1\u30FC\u30B9\u3068\u9280\u7CBE\u932C\u306E\u30E2\u30C7\u30EB\u30B1\u30FC\u30B9\u3092\u5206\u3051\u3066\u8868\u793A\u3057\u307E\u3059\u3002\u8A2D\u5099\u8CFC\u5165\u8005\u304C\u5404\u30EA\u30B5\u30A4\u30AF\u30EB\u65B9\u5F0F\u81EA\u4F53\u306E\u5275\u51FA\u4FA1\u5024\u3092\u6BD4\u8F03\u3067\u304D\u308B\u3088\u3046\u3001\u51E6\u7406\u8CBB\u306F\u542B\u3081\u3066\u3044\u307E\u305B\u3093\u3002`, detail: `${scenarioRegion}：月間 ${panelCount.format(economicsData.scenario.panelsPerMonth)} 枚、年間 ${panelCount.format(economicsData.scenario.annualPanels)} 枚、1枚 ${scenarioWeight}。`, visual: <ProfitPerMwChart data={economicsData}/> },
        { label: "\u51E6\u7406\u8CBB", heading: "\u73FE\u5728\u306E\u51E6\u7406\u8CBB\u304C\u904B\u55B6\u306E\u57FA\u6E96", copy: chineseCopy?.feeCopy ?? `${currentFeeLabel} の場合、モデル処理量で年間収益に ${money(feeRevenue, 0)} を加えます。グラフは感度分析として ${feeRange} を表示します。`, detail: chineseCopy?.feeDetail ?? breakevenDetail ?? scenarioDetail, visual: <EconomicLineChart currentLabel="現在の料金" title="処理費と年間 EBITDA" subtitle={chineseCopy?.feeSubtitle ?? `年間1,000 ${currency} · ${scenarioRegion} · 月間 ${panelCount.format(economicsData.scenario.panelsPerMonth)} 枚`} labels={economicsData.feeSensitivity.feeSteps.map(v => `${money(v)}${feeSuffix}`)} series={feeSeries} highlightIndex={currentFeeIndex}/> },
        { label: "\u7CBE\u88FD\u306B\u3088\u308B\u4E0A\u7A4D\u307F\u4F59\u5730", heading: "\u9280\u7CBE\u88FD\u306F\u57FA\u672C\u30B1\u30FC\u30B9\u306B\u5BFE\u3059\u308B\u4E0A\u7A4D\u307F\u4F59\u5730", copy: chineseCopy?.refiningCopy ?? `基本ケースのセル粉末直接販売は年間 ${money(economicsData.cellPowder.scenario1, 0)}。モデル精製ルートの純価値は ${money(economicsData.cellPowder.scenario2Net, 0)}、増加余地は ${money(economicsData.cellPowder.scenario2Net - economicsData.cellPowder.scenario1, 0)} です。`, detail: "\u7CBE\u88FD\u30B1\u30FC\u30B9\u3067\u63A7\u9664\u3059\u308B\u306E\u306F\u3001\u30E2\u30C7\u30EB\u4E0A\u306E\u8A66\u85AC\u3068\u96FB\u89E3\u7CBE\u932C\u306E\u96FB\u529B\u306E\u307F\u3067\u3059\u3002\u8FFD\u52A0\u306E\u7CBE\u932C\u4EBA\u4EF6\u8CBB\u3001\u8A2D\u5099\u6E1B\u4FA1\u511F\u5374\u3001\u8A31\u8A8D\u53EF\u3001\u6392\u6C34\u51E6\u7406\u3001\u8CC7\u91D1\u8ABF\u9054\u3001\u88FD\u54C1\u9069\u683C\u6027\u8A55\u4FA1\u306F\u672A\u7B97\u5165\u306E\u305F\u3081\u3001\u3053\u308C\u306F\u6F5C\u5728\u4FA1\u5024\u3067\u3042\u308A EBITDA \u306E\u898B\u901A\u3057\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002", visual: <PurificationUpliftChart currency={currency} directSale={economicsData.cellPowder.scenario1} purifiedNet={economicsData.cellPowder.scenario2Net}/> },
    ];
    const slide = slides[current];
    useEffect(() => {
        if (!sectionRef.current)
            return;
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.45 });
        observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);
    useEffect(() => {
        if (isPaused || !isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % slides.length), 30000);
        return () => window.clearTimeout(timer);
    }, [current, isPaused, isVisible, slides.length]);
    return <section ref={sectionRef} id="economic" className={`pv-screen os-economic is-auto${isPaused || !isVisible ? " is-paused" : ""}`} style={{ "--deck-duration": "30000ms" } as CSSProperties} aria-labelledby="economic-title" onFocusCapture={() => setIsPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setIsPaused(false); }} onKeyDown={(event) => { if (event.key === "ArrowLeft")
        setCurrent((value) => Math.max(0, value - 1)); if (event.key === "ArrowRight")
        setCurrent((value) => Math.min(slides.length - 1, value + 1)); }}>
    <aside className="os-economic-copy">
      <div className="os-economic-copy-body"><h2 id="economic-title">セル粉末の直接販売が収益性のある基本ケースを支援</h2><p>{scenarioRegion}の年間 {panelCount.format(economicsData.scenario.annualPanels)} 枚のシナリオで、PV Circulator は材料価値を保ち、分離したセル粉末を直接販売します。</p><DirectCellPowderSale rates={economicsData.cellPowder.directSaleRealization} locale="ja-JP" /><strong className="os-economic-result">現在の処理費 {currentFeeLabel} で、年間 EBITDA は約 <b>{money(circulator.annualEbitdaAtCurrentFee, 0)}</b></strong><div className="os-economic-actions">{calculatorHref ? <a className="pv-button os-economic-cta" href={calculatorHref}>自社の運営条件で試算 <Arrow /></a> : <Link className="pv-button os-economic-cta" href="/contact/">プロジェクトについて相談する <Arrow /></Link>}<a className="pv-text-button" href="/ja/pv-circulator/#routes">利益の源泉を確認 <Arrow /></a></div></div>
      <div className="os-deck-navigation" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}><div className="os-deck-progress" aria-label="経済性グラフを選択">{slides.map((item, index) => <button key={item.label} type="button" aria-label={`経済性グラフ ${index + 1}：${item.label}`} aria-pressed={current === index} onClick={() => setCurrent(index)}><span /><small>{item.label}</small></button>)}</div></div>
    </aside>
    <div className="os-economic-visual" aria-live="polite"><div key={`economic-${current}`} className="os-economic-slide"><div className="os-economic-slide-copy"><h3>{slide.heading}</h3><p>{slide.copy}</p><small>{slide.detail}</small></div><div className="os-economic-slide-graphic">{slide.visual}</div><p className="os-economic-source">{priceSources}{currency === "JPY" ? "。米ドル建ての週次金属価格はワークブックの為替レートで円換算しています。" : " · "}シナリオ値は参考値であり、商業成果を保証するものではありません。</p></div></div>
  </section>;
}
const materialOutputs = [
    ["ガラス", "/images/pvc-material-glass.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u5206\u96E2\u30AC\u30E9\u30B9\u6750\u6599", "\u30DD\u30BE\u30E9\u30F3 / \u518D\u751F\u30AC\u30E9\u30B9\u7528\u9014", "\u5C64\u3054\u3068\u306E\u51E6\u7406\u3067\u5E38\u6E29\u306B\u3066\u30AC\u30E9\u30B9\u3092\u5206\u96E2\u3057\u3001\u4EA4\u5DEE\u6C5A\u67D3\u3092\u6291\u3048\u306A\u304C\u3089\u3001\u30DD\u30BE\u30E9\u30F3\u3084\u518D\u751F\u30AC\u30E9\u30B9\u7528\u9014\u3078\u306E\u9078\u629E\u80A2\u3092\u4FDD\u6301\u3057\u307E\u3059\u3002"],
    ["\u30D5\u30EC\u30FC\u30E0", "/images/pvc-material-frame.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u56DE\u53CE\u30A2\u30EB\u30DF\u30D5\u30EC\u30FC\u30E0", "\u56DE\u53CE\u30A2\u30EB\u30DF\u30CB\u30A6\u30E0\u306E\u7528\u9014", "\u5C64\u9593\u5265\u96E2\u306E\u524D\u306B\u30A2\u30EB\u30DF\u30D5\u30EC\u30FC\u30E0\u3092\u72EC\u7ACB\u3057\u305F\u6750\u6599\u6D41\u3068\u3057\u3066\u53D6\u308A\u5916\u3057\u3001\u65E2\u5B58\u306E\u30A2\u30EB\u30DF\u30CB\u30A6\u30E0\u56DE\u53CE\u7528\u9014\u306B\u5229\u7528\u3067\u304D\u308B\u72B6\u614B\u3092\u4FDD\u3061\u307E\u3059\u3002"],
    ["\u30B8\u30E3\u30F3\u30AF\u30B7\u30E7\u30F3\u30DC\u30C3\u30AF\u30B9", "/images/pvc-material-junction-box.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u5206\u96E2\u30B8\u30E3\u30F3\u30AF\u30B7\u30E7\u30F3\u30DC\u30C3\u30AF\u30B9", "\u91D1\u5C5E\u30FB\u30D7\u30E9\u30B9\u30C1\u30C3\u30AF\u306E\u56DE\u53CE", "\u81EA\u52D5\u30B8\u30E3\u30F3\u30AF\u30B7\u30E7\u30F3\u30DC\u30C3\u30AF\u30B9\u53D6\u308A\u5916\u3057\u306B\u3088\u308A\u3001\u30D1\u30CD\u30EB\u304C\u4E3B\u5DE5\u7A0B\u306B\u5165\u308B\u524D\u306B\u3053\u306E\u90E8\u54C1\u3092\u5206\u96E2\u3057\u3001\u91D1\u5C5E\u3068\u30D7\u30E9\u30B9\u30C1\u30C3\u30AF\u306E\u5404\u753B\u5206\u3092\u56DE\u53CE\u3067\u304D\u308B\u72B6\u614B\u3092\u4FDD\u3061\u307E\u3059\u3002"],
    ["バックシート", "/images/pvc-material-backsheet.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u5206\u96E2\u30D0\u30C3\u30AF\u30B7\u30FC\u30C8\u6750\u6599", "\u71B1\u53EF\u5851\u6027\u30D7\u30E9\u30B9\u30C1\u30C3\u30AF\u306E\u56DE\u53CE", "\u5E38\u6E29\u3067\u306E\u5C64\u9593\u5265\u96E2\u306B\u3088\u308A\u3001\u71B1\u51E6\u7406\u3084\u5316\u5B66\u51E6\u7406\u3092\u884C\u308F\u305A\u306B\u30D0\u30C3\u30AF\u30B7\u30FC\u30C8\u3092\u72EC\u7ACB\u3057\u305F\u6750\u6599\u6D41\u3068\u3057\u3066\u56DE\u53CE\u3057\u307E\u3059\u3002"],
    ["EVA", "/images/pvc-material-eva.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u5206\u96E2 EVA \u6750\u6599", "PCR EVA \u306E\u88FD\u9020", "EVA \u3092\u30AC\u30E9\u30B9\u3084\u30BB\u30EB\u6750\u6599\u304B\u3089\u5206\u96E2\u3059\u308B\u3053\u3068\u3067\u4EA4\u5DEE\u6C5A\u67D3\u3092\u6E1B\u3089\u3057\u3001PCR EVA \u88FD\u9020\u5411\u3051\u306E\u660E\u78BA\u306A\u6295\u5165\u539F\u6599\u3092\u78BA\u4FDD\u3057\u307E\u3059\u3002\u5229\u7528\u306B\u306F\u4E0B\u6D41\u5DE5\u7A0B\u3067\u306E\u9069\u683C\u6027\u8A55\u4FA1\u304C\u5FC5\u8981\u3067\u3059\u3002"],
    ["\u30BB\u30EB", "/images/pvc-material-cells.webp", "PV Circulator \u30D1\u30F3\u30D5\u30EC\u30C3\u30C8\u63B2\u8F09\u306E\u30AC\u30E9\u30B9\u3092\u542B\u307E\u306A\u3044\u30BB\u30EB\u753B\u5206", "\u30AC\u30E9\u30B9\u3092\u542B\u307E\u306A\u3044\u30B7\u30EA\u30B3\u30F3\u30FB\u9280\u30FB\u91D1\u5C5E\u306E\u56DE\u53CE", "\u5C64\u3054\u3068\u306E\u5206\u96E2\u306B\u3088\u308A\u3001\u7834\u7815\u30AC\u30E9\u30B9\u3092\u6DF7\u5165\u3055\u305B\u305A\u306B\u30BB\u30EB\u753B\u5206\u3092\u6FC3\u7E2E\u3057\u3001\u30B7\u30EA\u30B3\u30F3\u3001\u9280\u3001\u305D\u306E\u4ED6\u306E\u91D1\u5C5E\u56DE\u53CE\u306B\u3088\u308A\u9069\u3057\u305F\u6750\u6599\u6D41\u3092\u4FDD\u6301\u3057\u307E\u3059\u3002"],
] as const;
const materialPathways = [
    { material: "\u9280\uFF0B\u9285", routes: [{ destination: "\u7CBE\u932C\u6240", detail: "\u5206\u96E2\u3057\u305F\u30B7\u30EA\u30B3\u30F3\uFF08\u30BB\u30EB\uFF09\u7C89\u672B\u306F\u3001\u8FFD\u52A0\u306E\u91D1\u5C5E\u56DE\u53CE\u5DE5\u7A0B\u306B\u9001\u3089\u308C\u307E\u3059\u3002" }] },
    { material: "\u30A2\u30EB\u30DF\u30D5\u30EC\u30FC\u30E0", routes: [{ destination: "\u518D\u751F\u30A2\u30EB\u30DF\u30CB\u30A6\u30E0", detail: "" }] },
    { material: "ガラス", routes: [{ destination: "\u30BB\u30E1\u30F3\u30C8\u4EE3\u66FF\u6750", detail: "" }] },
    { material: "シリコン", routes: [
            { destination: "H\u2082\uFF0B\u30B1\u30A4\u9178\u5869", detail: "\u30A2\u30EB\u30AB\u30EA\u51E6\u7406\u306B\u3088\u308A\u3001\u71C3\u6599\u96FB\u6C60\u767A\u96FB\u7528\u306E\u6C34\u7D20\u3068\u30B1\u30A4\u9178\u30CA\u30C8\u30EA\u30A6\u30E0\u3092\u751F\u6210\u3057\u307E\u3059\u3002" },
            { destination: "MG-Si", detail: "\u9178\u51E6\u7406\u306B\u3088\u308A\u91D1\u5C5E\u3092\u5206\u96E2\u3057\u3001\u91D1\u5C5E\u7D1A\u30B7\u30EA\u30B3\u30F3\u3092\u751F\u6210\u3057\u307E\u3059\u3002" },
        ] },
    { material: "EVA\uFF0B\u30D0\u30C3\u30AF\u30B7\u30FC\u30C8", routes: [{ destination: "\u518D\u751F\u30D7\u30E9\u30B9\u30C1\u30C3\u30AF", detail: "EVA \u306F\u8131\u67B6\u6A4B\u3057\u3066\u767A\u6CE1\u9774\u5E95\u306B\u518D\u52A0\u5DE5\u3067\u304D\u3001\u30D0\u30C3\u30AF\u30B7\u30FC\u30C8\u306F\u5C04\u51FA\u6210\u5F62\u54C1\u3084\u62BC\u51FA\u6210\u5F62\u54C1\u306B\u5229\u7528\u3067\u304D\u307E\u3059\u3002" }] },
] as const;
function MaterialsSection({ data }: {
    data: OurSolutionView;
}) {
    const silver = webNum(data, "materials.silver_demand_recovered_percent"), other = webNum(data, "materials.other_demand_recovered_percent"), start = webNum(data, "materials.demand_horizon_start_year"), end = webNum(data, "materials.demand_horizon_end_year"), aluminiumCarbon = webNum(data, "materials.recycled_aluminium_primary_carbon_percent");
    const glassShare = data.productMaterials.find(material => material.name === "Glass")!.share * 100;
    const pathways = materialPathways.map(pathway => pathway.material === "\u30A2\u30EB\u30DF\u30D5\u30EC\u30FC\u30E0" ? { ...pathway, routes: [{ ...pathway.routes[0], detail: `新地金から製造したアルミニウムに比べ、炭素排出量は約 ${compactNumber(aluminiumCarbon)}％です。` }] } : pathway.material === "ガラス" ? { ...pathway, routes: [{ ...pathway.routes[0], detail: `パネル重量の約 ${compactNumber(glassShare)}％を占め、ポゾラン材として利用できるように処理します。` }] } : pathway);
    return <section id="materials" className="pv-screen os-materials-section" aria-labelledby="materials-title">
    <div className="os-materials-overview">
      <h2 id="materials-title">リサイクルの終点が原料の出発点</h2>
      <div className="os-materials-overview-grid">
        <div className="os-materials-demand"><strong><small>約</small><span>{compactNumber(silver)}%</span></strong><h3>の太陽光産業の銀需要を回収材料で供給できる可能性</h3><p>IEA の試算では、回収材料が原料として再利用できる品質であれば、{compactNumber(start)}～{compactNumber(end)}年までにアルミニウム、銅、ガラス、シリコンの需要もそれぞれ {compactNumber(other)}％超を賄える可能性があります。</p><p className="os-materials-citation">出典：<a href="https://www.iea.org/reports/solar-pv-global-supply-chains">{data.websiteData["materials.silver_demand_recovered_percent"].source === "IEA, Solar PV Global Supply Chains (2022)" ? "IEA「太陽光発電の世界サプライチェーン」（2022年）" : data.websiteData["materials.silver_demand_recovered_percent"].source}</a>.</p></div>
        <div className="os-material-pathways" aria-label="回収材料と上流での用途">{pathways.map(({ material, routes }) => <div className={`os-material-pathway${routes.length > 1 ? " is-grouped" : ""}`} key={material}><strong>{material}</strong>{routes.map(({ destination, detail }) => <div className="os-material-route" key={destination}><b>{destination}</b><span>{detail}</span></div>)}</div>)}</div>
      </div>
    </div>
    <aside className="os-materials-scroll" tabIndex={0} aria-label="回収材料流です。スクロールして全六種類の材料をご覧ください。">
      <div className="os-materials-scroll-intro"><h3>{materialOutputs.length}種類の回収材料。<br />産業に戻す{materialOutputs.length}つの経路。</h3><p>PV Circulator は常温でモジュールを層ごとに分離し、下流での回収と適格性評価に向けて独立した材料流を保持します。</p></div>
      {materialOutputs.map(([label, image, imageAlt, route, note]) => <article key={label}><figure><img src={image} alt={imageAlt} loading="lazy"/></figure><div><span>{route}</span><h3>{label}</h3><p>{note}</p></div></article>)}
    </aside>
  </section>;
}
export function OurSolutionJa({ market, equipmentClaims = defaultEquipmentQuantitative.claims, economicsData = economicsView(seededOurSolutionData), routeMetrics = [], breakeven = null, capacityTrend = defaultCapacityTrend, retirementWave = defaultRetirementWave, retirementMarketWaves = defaultRetirementMarketWaves, pressureData = defaultPressureData, waveAssumptions = defaultWaveAssumptions, priceSources = "\u30EF\u30FC\u30AF\u30D6\u30C3\u30AF\u306E\u4FA1\u683C", pricingRules = initialJapanRules, residentialSurchargePct = defaultTransportLimits.residentialSurchargePct, showPublicPricingBenchmark = true }: {
    market?: PublicSolutionMarket;
    equipmentClaims?: EquipmentClaims;
    economicsData?: OurSolutionView;
    routeMetrics?: ImpactRouteMetric[];
    breakeven?: BreakevenView;
    capacityTrend?: CapacityTrendPoint[];
    retirementWave?: RetirementWave;
    retirementMarketWaves?: RetirementMarketWaves;
    pressureData?: {
        year: string;
        values: number[];
    }[];
    waveAssumptions?: WaveAssumptions;
    priceSources?: string;
    pricingRules?: PricingRules;
    residentialSurchargePct?: number;
    showPublicPricingBenchmark?: boolean;
}) {
    const capacityPeak = Math.max(...capacityTrend.map(point => point.total));
    const capacityFirst = capacityTrend[0], capacityLast = capacityTrend[capacityTrend.length - 1];
    const capacityMultiples = trendRegions.map((market, index) => ({ market, multiple: capacityFirst.values[index] > 0 ? capacityLast.values[index] / capacityFirst.values[index] : 0 }));
    const [active, setActive] = useState<SectionId>("overview");
    const [stake, setStake] = useState<StakeTopic>("cost");
    const [audience, setAudience] = useState<AudienceTopic>("owner");
    const activeMarket = market ?? "JP";
  const defaultDemandMarket = solutionDemandMarket(activeMarket);
  const [demandMarket, setDemandMarket] = useState<DemandMarket>(defaultDemandMarket);
  const marketOptions = defaultDemandMarket === "World" ? [{key: "World" as const, label: "世界"}, ...demandMarkets] : demandMarkets;
  const calculatorHref = businessCaseHref("ja-JP", activeMarket);
    useEffect(() => {
        document.documentElement.lang = "ja";
        document.documentElement.classList.add("os-section-scroll");
        const observed = sections.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
        const visibleRatios = new Map<Element, number>();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visibleRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
            const visible = observed.reduce<HTMLElement | null>((current, element) => {
                if (!current)
                    return element;
                return (visibleRatios.get(element) ?? 0) > (visibleRatios.get(current) ?? 0) ? element : current;
            }, null);
            if (visible && (visibleRatios.get(visible) ?? 0) > 0)
                setActive(visible.id as SectionId);
        }, { threshold: [0, 0.35, 0.55, 0.75, 1] });
        observed.forEach((element) => observer.observe(element));
        return () => { observer.disconnect(); document.documentElement.classList.remove("os-section-scroll"); };
    }, []);
    const lightNavigation = ["wave", "stakes", "conventional", "regulation", "materials", "value", "economic", "system", "evidence", "scale", "pathways"].includes(active);
    const selectedStake = stakeSolutions[stake];
    const selectedAudience = audienceTopics[audience];
    const selectedGoal = stake === "circularity" ? `${compactNumber(webNum(economicsData, "stakes.circularity_goal_percent"))}%を再利用可能に。` : selectedStake.goal;
    const cards = systemCardContent(economicsData);
    const demandYears = [2025, 2030, 2040, 2050], lineCapacityMw = webNum(economicsData, "scale.line_capacity_mw_per_year"), demandWave = retirementMarketWaves[demandMarket];
    const demandIndex = demandYears.map(year => demandWave.years.indexOf(year));
    const demand = (loss: "early" | "regular") => demandIndex.map(index => Math.ceil(demandWave[`${loss}_T${waveAssumptions.defaultLifetime}`][index] / waveAssumptions.tonnesPerMw / lineCapacityMw));
    const earlyDemand = demand("early"), regularDemand = demand("regular");
    const demandMarketLabel = marketOptions.find(item => item.key === demandMarket)?.label ?? demandMarket;
    const pressureFirst = pressureData[0], pressureLast = pressureData[pressureData.length - 1];
    const pressureMultiples = pressureLast.values.map((value, index) => pressureFirst.values[index] > 0 ? value / pressureFirst.values[index] : 0);
    const positivePressureMultiples = pressureMultiples.filter(value => value > 0), pressureMultipleLow = Math.round(Math.min(...positivePressureMultiples)), pressureMultipleHigh = Math.round(Math.max(...positivePressureMultiples));
    const highestPressureIndex = pressureLast.values.indexOf(Math.max(...pressureLast.values));
    const waveSlides: DeckSlide[] = [
        { label: "\u5C0E\u5165\u52D5\u5411", navigationLabel: "\u7D2F\u7A4D\u5C0E\u5165\u5BB9\u91CF", visual: <div className="os-data-slide os-market-slide"><h2>{capacityLast.year} 年までに太陽光の累積導入容量が {capacityFirst.totalLabel} から {capacityLast.totalLabel} へ拡大</h2><StackedTrendChart data={capacityTrend} max={capacityPeak} tone="neutral" label="市場別の太陽光累積導入容量、2025 年から 2050 年まで各年を積み上げ棒で表示"/></div>, noteTitle: "\u4ECA\u65E5\u306E\u5C0E\u5165\u5206\u5E03\u304C\u5C06\u6765\u306E\u5EC3\u68C4\u5730\u57DF\u3092\u898F\u5B9A", note: <><p>各年の棒は、将来のはるかに大きな廃棄市場につながる、現在建設中のインフラを表しています。市場構成は、将来どこで回収・処理能力が必要になるかを示します。</p><table className="os-capacity-multiple-table"><caption>累積導入容量の成長、2025–2050</caption><thead><tr><th>市場</th><th>成長</th></tr></thead><tbody>{capacityMultiples.map(({ market, multiple }) => <tr key={market}><td>{waveMarketLabels[market]}</td><td>{multiple.toFixed(1)}×</td></tr>)}</tbody></table></> },
        { label: "\u5EC3\u68C4\u91CF", navigationLabel: "\u5EC3\u68C4\u91CF", visual: <div className="os-data-slide os-wave-global-slide"><h2>2050 年に向けて累増する世界の廃棄の波</h2><GlobalCumulativeRetirementChart waves={retirementMarketWaves} assumptions={waveAssumptions}/></div>, noteTitle: "", note: <CountryRetirementExplorer waves={retirementMarketWaves} assumptions={waveAssumptions}/> },
        { label: "\u4E00\u4EBA\u5F53\u305F\u308A\u51E6\u7406\u8CA0\u8377", navigationLabel: "\u4E00\u4EBA\u5F53\u305F\u308A\u51E6\u7406\u8CA0\u8377", visual: <div className="os-data-slide os-market-slide os-pressure-slide"><h2>2050 年に向けて不均一に上昇する一人当たり処理負荷</h2><PressureTrendChart data={pressureData}/></div>, noteTitle: `2050年の一人当たり処理負荷は2025年の${pressureMultipleLow}～${pressureMultipleHigh}倍に。`, note: <><p>{waveMarketLabels[pressureSeries[highestPressureIndex].label]}の一人当たり処理負荷は {pressureFirst.values[highestPressureIndex].toFixed(1)} kg から {pressureLast.values[highestPressureIndex].toFixed(1)} kg へ約 {Math.round(pressureMultiples[highestPressureIndex])} 倍に増え、モデル対象市場で最も高くなります。地域差を踏まえると、世界全体の推計に加え、各地域で必要な場所に設置できる処理能力を計画することが重要です。このグラフでは全市場に共通の推計条件を用います。人口データ：国連「世界人口推計2022年版」（中位推計）。</p><table className="os-capacity-multiple-table"><caption>一人当たり処理負荷の増加、2025–2050</caption><thead><tr><th>市場</th><th>成長</th></tr></thead><tbody>{pressureSeries.map((series, index) => <tr key={series.label}><td>{waveMarketLabels[series.label]}</td><td>{pressureMultiples[index].toFixed(1)}×</td></tr>)}</tbody></table></> },
    ];
    const pvFacility = economicsSolutions(economicsData).circulator.facilityFootprint;
    const conventionalSlides: DeckSlide[] = [
        { label: "\u30B9\u30DA\u30FC\u30B9\u3068\u6280\u8853", navigationLabel: "\u8A2D\u7F6E\u9762\u7A4D", visual: <FootprintMethodVisual data={economicsData}/>, noteTitle: "\u5C0F\u3055\u306A\u8A2D\u7F6E\u9762\u7A4D\u304C\u30EA\u30B5\u30A4\u30AF\u30EB\u306E\u5834\u6240\u3092\u5909\u9769", note: <><p>PV Circulator はモジュール式で配置可能なため、処理量の変化に応じて現場やその近くに処理能力を設置できます。考え方はシンプルで、パネルではなく機械を移動させます。</p><div className="os-deployment-time"><p><strong>{compactNumber(equipmentClaims.relocationHours)}</strong><span>時間</span></p><small>モジュール式の PV Circulator は、{compactNumber(equipmentClaims.relocationHours)}時間以内に設置または撤去でき、移設が可能です。</small></div></> },
        { label: "\u904B\u55B6\u30B3\u30B9\u30C8\uFF08OPEX\uFF09", navigationLabel: "運営コスト", visual: <OperatingCostMethodVisual economicsData={economicsData}/>, noteTitle: "PV Circulator \u304C\u904B\u55B6\u30B3\u30B9\u30C8\u69CB\u9020\u3092\u5909\u9769", note: <><p>自動化を優先します。搬送、測定、層分離の統合により反復作業を減らし、安定した出力を支えます。この運営シナリオでは、人員、電力、床面積の要件削減により、モデル上のパネル当たりコストが低下します。設備の減価償却費と施設外への輸送費は比較対象外です。</p><p className="os-operating-cost-note">主な運営コストは人件費と施設賃料です。PV Circulator は、1シフト当たり運転・構内物流スタッフ合計 {compactNumber(webNum(economicsData, "methods.circulator.total_staff_per_shift"))} 人を想定しています。</p><FacilityRentArea footprint={pvFacility} locale="ja-JP" /></> },
        { label: "\u4E8C\u6B21\u51E6\u7406\u3068\u6750\u6599", navigationLabel: "二次処理", visual: <MaterialMethodVisual data={economicsData}/>, noteTitle: "\u771F\u306E\u9055\u3044\u306F\u3001\u306A\u304A\u51E6\u7406\u304C\u5FC5\u8981\u306A\u6750\u6599\u306B\u3042\u308A\u307E\u3059\u3002", note: <p>PV Circulator は第一原理から出発します。太陽光パネルは層構造のため、製造工程を逆にたどり、層ごとに分離します。これにより、ガラス、シリコン（セル）粉末、ポリマーをそれぞれ独立した回収物として保持し、二次処理が必要な材料を減らします。</p> },
    ];
    const scaleSlides: DeckSlide[] = [
        { label: "\u4E8B\u696D\u5C55\u958B\u72B6\u6CC1", navigationLabel: "\u5E02\u5834", visual: <div className="os-data-slide os-scale-map-slide"><h2>PV Circulator のグローバル事業化</h2><GlobalDeploymentMap /></div>, noteTitle: "", note: <div className="os-scale-market-list"><article><strong>米国｜導入済み</strong><span>カリフォルニア州 DTSC の許可取得済み</span><p>カリフォルニア州有害物質管理局（DTSC）から、使用済み太陽光パネルの受け入れ、処理、リサイクルの許可を取得しています。R2v3 および ISO 9001/14001/45001 のマネジメントシステムを採用しています。</p></article><article><strong>オーストラリア｜{compactNumber(webNum(economicsData, "scale.australia_launch_year"))}年に展開予定</strong><p>PV Circulator とマテリアル・アップサイクル技術を、下流での利用経路と組み合わせた統合ソリューションです。</p></article><article><strong>日本｜市場開拓中</strong><p>日本の商社と協力し、日本国内で PV Circulator を展開しています。</p></article><article><strong>欧州｜提携を推進中</strong><p>現地パートナーと協力し、PV Circulator を既存の工程に組み込んでいます。</p></article><article><strong>台湾｜{compactNumber(webNum(economicsData, "scale.taiwan_launch_year"))}年末に展開予定</strong><p>苗栗の水素エネルギー区域での導入を計画しており、アルカリ法で回収シリコンを水素に変換し、燃料電池による発電に利用します。</p></article></div> },
        { label: "\u8A2D\u5099\u9700\u8981", navigationLabel: "\u8A2D\u5099\u9700\u8981", visual: <div className="os-data-slide os-scale-demand-slide"><h2>廃棄（退役）量から生まれる設備需要</h2><div className="os-demand-market-tabs" role="group" aria-label="設備需要の対象市場を選択">{marketOptions.map(item => <button type="button" key={item.key} aria-pressed={demandMarket === item.key} onClick={() => setDemandMarket(item.key)}>{item.label}</button>)}</div><EquipmentDemandChart years={demandYears} early={earlyDemand} regular={regularDemand} lineCapacityMw={lineCapacityMw} marketLabel={demandMarketLabel}/><PublishedCapacityGap data={economicsData} market={demandMarket}/></div>, noteTitle: "2030 \u5E74\u4EE5\u964D\u306B\u52A0\u901F\u3059\u308B\u51E6\u7406\u80FD\u529B\u9700\u8981", note: <div className="os-scale-demand-copy"><p>1ラインの年間処理能力を <strong>{lineCapacityMw.toFixed(0)} MW</strong> とすると、{demandMarketLabel}の2050年の年間廃棄量に対応するには、通常廃棄シナリオで {regularDemand.at(-1)?.toLocaleString("ja-JP")} 台、早期廃棄シナリオで {earlyDemand.at(-1)?.toLocaleString("ja-JP")} 台が必要と試算されます。</p><p>これは予測ではなく、シナリオ分析です。設備需要は年間廃棄（退役）重量をモデル上のライン処理能力で割って算出しており、稼働率、地理的条件、停止時間、市場シェアは適用していません。</p></div> },
    ];
    return <div lang="ja" className={`pv-review os-page os-page-ja${lightNavigation ? " pv-light-nav" : ""}`}>
    <a className="pv-skip" href="#overview">ソリューションへスキップ</a><PublicHeader solutionMarket={market} locale="ja-JP" assistantInlineLinks assistantTechnologyAnchor="#first-principles"/>
    <nav className="pv-dots" aria-label="ソリューションの各セクション">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "step" : undefined}><i /><span>{label}</span></a>)}</nav>
    <main>
      <section id="overview" className="pv-screen pv-hero os-hero" aria-labelledby="os-title"><video autoPlay muted loop playsInline poster="/images/pvcirculator-oursolution-poster.jpg"><source src="/videos/pvcirculator-oursolution.mp4" type="video/mp4"/></video><div className="pv-hero-shade"/><div className="pv-hero-copy"><h1 id="os-title">所有者の負担を軽減。<br />リサイクル事業者の利益を向上。<br />材料の循環を維持。</h1><p className="os-legacy-line">発電が終わるとき、太陽光産業の次の課題が始まります。</p><p className="os-hero-context">所有者、リサイクル事業者、投資家にとって、設備の廃止は、コスト、法令遵守、評判、材料価値を一つの意思決定に結び付けます。</p></div><a className="pv-down" href="#wave" aria-label="迫り来る廃棄の波へ進む"><Arrow /></a></section>
      <section id="wave" className="pv-screen os-deck-section" aria-label="迫り来る廃棄の波"><StoryDeck id="wave-deck" title="迫り来る廃棄の波" slides={waveSlides} variant="split" autoAdvanceMs={30000}/></section>
      <section id="stakes" className="pv-screen os-stakes" aria-labelledby="stakes-title">
        <div className="os-stakes-main">
          <h2 id="stakes-title">何が問われているのか</h2>
          <p>所有者、リサイクル事業者、材料利用者、一般の人々は、使用済み太陽光パネルをそれぞれ異なる視点で捉えていますが、必要とする四つのことは共通しています。</p>
          <div className="os-stake-tabs" role="group" aria-label="ステークホルダーの目指す成果を選択">{(Object.keys(stakeSolutions) as StakeTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={stake === topic} onClick={() => setStake(topic)}><StakeIcon topic={topic}/><strong>{stakeSolutions[topic].label}</strong></button>)}</div>
          {stake === "cost" && (market === "JP" ? <JapanFeeBenchmark data={economicsData.websiteData} locale="ja-JP" /> : showPublicPricingBenchmark ? <CostBenchmarkChart data={economicsData} rules={pricingRules} residentialSurchargePct={residentialSurchargePct}/> : <MarketOperatingCostChart data={economicsData} watts={waveAssumptions.panelRating} locale="ja-JP" />)}
          {stake === "compliance" && <div className="os-compliance-risk"><strong className="os-compliance-risk-mark">HFCs</strong><div><h3>含フッ素バックシートの環境流出防止</h3><p>一部の太陽光パネルのバックシートには、PVF または PVDF のフッ素ポリマーが含まれています。広義の定義では、これらは「永遠の化学物質」と呼ばれることもある難分解性化学物質、PFAS に該当します。熱処理ではフッ化水素（HF）やその他の含フッ素分解生成物が発生する可能性があり、埋立では難分解性のフッ素ポリマーが環境中に残ります。PV Circonomy の第一の使命は、EVA とバックシートを別々に回収し、適合性が確認された用途に戻すことです。</p></div></div>}
          {stake === "circularity" && <div className="os-compliance-risk os-offtake-service"><strong className="os-circularity-mark"><b>{compactNumber(webNum(economicsData, "stakes.circularity_goal_percent"))}%</b><span>再利用可能</span></strong><div><h3>市場ごとに開拓する次の用途</h3><p>PV Circonomy は、リサイクル技術に加え、マテリアル・アップサイクル技術とオフテイクサービスも提供します。各国・地域の産業エコシステムに合わせた現地化戦略により、回収材料を発生地の近くで継続利用します。EVA とバックシートのオフテイクは、分離した材料を、適合性が確認された地域内または下流の用途につなぎ、すべての回収材料の責任ある利用を可能にします。</p><span><b>回収材料の引き取り支援</b> EVA とバックシートの適合性を確認し、下流の利用先につなぎます。</span></div></div>}
          {stake === "reputation" && <div className="os-compliance-risk os-connected-service"><strong className="os-connected-mark">つながり</strong><div><h3>リサイクルそのものに価値を</h3><p>PV Circonomy は上流と下流のパートナーをつなぎ、リサイクル事業者が投資家に回収材料の行き先を責任を持って説明し、材料利用者が消費者にその出所を開示できるようにします。行き先と出所の両方を可視化することで、リサイクルの取り組みそのものに価値が生まれます。</p></div></div>}
          <div key={stake} className="os-stakeholder-needs" aria-live="polite"><strong>関係者別の視点（{selectedStake.label}）</strong>{selectedStake.stakeholders.map(([stakeholder, need]) => <div key={stakeholder}><span>{stakeholder}</span><p>{need}</p></div>)}</div>
        </div>
        <aside className="os-speaker-notes" aria-live="polite"><div key={stake}><span className="os-note-label">{selectedStake.label}</span><h3>{selectedStake.heading}</h3><div className="os-note-copy"><p>{selectedStake.intro}</p></div><p className="os-stake-goal"><strong>私たちの目標</strong><span>{selectedGoal}</span></p><div className="os-solution-drivers">{selectedStake.drivers.map(([driver, outcome]) => <div key={driver}><strong>{driver}</strong><p>{outcome}</p></div>)}</div><div className="os-stakes-bridge"><strong> {activeMarket !== "US" && stake === "cost" ? `収益性のセクションで${marketNames["ja-JP"][activeMarket]}の運営条件による試算をご覧ください。` : selectedStake.conclusion}</strong><small>{selectedStake.note}</small><a className="pv-text-button" href="#conventional">従来の方法の限界を見る <Arrow /></a></div></div></aside>
      </section>
      <section id="system" className="pv-screen os-system" aria-labelledby="system-title"><div className="os-system-stage"><div className="os-system-heading"><h2 id="system-title">ソリューション</h2><p>一つの循環システムで、コスト削減、証明可能な法令遵守、材料循環、根拠のある評判という四つの共通ニーズに応えます。</p></div><div className="os-system-flow" role="list" aria-label="PV Circonomy の循環価値システム">{(Object.keys(systemTopics) as SystemTopic[]).map((topic) => <article key={topic} role="listitem"><figure><img src={systemVisuals[topic].src} alt={systemVisuals[topic].alt}/></figure><div className="os-system-card-copy"><div><strong>{systemTopics[topic][0]}</strong><span> | {cards[topic].tagline}</span></div><ul>{cards[topic].bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div></article>)}</div></div></section>
      <ProcessPlaylist infeedPanelsPerPallet={equipmentClaims.infeedPanelsPerPallet} locale="ja-JP" active={active === "first-principles"} sectionId="first-principles" titleId="first-principles-title" heading={<>シンプルな原理。<br />層ごとに。<br />材料ごとに。</>}/>
      <section id="conventional" className="pv-screen os-deck-section" aria-label="従来のリサイクルが価値を損なう理由"><StoryDeck id="conventional-deck" title="従来のリサイクルが価値を損なう理由" slides={conventionalSlides} variant="split" autoAdvanceMs={30000}/></section>
      <RegulationSection metrics={routeMetrics} assumptions={waveAssumptions} data={economicsData} locale="ja-JP"/>
      <MaterialsSection data={economicsData}/>
      <ValueSection economicsData={economicsData}/>
      <EconomicSection calculatorHref={calculatorHref} economicsData={economicsData} breakeven={breakeven} priceSources={priceSources} locale="ja-JP"/>
      <section id="evidence" className="pv-screen os-evidence-section os-passport-section" aria-labelledby="evidence-title"><div className="os-evidence-list os-passport-main"><div><h2 id="evidence-title">すべての太陽光パネルに記録を：<br /><span>出所、処理工程、行き先。</span></h2><p className="os-passport-intro">リサイクルコストの削減と材料価値の向上は、始まりにすぎません。検証可能な記録によって、リサイクルという行為そのものに価値が生まれます。</p></div><div className="os-passport-flow" role="list" aria-label="太陽光パネルのリサイクル記録を構成する三つの要素"><article role="listitem"><strong>出所</strong><p>設置場所、所有者、数量、モジュール識別情報です。</p></article><article role="listitem"><strong>処理工程</strong><p>処理経路、エネルギー使用量、回収結果です。</p></article><article role="listitem"><strong>行き先</strong><p>各材料の引き取り先と次の用途です。</p></article></div><div className="os-passport-value"><p><strong>所有者</strong> は、ESG、拡大生産者責任（EPR）、デジタル製品パスポートに活用できる、監査対応データを受け取れます。</p><p><strong>材料購入者</strong> は、追跡可能な出所、組成、用途のデータを受け取れます。</p></div></div><aside className="os-speaker-notes"><div><h3>実際の作業から検証可能な記録へ</h3><div className="os-note-copy"><p>EasyCycle は設備側で記録を作成し、ネットワーク全体に配信することで、大規模な検証を効率化します。</p></div><div className="os-passport-tech"><div><strong>設備側で記録を生成</strong><p>センサーとエッジコンピューティングが設備の稼働中に処理記録を自動生成し、手入力への依存を減らします。</p></div><div><strong>データの完全性を保護</strong><p>暗号学的ハッシュ、信頼できるタイムスタンプ、IPFS により、改ざんを検知できる一連の記録を作成します。</p></div><div><strong>設備とともにストレージを拡張</strong><p>各 PV Circulator が分散型エッジノードとして機能し、ネットワークの成長に伴ってストレージ容量を提供します。</p></div><div><strong>大規模でも効率的に検証</strong><p>分散型の容量はノードごとに拡張され、マークルツリーによる一括証明が各記録の検証にかかる追加コストを削減します。</p></div><div><strong>必要な情報だけを開示</strong><p>オントロジーとロールベースのアクセス制御により、元データと商業情報を保護しながら記録を結び付けます。</p></div></div></div><Link className="pv-text-button" href="/ja/easycycle/">EasyCycle を詳しく見る <Arrow /></Link></aside></section>
      <section id="scale" className="pv-screen os-deck-section" aria-label="技術から商業規模へ"><StoryDeck id="scale-deck" title="技術から商業規模へ" slides={scaleSlides} variant="split" autoAdvanceMs={30000}/></section>
      <section id="pathways" className="pv-screen os-audience" aria-labelledby="audience-title"><div className="os-audience-heading"><h2 id="audience-title">太陽光の循環経済における役割を選び、行動へ</h2><div className="os-audience-tabs" role="group" aria-label="役割を選択">{(Object.keys(audienceTopics) as AudienceTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={audience === topic} onClick={() => setAudience(topic)}>{audienceTopics[topic][0]}</button>)}</div></div><div className="os-audience-detail" aria-live="polite"><span>{selectedAudience[0]}</span><h3>{selectedAudience[1]}</h3><p>{selectedAudience[4]}</p><div className="os-audience-actions">{(audience !== "owner" || activeMarket === "US") && <Link className="pv-button" href={audience === "recycler" ? localizedPublicPath("ja-JP", "/pv-circulator/") + `?market=${activeMarket}` : selectedAudience[3]}>{selectedAudience[2]} <Arrow /></Link>}{audience === "recycler" && calculatorHref && <a className="pv-text-button" href={calculatorHref}>事業収支を試算する <Arrow /></a>}</div></div><footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span><span>PV Circulator · 材料のアップサイクル · EasyCycle</span><a className="pv-text-button" href="#overview">ページの先頭へ</a></footer></section>
    </main>
  </div>;
}
