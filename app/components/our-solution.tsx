"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { PublicHeader } from "./public-header";
import { ProcessPlaylist } from "./pv-circulator-page";
import { capacityTrend as buildCapacityTrend, usCumulativeMw, type CapacityTrendPoint } from "../../lib/market-capacity";
import type { RetirementWave } from "../../lib/us-retirement-wave";
import { seededOurSolutionData, economicsView } from "../../lib/our-solution-data";
import { model } from "../../lib/our-solution/model";

import type { RouteEnvironmentalMetric } from "../../lib/route-comparison";

import type { EconomicsView } from "../../lib/our-solution-data";
import { websiteNumber } from "../../lib/our-solution/public-data";
import { initialRules, tierRate, type PricingRules } from "../../lib/pricing-rules";
import { defaultTransportLimits } from "../../lib/pickup";
import "./review-home.css";

export type BreakevenView = { region: string; feeUnit: string; currency: string; panelsPerMonth: number; panelWeightLb: number; source: string; fees: { code: string; breakevenFee: number | null }[] } | null;
const webNum=(data:OurSolutionView,key:string)=>websiteNumber(data.websiteData,key);
const compactNumber=(value:number)=>Number.isInteger(value)?String(value):value.toLocaleString("en-US",{maximumFractionDigits:2});

// Only fields used by the public story cross the server/client boundary.
export type OurSolutionView = EconomicsView;
type WaveAssumptions = { defaultLifetime:25|18|15|12;loss:"early"|"regular";shapes:{early:number;regular:number};panelWeightLb:number;panelRating:number;tonnesPerMw:number };
const defaultModel=model(seededOurSolutionData);
const defaultWaveAssumptions:WaveAssumptions={defaultLifetime:defaultModel.defaultLifetime as 25|18|15|12,loss:defaultModel.loss,shapes:defaultModel.shapes,panelWeightLb:seededOurSolutionData.scenario.panel_weight_lb,panelRating:Number(seededOurSolutionData.assumptions[10]["Panel rating"][0]),tonnesPerMw:defaultModel.kgPerMw/1000};

const sections = [
  ["overview", "Overview"],
  ["wave", "Wave"],
  ["stakes", "Stakes"],
  ["system", "Solution"],
  ["first-principles", "Principle"],
  ["conventional", "Methods"],
  ["regulation", "Impact"],
  ["materials", "Materials"],
  ["value", "Value"],
  ["economic", "Economic"],
  ["evidence", "Passport"],
  ["scale", "Scale"],
  ["pathways", "Action"],
] as const;

type SectionId = (typeof sections)[number][0];
type DeckSlide = { label: string; navigationLabel?: string; visual: ReactNode; noteTitle: string; note: ReactNode };

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d={direction === "right" ? "M3 9h11M10 5l4 4-4 4" : "M15 9H4m4-4L4 9l4 4"} stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function CostBenchmarkChart({data,rules,residentialSurchargePct}:{data:OurSolutionView;rules:PricingRules;residentialSurchargePct:number}) {
  const watts=webNum(data,"stakes.cost.reference_panel_watts"),panelsPerMw=1e6/watts,weightLb=data.scenario.panelWeightLb;
  const truckRate=tierRate(watts,"panel",{},rules)?.rate??0,utilityRate=tierRate(watts,"lb",{},rules)?.rate??0;
  const residential=truckRate*(1+residentialSurchargePct/100)*panelsPerMw,utility=utilityRate*weightLb*panelsPerMw;
  const landfillLow=webNum(data,"stakes.cost.nrel_landfill_low_usd_per_panel")*panelsPerMw,landfillHigh=webNum(data,"stakes.cost.nrel_landfill_high_usd_per_panel")*panelsPerMw;
  const {conventional,hotKnife}=economicsSolutions(data),pvCirconomy=(residential+utility)/2,landfill=(landfillLow+landfillHigh)/2;
  const shredding=conventional.opexPerPanel.total*panelsPerMw,thermal=hotKnife.opexPerPanel.total*panelsPerMw;
  const bars=[
    {label:"Landfill",value:landfill,className:"is-landfill"},
    {label:"PV Circonomy",value:pvCirconomy,className:"is-pv-circonomy"},
    {label:"Shredding",value:shredding,className:"is-shredding"},
    {label:"Thermal processing",value:thermal,className:"is-thermal"},
  ];
  const max=Math.max(...bars.map(bar=>bar.value))*1.16,money=(value:number)=>`$${Math.round(value).toLocaleString("en-US")}`,percentage=(value:number)=>`${value/max*100}%`;
  return <figure className="os-cost-benchmark">
    <figcaption><strong>Recycling Cost per MW</strong><span>{compactNumber(watts)} W modules · current Residential / Utility-scale pricing and modeled OPEX</span></figcaption>
    <div className="os-cost-plot" role="img" aria-label={`Cost per megawatt: Landfill midpoint ${money(landfill)}, PV Circonomy current Residential and Utility-scale average ${money(pvCirconomy)}, Shredding ${money(shredding)}, Thermal processing ${money(thermal)}.`}>
      <div className="os-cost-columns">{bars.map(bar=><div className={`os-cost-column ${bar.className}`} style={{"--bar":percentage(bar.value)} as CSSProperties} key={bar.label}><strong>{money(bar.value)}</strong><i aria-hidden="true"/><span>{bar.label}</span></div>)}</div>
    </div>
    <small>PV Circonomy = mean of current Residential and Utility-scale processing prices. Landfill = midpoint of the NREL range. Shredding and Thermal processing = modeled California OPEX. Transport, taxes, CAPEX and depreciation are excluded; NREL estimates also exclude transport.</small>
  </figure>;
}

function GlobalDeploymentMap() {
  const markets = [
    { name: "USA", left: "20.5%", top: "38%" },
    { name: "Australia", left: "84%", top: "70.5%" },
    { name: "Japan", left: "89.5%", top: "34%" },
    { name: "Europe", left: "52.5%", top: "31.5%" },
    { name: "Taiwan", left: "86.5%", top: "45%" },
  ];
  return <div className="os-global-map" role="img" aria-label="World map marking PV Circulator commercialization in the United States, Australia, Japan, Europe and Taiwan">
    <img src="/images/world-map-low.svg" alt="" aria-hidden="true" />
    {markets.map((market, index) => <span className="os-map-market" key={market.name} style={{ left: market.left, top: market.top }}><i>{index + 1}</i><b>{market.name}</b></span>)}
  </div>;
}

function StoryDeck({ id, title, slides, variant, autoAdvanceMs }: { id: string; title: string; slides: DeckSlide[]; variant: "split" | "band"; autoAdvanceMs?: number }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const deckRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const slide = slides[current];
  function move(direction: -1 | 1) { setCurrent((value) => Math.min(slides.length - 1, Math.max(0, value + direction))); }
  useEffect(() => {
    if (!autoAdvanceMs || !deckRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.45 });
    observer.observe(deckRef.current);
    return () => observer.disconnect();
  }, [autoAdvanceMs]);
  useEffect(() => {
    if (!autoAdvanceMs || isPaused || !isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") setCurrent((value) => (value + 1) % slides.length);
    }, autoAdvanceMs);
    return () => window.clearTimeout(timer);
  }, [autoAdvanceMs, current, isPaused, isVisible, slides.length]);
  return <div ref={deckRef} id={id} className={`os-story-deck os-story-${variant} os-deck-${id}${autoAdvanceMs ? " is-auto" : ""}${autoAdvanceMs && (isPaused || !isVisible) ? " is-paused" : ""}`} style={autoAdvanceMs ? ({ "--deck-duration": `${autoAdvanceMs}ms` } as CSSProperties) : undefined} role="region" aria-label={title} tabIndex={0}
    onFocusCapture={() => setIsPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }}
    onKeyDown={(event) => { if ((event.target as HTMLElement).closest("select, input, textarea")) return; if (event.key === "ArrowLeft") move(-1); if (event.key === "ArrowRight") move(1); }}
    onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 55) move(distance < 0 ? 1 : -1); touchStart.current = null; }}>
    <div className="os-slide-stage" aria-live="polite"><div key={`${id}-${current}`} className="os-slide-frame">{slide.visual}</div>{slides.length > 1 && <div className="os-slide-counter" aria-hidden="true">{String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</div>}</div>
    <aside className="os-speaker-notes" aria-label="Slide context"><div>{variant === "split" && slide.noteTitle && <h3>{slide.noteTitle}</h3>}<div className="os-note-copy">{slide.note}</div></div>{slides.length > 1 && <div className="os-deck-navigation" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}><div className="os-deck-progress" aria-label="Choose a slide">{slides.map((item, index) => <button key={item.label} type="button" aria-label={`Show slide ${index + 1}: ${item.label}`} aria-pressed={current === index} onClick={() => setCurrent(index)}><span />{item.navigationLabel && <small>{item.navigationLabel}</small>}</button>)}</div></div>}</aside>
  </div>;
}

const stakeSolutions = {
  cost: {
    label: "Cost",
    heading: "Recycling must make money—even without processing fees",
    summary: "Lower cost. Higher recovered value.",
    stakeholders: [
      ["Upstream owners", "Lower recycling cost and more value returned."],
      ["Recyclers", "Lower CAPEX and OPEX; higher material revenue."],
      ["Downstream users", "Recovered inputs priced below virgin material."],
      ["Public", "Lower system-wide waste and environmental cost."],
      ["PV Circonomy", "A profitable model that can scale responsible recycling."],
    ],
    intro: "PV Circonomy lowers total recycling cost by cutting unnecessary processing steps and keeping the value of recovered materials in the system.",
    goal: "Same price as landfill.",
    drivers: [
      ["Remove avoidable treatment", "Use room-temperature physical processing to avoid chemical, thermal and water-treatment burdens."],
      ["Automate repeatable work", "Use AI-assisted automation so one operator can run a consistent process."],
      ["Protect material value", "Separate layer by layer so clean streams can be sold or upcycled instead of disposed."],
      ["Deploy capacity closer", "Use a compact modular footprint to reduce facility and logistics burden through on-site or near-site processing."],
      ["Share recovered value", "Use material revenue to offset processing cost and improve economics for owners and recyclers."],
    ],
    conclusion: "In our California business-case scenario, the lowest-impact process also delivers the highest operating profit.",
    note: "Environmental performance becomes operating advantage.",
  },
  compliance: {
    label: "Compliance",
    heading: "Do not create another problem that requires treatment",
    summary: "Provable treatment and handoffs.",
    stakeholders: [
      ["Upstream owners", "Proof of responsible treatment and final destination."],
      ["Recyclers", "A repeatable process with less reporting burden."],
      ["Downstream user", "Qualified inputs with traceable origin."],
      ["Public", "Accountability across the full chain of custody."],
      ["PV Circonomy", "Evidence that supports EPR, ESG, DPP and customer reporting."],
    ],
    intro: "PV Circonomy makes compliance part of the operating flow, connecting each panel, process step and material destination.",
    goal: "Toward zero pollution.",
    drivers: [
      ["Define required evidence", "Start with the records owners, regulators and material buyers need to receive."],
      ["Capture at intake", "Link source, condition, quantity and batch identity before treatment begins."],
      ["Record the process", "Document the treatment path and reconcile inputs with separated outputs."],
      ["Track every handoff", "Connect each output to its receiver, specification and intended next use."],
      ["Deliver one usable record", "Use EasyCycle to organize evidence for reporting, audit and due diligence."],
    ],
    conclusion: "Compliance becomes proof of responsible treatment, not paperwork added after the fact.",
    note: "What happened, where materials went and who received them remain visible.",
  },
  circularity: {
    label: "Circularity",
    heading: "Return materials to industry—not the environment",
    summary: "Keep every material useful.",
    stakeholders: [
      ["Upstream owners", "Materials retained as assets, not disposal liability."],
      ["Recyclers", "Clean output streams with higher market value."],
      ["Downstream user", "Reliable alternatives to virgin materials."],
      ["Public", "More resources kept in use and less sent to landfill."],
      ["PV Circonomy", "A closed-loop market that supports the energy transition."],
    ],
    intro: "PV Circonomy designs recovery around the next use of each material—not only the percentage leaving the machine.",
    goal: "100% reusable.",
    drivers: [
      ["Design from the next use", "Begin with downstream specifications and work backward to the required output."],
      ["Keep materials distinct", "Use layer-by-layer separation to prevent valuable fractions from becoming mixed waste."],
      ["Qualify each stream", "Define composition, quality and preparation requirements for material buyers."],
      ["Build upcycling routes", "Connect glass, silicon, polymers and metals to applications that displace virgin resources."],
      ["Return market feedback", "Use downstream performance to improve separation and output quality over time."],
    ],
    conclusion: "Separated materials are assets; mixed materials become waste.",
    note: "Recovery measures what leaves the process. Circularity measures what returns to use.",
  },
  reputation: {
    label: "Reputation",
    heading: "Make outcomes visible and verifiable",
    summary: "Visible, defensible outcomes.",
    stakeholders: [
      ["Upstream owners", "Defensible stewardship outcomes."],
      ["Recyclers", "Credible and consistent delivery."],
      ["Downstream user", "Responsible sourcing claims consumers can trust."],
      ["Public", "Confidence in solar end-of-life management."],
      ["PV Circonomy", "Trust built through transparent, verifiable results."],
    ],
    intro: "Trust comes from evidence: responsible end-of-life outcomes must be visible, independently verifiable and ready for stakeholder reporting.",
    goal: "Proof, not paperwork.",
    drivers: [
      ["Measure before claiming", "Capture recovery, energy and carbon data before making environmental claims."],
      ["Verify independently", "Use third-party validation for recovery performance and material quality."],
      ["Prevent secondary harm", "Avoid chemicals, heat and water so recycling does not create a new pollution problem."],
      ["Name the next use", "Show what recovered materials become and quantify the impact they avoid."],
      ["Give everyone one record", "Use EasyCycle to preserve source, process and destination data for stakeholders and ESG reporting."],
    ],
    conclusion: "Reputation becomes a defensible result—not an unsupported claim.",
    note: "Transparent evidence turns responsible end-of-life management into lasting trust.",
  },
} as const;
type StakeTopic = keyof typeof stakeSolutions;

