"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { PublicHeader } from "./public-header";
import "./review-home.css";

import type { PublicRoute } from "../../lib/route-comparison";
import { REFERENCE_CASE, SHOW_COMPETITOR_PROFIT } from "../../lib/route-comparison/config";

const sections = [
  ["pvcirculator", "PV Circulator"],
  ["performance", "Performance"],
  ["process", "Process"],
  ["functions", "Functions"],
  ["layer-by-layer", "Layer by layer"],
  ["quality", "Quality"],
  ["routes", "Profit"],
  ["capability", "Capability"],
  ["deployability", "Deployability"],
  ["configurations", "Configurations"],
  ["specification", "Specification"],
] as const;

const performance = [
  ["1\nPANEL/MIN", "Rated throughput", "Up to 240,000 panels a year from one compact line, based on published operating assumptions."],
  ["1\nOPERATOR", "Automated operation", "AI-assisted automation and centralized controls keep manual work to a minimum."],
  ["DRY PROCESS", "No secondary treatment", "No chemicals, heat or process water means no wastewater treatment and fewer consumables."],
  [">99% RECOVERY", "By weight", "More of every panel leaves the site as a separated material stream."],
  ["MODULAR\nDESIGN", "Flexible deployment", "A compact line designed to install quickly and relocate as feedstock volumes shift."],
] as const;

const processStages = [
  { src: "/videos/pvc-process-01.mp4", short: "Infeed", title: "Infeed", lead: "Load a pallet. Let it run.", description: "Automated continuous infeed handles 30+ PV modules per pallet, supporting consistent, high-throughput operation." },
  { src: "/videos/pvc-process-02.mp4", short: "Identification", title: "Identification & Measurement", lead: "Know every module before processing.", description: "AI-assisted identification and measurement support automated setup, module handling and traceability." },
  { src: "/videos/pvc-process-03.mp4", short: "Frame removal", title: "Frame Removal", lead: "Clean aluminum, no glass attached.", description: "Aluminum frames are automatically dismantled and collected as a dedicated material stream." },
  { src: "/videos/pvc-process-04.mp4", short: "Backsheet", title: "Backsheet Separation", lead: "Keep the backsheet out of the furnace.", description: "Room-temperature mechanical separation recovers the backsheet as a dedicated stream without thermal treatment." },
  { src: "/videos/pvc-process-05.mp4", short: "Cell separation", title: "Cell Separation", lead: "Glass on one side. Cells on the other.", description: "Layer-by-layer separation removes cell material and encapsulants from glass while limiting cross-contamination." },
  { src: "/videos/pvc-process-06.mp4", short: "Cell collection", title: "Cell Collection", lead: "Concentrate the value.", description: "Separated cell material is collected as a concentrated stream for downstream silicon and silver recovery." },
] as const;

const functions = [
  ["01 — PRE-PROCESSING", "Junction Box & Cable Removal", "Built in, or done beforehand.", "Choose integrated removal with Premium, or use standalone pre-processing with Economic and Basic.", "/images/pvc-function-01.webp"],
  ["02 — INFEED & INTELLIGENCE", "Intelligent Infeed & Identification", "Feed smarter. Track every panel.", "Automated feeding and optional identification streamline handling, capture processing data and support material traceability.", "/images/pvc-function-02.webp"],
  ["03 — AUTOMATED DISMANTLING", "Layer-by-Layer Separation", "Frame, backsheet, glass. Each on its own.", "Automated frame removal and controlled layer separation recover cleaner material streams with less cross-contamination.", "/images/pvc-function-03.webp"],
  ["04 — MATERIAL PREPARATION", "Material Preparation", "Ready to sell, ready to ship.", "Prepare recovered materials for recycling, refining and upcycling to reach more downstream buyers.", "/images/pvc-function-04.webp"],
] as const;

const outputs = [
  ["GLASS", ">99% PURITY", "Clean low-iron glass with minimal contamination."],
  ["ALUMINUM FRAME", "GLASS-FREE", "Clean aluminum frames ready for downstream metal recycling."],
  ["CELL POWDER", "<1% GLASS", "Concentrated silicon and silver for downstream refining."],
  ["POLYMERS", "SEPARATED", "EVA and backsheet remain separate from glass and metals."],
  ["J-BOX + CABLE", "SIZE-REDUCED", "Collected separately for downstream metal and plastic recovery."],
] as const;

