"use client";

import Link from "next/link";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { PublicHeader } from "./public-header";
import { ProcessPlaylist } from "./pv-circulator-page";
import { capacityTrend as buildCapacityTrend, usCumulativeMw, type CapacityTrendPoint } from "../../lib/market-capacity";
import { computeRetirementWave, type RetirementWave } from "../../lib/us-retirement-wave";
import seedMarketCapacity from "../../data/our-solution-market-capacity.json";
import type { MarketCapacityRow } from "../../lib/market-capacity";
import type { RouteEnvironmentalMetric } from "../../lib/route-comparison";
import economicsUsd from "../../data/our-solution-economics-usd.json";
import type { OurSolutionEconomics } from "../../lib/our-solution-data";
import { REFERENCE_CASE } from "../../lib/route-comparison/config";
import "./review-home.css";

export type BreakevenView = { region: string; feeUnit: string; currency: string; panelsPerMonth: number; panelWeightLb: number; source: string; fees: { code: string; breakevenFee: number | null }[] } | null;
const KG_PER_LB = 0.45359237;
const referenceTonnesPerMw = 1e6 / REFERENCE_CASE.panelWatts * REFERENCE_CASE.panelWeightLb * KG_PER_LB / 1000;

// Only fields used by the public story cross the server/client boundary.
export type OurSolutionView = Omit<OurSolutionEconomics, "solutions"> & { solutions: Omit<OurSolutionEconomics["solutions"][number], "residualMetricTons">[] };