function StakeIcon({ topic }: { topic: StakeTopic }) {
  const paths = {
    cost: <><path d="M5 7h9M5 12h14M5 17h7" /><path d="m15 15 3 3 4-6" /></>,
    compliance: <><path d="M7 3h8l4 4v14H7z" /><path d="M15 3v5h4M10 14l2 2 4-5" /></>,
    circularity: <><path d="M8 5a8 8 0 0 1 11 3l1-4M20 8h-4" /><path d="M18 19a8 8 0 0 1-11-3l-1 4M6 16h4" /></>,
    reputation: <><path d="M12 3 20 6v6c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  } as const;
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[topic]}</g></svg>;
}

const systemTopics = {
  process: ["PV Circulator", "Separates retired panels into distinct material streams at lower cost and with less environmental impact—turning recovered material into an asset while reducing the cost of recycling."],
  upcycle: ["Material Upcycling", "Moves glass, silicon, polymers and metals into higher-value applications, helping recycling generate revenue."],
  trace: ["EasyCycle", "Connects material origin, treatment, recovery results and final destination in a verifiable record—giving owners added value and a stronger reason to recycle."],
} as const;
type SystemTopic = keyof typeof systemTopics;
const systemVisuals: Record<SystemTopic, { src: string; alt: string }> = {
  process: { src: "/images/system-pv-circulator-hd.png", alt: "PV Circulator automated recycling equipment with AI and CES Innovation Awards recognition" },
  upcycle: { src: "/images/system-upcycling-hd.png", alt: "Material Upcycling loop from PV Circulator through hydrogen to fuel-cell power" },
  trace: { src: "/images/system-easycycle-hd.png", alt: "EasyCycle digital recycling passport and secure blockchain record" },
};
const staticSystemCardContent: Record<SystemTopic, { tagline: string; bullets: readonly string[] }> = {
  process: {
    tagline: "Clean × Compliant × Low-carbon",
    bullets: [
      "No chemicals, no heat, no process water; no secondary pollution",
      "Product recovery, throughput and energy use are published from the Solution master data",
      "Modular design for on-site and near-site deployment",
    ],
  },
  upcycle: {
    tagline: "From liability to asset",
    bullets: [
      "Glass → pozzolan, reducing cement use in concrete",
      "EVA → PCR plastic for footwear and yoga mats",
      "Silicon → hydrogen for energy and storage; silicates support carbon sequestration",
    ],
  },
  trace: {
    tagline: "Traceable, trusted, monetizable",
    bullets: [
      "Traceability of source, treatment method and end-use pathway",
      "Supports ESG, EPR and digital product passport (DPP) reporting",
      "Data for material markets, trading, funding tools and finance",
    ],
  },
};

function systemCardContent(data:OurSolutionView):Record<SystemTopic,{tagline:string;bullets:readonly string[]}>{
  const recovery=webNum(data,"methods.circulator.product_recovery_percent"),throughput=webNum(data,"methods.circulator.throughput_panels_per_hour")/60,energy=webNum(data,"methods.circulator.energy_max_kwh_per_panel");
  return {...staticSystemCardContent,process:{...staticSystemCardContent.process,bullets:[
    staticSystemCardContent.process.bullets[0],
    `${recovery>99?">":""}${compactNumber(recovery)}% recovery, ${compactNumber(throughput)} panel/min throughput, ${energy<1?"<1":compactNumber(energy)} kWh/panel`,
    staticSystemCardContent.process.bullets[2],
  ]}};
}

const audienceTopics = {
  owner: ["Owner / EPC / Contractor", "Retire panels at lower cost, with records you can prove.", "Prepare a project estimate", "/#pricing", "Plan quantity, condition, logistics and reporting requirements."],
  recycler: ["Recycler", "Add capacity. Preserve material value.", "Evaluate PV Circulator", "/pv-circulator/", "Review feedstock, configuration, output quality, deployment and partnership options."],
  investor: ["Investor / Strategic partner", "Help build the infrastructure behind circular solar.", "Discuss market expansion", "/contact/?interest=investment", "Review market timing, technology evidence, commercial milestones and the potential revenue model."],
} as const;
type AudienceTopic = keyof typeof audienceTopics;

const trendRegions = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;
type TrendPoint = { year: string; total: number; totalLabel: string; values: readonly number[] };