const configurationRows = [
  ["Automated Infeed", true, true, true],
  ["Identification & Measurement", false, false, true],
  ["Junction Box Removal", false, false, true],
  ["Frame Removal", true, true, true],
  ["Backsheet Separation", true, true, true],
  ["Cell Separation", false, true, true],
  ["Glass Cleaning & Outfeed", false, true, true],
  ["Discharge", true, true, true],
  ["Rated Throughput", "1 panel/min", "1 panel/min", "1 panel/min"],
  ["Digital Traceability", false, false, true],
  ["Manual Intervention", "Higher", "Moderate", "Minimal"],
] as const;

type SpecVariant = "economic" | "basic" | "premium" | "plus";

const specificationVariants: Record<SpecVariant, { label: string; title: string; description: string; drawing: string }> = {
  economic: { label: "Economic", title: "Start lean.", description: "Core automated processing for intact crystalline-silicon modules.", drawing: "/images/pvc_specs_economic.png" },
  basic: { label: "Basic", title: "Complete separation.", description: "Full layer-by-layer separation with glass cleaning, for intact crystalline-silicon modules.", drawing: "/images/pvc_specs_basic.png" },
  premium: { label: "Premium", title: "Automated & traceable.", description: "Integrated identification, junction-box removal and digital traceability for a highly automated line.", drawing: "/images/pvc_specs_premium.png" },
  plus: { label: "PLUS", title: "Expanded feedstock capability.", description: "Integrated crushing and material separation for broken and glass-glass modules across Economic, Basic and Premium configurations.", drawing: "/images/pvc_specs_pluss.png" },
};