const sections = [
  ["overview", "Solution"],
  ["wave", "Wave"],
  ["stakes", "Stakes"],
  ["system", "Solution"],
  ["conventional", "Methods"],
  ["regulation", "Rules"],
  ["first-principles", "Principle"],
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
const systemCardContent: Record<SystemTopic, { tagline: string; bullets: readonly string[] }> = {
  process: {
    tagline: "Clean × Compliant × Low-carbon",
    bullets: [
      "No chemicals, no heat, no process water; no secondary pollution",
      ">99% recovery, 1 panel/min throughput, <1 kWh/panel",
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

const audienceTopics = {
  owner: ["Owner / EPC / Contractor", "Retire panels at lower cost, with records you can prove.", "Prepare a project estimate", "/#pricing", "Plan quantity, condition, logistics and reporting requirements."],
  recycler: ["Recycler", "Add processing capacity while preserving more material value.", "Evaluate PV Circulator", "/pv-circulator/", "Review feedstock, configuration, output quality, deployment and partnership options."],
  investor: ["Investor / Strategic partner", "Help build the infrastructure behind circular solar.", "Discuss market expansion", "/contact/?interest=investment", "Review market timing, technology evidence, commercial milestones and the potential revenue model."],
} as const;
type AudienceTopic = keyof typeof audienceTopics;

const trendRegions = ["Europe", "United States", "Japan", "Taiwan", "Australia", "China", "Other markets"] as const;
type TrendPoint = { year: string; total: number; totalLabel: string; values: readonly number[] };

// Defaults for callers without published data; /solutions passes values computed from the published Market Capacity sheet.
const seededCapacityRows = seedMarketCapacity as MarketCapacityRow[];
const defaultCapacityTrend: CapacityTrendPoint[] = buildCapacityTrend(seededCapacityRows);
const defaultRetirementWave: RetirementWave = computeRetirementWave(usCumulativeMw(seededCapacityRows));


const pressureSeries = [
  { label: "World", className: "is-world" },
  { label: "Europe", className: "is-europe" },
  { label: "United States", className: "is-us" },
  { label: "Japan", className: "is-japan" },
  { label: "Taiwan", className: "is-taiwan" },
  { label: "China", className: "is-china" },
  { label: "Australia", className: "is-australia" },
] as const;

const pressureTrendData = [
  { year: "2025", values: [0.2001, 0.9380, 0.4624, 1.3826, 0.3025, 0.2672, 1.4287] },
  { year: "2030", values: [0.5846, 1.1444, 1.5738, 3.9299, 1.6045, 1.3933, 4.4508] },
  { year: "2035", values: [1.4664, 2.7245, 4.2549, 4.4053, 4.3777, 3.9213, 10.2252] },
  { year: "2040", values: [2.2198, 4.1104, 7.2590, 5.8441, 5.0184, 5.9628, 17.8375] },
  { year: "2045", values: [2.8362, 4.7097, 9.9705, 9.6326, 6.0560, 6.5096, 56.3391] },
  { year: "2050", values: [4.6795, 7.3047, 17.4643, 13.5528, 10.0640, 10.9649, 79.2550] },
] as const;

function PressureTrendChart() {
  const pressureTicks = [
    { value: 80, position: 100 },
    { value: 50, position: 85 },
    { value: 20, position: 70 },
    { value: 10, position: 35 },
    { value: 0, position: 0 },
  ] as const;
  const pressureHeight = (value: number) => value <= 20 ? value / 20 * 70 : 70 + (value - 20) / 60 * 30;
  return <div className="os-pressure-trend" role="img" aria-label="Annual retired-solar-panel processing pressure per person from 2025 to 2050 for the world, Europe, United States, Japan, Taiwan, China and Australia, based on our projection. The vertical axis is expanded from 0 to 20 kilograms per person and compressed from 20 to 80 kilograms per person.">
    <div className="os-pressure-plot">
      <div className="os-pressure-axis" aria-hidden="true">{pressureTicks.map((tick) => <span className={tick.value === 20 ? "is-break-tick" : undefined} key={tick.value} style={{ bottom: `${tick.position}%` }}>{tick.value}</span>)}<i className="os-pressure-axis-break" /></div>
      <div className="os-pressure-canvas">
        <div className="os-pressure-guides" aria-hidden="true">{pressureTicks.map((tick) => <i key={tick.value} style={{ bottom: `${tick.position}%` }} />)}</div>
        <div className="os-pressure-groups">{pressureTrendData.map((point) => <div className="os-pressure-group" key={point.year}>{pressureSeries.map((series, index) => { const pressure = point.values[index]; return <i className={series.className} style={{ height: `${Math.max(1.5, pressureHeight(pressure))}%` }} title={`${series.label}, ${point.year}: ${pressure.toFixed(1)} kg/person`} key={series.label} />; })}<small>{point.year}</small></div>)}</div>
        <div className="os-pressure-break" aria-hidden="true"><span>20–80 compressed</span></div>
      </div>
    </div>
    <div className="os-pressure-legend" aria-hidden="true">{pressureSeries.map((series) => <span key={series.label}><i className={series.className} />{series.label}</span>)}</div>
  </div>;
}

function StackedTrendChart({ data, max, label, tone }: { data: TrendPoint[]; max: number; label: string; tone: "neutral" | "negative" }) {
  const [highlightedRegion, setHighlightedRegion] = useState<number | null>(null);
  return <div className={`os-stacked-chart is-${tone}${highlightedRegion === null ? "" : " has-highlight"}`} role="group" aria-label={label}>
    <div className="os-stacked-bars is-annual">{data.map((point) => { const isMajor = Number(point.year) % 5 === 0; return <div className={`os-stacked-column${isMajor ? " is-major" : ""}`} key={point.year} aria-label={`${point.year}: ${point.totalLabel}`} title={`${point.year}: ${point.totalLabel}`}>
      <strong aria-hidden={!isMajor}>{isMajor ? point.totalLabel : ""}</strong>
      <span className="os-stack" style={{ height: `${Math.max(3, (point.total / max) * 100)}%` }} aria-hidden="true">{point.values.map((value, index) => <i className={`is-region-${index + 1}${highlightedRegion === index ? " is-highlighted" : ""}`} style={{ flexGrow: value }} key={`${point.year}-${trendRegions[index]}`} />)}</span>
      <small aria-hidden={!isMajor}>{isMajor ? point.year : ""}</small>
    </div>})}</div>
    <div className="os-stacked-legend" aria-label="Highlight a market" onMouseLeave={() => setHighlightedRegion(null)}>{trendRegions.map((region, index) => <button type="button" key={region} aria-pressed={highlightedRegion === index} onMouseEnter={() => setHighlightedRegion(index)} onFocus={() => setHighlightedRegion(index)} onBlur={() => setHighlightedRegion(null)} onClick={() => setHighlightedRegion(index)}><i className={`is-region-${index + 1}`} aria-hidden="true" /><span>{region}</span></button>)}</div>
  </div>;
}

type MethodRow = { label: string; shredding: string; thermal: string; pyrolysis?: string; circulator: string };
const FOUR_METHODS = ["Shredding", "Hot knife", "Pyrolysis", "PV Circulator"] as const;
const THREE_METHODS = ["Shredding", "Hot knife", "PV Circulator"] as const;

function MethodTable({ caption, rows, columns = FOUR_METHODS }: { caption: string; rows: MethodRow[]; columns?: readonly string[] }) {
  const four = columns.length === 4;
  return <div className={`os-method-detail-table${four ? " is-four" : ""}`}><table><caption className="pv-sr-only">{caption}</caption><thead><tr><th scope="col">Item</th>{columns.map((column, index) => <th scope="col" key={column} className={index === columns.length - 1 ? "is-circulator" : undefined}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.shredding}</td><td>{row.thermal}</td>{four && <td>{row.pyrolysis ?? "To be confirmed"}</td>}<td>{row.circulator}</td></tr>)}</tbody></table></div>;
}

const processRow: MethodRow = { label: "Process", shredding: "Remove frame, junction box and copper cable; shred the whole module and sieve", thermal: "Remove frame and junction box; a ~300 °C hot knife separates the glass from the encapsulant", pyrolysis: "Remove frame and junction box; heat the module at 450–650 °C to burn off EVA and backsheet, separating glass and cells", circulator: "Remove frame and junction box; mill layer by layer, separating backsheet, EVA and glass in turn" };
const technologyRows: MethodRow[] = [
  processRow,
  { label: "Footprint", shredding: "~480 m²", thermal: "To be confirmed", pyrolysis: "To be confirmed", circulator: "~30–40 m²" },
  { label: "Energy", shredding: "~5 kWh / panel", thermal: "To be confirmed", pyrolysis: "To be confirmed", circulator: "<1 kWh / panel" },
  { label: "Throughput", shredding: "~50–60 panels / h", thermal: "~40 panels / h (~90 s per panel)", pyrolysis: "To be confirmed", circulator: "~60 panels / h" },
  { label: "Staff", shredding: "5 / shift", thermal: "To be confirmed", pyrolysis: "To be confirmed", circulator: "1 direct + 2 indirect" },
  { label: "Product recovery", shredding: "~19%", thermal: "~88%", pyrolysis: "~88%", circulator: "SGS-measured 99.3%" },
  { label: "By-products", shredding: "Mixed fragments need further treatment", thermal: "Cell laminate (EVA, backsheet, cells) needs further treatment", pyrolysis: "Fluorinated off-gas needs treatment; cannot process glass-glass modules", circulator: "No off-gas or wastewater" },
];
const methodSources = "Sources: Shredding — TNO 2022 R10860 (Späth et al.) pp. 8, 12, 19; NEDO 2026 A1-2-14 (MRI) p. 8. Hot knife — TNO 2022 App. D.1 pp. 25–26 (~90 s per panel); IEA-PVPS T12-25:2023; NEDO 2026 p. 8. Pyrolysis — NEDO 2026 p. 8; Shinryo, JPEA 2026. Product recovery = sellable output by purity. “To be confirmed” marks figures without a confirmed source yet.";

const usd = (value: number, digits = 0) => value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits });
function economicsSolutions(data: OurSolutionView) { return {
  conventional: data.solutions.find((solution) => solution.code === "CONVENTIONAL")!,
  hotKnife: data.solutions.find((solution) => solution.code === "HOT_KNIFE")!,
  circulator: data.solutions.find((solution) => solution.code === "PVCIRCULATOR")!,
}; }

const materialRows: MethodRow[] = [
  processRow,
  { label: "Glass", shredding: "Mixed glass cullet", thermal: "Separated from the encapsulant", pyrolysis: "Separated after EVA and backsheet burn-off", circulator: "Graded by particle size and purity" },
  { label: "Silver", shredding: "Stays mixed in the fragments", thermal: "Stays in the cell laminate", pyrolysis: "Stays on the cells", circulator: "Ends in the silicon (cell) powder" },
  { label: "EVA / backsheet", shredding: "Mixed into fragments", thermal: "Stay attached to the cell laminate", pyrolysis: "Burned off", circulator: "Separated and recovered" },
  { label: "By-products", shredding: "Mixed fragments need further treatment", thermal: "Cell laminate needs further treatment", pyrolysis: "Fluorinated off-gas needs treatment", circulator: "No off-gas or wastewater" },
  { label: "Secondary treatment", shredding: "~54 t / MW", thermal: "~5 t / MW", pyrolysis: "No operating data yet", circulator: "~0.5 t / MW" },
];

function FootprintMethodVisual() {
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>PV Circulator’s modular design requires only ~30–40 m²—about 92–94% less footprint than shredding. The compact footprint makes near-site or on-site deployment possible.</p></div><div className="os-method-bars is-footprint" role="img" aria-label="Equipment footprint comparison: shredding 480 square metres, hot knife and pyrolysis to be confirmed, PV Circulator 30 to 40"><div><span>Shredding</span><i style={{ width: "100%" }} /><strong>~480 m²</strong></div><div><span>Hot knife</span><i style={{ width: "0%" }} /><strong>To be confirmed</strong></div><div><span>Pyrolysis</span><i style={{ width: "0%" }} /><strong>To be confirmed</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{ width: "8.3%" }} /><strong>~30–40 m²</strong></div></div></div><MethodTable caption="Recycling technology comparison" rows={technologyRows} /><p className="os-chart-source">{methodSources}</p></div>;
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
    { label: "Hot knife", total: usd(hotKnife.opexPerPanel.total, 2), width: `${hotKnife.opexPerPanel.total / peak * 100}%`, values: [hotKnife.opexPerPanel.electricity, hotKnife.opexPerPanel.laborAndBurden, hotKnife.opexPerPanel.facility, hotKnife.opexPerPanel.other], className: "" },
    { label: "PV Circulator", total: usd(circulator.opexPerPanel.total, 2), width: `${circulator.opexPerPanel.total / peak * 100}%`, values: [circulator.opexPerPanel.electricity, circulator.opexPerPanel.laborAndBurden, circulator.opexPerPanel.facility, circulator.opexPerPanel.other], className: "is-circulator" },
  ];
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>Operating cost per processed panel (USD), using the California business-case scenario at 5,000 panels per month.</p><small>Annual OPEX divided by 60,000 panels. CAPEX and equipment depreciation are excluded; maintenance is included.</small></div><div className="os-cost-bars" role="img" aria-label={`Operating cost per panel in US dollars: Shredding ${operatingBars[0].total}, Hot knife ${operatingBars[1].total}, PV Circulator ${operatingBars[2].total}`}>{operatingBars.map((bar) => <div className={bar.className} key={bar.label}><span>{bar.label}</span><div className="os-cost-track"><div className="os-cost-stack" style={{ width: bar.width }}>{bar.values.map((value, index) => <i className={`is-part-${index + 1}`} style={{ flexGrow: value }} key={index} />)}</div></div><strong>{bar.total}</strong></div>)}</div><div className="os-cost-legend" aria-label="Operating cost categories">{["Electricity", "Labor + burden", "Facility / rent", "Other OPEX"].map((item, index) => <span key={item}><i className={`is-part-${index + 1}`} />{item}</span>)}</div></div><MethodTable caption="Operating cost breakdown in US dollars per panel" rows={operatingCostRows} columns={THREE_METHODS} /><p className="os-chart-source">Pyrolysis is not modeled: no operating data yet.</p></div>;
}