// Defaults for callers without published data; /solutions passes values computed from the published Capacity History parameters.
const seededCapacityRows = seededOurSolutionData;
const defaultCapacityTrend: CapacityTrendPoint[] = buildCapacityTrend(seededCapacityRows);
const defaultRetirementWave: RetirementWave = defaultModel.retirementWave;
const retirementStackMarkets = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;
const retirementMarkets = ["United States", "Japan", "Europe", "Australia"] as const;
type RetirementStackMarket = (typeof retirementStackMarkets)[number];
type RetirementMarket = (typeof retirementMarkets)[number];
type RetirementMarketWaves = Record<RetirementStackMarket | "World", RetirementWave>;
type DemandMarket = "United States" | "Europe" | "Japan" | "Australia" | "Taiwan";
const demandMarkets: { key: DemandMarket; label: string }[] = [
  { key: "United States", label: "US" },
  { key: "Europe", label: "Europe" },
  { key: "Japan", label: "Japan" },
  { key: "Australia", label: "Australia" },
  { key: "Taiwan", label: "Taiwan" },
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

const defaultPressureData=Object.keys(defaultModel.perCapitaKg.World).map(year=>({year,values:pressureSeries.map(s=>defaultModel.perCapitaKg[s.label][Number(year)])}));

function PressureTrendChart({ data: pressureTrendData = defaultPressureData }: {data?:{year:string;values:number[]}[]}) {
  const breakAt=20,lowerRangeShare=70;
  const ceiling=Math.max(30,Math.ceil(Math.max(...pressureTrendData.flatMap(p=>p.values))/10)*10);
  const compressedMidpoint=(breakAt+ceiling)/2;
  const pressureTicks=[
    {value:0,position:0},
    {value:breakAt/2,position:lowerRangeShare/2},
    {value:breakAt,position:lowerRangeShare},
    {value:compressedMidpoint,position:lowerRangeShare+(100-lowerRangeShare)/2},
    {value:ceiling,position:100},
  ];
  const pressureHeight=(value:number)=>value<=breakAt
    ? value/breakAt*lowerRangeShare
    : lowerRangeShare+(value-breakAt)/(ceiling-breakAt)*(100-lowerRangeShare);
  return <div className="os-pressure-trend" role="img" aria-label="Annual retired-solar-panel processing pressure per person from 2025 to 2050 for the world, Europe, United States, Japan, Taiwan, China and Australia, based on our projection. ">
    <div className="os-pressure-plot">
      <div className="os-pressure-axis" aria-hidden="true">{pressureTicks.map((tick) => <span className={tick.value === 20 ? "is-break-tick" : undefined} key={tick.value} style={{ bottom: `${tick.position}%` }}>{tick.value}</span>)}</div>
      <div className="os-pressure-canvas">
        <div className="os-pressure-guides" aria-hidden="true">{pressureTicks.map((tick) => <i key={tick.value} style={{ bottom: `${tick.position}%` }} />)}</div>
        <div className="os-pressure-groups">{pressureTrendData.map((point) => <div className="os-pressure-group" key={point.year}>{pressureSeries.map((series, index) => { const pressure = point.values[index]; return <i className={series.className} style={{ height: `${Math.max(1.5, pressureHeight(pressure))}%` }} title={`${series.label}, ${point.year}: ${pressure.toFixed(1)} kg/person`} key={series.label} />; })}<small>{point.year}</small></div>)}</div>
        <div className="os-pressure-break" aria-hidden="true"><span>{breakAt}–{ceiling} compressed</span></div>
      </div>
    </div>
    <div className="os-pressure-legend" aria-hidden="true">{pressureSeries.map((series) => <span key={series.label}><i className={series.className} />{series.label}</span>)}</div>
  </div>;
}

function StackedTrendChart({ data, max, label, tone }: { data: TrendPoint[]; max: number; label: string; tone: "neutral" | "negative" }) {
  const [highlightedRegion, setHighlightedRegion] = useState<number | null>(null);
  const ceiling=Math.max(5000,Math.ceil(max/5000)*5000);
  const yTicks=Array.from({length:ceiling/5000+1},(_,index)=>index*5000);
  const width=900,height=600,left=66,right=18,top=34,bottom=54,plotWidth=width-left-right,plotHeight=height-top-bottom;
  const barWidth=plotWidth/data.length;
  const x=(index:number)=>left+(index+.5)*barWidth,y=(value:number)=>top+(1-value/ceiling)*plotHeight;
  const majorPoints=data.map((point,index)=>({point,index})).filter(({point})=>Number(point.year)%5===0);
  return <figure className={`os-stacked-chart is-${tone}${highlightedRegion === null ? "" : " has-highlight"}`} aria-label={label}>
    <figcaption>Cumulative installed solar capacity · global projection</figcaption>
    <svg className="os-stacked-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
      <g className="os-stacked-grid" aria-hidden="true">{yTicks.map(tick=><g key={tick}><line x1={left} x2={width-right} y1={y(tick)} y2={y(tick)}/><text x={left-12} y={y(tick)+4} textAnchor="end">{tick===0?"0":`${tick/1000} TW`}</text></g>)}</g>
      <g className="os-stacked-svg-bars">{data.map((point,index)=>{let running=0;return <g key={point.year}><title>{point.year}: {point.totalLabel}</title>{point.values.map((value,regionIndex)=>{const bottomValue=running;running+=value;return <rect className={`is-region-${regionIndex+1}${highlightedRegion===regionIndex?" is-highlighted":""}`} key={`${point.year}-${trendRegions[regionIndex]}`} x={left+index*barWidth} y={y(running)} width={barWidth} height={y(bottomValue)-y(running)}/>})}</g>})}</g>
      <g className="os-stacked-totals" aria-hidden="true">{majorPoints.map(({point,index})=><text key={point.year} x={x(index)} y={y(point.total)-9} textAnchor="middle">{point.totalLabel}</text>)}</g>
      <g className="os-stacked-years" aria-hidden="true">{majorPoints.map(({point,index})=><text key={point.year} x={x(index)} y={height-18} textAnchor="middle">{point.year}</text>)}</g>
      <text className="os-stacked-unit" x="0" y="12">terawatts (TW)</text>
    </svg>
    <div className="os-stacked-legend" aria-label="Highlight a market" onMouseLeave={() => setHighlightedRegion(null)}>{trendRegions.map((region, index) => <button type="button" key={region} aria-pressed={highlightedRegion === index} onMouseEnter={() => setHighlightedRegion(index)} onFocus={() => setHighlightedRegion(index)} onBlur={() => setHighlightedRegion(null)} onClick={() => setHighlightedRegion(index)}><i className={`is-region-${index + 1}`} aria-hidden="true" /><span>{region}</span></button>)}</div>
  </figure>;
}

function GlobalCumulativeRetirementChart({ waves, assumptions }: { waves: RetirementMarketWaves; assumptions:WaveAssumptions }) {
  const cumulative = retirementStackMarkets.map(() => 0);
  let cumulativeWorld = 0;
  const seriesKey=`${assumptions.loss}_T${assumptions.defaultLifetime}` as RetirementSeriesKey;
  const data = waves.World.years.flatMap((year, waveIndex) => {
    if (year < 2025) return [];
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
    <figcaption>Cumulative retired-panel mass · global projection</figcaption>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Projected global cumulative retired-panel mass by market reaches ${last.total.toFixed(0)} million tonnes from 2025 through 2050.`}>
      <g className="os-wave-grid" aria-hidden="true">{yTicks.map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} /><text x={left - 12} y={y(tick) + 4} textAnchor="end">{tick.toFixed(0)}</text></g>)}</g>
      <g className="os-wave-bars">{data.map((point, index) => { let running = 0; return <g key={point.year}><title>{point.year}: {point.total.toFixed(1)} million tonnes</title>{point.values.map((value, marketIndex) => { const bottomValue = running; running += value; return <rect className={`is-region-${marketIndex + 1}`} key={retirementStackMarkets[marketIndex]} x={left + index / data.length * plotWidth + barGap / 2} y={y(running)} width={barWidth} height={y(bottomValue) - y(running)} />; })}</g>; })}</g>
      <g className="os-wave-years" aria-hidden="true">{majorYears.map((point) => <text key={point.year} x={x(data.indexOf(point))} y={height - 18} textAnchor="middle">{point.year}</text>)}</g>
      <g className="os-wave-endpoint" transform={`translate(${x(data.length - 1)} ${y(last.total)})`}><circle r="6" /><text x="-12" y="-14" textAnchor="end">{last.total.toFixed(0)}m t</text></g>
      <text className="os-wave-unit" x="0" y="12">million tonnes</text>
    </svg>
    <div className="os-wave-stack-legend" aria-label="Markets in the cumulative retirement bars">{retirementStackMarkets.map((market, index) => <span key={market}><i className={`is-region-${index + 1}`} />{market}</span>)}</div>
    <small>Basis: {assumptions.defaultLifetime}-year lifetime + {assumptions.loss}-loss scenario. Source: Capacity History and Assumptions in the published Our Solution workbook.</small>
  </figure>;
}

function CountryRetirementExplorer({ waves, assumptions }: { waves: RetirementMarketWaves;assumptions:WaveAssumptions }) {
  const [country, setCountry] = useState<RetirementMarket>("United States");
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
  const path = (data: { year: number; tonnes: number }[]) => `M ${data.map((point, index) => `${x(index)},${y(point.tonnes)}`).join(" L ")}`;
  const lastEarly = early.at(-1)!, lastRegular = regular.at(-1)!;
  const majorYears = early.filter((point) => point.year % 5 === 0);
  const labels: Record<RetirementMarket, string> = { "United States": "US", Japan: "Japan", Europe: "Europe", Australia: "Australia" };
  return <div className="os-wave-country-explorer">
    <div className="os-wave-country-copy" aria-live="polite"><h3>When will {labels[country]} solar panels reach end of life?</h3><p>Annual end-of-life PV panel mass, {country}.</p></div>
    <div className="os-wave-country-controls">
      <div className="os-wave-country-tabs" role="group" aria-label="Choose a market">{retirementMarkets.map((market) => <button type="button" key={market} aria-pressed={country === market} onClick={() => setCountry(market)}>{labels[market]}</button>)}</div>
      <div className="os-wave-lifetime" role="group" aria-label="Choose modeled panel lifetime"><span>Lifetime</span>{([25, 18, 15, 12] as const).map((years) => <button type="button" key={years} aria-pressed={lifetime === years} onClick={() => setLifetime(years)}>{years} years</button>)}</div>
      <p className="os-wave-lifetime-basis">Scenario, not a forecast. Lifetime basis: <strong>12 years</strong> — <a href="https://docs.nrel.gov/docs/fy21osti/74124.pdf">NREL/TP-6A20-74124, p. 8 (PDF p. 19)</a>, reporting industry observations that some commercial and utility-scale project owners may replace modules every 10–12 years; <strong>15 years</strong> — <a href="https://doi.org/10.1016/j.joule.2019.08.012">Jean, Woodhouse &amp; Bulović (2019)</a>; <strong>18 years</strong> — an intermediate modeled case between 12 and 25 years; <strong>25 years</strong> — IRENA 2026’s reference lifetime. Weibull shape factors: early loss {assumptions.shapes.early}; regular loss {assumptions.shapes.regular}.</p>
    </div>
    <figure className="os-wave-country-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${country}, ${lifetime}-year lifetime: early-loss annual end-of-life mass reaches ${(lastEarly.tonnes / 1e6).toFixed(2)} million tonnes in 2050; regular-loss reaches ${(lastRegular.tonnes / 1e6).toFixed(2)} million tonnes.`}>
        <g className="os-wave-country-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => axisStep * index).map((tick) => <g key={tick}><line x1={left} x2={width - right} y1={y(tick * 1e6)} y2={y(tick * 1e6)} /><text x={left - 10} y={y(tick * 1e6) + 4} textAnchor="end">{tick.toFixed(tickDigits)}</text></g>)}</g>
        <path className="os-wave-country-line is-regular" d={path(regular)} />
        <path className="os-wave-country-line is-early" d={path(early)} />
        <g className="os-wave-country-years" aria-hidden="true">{majorYears.map((point) => <text key={point.year} x={x(early.indexOf(point))} y={height - 14} textAnchor="middle">{point.year}</text>)}</g>
        <g className="os-wave-country-endpoint is-regular" transform={`translate(${x(regular.length - 1)} ${y(lastRegular.tonnes)})`}><circle r="4" /><text x="-10" y="16" textAnchor="end">{(lastRegular.tonnes / 1e6).toFixed(2)}m t</text></g>
        <g className="os-wave-country-endpoint is-early" transform={`translate(${x(early.length - 1)} ${y(lastEarly.tonnes)})`}><circle r="5" /><text x="-10" y="-12" textAnchor="end">{(lastEarly.tonnes / 1e6).toFixed(2)}m t</text></g>
        <text className="os-wave-country-unit" x="0" y="12">million tonnes / year</text>
      </svg>
      <figcaption className="os-wave-country-legend"><span className="is-early">Early loss</span><span className="is-regular">Regular loss</span></figcaption>
    </figure>
    <p className="os-wave-country-note">Both lines use the selected lifetime. The vertical scale adjusts to the selected market and scenario. Values are projections, not measured retirements.</p>
  </div>;
}

type MethodRow = { label: string; shredding: string; thermal: string; circulator: string };
const THREE_METHODS = ["Shredding", "Thermal processing", "PV Circulator"] as const;

function MethodTable({ caption, rows, columns = THREE_METHODS }: { caption: string; rows: MethodRow[]; columns?: readonly string[] }) {
  return <div className="os-method-detail-table"><table><caption className="pv-sr-only">{caption}</caption><thead><tr><th scope="col">Item</th>{columns.map((column, index) => <th scope="col" key={column} className={index === columns.length - 1 ? "is-circulator" : undefined}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.shredding}</td><td>{row.thermal}</td><td>{row.circulator}</td></tr>)}</tbody></table></div>;
}

function methodSources(data:OurSolutionView){return `Sources: ${[...new Set(Object.entries(data.websiteData).filter(([key])=>key.startsWith("methods.")).map(([,row])=>row.source).filter(source=>!source.startsWith("No public")&&source!=="SGS verification"))].join("; ")}. Product recovery = sellable output by purity. — = no public data.`;}

function technologyRows(data:OurSolutionView):MethodRow[]{
  const n=(key:string)=>webNum(data,key);
  const shredMin=n("methods.shredding.throughput_min_panels_per_hour"),shredMax=n("methods.shredding.throughput_max_panels_per_hour");
  const pv=n("methods.circulator.footprint_m2");
  return [
    {label:"Footprint",shredding:`${compactNumber(n("methods.shredding.footprint_m2"))} m²`,thermal:`${compactNumber(n("methods.thermal.footprint_m2"))} m²`,circulator:`${compactNumber(pv)} m²`},
    {label:"Energy",shredding:`${compactNumber(n("methods.shredding.energy_kwh_per_panel"))} kWh / panel`,thermal:`${compactNumber(n("methods.thermal.energy_kwh_per_panel"))} kWh / panel`,circulator:`<${compactNumber(n("methods.circulator.energy_max_kwh_per_panel"))} kWh / panel`},
    {label:"Throughput",shredding:`~${compactNumber(shredMin)}–${compactNumber(shredMax)} panels / h`,thermal:`~${compactNumber(n("methods.thermal.throughput_panels_per_hour"))} panels / h (~${compactNumber(n("methods.thermal.seconds_per_panel"))} s per panel)`,circulator:`~${compactNumber(n("methods.circulator.throughput_panels_per_hour"))} panels / h`},
    {label:"Staff",shredding:`${compactNumber(n("methods.shredding.total_staff_per_shift"))} people / shift`,thermal:`${compactNumber(n("methods.thermal.total_staff_per_shift"))} people / shift`,circulator:`${compactNumber(n("methods.circulator.total_staff_per_shift"))} people / shift`},
    {label:"Product recovery",shredding:`<${compactNumber(n("methods.shredding.product_recovery_percent"))}%`,thermal:`~${compactNumber(n("methods.thermal.product_recovery_percent"))}%`,circulator:`${compactNumber(n("methods.circulator.product_recovery_percent"))}%`},
    {label:"By-products",shredding:"Mixed fragments need further treatment",thermal:"Cell laminate (EVA, backsheet, cells) needs further treatment",circulator:"No off-gas or wastewater"},
  ];
}

const usd = (value: number, digits = 0) => value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
function economicsSolutions(data: OurSolutionView) { return {
  conventional: data.solutions.find((solution) => solution.code === "SHREDDING")!,
  hotKnife: data.solutions.find((solution) => solution.code === "HOT_KNIFE")!,
  circulator: data.solutions.find((solution) => solution.code === "PVCIRCULATOR")!,
}; }

function materialRows(data:OurSolutionView):MethodRow[]{return [
  {label:"Glass",shredding:"Mixed glass cullet",thermal:"Separated from the encapsulant",circulator:"Graded by particle size and purity"},
  {label:"Silver",shredding:"Stays mixed in the fragments",thermal:"Stays in the cell laminate",circulator:"Ends in the silicon (cell) powder"},
  {label:"EVA / backsheet",shredding:"Mixed into fragments",thermal:"Stay attached to the cell laminate",circulator:"Separated and recovered"},
  {label:"By-products",shredding:"Further sorting and treatment",thermal:"Cell laminate needs further treatment",circulator:"No off-gas or wastewater"},
  {label:"Secondary treatment",shredding:`~${compactNumber(webNum(data,"methods.shredding.secondary_treatment_t_per_mw"))} t / MW`,thermal:`~${compactNumber(data.thermalSecondaryTreatmentTPerMw)} t / MW`,circulator:`~${compactNumber(webNum(data,"methods.circulator.secondary_treatment_t_per_mw"))} t / MW`},
];}

function FootprintMethodVisual({data}:{data:OurSolutionView}) {
  const shredding=webNum(data,"methods.shredding.footprint_m2"),thermal=webNum(data,"methods.thermal.footprint_m2"),pv=webNum(data,"methods.circulator.footprint_m2");
  const reduction=(base:number,value:number)=>Math.round((1-value/base)*100),pvLabel=`${compactNumber(pv)} m²`;
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>PV Circulator’s modular design requires only {pvLabel}—about {reduction(shredding,pv)}% less footprint than shredding and about {reduction(thermal,pv)}% less than thermal processing. The compact footprint and dry process make near-site or on-site deployment possible.</p></div><div className="os-method-bars is-footprint" role="img" aria-label={`Equipment footprint comparison: shredding ${shredding} square metres, thermal processing ${thermal}, PV Circulator ${pv}`}><div><span>Shredding</span><i style={{width:"100%"}} /><strong>{compactNumber(shredding)} m²</strong></div><div><span>Thermal processing</span><i style={{width:`${thermal/shredding*100}%`}} /><strong>{compactNumber(thermal)} m²</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{width:`${pv/shredding*100}%`}} /><strong>{pvLabel}</strong></div></div></div><MethodTable caption="Recycling technology comparison" rows={technologyRows(data)} /><p className="os-chart-source">{methodSources(data)}</p></div>;
}

function OperatingCostMethodVisual({ economicsData }: { economicsData: OurSolutionView }) {
  const { conventional, hotKnife, circulator } = economicsSolutions(economicsData);
  const operatingCostRows: MethodRow[] = [
    { label: "Electricity", shredding: usd(conventional.opexPerPanel.electricity, 2), thermal: usd(hotKnife.opexPerPanel.electricity, 2), circulator: usd(circulator.opexPerPanel.electricity, 2) },
    { label: "Labor + burden", shredding: usd(conventional.opexPerPanel.laborAndBurden, 2), thermal: usd(hotKnife.opexPerPanel.laborAndBurden, 2), circulator: usd(circulator.opexPerPanel.laborAndBurden, 2) },
    { label: "Facility / rent", shredding: usd(conventional.opexPerPanel.facility, 2), thermal: usd(hotKnife.opexPerPanel.facility, 2), circulator: usd(circulator.opexPerPanel.facility, 2) },
    { label: "Other operating costs", shredding: usd(conventional.opexPerPanel.other, 2), thermal: usd(hotKnife.opexPerPanel.other, 2), circulator: usd(circulator.opexPerPanel.other, 2) },
    { label: "Total / panel", shredding: usd(conventional.opexPerPanel.total, 2), thermal: usd(hotKnife.opexPerPanel.total, 2), circulator: usd(circulator.opexPerPanel.total, 2) },
    { label: "Total / lb", shredding: usd(conventional.opexPerPanel.total / economicsData.scenario.panelWeightLb, 2), thermal: usd(hotKnife.opexPerPanel.total / economicsData.scenario.panelWeightLb, 2), circulator: usd(circulator.opexPerPanel.total / economicsData.scenario.panelWeightLb, 2) },
  ];
  const peak = Math.max(conventional.opexPerPanel.total, hotKnife.opexPerPanel.total, circulator.opexPerPanel.total);
  const operatingBars = [
    { label: "Shredding", total: usd(conventional.opexPerPanel.total, 2), width: `${conventional.opexPerPanel.total / peak * 100}%`, values: [conventional.opexPerPanel.electricity, conventional.opexPerPanel.laborAndBurden, conventional.opexPerPanel.facility, conventional.opexPerPanel.other], className: "" },
    { label: "Thermal processing", total: usd(hotKnife.opexPerPanel.total, 2), width: `${hotKnife.opexPerPanel.total / peak * 100}%`, values: [hotKnife.opexPerPanel.electricity, hotKnife.opexPerPanel.laborAndBurden, hotKnife.opexPerPanel.facility, hotKnife.opexPerPanel.other], className: "" },
    { label: "PV Circulator", total: usd(circulator.opexPerPanel.total, 2), width: `${circulator.opexPerPanel.total / peak * 100}%`, values: [circulator.opexPerPanel.electricity, circulator.opexPerPanel.laborAndBurden, circulator.opexPerPanel.facility, circulator.opexPerPanel.other], className: "is-circulator" },
  ];
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>Operating cost per processed panel (USD), using the {economicsData.scenario.region} business-case scenario at {economicsData.scenario.panelsPerMonth.toLocaleString()} panels per month.</p><small>Annual OPEX divided by {economicsData.scenario.annualPanels.toLocaleString()} panels. Labor uses total staff per shift from the Assumptions sheet. CAPEX and equipment depreciation are excluded; maintenance is included.</small></div><div className="os-cost-bars" role="img" aria-label={`Operating cost per panel in US dollars: Shredding ${operatingBars[0].total}, Thermal processing ${operatingBars[1].total}, PV Circulator ${operatingBars[2].total}`}>{operatingBars.map((bar) => <div className={bar.className} key={bar.label}><span>{bar.label}</span><div className="os-cost-track"><div className="os-cost-stack" style={{ width: bar.width }}>{bar.values.map((value, index) => <i className={`is-part-${index + 1}`} style={{ flexGrow: value }} key={index} />)}</div></div><strong>{bar.total}</strong></div>)}</div><div className="os-cost-legend" aria-label="Operating cost categories">{["Electricity", "Labor + burden", "Facility / rent", "Other OPEX"].map((item, index) => <span key={item}><i className={`is-part-${index + 1}`} />{item}</span>)}</div></div><MethodTable caption="Operating cost breakdown in US dollars per panel" rows={operatingCostRows} columns={THREE_METHODS} /></div>;
}