const specificationGroups = [
  { title: "Performance", items: [
    ["Rated throughput", { economic: "1 panel/min", basic: "1 panel/min", premium: "1 panel/min", plus: "5 panel/min" }],
    ["Annual capacity", { economic: "115,200 panels/yr", basic: "115,200 panels/yr", premium: "115,200 panels/yr", plus: "576,000 panels/yr" }],
    ["Annual capacity (weight)", { economic: "2,304 t/yr", basic: "2,304 t/yr", premium: "2,304 t/yr", plus: "11,520 t/yr" }],
    ["Material recovery rate", { economic: ">90 wt.%", basic: ">99 wt.%", premium: ">99 wt.%", plus: ">90 wt.%" }],
    ["Equipment availability", { economic: ">90%", basic: ">90%", premium: ">90%", plus: ">90%" }],
    ["Energy consumption", { economic: "<1 kWh/panel", basic: "<1 kWh/panel", premium: "<1 kWh/panel", plus: "<1 kWh/panel" }],
    ["Direct operating personnel", { economic: "1 person/shift", basic: "1 person/shift", premium: "1 person/shift", plus: "1 person/shift" }],
    ["Indirect operating personnel", { economic: "2 persons/shift", basic: "2 persons/shift", premium: "2 persons/shift", plus: "2 persons/shift" }],
    ["Consumables cost", { economic: "0.05 USD/panel", basic: "0.1 USD/panel", premium: "0.1 USD/panel", plus: "0.15 USD/panel" }],
  ] },
  { title: "Dimensions & Weight", items: [
    ["Equipment length", { economic: "14,175 mm", basic: "17,340 mm", premium: "20,100 mm", plus: "5,147 mm" }],
    ["Equipment width", { economic: "1,883 mm", basic: "1,883 mm", premium: "1,883 mm", plus: "1,883 mm" }],
    ["Equipment height", { economic: "2,120 mm", basic: "2,120 mm", premium: "2,120 mm", plus: "2,120 mm" }],
    ["Equipment weight", { economic: "6,480 kg", basic: "9,180 kg", premium: "11,940 kg", plus: "6,120 kg" }],
    ["Recommended footprint", { economic: "18,175 × 5,883", basic: "21,340 × 5,883", premium: "24,100 × 5,883", plus: "7,227 × 5,883" }],
    ["Floor load", { economic: "242.8 kg/m²", basic: "281.2 kg/m²", premium: "315.5 kg/m²", plus: "631.5 kg/m²" }],
  ] },
  { title: "Module Compatibility", items: [
    ["Module length", { economic: "1,525–2,500 mm", basic: "1,525–2,500 mm", premium: "1,525–2,500 mm", plus: "—" }],
    ["Module width", { economic: "915–1,150 mm", basic: "915–1,150 mm", premium: "915–1,150 mm", plus: "—" }],
    ["Module max. weight", { economic: "50 kg", basic: "50 kg", premium: "50 kg", plus: "—" }],
    ["Module technology", { economic: "Crystalline-silicon PV", basic: "Crystalline-silicon PV", premium: "Crystalline-silicon PV", plus: "Crystalline-silicon PV" }],
    ["Module structure", { economic: "Glass-backsheet", basic: "Glass-backsheet", premium: "Glass-backsheet", plus: "Glass-glass / bifacial" }],
    ["Broken modules", { economic: "Not included", basic: "Not included", premium: "Not included", plus: "Included" }],
  ] },
  { title: "Utilities & Installation", items: [
    ["Installed power", { economic: "65 kW", basic: "85 kW", premium: "100 kW", plus: "35 kW" }],
    ["Maximum demand", { economic: "45 kVA", basic: "55 kVA", premium: "65 kVA", plus: "30 kVA" }],
    ["Process water", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Thermal treatment", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Chemicals", { economic: "Not required", basic: "Not required", premium: "Not required", plus: "Not required" }],
    ["Installation time", { economic: "1 day", basic: "1 day", premium: "1 day", plus: "1 day" }],
  ] },
  { title: "Processing & Safety", items: [
    ["Control", { economic: "PLC / IPC", basic: "PLC / IPC", premium: "PLC / IPC", plus: "PLC / IPC" }],
    ["Traceability", { economic: "Optional", basic: "Optional", premium: "Included", plus: "Optional" }],
    ["Remote support", { economic: "Included", basic: "Included", premium: "Included", plus: "—" }],
    ["Certification", { economic: "CE / UL 508A", basic: "CE / UL 508A", premium: "CE / UL 508A", plus: "CE / UL 508A" }],
    ["Noise level", { economic: "<80 dB @ 1 m", basic: "<85 dB @ 1 m", premium: "<85 dB @ 1 m", plus: "<80 dB @ 1 m" }],
    ["Warranty", { economic: "12 months", basic: "12 months", premium: "12 months", plus: "12 months" }],
  ] },
] as const;

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9h11M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function LoopVideo({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !reduce && !document.hidden) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.25 });
    const visibility = () => {
      if (document.hidden || !visible || reduce) video.pause();
      else video.play().catch(() => {});
    };
    observer.observe(video);
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <video ref={ref} className={className} autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src={src} type="video/mp4" /></video>;
}

export function ProcessPlaylist({ active, sectionId = "process", titleId = "pvc-process-title", heading }: { active: boolean; sectionId?: string; titleId?: string; heading?: ReactNode }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const current = processStages[stage];

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    player.currentTime = 0;
    setProgress(0);
    if (active && !matchMedia("(prefers-reduced-motion: reduce)").matches) player.play().catch(() => {});
    else player.pause();
  }, [stage, active]);

  return <section id={sectionId} className="pv-screen pvc2-process" aria-labelledby={titleId}>
    <video
      ref={video}
      key={current.src}
      className="pvc2-process-video"
      muted
      playsInline
      preload="metadata"
      onTimeUpdate={(event) => {
        const player = event.currentTarget;
        setProgress(player.duration ? Math.min(100, player.currentTime / player.duration * 100) : 0);
      }}
      onEnded={() => setStage((value) => (value + 1) % processStages.length)}
    >
      <source src={current.src} type="video/mp4" />
    </video>
    <div className="pvc2-media-shade" />
    <div className="pvc2-process-heading">
      <h2 id={titleId}>{heading ?? <>Layer by layer.<br />Material by material.</>}</h2>
      <p>Separate materials at the source. Preserve their value for what comes next.</p>
    </div>
    <div className="pvc2-process-footer">
      <div className="pvc2-process-description" aria-live="polite">
        <span>{String(stage + 1).padStart(2, "0")} / {String(processStages.length).padStart(2, "0")}</span>
        <h3>{current.title}</h3>
        <strong>{current.lead}</strong>
        <p>{current.description}</p>
      </div>
      <div className="pvc2-process-progress" aria-label="Process stages">
        {processStages.map((item, index) => <button key={item.src} type="button" aria-current={index === stage ? "step" : undefined} onClick={() => setStage(index)} aria-label={`Play ${item.title}`}><i style={{ width: index === stage ? `${progress}%` : "0%" }} /><span>{item.short}</span></button>)}
      </div>
    </div>
  </section>;
}