function MaterialMethodVisual() {
  return <div className="os-method-visual"><div className="os-method-top"><div className="os-method-chart-copy"><p>Material requiring secondary treatment per MW. Shorter bars mean less material needs added processing or disposal.</p></div><div className="os-method-bars is-secondary" role="img" aria-label="Material requiring secondary treatment per megawatt: shredding 54 tonnes, hot knife 5 tonnes, PV Circulator about 0.5 tonnes; pyrolysis has no operating data yet"><div><span>Shredding</span><i style={{ width: "100%" }} /><strong>~54 t</strong></div><div><span>Hot knife</span><i style={{ width: "9.3%" }} /><strong>~5 t</strong></div><div className="is-circulator"><span>PV Circulator</span><i style={{ width: "1%" }} /><strong>~0.5 t</strong></div></div></div><MethodTable caption="Recovered materials comparison by technology" rows={materialRows} /><p className="os-chart-source">{methodSources}</p></div>;
}

function SilverValueVisual() {
  return <div className="os-data-slide os-silver-value-slide">
    <div className="os-value-intro">
      <h2 id="value-title">Silver is only 0.05% of a panel&apos;s weight—but 54% of its material value.</h2>
      <p>The technology difference begins after the frame comes off: preserving silver in a concentrated cell stream changes the economics of recovery.</p>
    </div>
    <div className="os-silver-value-chart" role="img" aria-label="A solar panel is approximately 17 percent aluminum frame, 70 percent glass and 0.05 percent silver by weight. Silver represents 54 percent of estimated recovered-material value, aluminum frame 23 percent and copper 10 percent.">
      <div className="os-silver-chart-row">
        <span>By weight · one panel</span>
        <div className="os-silver-weight-bar"><i className="is-silver" title="Silver · 0.05%" /><i className="is-frame"><b>Al frame</b><small>17%</small></i><i className="is-glass"><b>Glass</b><small>70%</small></i><i className="is-other"><b>Other</b><small>12.95%</small></i></div>
        <svg className="os-silver-connector" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="0" x2="100" y2="100" /></svg>
      </div>
      <div className="os-silver-chart-row">
        <span>By recovered-material value</span>
        <div className="os-silver-value-bar"><i className="is-silver"><b>Silver</b><small>54%</small></i><i className="is-frame"><b>Al frame</b><small>23%</small></i><i className="is-copper"><b>Copper</b><small>10%</small></i><i className="is-rest"><b>Rest</b><small>13%</small></i></div>
        <small>Rest: glass 6% · EVA 3% · silicon 3% · backsheet 1%</small>
      </div>
    </div>
  </div>;
}

const silverRows = [
  { method: "Shredding", fraction: "Mixed fragments (~82% of module mass)", silver: "≈0.06% (estimated)", recovery: "~19%" },
  { method: "Hot knife", fraction: "Cell laminate (~12%)", silver: "≈0.42% (estimated)", recovery: "~88%" },
  { method: "Pyrolysis", fraction: "Cells after burn-off", silver: "About 0.9–1.0% (estimated)", recovery: "~88%" },
  { method: "PV Circulator", fraction: "Silicon (cell) powder", silver: "1.5% (Elkem-measured)", recovery: "SGS-measured 99.3%" },
];
function SilverGradeTable() {
  return <div className="os-method-detail-table os-silver-grade-table"><table><caption className="pv-sr-only">Where silver ends up and product recovery, by method</caption><thead><tr><th scope="col">Method</th><th scope="col">Silver-bearing fraction</th><th scope="col">Silver content</th><th scope="col">Product recovery</th></tr></thead><tbody>{silverRows.map(row => <tr key={row.method} className={row.method === "PV Circulator" ? "is-circulator" : undefined}><th scope="row">{row.method}</th><td>{row.fraction}</td><td>{row.silver}</td><td>{row.recovery}</td></tr>)}</tbody></table></div>;
}