function MaterialMethodVisual({data}:{data:OurSolutionView}) {
  const shredding=webNum(data,"methods.shredding.secondary_treatment_t_per_mw"),thermal=data.thermalSecondaryTreatmentTPerMw,circulator=webNum(data,"methods.circulator.secondary_treatment_t_per_mw");
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>Material requiring secondary treatment per MW. Shorter bars mean less material needs added processing or disposal.</p></div><div className="os-method-bars is-secondary" role="img" aria-label={`Material requiring secondary treatment per megawatt: shredding ${shredding} tonnes, thermal processing about ${thermal} tonnes, PV Circulator about ${circulator} tonnes`}><div><span>Shredding</span><i style={{width:"100%"}} /><strong>~{compactNumber(shredding)} t</strong></div><div><span>Thermal processing</span><i style={{width:`${thermal/shredding*100}%`}} /><strong>~{compactNumber(thermal)} t</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{width:`${circulator/shredding*100}%`}} /><strong>~{compactNumber(circulator)} t</strong></div></div></div><MethodTable caption="Recovered materials comparison by technology" rows={materialRows(data)} /><p className="os-chart-source">{methodSources(data)}</p></div>;
}

function SilverValueVisual({economicsData}:{economicsData:OurSolutionView}) {
  const items=economicsData.productMaterials;
  const mat=(name:string)=>items.find(m=>m.name===name)!;
  const pct=(n:number,digits=0)=>(n*100).toFixed(digits)+"%";
  const ag=mat("Silver"),al=mat("Aluminium"),glass=mat("Glass"),cu=mat("Copper");
  return <div className="os-data-slide os-silver-value-slide"><div className="os-value-intro"><h2 id="value-title">Silver is only {pct(ag.share,2)} of a panel&apos;s weight—but {pct(ag.valueShare)} of its material value.</h2><strong className="os-value-thesis">Silver is the most direct route to higher recovery value.</strong><p>Aluminium and glass need substantial downstream infrastructure to upgrade at scale. Silver is easier to purify from a concentrated cell stream; PV Circonomy has this purification technology, so recovering it can lift profit without the same infrastructure burden.</p></div>
    <div className="os-silver-value-chart" role="img" aria-label={`Silver is ${pct(ag.share,2)} by weight and ${pct(ag.valueShare)} of benchmark material value.`}>
      <div className="os-silver-chart-row"><span>By weight · one panel</span><div className="os-silver-weight-bar"><i className="is-silver" style={{flexGrow:ag.share,flexBasis:0}} title={`Silver · ${pct(ag.share,2)}`} /><i className="is-frame" style={{flexGrow:al.share,flexBasis:0}}><b>Al frame</b><small>{pct(al.share)}</small></i><i className="is-glass" style={{flexGrow:glass.share,flexBasis:0}}><b>Glass</b><small>{pct(glass.share)}</small></i><i className="is-other" style={{flexGrow:1-ag.share-al.share-glass.share,flexBasis:0}}><b>Other</b><small>{pct(1-ag.share-al.share-glass.share,2)}</small></i></div></div>
      <div className="os-silver-chart-row"><span>By material value · 100% silver</span><div className="os-silver-value-bar">{[[ag,"is-silver"],[al,"is-frame"],[cu,"is-copper"]].map(([v,cls])=>{const m=v as typeof ag;return <i key={m.name} className={cls as string} style={{flexGrow:m.valueShare,flexBasis:0}}><b>{m.name}</b><small>{pct(m.valueShare)}</small></i>})}<i className="is-rest" style={{flexGrow:1-ag.valueShare-al.valueShare-cu.valueShare,flexBasis:0}}><b>Rest</b><small>{pct(1-ag.valueShare-al.valueShare-cu.valueShare)}</small></i></div><small className="os-silver-value-method">Calculation: module mass share × benchmark price × approved value factor. Silver uses 100%; aluminium and copper use 50% of LME; glass uses the cement benchmark; EVA and backsheet are zero; silicon and junction box + cable follow Excel. Because concentrated silver is comparatively easy to purify and carries the largest value share, it is the most accessible lever for increasing recovered-material profit.</small></div>
    </div></div>;
}

function SilverGradeTable({economicsData}:{economicsData:OurSolutionView}) {
  const upper=(code:string,digits:number)=>economicsData.solutions.find(s=>s.code===code)!.silverUpperPct.toFixed(digits)+"%";
  const silverRows=[
    {method:"Shredding",fraction:"Mixed fragments",silver:upper("SHREDDING",4),recovery:`<${compactNumber(webNum(economicsData,"methods.shredding.product_recovery_percent"))}%`},
    {method:"Thermal processing",fraction:"Cell laminate",silver:upper("HOT_KNIFE",3),recovery:`~${compactNumber(webNum(economicsData,"methods.thermal.product_recovery_percent"))}%`},
    {method:"PV Circulator",fraction:"Silicon (cell) powder",silver:upper("PVCIRCULATOR",3)+` · Actual measured value ${compactNumber(webNum(economicsData,"value.circulator_measured_silver_percent"))}%`,recovery:`${compactNumber(webNum(economicsData,"methods.circulator.product_recovery_percent"))}%`}
  ];
  return <div className="os-method-detail-table os-silver-grade-table"><table><caption className="pv-sr-only">Where silver ends up and product recovery, by method</caption><thead><tr><th scope="col">Method</th><th scope="col">Silver-bearing fraction</th><th scope="col">Silver content</th><th scope="col">Product recovery</th></tr></thead><tbody>{silverRows.map(row => <tr key={row.method} className={row.method === "PV Circulator" ? "is-circulator" : undefined}><th scope="row">{row.method}</th><td>{row.fraction}</td><td>{row.silver}</td><td>{row.recovery}</td></tr>)}</tbody></table></div>;
}

function SilverTechnologyTrend({data}:{data:OurSolutionView}) {
  const industry=webNum(data,"value.silver_industry_2024_mg_per_w");
  const topcon=[webNum(data,"value.silver_topcon_2025_mg_per_w"),webNum(data,"value.silver_topcon_2035_mg_per_w")];
  const hjt=[webNum(data,"value.silver_hjt_2025_mg_per_w"),webNum(data,"value.silver_hjt_2035_mg_per_w")];
  const top=15,left=36,right=420,y=(value:number)=>24+(top-value)/top*126;
  return <figure className="os-silver-intensity-chart">
    <figcaption><strong>Silver use is falling by cell technology.</strong><span>milligrams per watt</span></figcaption>
    <div className="os-silver-intensity-legend" aria-hidden="true"><span className="is-topcon"><i/>TOPCon</span><span className="is-hjt"><i/>HJT</span><span className="is-industry"><i/>2024 industry average</span></div>
    <svg viewBox="0 0 460 188" role="img" aria-label={`Silver use: 2024 industry average ${industry} milligrams per watt. TOPCon falls from ${topcon[0]} in 2025 to ${topcon[1]} in 2035. HJT falls from ${hjt[0]} in 2025 to ${hjt[1]} in 2035.`}>
      {[0,5,10,15].map(value=><g key={value}><line className="os-silver-intensity-grid" x1={left} x2="438" y1={y(value)} y2={y(value)}/><text x="27" y={y(value)+3} textAnchor="end">{value}</text></g>)}
      <g className="is-industry"><circle cx="54" cy={y(industry)} r="4"/><text x="64" y={y(industry)-7}>2024 average · {compactNumber(industry)}</text></g>
      <g className="is-topcon"><polyline points={`128,${y(topcon[0])} ${right},${y(topcon[1])}`}/><circle cx="128" cy={y(topcon[0])} r="4"/><circle cx={right} cy={y(topcon[1])} r="4"/><text x="128" y={y(topcon[0])-8} textAnchor="middle">{compactNumber(topcon[0])}</text><text x={right-8} y={y(topcon[1])-9} textAnchor="end">TOPCon · {compactNumber(topcon[1])}</text></g>
      <g className="is-hjt"><polyline points={`128,${y(hjt[0])} ${right},${y(hjt[1])}`}/><circle cx="128" cy={y(hjt[0])} r="4"/><circle cx={right} cy={y(hjt[1])} r="4"/><text x="128" y={y(hjt[0])-8} textAnchor="middle">{compactNumber(hjt[0])}</text><text x={right-8} y={y(hjt[1])+15} textAnchor="end">HJT · {compactNumber(hjt[1])}</text></g>
      <text className="os-silver-intensity-year" x="54" y="178" textAnchor="middle">2024</text><text className="os-silver-intensity-year" x="128" y="178" textAnchor="middle">2025</text><text className="os-silver-intensity-year" x={right} y="178" textAnchor="middle">2035</text>
    </svg>
  </figure>;
}

function ValueSection({economicsData}:{economicsData:OurSolutionView}) {
  const industry=webNum(economicsData,"value.silver_industry_2024_mg_per_w");
  const topconNow=webNum(economicsData,"value.silver_topcon_2025_mg_per_w"),topconFuture=webNum(economicsData,"value.silver_topcon_2035_mg_per_w");
  const hjtNow=webNum(economicsData,"value.silver_hjt_2025_mg_per_w"),hjtFuture=webNum(economicsData,"value.silver_hjt_2035_mg_per_w");
  return <section id="value" className="pv-screen os-value-section" aria-labelledby="value-title">
    <div className="os-value-visual"><SilverValueVisual economicsData={economicsData} /></div>
    <aside className="os-value-explanation">
      <div className="os-value-grade"><h3>Keep silver concentrated—and preserve its value.</h3><p>Separating panel layers preserves a concentrated cell stream for further recovery instead of dispersing silver into mixed glass.</p>
        <SilverGradeTable economicsData={economicsData} />
        <p className="os-chart-source">Theoretical upper bound = silver ÷ (silver + the module components that end up in the product), with all module silver assumed in the product.</p></div>
      <div id="silver-trend" className="os-silver-trend">
        <h3>Less silver in every panel. Recovery has to keep up.</h3>
        <SilverTechnologyTrend data={economicsData} />
        <p>Panel makers keep cutting silver to lower cost. Solar panels used about {compactNumber(industry)} g of silver per kW in 2024—less than half the 2014 level (IRENA, 2026). In 2025 the median TOPCon cell used about {compactNumber(topconNow)} mg per watt, and the industry roadmap expects about {compactNumber(topconFuture)} mg per watt within ten years; heterojunction cells, {compactNumber(hjtNow)} mg today, are expected to fall to {compactNumber(hjtFuture)} mg (ITRPV, 17th edition, 2026).</p>
        <p>Each retired panel will carry less silver than the one before. Recycling stays profitable only if far more of that silver is recovered, in a concentrated stream a refiner will pay for. Routes that grind silver into mixed glass or leave it inside a polymer layer lose that value first.</p>
        <p className="os-chart-source">Sources: <a href="https://www.irena.org/Publications">IRENA (2026)</a> · <a href="https://www.vdma.eu/documents/d/group-34568/en-press-release-itrpv-17-edition">ITRPV, 17th edition (2026)</a>.</p>
      </div>
    </aside>
  </section>;
}

type EconomicSeries = { label: string; values: number[]; className: string };