function ConfigurationValue({ value, premium = false }: { value: boolean | string; premium?: boolean }) {
  if (typeof value === "string") return <span>{value}</span>;
  return <span className={value ? `pvc2-config-check${premium ? " is-premium" : ""}` : "pvc2-config-empty"} aria-label={value ? "Included" : "Not included"}>{value ? "●" : "—"}</span>;
}

function Specifications() {
  const [variant, setVariant] = useState<SpecVariant>("basic");
  const selected = specificationVariants[variant];

  return <section id="specification" className="pv-screen pvc2-specification" aria-labelledby="specification-title">
    <div className="pvc2-spec-top">
      <span id="specification-title">Specifications</span>
      <div className="pvc2-spec-tabs" role="tablist" aria-label="PV Circulator configuration">
        {(Object.keys(specificationVariants) as SpecVariant[]).map((key) => <button key={key} type="button" role="tab" aria-selected={variant === key} aria-controls="pvc2-spec-detail" onClick={() => setVariant(key)}>{specificationVariants[key].label}</button>)}
      </div>
    </div>
    <div className="pvc2-spec-actions">
      <div className="pvc2-version" aria-label="PV Circulator model version"><button type="button" disabled aria-label="PV Circulator 2 unavailable">02</button><button type="button" aria-current="true">03</button></div>
      <div><Link className="pv-button" href="/contact/">Contact us</Link><a className="pv-button" href="/business-case/">Business case</a><Link className="pv-button pvc2-quote-button" href="/shop/?type=equipment">Request a quote <Arrow /></Link></div>
    </div>
    <div id="pvc2-spec-detail" role="tabpanel" className="pvc2-spec-detail">
      <div className="pvc2-spec-hero">
        <div><span>{selected.label} configuration</span><h2>{selected.title}</h2><p>{selected.description}</p></div>
        <figure><img key={selected.drawing} src={selected.drawing} alt={`${selected.label} PV Circulator engineering drawing`} /></figure>
      </div>
      <div className="pvc2-specs">{specificationGroups.map((group, index) => <details key={group.title} open={index < 2}><summary><span>{group.title}</span><span aria-hidden="true">+</span></summary><dl>{group.items.map(([label, values]) => <div key={label}><dt>{label}</dt><dd>{values[variant]}</dd></div>)}</dl></details>)}</div>
    </div>
    <p className="pv-note">Published specifications are configuration- and site-dependent. Confirm feedstock, operating assumptions, utilities, compliance scope and final specifications during commercial and engineering review.</p>
    <footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span><span>PV Circulator technology · developed by TSGC</span><a className="pv-text-button" href="#pvcirculator">Back to top</a></footer>
  </section>;
}