function ValueSection() {
  return <section id="value" className="pv-screen os-value-section" aria-labelledby="value-title">
    <div className="os-value-visual"><SilverValueVisual /></div>
    <aside className="os-value-explanation">
      <div className="os-value-grade"><h3>Keep silver concentrated.</h3><p>Separating panel layers preserves a concentrated cell stream for further recovery instead of dispersing silver into mixed glass.</p>
        <SilverGradeTable />
        <p className="os-chart-source">Silver content = silver ÷ total mass of the silver-bearing output, for every method. PV Circulator: Elkem-measured silver in the silicon (cell) powder. Shredding, Hot knife and Pyrolysis: estimated by mass balance from a reference module (mass %): glass 70, Al frame 17, junction box + cable 1, EVA 5, backsheet 3, silicon 3.0, Al paste 0.4, Cu ribbon 0.55, silver 0.05 (assumption, not measured).</p></div>
      <div id="silver-trend" className="os-silver-trend">
        <h3>Less silver in every panel. Recovery has to keep up.</h3>
        <p>Panel makers keep cutting silver to lower cost. Solar panels used about 13 g of silver per kW in 2024—less than half the 2014 level (IRENA, 2026). In 2025 the median TOPCon cell used about 10 mg per watt, and the industry roadmap expects about 6.3 mg per watt within ten years; heterojunction cells, 12.0 mg today, are expected to fall to 4.3 mg (ITRPV, 17th edition, 2026).</p>
        <p>Each retired panel will carry less silver than the one before. Recycling stays profitable only if far more of that silver is recovered, in a concentrated stream a refiner will pay for. Routes that grind silver into mixed glass or leave it inside a polymer layer lose that value first.</p>
        <p className="os-chart-source">Sources: <a href="https://www.irena.org/Publications">IRENA (2026)</a> · <a href="https://www.vdma.eu/documents/d/group-34568/en-press-release-itrpv-17-edition">ITRPV, 17th edition (2026)</a>.</p>
      </div>
    </aside>
  </section>;
}

type EconomicSeries = { label: string; values: number[]; className: string };

function RetirementLineChart({ lifetime, onLifetimeChange, wave: retirementWave }: { lifetime: 25 | 18 | 15 | 12; onLifetimeChange: (value: 25 | 18 | 15 | 12) => void; wave: RetirementWave }) {
  const SHOW_LIFETIME_REFERENCE = lifetime !== 25;
  const x = (year: number) => 48 + (year - 2016) / 34 * 500;
  const peak = Math.max(...retirementWave[`early_T${lifetime}`], ...retirementWave[`regular_T${lifetime}`], ...(SHOW_LIFETIME_REFERENCE ? [...retirementWave.early_T25, ...retirementWave.regular_T25] : []));
  const tickStep = peak > 5e6 ? 2 : 1;
  const ceilingMt = Math.max(4, Math.ceil(peak / 1e6 / tickStep) * tickStep);
  const ceiling = ceilingMt * 1e6;
  const ticks = Array.from({ length: ceilingMt / tickStep + 1 }, (_, index) => index * tickStep);
  const y = (value: number) => 202 - value / ceiling * 180;
  const basis = [
    { label: "Early-loss scenario (IRENA, main)", values: retirementWave[`early_T${lifetime}`], className: "is-early is-main" },
    { label: "Regular-loss scenario (comparison)", values: retirementWave[`regular_T${lifetime}`], className: "is-regular is-comparison" },
  ];
  const references = [retirementWave.early_T25, retirementWave.regular_T25];
  const points = (values: number[]) => retirementWave.years.map((year, i) => `${x(year)},${y(values[i])}`).join(" ");
  const ariaLabel = basis.map(series => `${series.label}: ${retirementWave.years.flatMap((year, i) => year % 5 === 0 ? [`${year}: ${series.values[i].toLocaleString("en-US")} tonnes`] : []).join("; ")}`).join(". ");
  return <figure className="os-economic-chart os-retirement-chart"><figcaption>Annual end-of-life PV panel mass, United States, 2016–2050: IRENA early-loss scenario, {lifetime}-year EoL lifetime (modelled; regular-loss shown for comparison).</figcaption>
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
      <select aria-label="EoL lifetime" value={lifetime} onChange={event => onLifetimeChange(Number(event.target.value) as 25 | 18 | 15 | 12)}>{[25, 18, 15, 12].map(value => <option key={value} value={value}>{value} years{value === 18 ? " (default)" : ""}</option>)}</select>
    </label>
  </figure>;
}