function RetirementLineChart({ lifetime, onLifetimeChange, wave: retirementWave, assumptions = defaultWaveAssumptions }: { assumptions?:WaveAssumptions; lifetime: 25 | 18 | 15 | 12; onLifetimeChange: (value: 25 | 18 | 15 | 12) => void; wave: RetirementWave }) {
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
  const ariaLabel = basis.map(series => `${series.label}: ${retirementWave.years.flatMap((year, i) => year % 5 === 0 ? [`${year}: ${series.values[i].toLocaleString("en-US")} tonnes`] : []).join("; ")}`).join(". ");
  return <figure className="os-economic-chart os-retirement-chart"><figcaption>Annual end-of-life PV panel mass, United States, 2016–2050: IRENA {assumptions.loss}-loss scenario, {lifetime}-year EoL lifetime (modelled; the other shape shown for comparison).</figcaption>
    <div className="os-economic-legend">{basis.map(series => <span className={series.className} key={series.label}><i />{series.label}</span>)}{SHOW_LIFETIME_REFERENCE && <span className="is-reference"><i />IRENA 2026: 25 yrs</span>}</div>
    <svg viewBox="0 0 600 240" role="img" aria-label={ariaLabel}>
      <text x="48" y="12">million t</text>
      {ticks.map(tick => <g key={tick}><line className="os-economic-grid" x1="48" x2="548" y1={y(tick * 1e6)} y2={y(tick * 1e6)} /><text x="40" y={y(tick * 1e6) + 3} textAnchor="end">{tick.toFixed(1)}</text></g>)}
      {[2020, 2025, 2030, 2035, 2040, 2045, 2050].map(year => <text className="os-economic-axis-label" key={year} x={x(year)} y="225" textAnchor="middle">{year}</text>)}
      {[{ value: 1e5, label: "100 kt/yr" }, { value: 1e6, label: "1 Mt/yr" }].map(guide => <g key={guide.value}><line className="os-retirement-guide" x1="48" x2="548" y1={y(guide.value)} y2={y(guide.value)} /><text x="552" y={y(guide.value) + 3}>{guide.label}</text></g>)}
      {SHOW_LIFETIME_REFERENCE && references.map((values, i) => <polyline className={`is-reference ${i === 0 ? "is-early" : "is-regular"}`} key={i} points={points(values)} />)}
      {basis.map((series, seriesIndex) => <g key={series.label} className={series.className}><polyline points={points(series.values)} />{[2030, 2035, 2040, 2050].map(year => { const value = series.values[retirementWave.years.indexOf(year)]; return <text key={year} x={x(year)} y={y(value) + (seriesIndex === 0 ? -9 : 14)} textAnchor="middle">{(value / 1e6).toFixed(2)}m t</text>; })}</g>)}
    </svg>
    <label className="os-lifetime-control">EoL lifetime
      <select aria-label="EoL lifetime" value={lifetime} onChange={event => onLifetimeChange(Number(event.target.value) as 25 | 18 | 15 | 12)}>{[25, 18, 15, 12].map(value => <option key={value} value={value}>{value} years{value === assumptions.defaultLifetime ? " (default)" : ""}</option>)}</select>
    </label>
  </figure>;
}