function RouteSection({ routes }: { routes: PublicRoute[] }) {
  const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  const ordered = ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"].map(code => routes.find(route => route.code === code));
  const pvc = ordered[2];
  const rows: { label: string; value: (route: PublicRoute) => string; financial?: boolean }[] = [
    { label: "Material revenue per MW", value: route => usd(route.materialRevenuePerMw!), financial: true },
    { label: "Landfilled residue t/MW", value: route => route.landfillTPerMw.toFixed(2) },
    { label: "Process CO2e t/MW", value: route => route.co2eTPerMw.toFixed(2) },
    { label: "Material recovery rate", value: route => `${(route.recoveryRate * 100).toFixed(1)}%` },
    { label: "EBITDA per MW", value: route => usd(route.ebitdaPerMw!), financial: true },
  ];
  return <section id="routes" className="pv-screen pvc2-text-screen pvc2-routes" aria-labelledby="routes-title">
    <header className="pvc2-section-heading"><h2 id="routes-title">Where the profit is.</h2><p>Per MW of retired panels in our California reference case ({REFERENCE_CASE.panelWatts} W modules at {REFERENCE_CASE.panelWeightLb} lb each, ${REFERENCE_CASE.processingFee.toFixed(2)}/lb processing fee, Business Case master data).</p></header>
    {pvc?.ebitdaPerMw != null && <div className="pvc2-route-result"><strong>PV Circulator EBITDA per MW: {usd(pvc.ebitdaPerMw)}</strong><p>Material revenue {usd(pvc.materialRevenuePerMw!)} + processing fee {usd(pvc.feePerMw!)} − operating cost. Before depreciation.</p></div>}
    {routes.length ? <div className="os-method-detail-table"><table><caption className="pv-sr-only">California reference case per MW of retired panels</caption><thead><tr><th scope="col">Item</th>{["Shredding", "Thermal processing", "PV Circulator"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{ordered.map((route, index) => <td key={index}>{!route ? "Unavailable" : row.financial && index !== 2 && !SHOW_COMPETITOR_PROFIT ? <span aria-label="Not published">—</span> : row.value(route)}</td>)}</tr>)}</tbody></table></div> : <p>Reference-case metrics are currently unavailable. Run your business case to explore available regions.</p>}
    <p>Separating layers keeps silver concentrated and glass clean, so more of each panel is sold instead of landfilled.</p>
    <div className="pvc2-route-actions"><Link className="pv-button" href="/business-case/">Run your business case <Arrow /></Link><Link className="pv-text-button" href="/shop/?type=equipment">Request equipment information</Link></div>
    <p className="os-chart-source">Estimates from the PV Circonomy Business Case model with its published master data for California; your results depend on region, volume, fee and material prices. EBITDA excludes depreciation, financing and taxes.</p>
  </section>;
}