function RetirementContext({ lifetime, wave: retirementWave }: { lifetime: 25 | 18 | 15 | 12; wave: RetirementWave }) {
  const sources = {
    25: <>IRENA 2026 (25-year lifetime).</>,
    18: <>PV Circonomy conservative assumption (default).</>,
    15: <><a href="https://doi.org/10.1016/j.joule.2019.08.012">Jean, Woodhouse &amp; Bulović, Joule 2019</a> (initial life under 15 years).</>,
    12: <><a href="https://docs.nrel.gov/docs/fy21osti/74124.pdf">NREL/TP-6A20-74124 p.8</a> (repowering every 10–12 years, upper bound).</>,
  };
  return <div className="os-retirement-context" aria-live="polite">
    <p><strong>{lifetime}-year EoL lifetime, IRENA early-loss scenario.</strong> {sources[lifetime]}</p>
    <p>Default: 18-year lifetime, IRENA early-loss scenario. In {retirementWave.years[retirementWave.years.length - 1]}, early-loss retirements reach {(retirementWave[`early_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t; regular loss, for comparison, {(retirementWave[`regular_T${lifetime}`][retirementWave.years.length - 1] / 1e6).toFixed(2)} million t.</p>
    <table><caption>First year annual retirements cross each threshold (early loss is the main scenario)</caption><thead><tr><th scope="col">Annual mass</th><th scope="col">Early loss (main)</th><th scope="col">Regular loss (comparison)</th></tr></thead><tbody>{[100000, 500000, 1000000].map(threshold => <tr key={threshold}><th scope="row">{threshold === 1000000 ? "1 Mt" : `${threshold / 1000} kt`}</th><td>{retirementWave.crossings[`early_T${lifetime}`][String(threshold) as "100000" | "500000" | "1000000"]}</td><td>{retirementWave.crossings[`regular_T${lifetime}`][String(threshold) as "100000" | "500000" | "1000000"]}</td></tr>)}</tbody></table>
    <p className="os-chart-source">Scenario, not a forecast. IRENA Weibull shape factors: early loss 2.4928; regular loss 5.3759. Installed capacity: Market Capacity sheet (IRENA statistics 2000–2025, without AC-to-DC correction; 2026–2050 grows to 3.2 TW, the same path as the installed-capacity chart). Panels produce no waste in the year they are installed. Retired panels are replaced, so annual installations = net capacity growth + retired capacity, and replacement panels retire again. Panel mass per MW: IRENA 2026. Faint reference lines use IRENA 2026’s 25-year lifetime. Threshold years depend on these assumptions.</p>
  </div>;
}

function RegulationSection({ metrics }: { metrics: RouteEnvironmentalMetric[] }) {
  const ordered = ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"].map(code => metrics.find(item => item.code === code));
  const values = (key: "landfillTPerMw" | "co2eTPerMw") => ordered.map(item => item ? item[key].toFixed(2) : "Unavailable");
  const rows = [["Landfilled residue, t per MW", ...values("landfillTPerMw")], ["Process CO2e, t per MW", ...values("co2eTPerMw")]].map(([label, shredding, thermal, circulator]) => ({ label, shredding, thermal, circulator }));
  const rules = [
    ["United States (federal, RCRA).", "A retired solar panel that is discarded is a solid waste. It is hazardous waste if it fails the toxicity test for lead or cadmium (TCLP); the generator must make that determination. Solar panels are not yet a federal universal waste; EPA has a rulemaking in progress.", "https://www.epa.gov/hw/solar-panel-frequent-questions", "EPA FAQ"],
    ["California.", "Since 1 January 2021, hazardous end-of-life PV modules may be managed as universal waste under 22 CCR Chapter 23. Handlers and treatment facilities must notify DTSC and report annually.", "https://dtsc.ca.gov/photovoltaic-modules-pv-modules-universal-waste-management-regulations/", "DTSC"],
    ["North Carolina.", "From 1 December 2026, PV modules may not be disposed of in unlined landfills, including construction-and-demolition debris landfills.", "https://www.deq.nc.gov/north-carolina-landfill-disposal-bans", "NC DEQ"],
    ["European Union (WEEE Directive 2012/19/EU).", "PV panels are covered as large equipment: at least 85% must be recovered and 80% prepared for re-use and recycled.", "https://eur-lex.europa.eu/eli/dir/2012/19/oj", "EUR-Lex"],
  ];
  return <section id="regulation" className="pv-screen os-regulation" aria-labelledby="regulation-title"><div>
    <h2 id="regulation-title">Less to landfill. Less carbon in the process.</h2>
    <p>Per MW of retired panels ({REFERENCE_CASE.panelWatts} W modules at {REFERENCE_CASE.panelWeightLb} lb each, about {Math.round(referenceTonnesPerMw)} t), gate-to-gate: from panels arriving at the plant to separated materials leaving it. Process CO2e covers process electricity only.</p>
    <MethodTable caption="Environmental metrics per MW of retired panels" columns={THREE_METHODS} rows={rows} />
    <p className="os-chart-source">Landfill = residues sent to disposal in the Business Case master data; CO2e = process electricity (kWh per panel, Business Case master data) × US grid average 0.3497 kg CO2e/kWh (<a href="https://www.epa.gov/egrid/summary-data">EPA eGRID2023</a>). Transport, downstream refining and avoided emissions are excluded. Hot-knife routes leave an encapsulant–cell layer that still needs further treatment before its metals are recovered. Pyrolysis is not modeled: no operating data yet.</p>
  </div><div className="os-regulation-rules">{rules.map(([title, copy, href, source]) => <article key={title}><h3>{title}</h3><p>{copy}</p><a href={href}>{source} <Arrow /></a></article>)}</div></section>;
}

function EconomicLineChart({ title, subtitle, labels, series, min, max }: { title: string; subtitle: string; labels: string[]; series: EconomicSeries[]; min: number; max: number }) {
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
      {series.map((item) => <g className={item.className} key={item.label}>
        <polyline points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />
        {item.values.map((value, index) => <g key={`${item.label}-${labels[index]}`}><circle cx={x(index)} cy={y(value)} r="3" /><text x={x(index)} y={y(value) - 8} textAnchor="middle">{value.toLocaleString()}</text></g>)}
      </g>)}
      {labels.map((label, index) => <text className="os-economic-axis-label" x={x(index)} y={height - 8} textAnchor="middle" key={label}>{label}</text>)}
    </svg>
  </figure>;
}

function EconomicSection({ economicsData, breakeven }: { economicsData: OurSolutionView; breakeven: BreakevenView }) {
  const { conventional, hotKnife, circulator } = economicsSolutions(economicsData);
  const economicRows = [
    ["Material revenue — silver", usd(conventional.materialRevenue.silver), usd(hotKnife.materialRevenue.silver), usd(circulator.materialRevenue.silver)],
    ["Material revenue — Al, Cu", usd(conventional.materialRevenue.aluminumAndCopper), usd(hotKnife.materialRevenue.aluminumAndCopper), usd(circulator.materialRevenue.aluminumAndCopper)],
    ["Other recovered materials", usd(conventional.materialRevenue.other), usd(hotKnife.materialRevenue.other), usd(circulator.materialRevenue.other)],
    ["Total material revenue", usd(conventional.annualMaterialRevenue), usd(hotKnife.annualMaterialRevenue), usd(circulator.annualMaterialRevenue)],
    ["Operating cost", usd(conventional.annualOpex), usd(hotKnife.annualOpex), usd(circulator.annualOpex)],
    ["Annual EBITDA", usd(conventional.annualEbitda), usd(hotKnife.annualEbitda), usd(circulator.annualEbitda)],
  ] as const;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const feeSeries: EconomicSeries[] = [
    { label: "Shredding", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.CONVENTIONAL, className: "is-shredding" },
    { label: "Hot knife", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.HOT_KNIFE, className: "is-thermal" },
    { label: "PV Circulator", values: economicsData.feeSensitivity.annualEbitdaUsdThousands.PVCIRCULATOR, className: "is-circulator" },
  ];
  const silverSeries: EconomicSeries[] = [
    { label: "Shredding", values: economicsData.silverSensitivity.annualEbitdaUsdThousands.CONVENTIONAL, className: "is-shredding" },
    { label: "Hot knife", values: economicsData.silverSensitivity.annualEbitdaUsdThousands.HOT_KNIFE, className: "is-thermal" },
    { label: "PV Circulator", values: economicsData.silverSensitivity.annualEbitdaUsdThousands.PVCIRCULATOR, className: "is-circulator" },
  ];
  const breakevenFee = (code: string) => breakeven?.fees.find(item => item.code === code)?.breakevenFee;
  const feeText = (value: number | null | undefined) => value == null || !breakeven ? null : `${value.toLocaleString("en-US", { style: "currency", currency: breakeven.currency, minimumFractionDigits: 3, maximumFractionDigits: 3 })}${breakeven.feeUnit.replace(/^[A-Z]{3}/, "")}`;
  const shreddingBreakeven = feeText(breakevenFee("CONVENTIONAL")), hotKnifeBreakeven = feeText(breakevenFee("HOT_KNIFE")), circulatorBreakeven = breakevenFee("PVCIRCULATOR");
  const breakevenCopy = breakeven && shreddingBreakeven && hotKnifeBreakeven ? `Breakeven processing fee (annual EBITDA = 0): Shredding ${shreddingBreakeven}, Hot knife ${hotKnifeBreakeven}${circulatorBreakeven === 0 ? "; PV Circulator is EBITDA-positive with no processing fee" : ""}. Across the modeled $0–$0.30/lb range, PV Circulator retains the highest annual EBITDA.` : null;
  const breakevenDetail = breakeven && breakevenCopy ? `Breakeven fees from the Business Case engine on the ${breakeven.source.toLowerCase()}: ${breakeven.region}, ${breakeven.panelsPerMonth.toLocaleString("en-US")} panels/month, ${breakeven.panelWeightLb} lb/panel. CAPEX and equipment depreciation are excluded; maintenance is included.` : null;
  const slides = [
    { label: "Annual P&L", heading: "Material recovery value sets the ranking.", copy: `At zero processing fee, Shredding models about ${usd(conventional.annualEbitda / 1000)}k, Hot knife ${usd(hotKnife.annualEbitda / 1000)}k and PV Circulator ${usd(circulator.annualEbitda / 1000)}k in annual EBITDA.`, detail: `${economicsData.scenario.region} business-case scenario: ${economicsData.scenario.panelsPerMonth.toLocaleString()} panels/month, ${economicsData.scenario.annualPanels.toLocaleString()} panels/year and ${economicsData.scenario.panelWeightLb} lb/panel. CAPEX and equipment depreciation are excluded; maintenance is included.`, visual: <div className="os-economic-table-wrap"><table><caption>Annual profit and loss in US dollars, with no processing fee</caption><thead><tr><th scope="col">Annual · USD</th><th scope="col">Shredding</th><th scope="col">Hot knife</th><th scope="col">PV Circulator</th></tr></thead><tbody>{economicRows.map(([label, conventionalValue, hotKnifeValue, circulatorValue]) => <tr key={label}><th scope="row">{label}</th><td>{conventionalValue}</td><td>{hotKnifeValue}</td><td>{circulatorValue}</td></tr>)}</tbody></table></div> },
    { label: "Processing fee", heading: "Processing fees lift revenue, but do not change the order.", copy: breakevenCopy ?? "Across the modeled $0–$0.30/lb processing-fee range, PV Circulator retains the highest annual EBITDA.", detail: breakevenDetail ?? "California business-case scenario at 5,000 panels/month. CAPEX and equipment depreciation are excluded; maintenance is included.", visual: <EconomicLineChart title="Processing fee vs. annual EBITDA" subtitle="$1,000 per year · California · 5,000 panels/month" labels={["$0", "$0.05", "$0.10", "$0.15", "$0.20", "$0.25", "$0.30/lb"]} series={feeSeries} min={-400} max={1300} /> },
    { label: "Silver price", heading: "Silver price changes the spread, not the ranking.", copy: "Across a ±30% silver-price range, PV Circulator remains the strongest modeled annual outcome.", detail: "This sensitivity uses no processing fee and changes only modeled silver revenue. CAPEX and equipment depreciation are excluded; maintenance is included.", visual: <EconomicLineChart title="Silver price vs. annual EBITDA" subtitle="$1,000 per year · no processing fee" labels={["−30%", "−15%", "Base", "+15%", "+30%"]} series={silverSeries} min={-400} max={600} /> },
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
    const timer = window.setTimeout(() => setCurrent((value) => (value + 1) % slides.length), 10000);
    return () => window.clearTimeout(timer);
  }, [current, isPaused, isVisible, slides.length]);
  return <section ref={sectionRef} id="economic" className={`pv-screen os-economic is-auto${isPaused || !isVisible ? " is-paused" : ""}`} style={{ "--deck-duration": "10000ms" } as CSSProperties} aria-labelledby="economic-title" onFocusCapture={() => setIsPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false); }} onKeyDown={(event) => { if (event.key === "ArrowLeft") setCurrent((value) => Math.max(0, value - 1)); if (event.key === "ArrowRight") setCurrent((value) => Math.min(slides.length - 1, value + 1)); }}>
    <aside className="os-economic-copy">
      <div className="os-economic-copy-body"><h2 id="economic-title">The lowest-impact process also delivers the highest operating profit.</h2><p>For {economicsData.scenario.annualPanels.toLocaleString()} retired panels per year in the {economicsData.scenario.region} business-case scenario, preserving material value changes the economics before any processing fee is charged.</p><strong className="os-economic-result">PV Circulator delivers about <b>{usd(circulator.annualEbitda / 1000)}k</b> annual EBITDA</strong><a className="pv-button os-economic-cta" href="/business-case/">Run the numbers for your operation <Arrow /></a><a className="pv-text-button" href="/pv-circulator/#routes">See where the profit is <Arrow /></a></div>
      <div className="os-deck-navigation" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}><div className="os-deck-progress" aria-label="Choose an economic chart">{slides.map((item, index) => <button key={item.label} type="button" aria-label={`Show economic chart ${index + 1}: ${item.label}`} aria-pressed={current === index} onClick={() => setCurrent(index)}><span /><small>{item.label}</small></button>)}</div></div>
    </aside>
    <div className="os-economic-visual" aria-live="polite"><div key={`economic-${current}`} className="os-economic-slide"><div className="os-economic-slide-copy"><h3>{slide.heading}</h3><p>{slide.copy}</p><small>{slide.detail} Pyrolysis is not modeled: no operating data yet.</small></div><div className="os-economic-slide-graphic">{slide.visual}</div><p className="os-economic-source">Source: TSGC internal operating scenario and cited MOE market parameters. Scenario values are estimates, not guaranteed commercial outcomes.</p></div></div>
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
  { material: "Aluminum frame", routes: [{ destination: "Recycled aluminum", detail: "Around 3% of the carbon emissions of primary aluminum." }] },
  { material: "Glass", routes: [{ destination: "Cement substitute", detail: "About 70% of panel weight, prepared for pozzolan applications." }] },
  { material: "Silicon", routes: [
    { destination: "H₂ + silicate", detail: "Alkaline processing produces hydrogen and sodium silicate." },
    { destination: "MG-Si", detail: "Acid processing produces metallurgical-grade silicon." },
  ] },
  { material: "EVA + backsheet", routes: [{ destination: "Recycled plastics", detail: "The goal is zero waste: turn every separated output into feedstock." }] },
] as const;

function MaterialsSection() {
  return <section id="materials" className="pv-screen os-materials-section" aria-labelledby="materials-title">
    <div className="os-materials-overview">
      <h2 id="materials-title">Recycling ends where feedstock begins.</h2>
      <div className="os-materials-overview-grid">
        <div className="os-materials-demand"><strong><small>Nearly</small><span>70%</span></strong><h3>of solar-industry silver demand could be supplied by recovered material.</h3><p>Aluminum, copper, glass and silicon could each exceed 20% by 2040–2050 in the IEA assessment—if the recovered materials are clean enough to return as feedstock.</p></div>
        <div className="os-material-pathways" aria-label="Recovered materials and their upstream applications">{materialPathways.map(({ material, routes }) => <div className={`os-material-pathway${routes.length > 1 ? " is-grouped" : ""}`} key={material}><strong>{material}</strong>{routes.map(({ destination, detail }) => <div className="os-material-route" key={destination}><b>{destination}</b><span>{detail}</span></div>)}</div>)}</div>
      </div>
    </div>
    <aside className="os-materials-scroll" tabIndex={0} aria-label="Recovered material streams. Scroll for all six materials.">
      <div className="os-materials-scroll-intro"><h3>Six outputs.<br />Six routes back into industry.</h3><p>PV Circulator separates the module layer by layer at room temperature, preserving distinct streams for downstream recovery and qualification.</p></div>
      {materialOutputs.map(([label, image, imageAlt, route, note]) => <article key={label}><figure><img src={image} alt={imageAlt} loading="lazy" /></figure><div><span>{route}</span><h3>{label}</h3><p>{note}</p></div></article>)}
    </aside>
  </section>;
}

export function OurSolution({ economicsData = economicsUsd as OurSolutionView, routeMetrics = [], breakeven = null, capacityTrend = defaultCapacityTrend, retirementWave = defaultRetirementWave }: { economicsData?: OurSolutionView; routeMetrics?: RouteEnvironmentalMetric[]; breakeven?: BreakevenView; capacityTrend?: CapacityTrendPoint[]; retirementWave?: RetirementWave }) {
  const capacityPeak = Math.max(...capacityTrend.map(point => point.total));
  const capacityFirst = capacityTrend[0], capacityLast = capacityTrend[capacityTrend.length - 1];
  const [active, setActive] = useState<SectionId>("overview");
  const [stake, setStake] = useState<StakeTopic>("cost");
  const [audience, setAudience] = useState<AudienceTopic>("owner");

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

  const [waveLifetime, setWaveLifetime] = useState<25 | 18 | 15 | 12>(18);
  const waveSlides: DeckSlide[] = [
    { label: "Installation trend", navigationLabel: "Installed capacity", visual: <div className="os-data-slide os-market-slide"><h2>Installed solar capacity grows from {capacityFirst.totalLabel} to {capacityLast.totalLabel} by {capacityLast.year}.</h2><StackedTrendChart data={capacityTrend} max={capacityPeak} tone="neutral" label="Cumulative installed solar capacity by market, with one stacked column for every year from 2025 to 2050" /></div>, noteTitle: "Today’s installations define tomorrow’s retirement geography.", note: <p>Every annual column represents the infrastructure already being built toward a much larger retirement market. The market mix shows where future collection and processing capacity will be needed.</p> },
    { label: "Retirement volume", navigationLabel: "Retirement volume", visual: <div className="os-data-slide os-market-slide os-us-retirement"><h2>When will US solar panels reach end of life?</h2><RetirementLineChart lifetime={waveLifetime} onLifetimeChange={setWaveLifetime} wave={retirementWave} /></div>, noteTitle: "The retirement scenario you choose.", note: <RetirementContext lifetime={waveLifetime} wave={retirementWave} /> },
    { label: "Per-capita processing pressure", navigationLabel: "Per-capita pressure", visual: <div className="os-data-slide os-market-slide os-pressure-slide"><h2>Per-capita processing pressure rises unevenly through 2050.</h2><PressureTrendChart /></div>, noteTitle: "Processing pressure grows at a different pace in every market.", note: <p>Our projection shows Australia rising to 79.3 kg per person by 2050, far above the other markets. The long view strengthens the case for regional and deployable capacity rather than planning from a single global endpoint.</p> },
  ];

  const conventionalSlides: DeckSlide[] = [
    { label: "Space and technology", navigationLabel: "Footprint", visual: <FootprintMethodVisual />, noteTitle: "A small footprint changes where recycling can happen.", note: <p>PV Circulator is modular and deployable, so capacity can be installed on-site or near-site as volumes shift. The idea is simple: move the machine, not the panels.</p> },
    { label: "Operating cost", navigationLabel: "OPEX", visual: <OperatingCostMethodVisual economicsData={economicsData} />, noteTitle: "PV Circulator changes the operating-cost structure.", note: <p>Automation comes first. Integrated handling, measurement and layer separation reduce repetitive labor and support consistent output. In our California operating scenario, lower labor, electricity and floor-space requirements reduce the modeled cost per panel; equipment depreciation and logistics remain outside the comparison.</p> },
    { label: "Secondary treatment and materials", navigationLabel: "Secondary treatment", visual: <MaterialMethodVisual />, noteTitle: "The real difference is what still needs treatment.", note: <p>PV Circulator starts from first principles: panels are built in layers, so reverse the manufacturing process and separate them layer by layer. This preserves glass, silicon (cell) powder and polymers as distinct outputs and leaves less material requiring secondary treatment.</p> },
  ];

  const scaleSlides: DeckSlide[] = [
    { label: "Commercial footprint", visual: <div className="os-data-slide os-scale-map-slide"><h2>PV Circulator global commercialization</h2><GlobalDeploymentMap /></div>, noteTitle: "", note: <div className="os-scale-market-list"><article><strong>USA | Deployed</strong><span>Permitted by California DTSC</span><p>Permitted by the California Department of Toxic Substances Control (DTSC) to receive, process and recycle end-of-life PV panels; R2v3 and ISO 9001/14001/45001 management systems.</p></article><article><strong>Australia | Launch in 2027</strong><p>An integrated solution combining PV Circulator and Material Upcycling technologies with downstream utilization pathways.</p></article><article><strong>Japan | Market development in progress</strong><p>Working with a Japanese trading company to promote PV Circulator in Japan.</p></article><article><strong>Europe | Partnership in progress</strong><p>Working with local partners to integrate PV Circulator into existing processes.</p></article><article><strong>Taiwan | Launch end of 2027</strong><p>Planned for the Miaoli hydrogen zone, the alkaline route converts recovered silicon into hydrogen for fuel-cell power.</p></article></div> },
  ];

  return <div className={`pv-review os-page${lightNavigation ? " pv-light-nav" : ""}`}>
    <a className="pv-skip" href="#overview">Skip to Our Solution</a><PublicHeader assistantInlineLinks assistantTechnologyAnchor="#first-principles" />
    <nav className="pv-dots" aria-label="Our Solution sections">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "step" : undefined}><i /><span>{label}</span></a>)}</nav>
    <main>
      <section id="overview" className="pv-screen pv-hero os-hero" aria-labelledby="os-title"><video autoPlay muted loop playsInline poster="/images/pvcirculator-oursolution-poster.jpg"><source src="/videos/pvcirculator-oursolution.mp4" type="video/mp4" /></video><div className="pv-hero-shade" /><div className="pv-hero-copy"><h1 id="os-title">Owners pay less.<br />Recyclers earn more.<br />Materials stay in circulation.</h1><p className="os-legacy-line">The next solar industry challenge begins when generation ends.</p><p className="os-hero-context">For owners, recyclers and investors, decommissioning brings cost, compliance, reputation and material value into the same decision.</p></div><a className="pv-down" href="#wave" aria-label="Continue to the coming decommissioning wave"><Arrow /></a></section>
      <section id="wave" className="pv-screen os-deck-section" aria-label="The coming decommissioning wave"><StoryDeck id="wave-deck" title="The coming decommissioning wave" slides={waveSlides} variant="split" autoAdvanceMs={30000} /></section>
      <section id="stakes" className="pv-screen os-stakes" aria-labelledby="stakes-title"><div className="os-stakes-main"><h2 id="stakes-title">What is at stake?</h2><p>Owners, recyclers, material users and the public each see retired panels differently—but they all need the same four things.</p><div className="os-stake-tabs" role="group" aria-label="Choose a stakeholder outcome">{(Object.keys(stakeSolutions) as StakeTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={stake === topic} onClick={() => setStake(topic)}><StakeIcon topic={topic} /><strong>{stakeSolutions[topic].label}</strong></button>)}</div><div key={stake} className="os-stakeholder-needs" aria-live="polite"><strong>{selectedStake.label} by stakeholder</strong>{selectedStake.stakeholders.map(([stakeholder, need]) => <div key={stakeholder}><span>{stakeholder}</span><p>{need}</p></div>)}</div></div><aside className="os-speaker-notes" aria-live="polite"><div key={stake}><span className="os-note-label">{selectedStake.label}</span><h3>{selectedStake.heading}</h3><div className="os-note-copy"><p>{selectedStake.intro}</p></div><div className="os-solution-drivers">{selectedStake.drivers.map(([driver, outcome]) => <div key={driver}><strong>{driver}</strong><p>{outcome}</p></div>)}</div><div className="os-stakes-bridge"><strong>{selectedStake.conclusion}</strong><small>{selectedStake.note}</small><a className="pv-text-button" href="#conventional">See why conventional methods fall short <Arrow /></a></div></div></aside></section>
      <section id="system" className="pv-screen os-system" aria-labelledby="system-title"><div className="os-system-stage"><div className="os-system-heading"><h2 id="system-title">Our solution</h2><p>One circular system answers the four shared needs: lower cost, provable compliance, material circularity and defensible reputation.</p></div><div className="os-system-flow" role="list" aria-label="The PV Circonomy circular value system">{(Object.keys(systemTopics) as SystemTopic[]).map((topic) => <article key={topic} role="listitem"><figure><img src={systemVisuals[topic].src} alt={systemVisuals[topic].alt} /></figure><div className="os-system-card-copy"><div><strong>{systemTopics[topic][0]}</strong><span> | {systemCardContent[topic].tagline}</span></div><ul>{systemCardContent[topic].bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul></div></article>)}</div></div></section>
      <section id="conventional" className="pv-screen os-deck-section" aria-label="Why conventional recycling destroys value"><StoryDeck id="conventional-deck" title="Why conventional recycling destroys value" slides={conventionalSlides} variant="split" autoAdvanceMs={10000} /></section>
      <RegulationSection metrics={routeMetrics} />
      <ProcessPlaylist active={active === "first-principles"} sectionId="first-principles" titleId="first-principles-title" />
      <MaterialsSection />
      <ValueSection />
      <EconomicSection economicsData={economicsData} breakeven={breakeven} />
      <section id="evidence" className="pv-screen os-evidence-section os-passport-section" aria-labelledby="evidence-title"><div className="os-evidence-list os-passport-main"><div><h2 id="evidence-title">Every panel gets a record:<br /><span>origin, process, destination.</span></h2><p className="os-passport-intro">Lower recycling cost and higher material value are only the beginning. A verifiable record makes the act of recycling valuable in its own right.</p></div><div className="os-passport-flow" role="list" aria-label="The three parts of a panel recycling record"><article role="listitem"><strong>Origin</strong><p>Site, owner, quantity and module identity.</p></article><article role="listitem"><strong>Process</strong><p>Treatment path, energy use and recovery results.</p></article><article role="listitem"><strong>Destination</strong><p>The receiver and next use of every material stream.</p></article></div><div className="os-passport-value"><p><strong>Owners</strong> receive audit-ready data for ESG, EPR and digital product passports.</p><p><strong>Material buyers</strong> receive traceable origin, composition and intended-use data.</p></div></div><aside className="os-speaker-notes"><div><h3>From physical action to verifiable record.</h3><div className="os-note-copy"><p>EasyCycle creates the record at the machine, distributes it across the network and makes it efficient to verify at scale.</p></div><div className="os-passport-tech"><div><strong>Generate at the machine</strong><p>Sensors and edge computing automatically create the process record as the machine operates—reducing reliance on manual entry.</p></div><div><strong>Lock data integrity</strong><p>Cryptographic hashes, trusted timestamps and IPFS create a tamper-evident sequence of records.</p></div><div><strong>Scale storage with every machine</strong><p>Each PV Circulator acts as a decentralized edge node and contributes storage capacity as the network grows.</p></div><div><strong>Verify efficiently at scale</strong><p>Distributed capacity expands with each node; Merkle Tree batch proofs lower the incremental cost of verifying each record.</p></div><div><strong>Disclose selectively</strong><p>Ontology and role-based access connect the record while protecting raw data and commercial information.</p></div></div></div><Link className="pv-text-button" href="/easycycle/">Explore EasyCycle <Arrow /></Link></aside></section>
      <section id="scale" className="pv-screen os-deck-section" aria-label="From technology to commercial scale"><StoryDeck id="scale-deck" title="From technology to commercial scale" slides={scaleSlides} variant="split" /></section>
      <section id="pathways" className="pv-screen os-audience" aria-labelledby="audience-title"><div className="os-audience-heading"><h2 id="audience-title">Choose your role in the circular solar economy—and take action.</h2><div className="os-audience-tabs" role="group" aria-label="Choose your role">{(Object.keys(audienceTopics) as AudienceTopic[]).map((topic) => <button type="button" key={topic} aria-pressed={audience === topic} onClick={() => setAudience(topic)}>{audienceTopics[topic][0]}</button>)}</div></div><div className="os-audience-detail" aria-live="polite"><span>{selectedAudience[0]}</span><h3>{selectedAudience[1]}</h3><p>{selectedAudience[4]}</p><div className="os-audience-actions"><Link className="pv-button" href={selectedAudience[3]}>{selectedAudience[2]} <Arrow /></Link>{audience === "recycler" && <a className="pv-text-button" href="/business-case/">Calculate your business case <Arrow /></a>}</div></div><footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span><span>PV Circulator · Material Upcycling · EasyCycle</span><a className="pv-text-button" href="#overview">Back to top</a></footer></section>
    </main>
  </div>;
}