function RetirementContext({ lifetime, wave: retirementWave, assumptions = defaultWaveAssumptions }: { assumptions?:WaveAssumptions; lifetime: 25 | 18 | 15 | 12; wave: RetirementWave }) {
  const sources = {
    25: <>IRENA 2026 (25-year lifetime){assumptions.defaultLifetime===25?" (default)":""}.</>,
    18: <>Intermediate modeled case between the 12- and 25-year scenarios{assumptions.defaultLifetime===18?" (default)":""}.</>,
    15: <><a href="https://doi.org/10.1016/j.joule.2019.08.012">Jean, Woodhouse &amp; Bulović, Joule 2019</a> (initial life under 15 years).</>,
    12: <><a href="https://docs.nrel.gov/docs/fy21osti/74124.pdf">NREL/TP-6A20-74124, p. 8 (PDF p. 19)</a> (industry observations of possible 10–12-year commercial and utility-scale repowering).</>,
  };
  return <div className="os-retirement-context" aria-live="polite">
    <p><strong>{lifetime}-year EoL lifetime, IRENA {assumptions.loss}-loss scenario.</strong> {sources[lifetime]}</p>
    <p>Default: {assumptions.defaultLifetime}-year lifetime, IRENA {assumptions.loss}-loss scenario. In {retirementWave.years[retirementWave.years.length - 1]}, early-loss retirements reach {(retirementWave[`early_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t; regular loss, for comparison, {(retirementWave[`regular_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t.</p>
    <table><caption>First year annual retirements cross each threshold ({assumptions.loss} loss is the main scenario)</caption><thead><tr><th scope="col">Annual mass</th><th scope="col">Early loss ({assumptions.loss === "early" ? "main" : "comparison"})</th><th scope="col">Regular loss ({assumptions.loss === "regular" ? "main" : "comparison"})</th></tr></thead><tbody>{[100000, 500000, 1000000].map(threshold => <tr key={threshold}><th scope="row">{threshold === 1000000 ? "1 Mt" : `${threshold / 1000} kt`}</th><td>{retirementWave.crossings[`early_T${lifetime}`][String(threshold) as "100000" | "500000" | "1000000"]}</td><td>{retirementWave.crossings[`regular_T${lifetime}`][String(threshold) as "100000" | "500000" | "1000000"]}</td></tr>)}</tbody></table>
    <p className="os-chart-source">Scenario, not a forecast. IRENA Weibull shape factors: early loss {assumptions.shapes.early}; regular loss {assumptions.shapes.regular}. Capacity History: 2000–2024 actual and 2025–2049 constant annual growth to the 2050 value. Panel mass {assumptions.panelWeightLb} lb at {assumptions.panelRating} W (≈{assumptions.tonnesPerMw.toFixed(1)} t per MW). Panels produce no waste in the year they are installed. Retired panels are replaced, and replacement panels retire again. Faint reference lines use IRENA 2026’s 25-year lifetime. The 12-year case follows NREL/TP-6A20-74124, p. 8 (PDF p. 19); 18 years is an intermediate modeled case. Threshold years depend on these assumptions.</p>
  </div>;
}

function RegulationSection({ metrics, assumptions, data }: { metrics: RouteEnvironmentalMetric[]; assumptions:WaveAssumptions;data:OurSolutionView }) {
  const rules = [
    ["United States (federal, RCRA).", "A retired solar panel that is discarded is a solid waste. It is hazardous waste if it fails the toxicity test for lead or cadmium (TCLP); the generator must make that determination. Solar panels are not yet a federal universal waste; EPA has a rulemaking in progress.", "https://www.epa.gov/hw/solar-panel-frequent-questions", "EPA FAQ"],
    ["California.", "Since 1 January 2021, hazardous end-of-life PV modules may be managed as universal waste under 22 CCR Chapter 23. Handlers and treatment facilities must notify DTSC and report annually.", "https://dtsc.ca.gov/photovoltaic-modules-pv-modules-universal-waste-management-regulations/", "DTSC"],
    ["North Carolina.", "From 1 December 2026, PV modules may not be disposed of in unlined landfills, including construction-and-demolition debris landfills.", "https://www.deq.nc.gov/north-carolina-landfill-disposal-bans", "NC DEQ"],
    ["European Union (WEEE Directive 2012/19/EU).", "PV panels are covered as large equipment: at least 85% must be recovered and 80% prepared for re-use and recycled.", "https://eur-lex.europa.eu/eli/dir/2012/19/oj", "EUR-Lex"],
    ["Japan.", "Used PV panels must be properly managed under the Waste Management Act. FIT/FIP business systems of 10 kW or more are subject to the decommissioning-cost reserve mechanism under the Renewable Energy Special Measures Act.", "https://www.env.go.jp/content/000378443.pdf", "MOE / METI"],
    ["Australia (Victoria).", "Photovoltaic panels are e-waste under the Environment Protection Regulations 2021. Victoria landfills cannot receive e-waste; generators, transporters and receivers have duties under the Environment Protection Act 2017.", "https://www.epa.vic.gov.au/electronic-waste", "EPA Victoria"],
  ];
  return <section id="regulation" className="pv-screen os-regulation" aria-labelledby="regulation-title"><div>
    <h2 id="regulation-title">Less to landfill. Less carbon in the process.</h2>
    <p>Per MW of retired panels ({assumptions.panelRating} W modules at {assumptions.panelWeightLb} lb each, about {assumptions.tonnesPerMw.toFixed(1)} t), gate-to-gate: from panels arriving at the plant to separated materials leaving it. Process CO2e covers process electricity only.</p>
    <EnvironmentalEvidenceChart metrics={metrics} />
    <p className="os-chart-source">Landfill = unrecovered material from the Our Solution parameter engine; CO2e = process electricity (kWh per panel, Our Solution parameters) × US grid average {compactNumber(webNum(data,"impact.grid_kg_co2e_per_kwh"))} kg CO2e/kWh (<a href="https://www.epa.gov/egrid/summary-data">EPA eGRID2023</a>). Transport, downstream refining and avoided emissions are excluded. Thermal-processing routes leave an encapsulant–cell layer that still needs further treatment before its metals are recovered.</p>
  </div><div className="os-regulation-rules">{rules.map(([title, copy, href, source]) => <article key={title}><h3>{title}</h3><p>{copy}</p><a href={href}>{source} <Arrow /></a></article>)}</div></section>;
}

function EnvironmentalEvidenceChart({metrics}:{metrics:RouteEnvironmentalMetric[]}) {
  const ordered=["SHREDDING","HOT_KNIFE","PVCIRCULATOR"].map(code=>metrics.find(item=>item.code===code));
  const items=ordered.map((item,index)=>({label:THREE_METHODS[index],landfill:item?.landfillTPerMw??0,co2:item?.co2eTPerMw??0,available:Boolean(item)}));
  const peak=Math.max(1,...items.flatMap(item=>[item.landfill,item.co2])),format=(value:number)=>value.toLocaleString("en-US",{maximumFractionDigits:2});
  return <figure className="os-impact-mini-chart"><figcaption><strong>Landfill and process carbon per MW</strong><span>metric tonnes / MW</span></figcaption><div className="os-impact-mini-legend" aria-hidden="true"><span><i className="is-landfill"/>Landfill</span><span><i className="is-carbon"/>Process CO₂e</span></div><div className="os-impact-mini-bars" role="img" aria-label={items.map(item=>`${item.label}: ${item.available?`${format(item.landfill)} tonnes landfilled and ${format(item.co2)} tonnes process carbon dioxide equivalent per megawatt`:"data unavailable"}`).join(". ")}>{items.map(item=><article key={item.label}><div><i className="is-landfill" style={{height:`${item.landfill/peak*100}%`}}><b>{item.available?format(item.landfill):"—"}</b></i><i className="is-carbon" style={{height:`${item.co2/peak*100}%`}}><b>{item.available?format(item.co2):"—"}</b></i></div><strong>{item.label}</strong></article>)}</div></figure>;
}

function EquipmentDemandChart({years,early,regular,lineCapacityMw,marketLabel}:{years:number[];early:number[];regular:number[];lineCapacityMw:number;marketLabel:string}) {
  const width=560,height=240,left=48,right=18,top=38,bottom=34,peak=Math.max(1,...early,...regular)*1.12;
  const x=(index:number)=>left+index*((width-left-right)/(years.length-1)),y=(value:number)=>top+(peak-value)/peak*(height-top-bottom),points=(values:number[])=>values.map((value,index)=>`${x(index)},${y(value)}`).join(" ");
  return <figure className="os-equipment-demand-chart"><figcaption><strong>Annual {marketLabel} equipment demand</strong><span>{lineCapacityMw.toFixed(0)} MW per line-year</span></figcaption><div className="os-economic-legend" aria-hidden="true"><span className="is-regular"><i/>Regular loss</span><span className="is-early"><i/>Early loss</span></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Scenario equipment demand in ${marketLabel}. Regular-loss: ${years.map((year,index)=>`${year}: ${regular[index]} systems`).join(", ")}. Early-loss: ${years.map((year,index)=>`${year}: ${early[index]} systems`).join(", ")}.`}>
    {[0,.25,.5,.75,1].map(ratio=><line className="os-economic-grid" x1={left} x2={width-right} y1={top+ratio*(height-top-bottom)} y2={top+ratio*(height-top-bottom)} key={ratio}/>)}
    <g className="is-regular"><polyline points={points(regular)}/>{regular.map((value,index)=><g key={years[index]}><circle cx={x(index)} cy={y(value)} r="3"/><text x={x(index)} y={y(value)+15} textAnchor="middle">{value}</text></g>)}</g>
    <g className="is-early"><polyline points={points(early)}/>{early.map((value,index)=><g key={years[index]}><circle cx={x(index)} cy={y(value)} r="3"/><text x={x(index)} y={y(value)-9} textAnchor="middle">{value}</text></g>)}</g>
    {years.map((year,index)=><text className="os-economic-axis-label" x={x(index)} y={height-9} textAnchor="middle" key={year}>{year}</text>)}
  </svg></figure>;
}

function PublishedCapacityGap({data,market}:{data:OurSolutionView;market:DemandMarket}) {
  if(market!=="Japan")return null;
  const capacity=webNum(data,"scale.japan_recycling_capacity_t_per_year"),peak=webNum(data,"scale.japan_peak_discard_t_per_year"),gap=Math.max(0,peak-capacity),collected=webNum(data,"scale.japan_2024_collected_t"),respondents=webNum(data,"scale.japan_2024_survey_respondents");
  const compact=(value:number)=>`${Math.round(value/1000).toLocaleString("en-US")}k t/year`;
  return <figure className="os-capacity-gap"><figcaption><strong>Published national capacity gap</strong><span>Japan · dedicated PV recycling</span></figcaption><div className="os-capacity-gap-bar" role="img" aria-label={`Japan has about ${capacity.toLocaleString("en-US")} tonnes per year of dedicated solar-panel recycling capacity against a projected peak of about ${peak.toLocaleString("en-US")} tonnes per year, leaving about ${gap.toLocaleString("en-US")} tonnes per year of additional capacity needed.`}><i className="is-existing" style={{flexGrow:capacity}}><b>{compact(capacity)} existing</b></i><i className="is-gap" style={{flexGrow:gap}}><b>{compact(gap)} gap</b></i></div><small>Peak need: {compact(peak)}. A 2024 survey recorded {collected.toLocaleString("en-US")} t collected across {respondents.toLocaleString("en-US")} respondents. <a href="https://www.env.go.jp/content/000378443.pdf">Japan Ministry of the Environment, 23 Jan 2026, pp. 1, 6, 19</a>.</small></figure>;
}

function EconomicLineChart({ title, subtitle, labels, series, highlightIndex }: { title: string; subtitle: string; labels: string[]; series: EconomicSeries[]; highlightIndex?:number }) {
  const values=series.flatMap(s=>s.values);
  let min=Math.min(0,...values),max=Math.max(0,...values);
  const padding=Math.max(1,(max-min)*0.15);min-=padding;max+=padding;
  const width = 600;
  const height = 210;
  const left = 44;
  const right = 18;
  const top = 28;
  const bottom = 32;
  const x = (index: number) => left + index * ((width - left - right) / (labels.length - 1));
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom);
  return <figure className="os-economic-chart">
    <figcaption><strong>{title}</strong><span>{subtitle}</span></figcaption>
    <div className="os-economic-legend" aria-hidden="true">{series.map((item) => <span className={item.className} key={item.label}><i />{item.label}</span>)}</div>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${series.map((item) => `${item.label}: ${item.values.join(", ")}`).join(". ")}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={left} x2={width - right} y1={top + ratio * (height - top - bottom)} y2={top + ratio * (height - top - bottom)} className="os-economic-grid" />)}
      {highlightIndex!==undefined&&<g className="os-economic-current"><line x1={x(highlightIndex)} x2={x(highlightIndex)} y1={top-4} y2={height-bottom}/><text x={x(highlightIndex)} y="13" textAnchor="middle">Current fee</text></g>}
      {series.map((item) => <g className={item.className} key={item.label}>
        <polyline points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />
        {item.values.map((value, index) => <g className={index===highlightIndex?"is-current-point":undefined} key={`${item.label}-${labels[index]}`}><circle cx={x(index)} cy={y(value)} r={index===highlightIndex?5:3} /><text x={x(index)} y={y(value) - 8} textAnchor="middle">{value.toLocaleString()}</text></g>)}
      </g>)}
      {labels.map((label, index) => <text className="os-economic-axis-label" x={x(index)} y={height - 8} textAnchor="middle" key={label}>{label}</text>)}
    </svg>
  </figure>;
}

function PurificationUpliftChart({directSale,purifiedNet}:{directSale:number;purifiedNet:number}) {
  const peak=Math.max(directSale,purifiedNet),values=[{label:"Direct cell-powder sale",value:directSale,className:"is-direct"},{label:"Modeled purification net",value:purifiedNet,className:"is-purified"}];
  return <figure className="os-purification-chart"><figcaption>Annual cell-stream value · USD</figcaption><div role="img" aria-label={`Direct cell-powder sale ${usd(directSale)} per year. Modeled purification net ${usd(purifiedNet)} per year.`}>{values.map(item=><div className={item.className} key={item.label}><span>{item.label}</span><i><b style={{width:`${item.value/peak*100}%`}}/></i><strong>{usd(item.value)}</strong></div>)}</div></figure>;
}

function ProfitPerMwChart({data}:{data:OurSolutionView}) {
  const {conventional,hotKnife,circulator}=economicsSolutions(data),watts=webNum(data,"stakes.cost.reference_panel_watts");
  const annualMw=data.scenario.annualPanels*watts/1e6;
  const perMw=(value:number)=>value/annualMw,short=(value:number)=>`${value<0?"−":""}$${Math.abs(value/1000).toFixed(1)}k`;
  const direct=[
    {label:"PV Circulator",revenue:perMw(circulator.annualMaterialRevenue),cost:perMw(circulator.annualOpex)},
    {label:"Shredding",revenue:perMw(conventional.annualMaterialRevenue),cost:perMw(conventional.annualOpex)},
    {label:"Thermal processing",revenue:perMw(hotKnife.annualMaterialRevenue),cost:perMw(hotKnife.annualOpex)},
  ];
  const refinedRevenue=circulator.annualMaterialRevenue-data.cellPowder.scenario1+data.cellPowder.scenario2Revenue;
  const refinedCost=circulator.annualOpex+data.cellPowder.reagentCost+data.cellPowder.electroCost;
  const refined=[{label:"PV Circulator",revenue:perMw(refinedRevenue),cost:perMw(refinedCost)}];
  const axisMax=Math.max(...[...direct,...refined].flatMap(item=>[item.revenue,item.cost]))*1.15;
  const group=(title:string,items:typeof direct,className:string)=><section className={className}><h4>{title}</h4><div>{items.map(item=>{const profit=item.revenue-item.cost;return <article key={item.label}><div className="os-profit-pair"><i className="is-revenue" style={{height:`${item.revenue/axisMax*100}%`}}><b>{short(item.revenue)}</b></i><i className="is-cost" style={{height:`${item.cost/axisMax*100}%`}}><b>{short(item.cost)}</b></i></div><strong>{item.label}</strong><span className={profit>=0?"is-positive":"is-negative"}>{short(profit)} net</span></article>})}</div></section>;
  return <figure className="os-profit-per-mw"><figcaption><strong>Recycling profit per MW</strong><span>No processing fee · {compactNumber(watts)} W modules</span></figcaption><div className="os-profit-legend" aria-hidden="true"><span><i className="is-revenue"/>Material revenue</span><span><i className="is-cost"/>Operating cost</span></div><div className="os-profit-groups" role="img" aria-label={`Without silver refining: PV Circulator net ${short(direct[0].revenue-direct[0].cost)}, Shredding net ${short(direct[1].revenue-direct[1].cost)}, Thermal processing net ${short(direct[2].revenue-direct[2].cost)}. With silver refining: PV Circulator modeled net ${short(refined[0].revenue-refined[0].cost)} per megawatt.`}>{group("Without silver refining",direct,"is-direct")}{group("With silver refining",refined,"is-refined")}</div><small>Silver-refining cost includes modeled reagents and electrorefining electricity only. Added labor, depreciation, permitting, wastewater treatment, financing and product qualification are excluded.</small></figure>;
}

function EconomicSection({ economicsData, breakeven, priceSources }: { economicsData: OurSolutionView; breakeven: BreakevenView; priceSources:string }) {
  const { conventional, hotKnife, circulator } = economicsSolutions(economicsData);
  const currentFee=economicsData.scenario.processingFeeUsdPerLb,currentFeeLabel=`${usd(currentFee,2)}/lb`,feeRevenue=economicsData.scenario.annualProcessingFeeRevenue;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const feeSeries: EconomicSeries[] = [
    { label: "Shredding", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.SHREDDING, className: "is-shredding" },
    { label: "Thermal processing", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.HOT_KNIFE, className: "is-thermal" },
    { label: "PV Circulator", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.PVCIRCULATOR, className: "is-circulator" },
  ];
  const currentFeeIndex=economicsData.feeSensitivity.feeUsdPerLb.findIndex(value=>Math.abs(value-currentFee)<1e-9);
  const breakevenFee = (code: string) => breakeven?.fees.find(item => item.code === code)?.breakevenFee;
  const feeText = (value: number | null | undefined) => value == null || !breakeven ? null : `${value.toLocaleString("en-US", { style: "currency", currency: breakeven.currency, minimumFractionDigits: 3, maximumFractionDigits: 3 })}${breakeven.feeUnit.replace(/^[A-Z]{3}/, "")}`;
  const shreddingBreakeven = feeText(breakevenFee("SHREDDING")), hotKnifeBreakeven = feeText(breakevenFee("HOT_KNIFE")), circulatorBreakeven = breakevenFee("PVCIRCULATOR");
  const feeRange=`${usd(Math.min(...economicsData.feeSensitivity.feeUsdPerLb),2)}–${usd(Math.max(...economicsData.feeSensitivity.feeUsdPerLb),2)}/lb`;
  const scenarioDetail=`${economicsData.scenario.region} operating scenario at ${economicsData.scenario.panelsPerMonth.toLocaleString()} panels/month. CAPEX and equipment depreciation are excluded; maintenance is included.`;
  const breakevenCopy = breakeven && shreddingBreakeven && hotKnifeBreakeven ? `Breakeven processing fee (annual EBITDA = 0): Shredding ${shreddingBreakeven}, Thermal processing ${hotKnifeBreakeven}${circulatorBreakeven === 0 ? "; PV Circulator is EBITDA-positive with no processing fee" : ""}. Across the modeled ${feeRange} range, The chart shows each route’s annual EBITDA.` : null;
  const breakevenDetail = breakeven && breakevenCopy ? `Breakeven fees from the Our Solution parameter engine on the ${breakeven.source.toLowerCase()}: ${breakeven.region}, ${breakeven.panelsPerMonth.toLocaleString("en-US")} panels/month, ${breakeven.panelWeightLb} lb/panel. CAPEX and equipment depreciation are excluded; maintenance is included.` : null;
  const slides = [
    { label: "Profit per MW", heading: "Direct cell-powder sales make the base case profitable.", copy: `The chart separates the direct-sale case from the modeled silver-refining case. It excludes processing fees so equipment buyers can compare the value created by each recycling route itself.`, detail: `${economicsData.scenario.region} business-case scenario: ${economicsData.scenario.panelsPerMonth.toLocaleString()} panels/month, ${economicsData.scenario.annualPanels.toLocaleString()} panels/year and ${economicsData.scenario.panelWeightLb} lb/panel. CAPEX and equipment depreciation are excluded; maintenance is included.`, visual: <ProfitPerMwChart data={economicsData}/> },
    { label: "Processing fee", heading: "The current processing fee is the operating baseline.", copy: `At ${currentFeeLabel}, processing adds ${usd(feeRevenue)} in annual revenue at the modeled volume. The chart keeps the wider ${feeRange} range visible for sensitivity.`, detail: breakevenDetail ?? scenarioDetail, visual: <EconomicLineChart title="Processing fee vs. annual EBITDA" subtitle={`$1,000 per year · ${economicsData.scenario.region} · ${economicsData.scenario.panelsPerMonth.toLocaleString()} panels/month`} labels={economicsData.feeSensitivity.feeUsdPerLb.map(v=>`${usd(v,2)}/lb`)} series={feeSeries} highlightIndex={currentFeeIndex} /> },
    { label: "Purification upside", heading: "Silver purification is upside—not the base case.", copy: `Direct cell-powder sale contributes ${usd(economicsData.cellPowder.scenario1)} per year in the base case. The modeled purification route increases net cell-stream value to ${usd(economicsData.cellPowder.scenario2Net)}, an indicative uplift of ${usd(economicsData.cellPowder.scenario2Net-economicsData.cellPowder.scenario1)}.`, detail: "The purification case deducts modeled reagents and electrorefining electricity only. Added refining labor, equipment depreciation, permitting, wastewater treatment, financing and product qualification are not yet included, so this is potential value—not EBITDA guidance.", visual: <PurificationUpliftChart directSale={economicsData.cellPowder.scenario1} purifiedNet={economicsData.cellPowder.scenario2Net} /> },
  ];
  const slide = slides[current];
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.45 });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (isPaused || !isVisible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % slides.length), 30000);
    return () => window.clearTimeout(timer);
  }, [current, isPaused, isVisible, slides.length]);
  return <section ref={sectionRef} id="economic" className={`pv-screen os-economic is-auto${isPaused || !isVisible ? " is-paused" : ""}`} style={{ "--deck-duration": "30000ms" } as CSSProperties} aria-labelledby="economic-title" onFocusCapture={() => setIsPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") setCurrent((value) => Math.max(0, value - 1)); if (event.key === "ArrowRight") setCurrent((value) => Math.min(slides.length - 1, value + 1)); }}>
    <aside className="os-economic-copy">
      <div className="os-economic-copy-body"><h2 id="economic-title">Direct cell-powder sales support a profitable base case.</h2><p>For {economicsData.scenario.annualPanels.toLocaleString()} retired panels per year in the {economicsData.scenario.region} business-case scenario, PV Circulator preserves material value and sells the separated cell powder directly. Processing-fee sensitivity and the modeled purification upside are shown separately.</p><strong className="os-economic-result">PV Circulator delivers about <b>{usd(circulator.annualEbitdaAtCurrentFee / 1000)}k</b> annual EBITDA at {currentFeeLabel}</strong><div className="os-economic-actions"><a className="pv-button os-economic-cta" href="/business-case/">Run the numbers for your operation <Arrow /></a><a className="pv-text-button" href="/pv-circulator/#routes">See where the profit is <Arrow /></a></div></div>
      <div className="os-deck-navigation" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}><div className="os-deck-progress" aria-label="Choose an economic chart">{slides.map((item, index) => <button key={item.label} type="button" aria-label={`Show economic chart ${index + 1}: ${item.label}`} aria-pressed={current === index} onClick={() => setCurrent(index)}><span /><small>{item.label}</small></button>)}</div></div>
    </aside>
    <div className="os-economic-visual" aria-live="polite"><div key={`economic-${current}`} className="os-economic-slide"><div className="os-economic-slide-copy"><h3>{slide.heading}</h3><p>{slide.copy}</p><small>{slide.detail}</small></div><div className="os-economic-slide-graphic">{slide.visual}</div><p className="os-economic-source">{priceSources} · Weekly sources: silver XAG/USD spot via currency-api; LME aluminium cash and LME copper 3-month via Westmetall; SMM silicon #553 workbook value. Glass benchmarked to US cement {economicsData.productMaterials.find(m=>m.name === "Glass")!.value / economicsData.productMaterials.find(m=>m.name === "Glass")!.share} USD/t, USGS Mineral Commodity Summaries 2026. Scenario values are illustrative, not guaranteed commercial outcomes.</p></div></div>
  </section>;
}

const materialOutputs = [
  ["Glass", "/images/pvc-material-glass.webp", "Separated glass material from the PV Circulator brochure", "Pozzolan / recycled glass applications", "Layer-by-layer processing separates glass at room temperature, helping minimize cross-contamination while preserving options for pozzolan and recycled-glass applications."],
  ["Frame", "/images/pvc-material-frame.webp", "Recovered aluminum frames from the PV Circulator brochure", "Recovered aluminum applications", "The aluminum frame is removed as a distinct material stream before delamination, keeping it available for established aluminum recovery applications."],
  ["Junction Box", "/images/pvc-material-junction-box.webp", "Separated junction boxes from the PV Circulator brochure", "Metal and plastics recovery", "Automatic junction-box removal can separate this component before the panel enters the main process, preserving access to its metal and plastic fractions."],
  ["Backsheet", "/images/pvc-material-backsheet.webp", "Separated backsheet material from the PV Circulator brochure", "Thermoplastic recovery", "Room-temperature delamination recovers the backsheet as its own stream without thermal or chemical treatment."],
  ["EVA", "/images/pvc-material-eva.webp", "Separated EVA material from the PV Circulator brochure", "PCR EVA production", "Keeping EVA separate from glass and cell material reduces cross-contamination and creates a defined input for PCR EVA production, subject to downstream qualification."],
  ["Cells", "/images/pvc-material-cells.webp", "Glass-free cell fraction from the PV Circulator brochure", "Glass-free silicon, silver & metal recovery", "Layer-by-layer separation concentrates the cell fraction without crushed glass, preserving a more useful stream for silicon, silver and other metal recovery."],
] as const;

const materialPathways = [
  { material: "Silver + copper", routes: [{ destination: "Refinery", detail: "Separated silicon (cell) powder is directed to further metal recovery." }] },
  { material: "Aluminum frame", routes: [{ destination: "Recycled aluminum", detail: "" }] },
  { material: "Glass", routes: [{ destination: "Cement substitute", detail: "" }] },
  { material: "Silicon", routes: [
    { destination: "H₂ + silicate", detail: "Alkaline processing produces hydrogen for fuel-cell power and sodium silicate." },
    { destination: "MG-Si", detail: "Acid processing separates metals and produces metallurgical-grade silicon." },
  ] },
  { material: "EVA + backsheet", routes: [{ destination: "Recycled plastics", detail: "EVA can be de-crosslinked and remade into foamed shoe soles; backsheets can be used in injection-moulded or extruded products." }] },
] as const;

function MaterialsSection({data}:{data:OurSolutionView}) {
  const silver=webNum(data,"materials.silver_demand_recovered_percent"),other=webNum(data,"materials.other_demand_recovered_percent"),start=webNum(data,"materials.demand_horizon_start_year"),end=webNum(data,"materials.demand_horizon_end_year"),aluminiumCarbon=webNum(data,"materials.recycled_aluminium_primary_carbon_percent");
  const glassShare=data.productMaterials.find(material=>material.name==="Glass")!.share*100;
  const pathways=materialPathways.map(pathway=>pathway.material==="Aluminum frame"?{...pathway,routes:[{...pathway.routes[0],detail:`Around ${compactNumber(aluminiumCarbon)}% of the carbon emissions of primary aluminum.`}]}:pathway.material==="Glass"?{...pathway,routes:[{...pathway.routes[0],detail:`About ${compactNumber(glassShare)}% of panel weight, prepared for pozzolan applications.`}]}:pathway);
  return <section id="materials" className="pv-screen os-materials-section" aria-labelledby="materials-title">
    <div className="os-materials-overview">
      <h2 id="materials-title">Recycling ends where feedstock begins.</h2>
      <div className="os-materials-overview-grid">
        <div className="os-materials-demand"><strong><small>Nearly</small><span>{compactNumber(silver)}%</span></strong><h3>of solar-industry silver demand could be supplied by recovered material.</h3><p>Aluminum, copper, glass and silicon could each exceed {compactNumber(other)}% by {compactNumber(start)}–{compactNumber(end)} in the IEA assessment—if the recovered materials are clean enough to return as feedstock.</p><p className="os-materials-citation">Source: <a href="https://www.iea.org/reports/solar-pv-global-supply-chains">{data.websiteData["materials.silver_demand_recovered_percent"].source}</a>.</p></div>
        <div className="os-material-pathways" aria-label="Recovered materials and their upstream applications">{pathways.map(({ material, routes }) => <div className={`os-material-pathway${routes.length > 1 ? " is-grouped" : ""}`} key={material}><strong>{material}</strong>{routes.map(({ destination, detail }) => <div className="os-material-route" key={destination}><b>{destination}</b><span>{detail}</span></div>)}</div>)}</div>
      </div>
    </div>
    <aside className="os-materials-scroll" tabIndex={0} aria-label="Recovered material streams. Scroll for all six materials.">
      <div className="os-materials-scroll-intro"><h3>{materialOutputs.length} outputs.<br />{materialOutputs.length} routes back into industry.</h3><p>PV Circulator separates the module layer by layer at room temperature, preserving distinct streams for downstream recovery and qualification.</p></div>
      {materialOutputs.map(([label, image, imageAlt, route, note]) => <article key={label}><figure><img src={image} alt={imageAlt} loading="lazy" /></figure><div><span>{route}</span><h3>{label}</h3><p>{note}</p></div></article>)}
    </aside>
  </section>;
}

export function OurSolution({ economicsData = economicsView(seededOurSolutionData), routeMetrics = [], breakeven = null, capacityTrend = defaultCapacityTrend, retirementWave = defaultRetirementWave, retirementMarketWaves = defaultRetirementMarketWaves, pressureData=defaultPressureData, waveAssumptions=defaultWaveAssumptions, priceSources="Workbook prices", pricingRules=initialRules, residentialSurchargePct=defaultTransportLimits.residentialSurchargePct }: { economicsData?: OurSolutionView; routeMetrics?: RouteEnvironmentalMetric[]; breakeven?: BreakevenView; capacityTrend?: CapacityTrendPoint[]; retirementWave?: RetirementWave; retirementMarketWaves?: RetirementMarketWaves; pressureData?:{year:string;values:number[]}[];waveAssumptions?:WaveAssumptions;priceSources?:string;pricingRules?:PricingRules;residentialSurchargePct?:number }) {
  const capacityPeak = Math.max(...capacityTrend.map(point => point.total));
  const capacityFirst = capacityTrend[0], capacityLast = capacityTrend[capacityTrend.length - 1];
  const capacityMultiples=trendRegions.map((market,index)=>({market,multiple:capacityFirst.values[index]>0?capacityLast.values[index]/capacityFirst.values[index]:0}));
  const [active, setActive] = useState<SectionId>("overview");
  const [stake, setStake] = useState<StakeTopic>("cost");
  const [audience, setAudience] = useState<AudienceTopic>("owner");
  const [demandMarket, setDemandMarket] = useState<DemandMarket>("United States");

  useEffect(() => {
    document.documentElement.classList.add("os-section-scroll");
    const observed = sections.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    const visibleRatios = new Map<Element, number>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => visibleRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
      const visible = observed.reduce<HTMLElement | null>((current, element) => {
        if (!current) return element;
        return (visibleRatios.get(element) ?? 0) > (visibleRatios.get(current) ?? 0) ? element : current;
      }, null);
      if (visible && (visibleRatios.get(visible) ?? 0) > 0) setActive(visible.id as SectionId);
    }, { threshold: [0, 0.35, 0.55, 0.75, 1] });
    observed.forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); document.documentElement.classList.remove("os-section-scroll"); };
  }, []);

  const lightNavigation = ["wave", "stakes", "conventional", "regulation", "materials", "value", "economic", "system", "evidence", "scale", "pathways"].includes(active);
  const selectedStake = stakeSolutions[stake];
  const selectedAudience = audienceTopics[audience];
  const selectedGoal=stake==="circularity"?`${compactNumber(webNum(economicsData,"stakes.circularity_goal_percent"))}% reusable.`:selectedStake.goal;
  const cards=systemCardContent(economicsData);
  const demandYears=[2025,2030,2040,2050],lineCapacityMw=webNum(economicsData,"scale.line_capacity_mw_per_year"),demandWave=retirementMarketWaves[demandMarket];
  const demandIndex=demandYears.map(year=>demandWave.years.indexOf(year));
  const demand=(loss:"early"|"regular")=>demandIndex.map(index=>Math.ceil(demandWave[`${loss}_T${waveAssumptions.defaultLifetime}`][index]/waveAssumptions.tonnesPerMw/lineCapacityMw));
  const earlyDemand=demand("early"),regularDemand=demand("regular");
  const demandMarketLabel=demandMarkets.find(item=>item.key===demandMarket)?.label??demandMarket;
  const pressureFirst=pressureData[0],pressureLast=pressureData[pressureData.length-1];
  const pressureMultiples=pressureLast.values.map((value,index)=>pressureFirst.values[index]>0?value/pressureFirst.values[index]:0);
  const positivePressureMultiples=pressureMultiples.filter(value=>value>0),pressureMultipleLow=Math.round(Math.min(...positivePressureMultiples)),pressureMultipleHigh=Math.round(Math.max(...positivePressureMultiples));
  const highestPressureIndex=pressureLast.values.indexOf(Math.max(...pressureLast.values));

  const waveSlides: DeckSlide[] = [
    { label: "Installation trend", navigationLabel: "Installed capacity", visual: <div className="os-data-slide os-market-slide"><h2>Installed solar capacity grows from {capacityFirst.totalLabel} to {capacityLast.totalLabel} by {capacityLast.year}.</h2><StackedTrendChart data={capacityTrend} max={capacityPeak} tone="neutral" label="Cumulative installed solar capacity by market, with one stacked column for every year from 2025 to 2050" /></div>, noteTitle: "Today’s installations define tomorrow’s retirement geography.", note: <><p>Every annual column represents the infrastructure already being built toward a much larger retirement market. The market mix shows where future collection and processing capacity will be needed.</p><table className="os-capacity-multiple-table"><caption>Installed capacity growth, 2025–2050</caption><thead><tr><th>Market</th><th>Growth</th></tr></thead><tbody>{capacityMultiples.map(({market,multiple})=><tr key={market}><td>{market}</td><td>{multiple.toFixed(1)}×</td></tr>)}</tbody></table></> },
    { label: "Retirement volume", navigationLabel: "Retirement volume", visual: <div className="os-data-slide os-wave-global-slide"><h2>The global retirement wave compounds through 2050.</h2><GlobalCumulativeRetirementChart waves={retirementMarketWaves} assumptions={waveAssumptions} /></div>, noteTitle: "", note: <CountryRetirementExplorer waves={retirementMarketWaves} assumptions={waveAssumptions} /> },
    { label: "Per-capita processing pressure", navigationLabel: "Per-capita pressure", visual: <div className="os-data-slide os-market-slide os-pressure-slide"><h2>Per-capita processing pressure rises unevenly through 2050.</h2><PressureTrendChart data={pressureData} /></div>, noteTitle: `By 2050, per-capita pressure is ${pressureMultipleLow}–${pressureMultipleHigh}× its 2025 level.`, note: <><p>{pressureSeries[highestPressureIndex].label} rises from {pressureFirst.values[highestPressureIndex].toFixed(1)} to {pressureLast.values[highestPressureIndex].toFixed(1)} kg per person—about {Math.round(pressureMultiples[highestPressureIndex])}×—the highest pressure among the modeled markets. The divergence strengthens the case for regional and deployable capacity rather than planning from a single global endpoint. Population source: UN World Population Prospects 2022, Medium variant.</p><table className="os-capacity-multiple-table"><caption>Per-capita processing pressure growth, 2025–2050</caption><thead><tr><th>Market</th><th>Growth</th></tr></thead><tbody>{pressureSeries.map((series,index)=><tr key={series.label}><td>{series.label}</td><td>{pressureMultiples[index].toFixed(1)}×</td></tr>)}</tbody></table></> },
  ];

  const conventionalSlides: DeckSlide[] = [
    { label: "Space and technology", navigationLabel: "Footprint", visual: <FootprintMethodVisual data={economicsData} />, noteTitle: "A small footprint changes where recycling can happen.", note: <p>PV Circulator is modular and deployable, so capacity can be installed on-site or near-site as volumes shift. The idea is simple: move the machine, not the panels.</p> },
    { label: "Operating cost", navigationLabel: "OPEX", visual: <OperatingCostMethodVisual economicsData={economicsData} />, noteTitle: "PV Circulator changes the operating-cost structure.", note: <p>Automation comes first. Integrated handling, measurement and layer separation reduce repetitive labor and support consistent output. In our California operating scenario, lower labor, electricity and floor-space requirements reduce the modeled cost per panel; equipment depreciation and logistics remain outside the comparison.</p> },
    { label: "Secondary treatment and materials", navigationLabel: "Secondary treatment", visual: <MaterialMethodVisual data={economicsData} />, noteTitle: "The real difference is what still needs treatment.", note: <p>PV Circulator starts from first principles: panels are built in layers, so reverse the manufacturing process and separate them layer by layer. This preserves glass, silicon (cell) powder and polymers as distinct outputs and leaves less material requiring secondary treatment.</p> },
  ];

  const scaleSlides: DeckSlide[] = [
    { label: "Commercial footprint", navigationLabel:"Markets", visual: <div className="os-data-slide os-scale-map-slide"><h2>PV Circulator global commercialization</h2><GlobalDeploymentMap /></div>, noteTitle: "", note: <div className="os-scale-market-list"><article><strong>USA | Deployed</strong><span>Permitted by California DTSC</span><p>Permitted by the California Department of Toxic Substances Control (DTSC) to receive, process and recycle end-of-life PV panels; R2v3 and ISO 9001/14001/45001 management systems.</p></article><article><strong>Australia | Launch in {compactNumber(webNum(economicsData,"scale.australia_launch_year"))}</strong><p>An integrated solution combining PV Circulator and Material Upcycling technologies with downstream utilization pathways.</p></article><article><strong>Japan | Market development in progress</strong><p>Working with a Japanese trading company to promote PV Circulator in Japan.</p></article><article><strong>Europe | Partnership in progress</strong><p>Working with local partners to integrate PV Circulator into existing processes.</p></article><article><strong>Taiwan | Launch end of {compactNumber(webNum(economicsData,"scale.taiwan_launch_year"))}</strong><p>Planned for the Miaoli hydrogen zone, the alkaline route converts recovered silicon into hydrogen for fuel-cell power.</p></article></div> },
    { label:"Equipment demand",navigationLabel:"Equipment demand",visual:<div className="os-data-slide os-scale-demand-slide"><h2>Retirement volume becomes equipment demand.</h2><div className="os-demand-market-tabs" role="group" aria-label="Choose an equipment-demand market">{demandMarkets.map(item=><button type="button" key={item.key} aria-pressed={demandMarket===item.key} onClick={()=>setDemandMarket(item.key)}>{item.label}</button>)}</div><EquipmentDemandChart years={demandYears} early={earlyDemand} regular={regularDemand} lineCapacityMw={lineCapacityMw} marketLabel={demandMarketLabel}/><PublishedCapacityGap data={economicsData} market={demandMarket}/></div>,noteTitle:"Capacity demand accelerates after 2030.",note:<div className="os-scale-demand-copy"><p>At <strong>{lineCapacityMw.toFixed(0)} MW per line-year</strong>, annual {demandMarketLabel} retirements imply {regularDemand.at(-1)?.toLocaleString("en-US")} systems in the regular-loss scenario and {earlyDemand.at(-1)?.toLocaleString("en-US")} in the early-loss scenario by 2050.</p><p>Scenario, not a forecast. Equipment demand is annual retired mass divided by modeled line capacity; utilization, geography, downtime and market share are not applied.</p></div>},
  ];

  return <div className={`pv-review os-page${lightNavigation ? " pv-light-nav" : ""}`}>
    <a className="pv-skip" href="#overview">Skip to Our Solution</a><PublicHeader assistantInlineLinks assistantTechnologyAnchor="#first-principles" />
    <nav className="pv-dots" aria-label="Our Solution sections">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "step" : undefined}><i /><span>{label}</span></a>)}</nav>
    <main>
      <section id="overview" className="pv-screen pv-hero os-hero" aria-labelledby="os-title"><video autoPlay muted loop playsInline poster="/images/pvcirculator-oursolution-poster.jpg"><source src="/videos/pvcirculator-oursolution.mp4" type="video/mp4" /></video><div className="pv-hero-shade" /><div className="pv-hero-copy"><h1 id="os-title">Owners pay less.<br />Recyclers earn more.<br />Materials stay in circulation.</h1><p className="os-legacy-line">The next solar industry challenge begins when generation ends.</p><p className="os-hero-context">For owners, recyclers and investors, decommissioning brings cost, compliance, reputation and material value into the same decision.</p></div><a className="pv-down" href="#wave" aria-label="Continue to the coming decommissioning wave"><Arrow /></a></section>
      <section id="wave" className="pv-screen os-deck-section" aria-label="The coming decommissioning wave"><StoryDeck id="wave-deck" title="The coming decommissioning wave" slides={waveSlides} variant="split" autoAdvanceMs={30000} /></section>
      <section id="stakes" className="pv-screen os-stakes" aria-labelledby="stakes-title">
        <div className="os-stakes-main">
          <h2 id="stakes-title">What is at stake?</h2>
          <p>Owners, recyclers, material users and the public each see retired panels differently—but they all need the same four things.</p>
          <div className="os-stake-tabs" role="group" aria-label="Choose a stakeholder outcome">{(Object.keys(stakeSolutions) as StakeTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={stake === topic} onClick={() => setStake(topic)}><StakeIcon topic={topic} /><strong>{stakeSolutions[topic].label}</strong></button>)}</div>
          {stake==="cost"&&<CostBenchmarkChart data={economicsData} rules={pricingRules} residentialSurchargePct={residentialSurchargePct}/>}
          {stake==="compliance"&&<div className="os-compliance-risk"><strong className="os-compliance-risk-mark">HFCs</strong><div><h3>Keep fluorinated backsheets out of the environment.</h3><p>Some PV backsheets contain PVF or PVDF fluoropolymers. Under broad definitions, these materials fall within PFAS—the persistent chemicals often called “forever chemicals.” Thermal treatment can generate hydrogen fluoride (HF) and other fluorinated decomposition products, while landfill leaves persistent fluoropolymers in the environment. PV Circonomy’s first mission is to recover EVA and backsheets as separate streams and return them to qualified use.</p></div></div>}
          {stake==="circularity"&&<div className="os-compliance-risk os-offtake-service"><strong className="os-circularity-mark"><b>{compactNumber(webNum(economicsData,"stakes.circularity_goal_percent"))}%</b><span>reusable</span></strong><div><h3>Build the next use market by market.</h3><p>PV Circonomy provides more than recycling technology: we also provide material-upcycling technology and offtake services. Our localized strategy keeps recovered materials in use close to where they are generated, adapting to the industrial ecosystem of each country and region. EVA and backsheet offtake connects these separated streams to qualified local or downstream uses so every recovered material can be put to responsible use.</p><span><b>Offtake service</b> EVA and backsheet qualification and downstream placement.</span></div></div>}
          {stake==="reputation"&&<div className="os-compliance-risk os-connected-service"><strong className="os-connected-mark">Connected</strong><div><h3>Make recycling itself valuable.</h3><p>PV Circonomy connects upstream and downstream partners so recyclers can account responsibly to investors for where recovered materials go, while material users can disclose their origin to consumers. By making both destination and provenance visible, the work of recycling itself becomes valuable.</p></div></div>}
          <div key={stake} className="os-stakeholder-needs" aria-live="polite"><strong>{selectedStake.label} by stakeholder</strong>{selectedStake.stakeholders.map(([stakeholder, need]) => <div key={stakeholder}><span>{stakeholder}</span><p>{need}</p></div>)}</div>
        </div>
        <aside className="os-speaker-notes" aria-live="polite"><div key={stake}><span className="os-note-label">{selectedStake.label}</span><h3>{selectedStake.heading}</h3><div className="os-note-copy"><p>{selectedStake.intro}</p></div><p className="os-stake-goal"><strong>Our goal</strong><span>{selectedGoal}</span></p><div className="os-solution-drivers">{selectedStake.drivers.map(([driver, outcome]) => <div key={driver}><strong>{driver}</strong><p>{outcome}</p></div>)}</div><div className="os-stakes-bridge"><strong>{selectedStake.conclusion}</strong><small>{selectedStake.note}</small><a className="pv-text-button" href="#conventional">See why conventional methods fall short <Arrow /></a></div></div></aside>
      </section>
      <section id="system" className="pv-screen os-system" aria-labelledby="system-title"><div className="os-system-stage"><div className="os-system-heading"><h2 id="system-title">Our solution</h2><p>One circular system answers the four shared needs: lower cost, provable compliance, material circularity and defensible reputation.</p></div><div className="os-system-flow" role="list" aria-label="The PV Circonomy circular value system">{(Object.keys(systemTopics) as SystemTopic[]).map((topic) => <article key={topic} role="listitem"><figure><img src={systemVisuals[topic].src} alt={systemVisuals[topic].alt} /></figure><div className="os-system-card-copy"><div><strong>{systemTopics[topic][0]}</strong><span> | {cards[topic].tagline}</span></div><ul>{cards[topic].bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div></article>)}</div></div></section>
      <ProcessPlaylist active={active === "first-principles"} sectionId="first-principles" titleId="first-principles-title" heading={<>Simple principle.<br />Layer by layer.<br />Material by material.</>} />
      <section id="conventional" className="pv-screen os-deck-section" aria-label="Why conventional recycling destroys value"><StoryDeck id="conventional-deck" title="Why conventional recycling destroys value" slides={conventionalSlides} variant="split" autoAdvanceMs={30000} /></section>
      <RegulationSection metrics={routeMetrics} assumptions={waveAssumptions} data={economicsData} />
      <MaterialsSection data={economicsData} />
      <ValueSection economicsData={economicsData} />
      <EconomicSection economicsData={economicsData} breakeven={breakeven} priceSources={priceSources} />
      <section id="evidence" className="pv-screen os-evidence-section os-passport-section" aria-labelledby="evidence-title"><div className="os-evidence-list os-passport-main"><div><h2 id="evidence-title">Every panel gets a record:<br /><span>origin, process, destination.</span></h2><p className="os-passport-intro">Lower recycling cost and higher material value are only the beginning. A verifiable record makes the act of recycling valuable in its own right.</p></div><div className="os-passport-flow" role="list" aria-label="The three parts of a panel recycling record"><article role="listitem"><strong>Origin</strong><p>Site, owner, quantity and module identity.</p></article><article role="listitem"><strong>Process</strong><p>Treatment path, energy use and recovery results.</p></article><article role="listitem"><strong>Destination</strong><p>The receiver and next use of every material stream.</p></article></div><div className="os-passport-value"><p><strong>Owners</strong> receive audit-ready data for ESG, EPR and digital product passports.</p><p><strong>Material buyers</strong> receive traceable origin, composition and intended-use data.</p></div></div><aside className="os-speaker-notes"><div><h3>From physical action to verifiable record.</h3><div className="os-note-copy"><p>EasyCycle creates the record at the machine, distributes it across the network and makes it efficient to verify at scale.</p></div><div className="os-passport-tech"><div><strong>Generate at the machine</strong><p>Sensors and edge computing automatically create the process record as the machine operates—reducing reliance on manual entry.</p></div><div><strong>Lock data integrity</strong><p>Cryptographic hashes, trusted timestamps and IPFS create a tamper-evident sequence of records.</p></div><div><strong>Scale storage with every machine</strong><p>Each PV Circulator acts as a decentralized edge node and contributes storage capacity as the network grows.</p></div><div><strong>Verify efficiently at scale</strong><p>Distributed capacity expands with each node; Merkle Tree batch proofs lower the incremental cost of verifying each record.</p></div><div><strong>Disclose selectively</strong><p>Ontology and role-based access connect the record while protecting raw data and commercial information.</p></div></div></div><Link className="pv-text-button" href="/easycycle/">Explore EasyCycle <Arrow /></Link></aside></section>
      <section id="scale" className="pv-screen os-deck-section" aria-label="From technology to commercial scale"><StoryDeck id="scale-deck" title="From technology to commercial scale" slides={scaleSlides} variant="split" autoAdvanceMs={30000} /></section>
      <section id="pathways" className="pv-screen os-audience" aria-labelledby="audience-title"><div className="os-audience-heading"><h2 id="audience-title">Choose your role in the circular solar economy—and take action.</h2><div className="os-audience-tabs" role="group" aria-label="Choose your role">{(Object.keys(audienceTopics) as AudienceTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={audience === topic} onClick={() => setAudience(topic)}>{audienceTopics[topic][0]}</button>)}</div></div><div className="os-audience-detail" aria-live="polite"><span>{selectedAudience[0]}</span><h3>{selectedAudience[1]}</h3><p>{selectedAudience[4]}</p><div className="os-audience-actions"><Link className="pv-button" href={selectedAudience[3]}>{selectedAudience[2]} <Arrow /></Link>{audience === "recycler" && <a className="pv-text-button" href="/business-case/">Calculate your business case <Arrow /></a>}</div></div><footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span><span>PV Circulator · Material Upcycling · EasyCycle</span><a className="pv-text-button" href="#overview">Back to top</a></footer></section>
    </main>
  </div>;
}