export function PVCirculatorPage({ routes = [] }: { routes?: PublicRoute[] }) {
  const [active, setActive] = useState<(typeof sections)[number][0]>("pvcirculator");
  const paneNavigationLocked = useRef(false);
  useEffect(() => {
    document.documentElement.classList.add("pv-section-scroll");
    const elements = sections.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id as (typeof sections)[number][0]);
    }, { threshold: [0.25, 0.5, 0.7] });
    elements.forEach((element) => observer.observe(element));
    return () => { observer.disconnect(); document.documentElement.classList.remove("pv-section-scroll"); };
  }, []);

  const navigateSplitPane = (event: ReactWheelEvent<HTMLElement>, nextId: string, previousId: string, direct = false) => {
    if (window.innerWidth <= 760 || Math.abs(event.deltaY) < 8 || paneNavigationLocked.current) return;
    const pane = event.currentTarget;
    const atTop = pane.scrollTop <= 1;
    const atBottom = Math.ceil(pane.scrollTop + pane.clientHeight) >= pane.scrollHeight - 1;
    const targetId = direct
      ? (event.deltaY > 0 ? nextId : previousId)
      : (event.deltaY > 0 && atBottom ? nextId : event.deltaY < 0 && atTop ? previousId : "");
    if (!targetId) return;
    paneNavigationLocked.current = true;
    document.getElementById(targetId)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => { paneNavigationLocked.current = false; }, 750);
  };

  const light = ["performance", "functions", "quality", "routes", "capability", "configurations", "specification"].includes(active);

  return <div className={`pv-review pvc2-page${light ? " pv-light-nav" : ""}`}>
    <a className="pv-skip" href="#pvcirculator">Skip to PV Circulator</a>
    <PublicHeader assistantInlineLinks assistantTechnologyAnchor="#process" />
    <nav className="pv-dots" aria-label="PV Circulator sections">{sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "step" : undefined}><i /><span>{label}</span></a>)}</nav>
    <main>
      <section id="pvcirculator" className="pv-screen pv-hero pvc2-hero" aria-labelledby="pvc-title">
        <LoopVideo src="/videos/pvc-operation.mp4" className="pvc2-cover-video" />
        <div className="pv-hero-shade" />
        <div className="pv-hero-copy"><h1 id="pvc-title">Separate more.<br />Preserve more value.</h1><p>Turn end-of-life solar panels into clean, sellable material streams—automatically, at industrial scale, and without chemicals, heat or process water.</p></div>
      </section>

      <section id="performance" className="pv-screen pvc2-text-screen pvc2-performance" aria-labelledby="performance-title">
        <header className="pvc2-section-heading"><h2 id="performance-title">Built for industrial<br />PV recycling.</h2><p>Every line is designed around one question: how much value can you recover per panel, at what operating cost?</p></header>
        <figure className="pvc2-machine"><img src="/images/pvc-machine.webp" alt="PV Circulator industrial solar panel recycling line" /></figure>
        <div className="pvc2-card-row">{performance.map(([value, title, text]) => <article key={value}><strong>{value}</strong><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>

      <ProcessPlaylist active={active === "process"} />

      <section id="functions" className="pv-screen pvc2-split pvc2-split-64" aria-labelledby="functions-title">
        <div className="pvc2-split-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "layer-by-layer", "process", true)}><div><h2 id="functions-title">Configure the line.<br />Fit your operation.</h2><p>Start with the core line, then add what your operation needs: intelligent identification, integrated junction-box removal or material preparation for downstream buyers.</p><Link className="pv-button" href="/shop/?type=equipment">Request equipment information <Arrow /></Link></div></div>
        <div className="pvc2-split-scroll" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "layer-by-layer", "process")}>{functions.map(([number, title, lead, text, image]) => <article className="pvc2-function" key={number}><img src={image} alt="" /><div><span>{number}</span><h3>{title}</h3><strong>{lead}</strong><p>{text}</p></div></article>)}</div>
      </section>

      <section id="layer-by-layer" className="pv-screen pvc2-media-screen" aria-labelledby="layer-title">
        <LoopVideo src="/videos/pvc-layer-separation.mp4" className="pvc2-cover-video" />
        <div className="pvc2-media-shade" />
        <div className="pvc2-media-copy"><h2 id="layer-title">Don&apos;t crush<br />value together.</h2><p>A PV module is built in layers: glass, encapsulant, cells and backsheet. Shred it, and they end up mixed together. Separate them, and each one stays clean enough for what comes next.</p></div>
      </section>

      <section id="quality" className="pv-screen pvc2-text-screen pvc2-quality" aria-labelledby="quality-title">
        <header className="pvc2-section-heading"><h2 id="quality-title">What comes out<br />matters.</h2><p>Recovery rate tells you how much comes back. Purity determines what the recovered material can become—and what it may be worth.</p></header>
        <div className="pvc2-material-grid">{outputs.map(([name, value, text]) => <article key={name}><span>{name}</span><strong>{value}</strong><p>{text}</p></article>)}</div>
        <div className="pvc2-value-row"><article><strong>Cleaner separation</strong><p>Distinct streams at the source.</p></article><article><strong>Less secondary processing</strong><p>Less sorting and purification.</p></article><article><strong>More value per panel</strong><p>More routes to downstream buyers.</p></article></div>
      </section>

      <RouteSection routes={routes} />
      <section id="capability" className="pv-screen pvc2-split pvc2-split-64" aria-labelledby="capability-title">
        <div className="pvc2-split-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "deployability", "quality", true)}><div><h2 id="capability-title">One platform.<br />Intact, broken or glass-glass.</h2><p>PV Circulator separates intact modules layer by layer. The PLUS module extends the system to broken and glass-glass feedstock through crushing and material separation.</p></div></div>
        <div className="pvc2-split-scroll pvc2-capability-cards" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "deployability", "quality")}><article className="pvc2-image-card"><img src="/images/pvc-feedstock-intact.jpg" alt="Intact solar panels ready for processing" /><div><span>PV CIRCULATOR</span><h3>Intact modules</h3><p>Automated layer-by-layer separation for framed and frameless glass-backsheet panels.</p></div></article><article className="pvc2-image-card"><img src="/images/pvc-feedstock-broken.jpg" alt="Broken solar panel feedstock" /><div><span>PLUS MODULE</span><h3>Broken &amp; glass-glass</h3><p>Integrated crushing and material separation expands feedstock compatibility.</p></div></article></div>
      </section>

      <section id="deployability" className="pv-screen pvc2-deployability" aria-labelledby="deployability-title">
        <header><h2 id="deployability-title">Processing capacity.<br />Where you need it.</h2><p>PV waste is bulky and costly to haul. PV Circulator brings processing capacity closer to the source, reducing long-distance transportation and enabling flexible deployment as waste volumes shift.</p></header>
        <div className="pvc2-deploy-main"><article><img src="/images/pvc-deploy-onsite.webp" alt="Illustrative modular PV recycling operation at a solar farm" /><div><span>ON-SITE PROCESSING</span><h3>Bring recycling to<br />the panels.</h3><p>Set up at large decommissioning projects and collection sites. Skip the long haul.</p></div></article><article><img src="/images/pvc-deploy-nearsite.webp" alt="Illustrative regional PV recycling hub" /><div><span>NEAR-SITE PROCESSING</span><h3>Build capacity close<br />to the supply.</h3><p>Run a regional hub for several collection points, and move it when volumes shift.</p></div></article></div>
        <div className="pvc2-deploy-metrics"><article><strong>Modular</strong><span>Install. Dismantle. Redeploy.</span><p>Integrated processing modules enable efficient installation, dismantling and redeployment.</p></article><article><strong>24 Hours</strong><span>Relocate in a day.</span><p>Designed for rapid teardown and restart, subject to site readiness. Transport time excluded.</p></article><article><strong>Relocatable</strong><span>Follow the feedstock.</span><p>Move the line as panel volumes and collection locations change.</p></article></div>
      </section>

      <section id="configurations" className="pv-screen pvc2-split pvc2-split-43" aria-labelledby="configurations-title">
        <div className="pvc2-split-copy pvc2-config-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "specification", "deployability", true)}><div><h2 id="configurations-title">Choose<br />the right fit.</h2><strong>Three configurations.<br />One goal: maximum material value.</strong><p>Choose Economic, Basic or Premium to match your automation needs and material recovery goals. Add PLUS to expand feedstock compatibility across intact, broken and glass-glass PV modules.</p><div className="pvc2-business-case"><strong>Evaluate the economics of your configuration.</strong><p>Explore processing costs, material recovery value and annual EBITDA based on your operating conditions.</p><a className="pv-text-button" href="/business-case/">Calculate your business case <Arrow /></a></div></div></div>
        <div className="pvc2-split-scroll pvc2-config-table" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "specification", "deployability")}><div className="pvc2-config-comparison" role="table" aria-label="Comparison of PV Circulator configurations"><div className="pvc2-config-head" role="row"><span role="columnheader">Functions</span>{[["Economic", "Start lean."], ["Basic", "Complete separation."], ["Premium", "Automated & traceable."]].map(([name, lead], index) => <span role="columnheader" className={index === 2 ? "is-premium" : ""} key={name}><strong>{name}</strong><small>{lead}</small></span>)}</div>{configurationRows.map(([label, economic, basic, premium]) => <div className="pvc2-config-row" role="row" key={label}><span role="rowheader">{label}</span><ConfigurationValue value={economic} /><ConfigurationValue value={basic} /><ConfigurationValue value={premium} premium /></div>)}<div className="pvc2-config-plus"><strong>PLUS — One module. Every configuration.</strong><p>Available with Economic, Basic and Premium. Expand feedstock compatibility without changing your core PV Circulator configuration.</p>{["Coarse Crusher", "Fine Crusher", "Material Separation"].map((label) => <div className="pvc2-config-row" role="row" key={label}><span role="rowheader">{label}</span><ConfigurationValue value /><ConfigurationValue value /><ConfigurationValue value premium /></div>)}<div className="pvc2-config-row pvc2-config-dust"><span>Dust Control</span><span>Enclosed extraction and dedicated collection</span></div></div></div></div>
      </section>

      <Specifications />
    </main>
  </div>;
}
