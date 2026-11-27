"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { CapacityEstimate, useCapacityEstimate } from "./pv-capacity-estimate";
import { PVCirculatorBusinessModel } from "./pv-business-model";
import { EquipmentMouPreview, SpecificationInquiry } from "./specification-inquiry";
import type { EquipmentBaseVariant, EquipmentMouReview, EquipmentPurchaseOption, EquipmentVariant } from "../../lib/equipment-mou";
import { useTransferredVolume } from "./use-transferred-volume";
import { inquiryTranslate } from "./marketing";
import { defaultEquipmentConfigurations, equipmentElectricalRows, equipmentLineRating, integratedEquipmentThroughput, equipmentSpecificationGroups, type EquipmentConfigurations } from "../../lib/equipment-configurations";
import { defaultEquipmentQuantitative, type EquipmentClaims, type EquipmentMarketDefaults, type SitePowerOptions } from "../../lib/equipment-quantitative";
import { PublicHeader } from "./public-header";
import "./review-home.css";

import type { PVCirculatorProfitRoute, PVCirculatorReference, PVCirculatorRecovery, PVCirculatorSilverGrades, PVCirculatorTransportPricing } from "./pv-circulator-route-data";
import { RecoveryEstimate } from "./pv-recovery-estimate";
import { DistanceSensitivity } from "./pv-distance-sensitivity";
import { ProfitComparison } from "./pv-profit-comparison";
import { formatCurrency } from "../../lib/region-format";
import japaneseCopy from "../../lib/i18n/pv-circulator-ja.json";
import chineseCopy from "../../lib/i18n/pv-circulator-zh.json";
import { businessCaseHref as marketCalculatorHref, solutionHref, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";

type ProductLocale = OurSolutionLocale;
type Translate = (english: string, fallback?: string) => string;
const translate = (locale: ProductLocale): Translate => (english, fallback = english) =>
  (locale === "zh-TW" ? chineseCopy as Record<string, string> : locale === "ja-JP" ? japaneseCopy as Record<string, string> : {})[english] ?? fallback;

function formatCopy(template: string, values: Record<string, string | number>) {
  return template.replace(/\{([\w.]+)\}/g, (placeholder, name) => String(values[name] ?? placeholder));
}

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
  ["business-model", "Business model"],
  ["specification", "Specification"],
] as const;

const performance = [
  ["{throughput}\nPANEL/MIN", "Rated throughput", "Up to {panelsPerYear} panels a year from one compact line, based on published operating assumptions."],
  ["{operators}\nOPERATOR", "Automated operation", "AI-assisted automation and centralized controls keep manual work to a minimum."],
  [">{recovery}% RECOVERY", "By weight", "More of every panel leaves the site as a separated material stream."],
  ["DRY PROCESS", "No secondary treatment", "No chemicals, heat or process water means no wastewater treatment and fewer consumables."],
  ["MODULAR\nDESIGN", "Flexible deployment", "A compact line designed to install quickly and relocate as feedstock volumes shift."],
] as const;

const processStages = [
  { src: "/videos/pvc-process-01.mp4", short: "Infeed", title: "Infeed", lead: "Load a pallet. Let it run.", description: "Automated continuous infeed handles {panelsPerPallet}+ PV modules per pallet, supporting consistent, high-throughput operation." },
  { src: "/videos/pvc-process-02.mp4", short: "Identification", title: "Identification & Measurement", lead: "Know every module before processing.", description: "AI-assisted identification and measurement support automated setup, module handling and traceability." },
  { src: "/videos/pvc-process-03.mp4", short: "Frame removal", title: "Frame Removal", lead: "Clean aluminum, no glass attached.", description: "Aluminum frames are automatically dismantled and collected as a dedicated material stream." },
  { src: "/videos/pvc-process-04.mp4", short: "Backsheet", title: "Backsheet Separation", lead: "Keep the backsheet out of the furnace.", description: "Room-temperature mechanical separation recovers the backsheet as a dedicated stream without thermal treatment." },
  { src: "/videos/pvc-process-05.mp4", short: "Cell separation", title: "Cell Separation", lead: "Glass on one side. Cells on the other.", description: "Layer-by-layer separation removes cell material and encapsulants from glass while limiting cross-contamination." },
  { src: "/videos/pvc-process-06.mp4", short: "Cell collection", title: "Cell Collection", lead: "Concentrate the value.", description: "Separated cell material is collected as a concentrated stream for downstream silicon and silver recovery." },
] as const;

const japaneseProcessStages = [
  { short: "投入", title: "モジュールの投入", lead: "パレットをセットすれば、連続運転が始まります。", description: "パレット1枚に{panelsPerPallet}枚以上の太陽光モジュールを積載でき、自動で連続投入することで安定した処理を支えます。" },
  { short: "識別", title: "識別・計測", lead: "処理前にモジュールを一枚ずつ識別します。", description: "AIによる識別・計測が、自動設定、モジュールの取り扱い、トレーサビリティを支えます。" },
  { short: "フレーム取り外し", title: "フレームの取り外し", lead: "ガラスが付着していないアルミを回収します。", description: "アルミフレームを自動で取り外し、他の材料と分けて回収します。" },
  { short: "バックシート分離", title: "バックシートの分離", lead: "バックシートは加熱せずに回収します。", description: "常温で機械的に分離し、バックシートを単独で回収します。" },
  { short: "セル分離", title: "セルの分離", lead: "ガラスとセルを分けます。", description: "層ごとに分離し、材料の混入を抑えながら、セル材と封止材をガラスから取り除きます。" },
  { short: "セル回収", title: "セル材の回収", lead: "価値のある材料を高濃度で回収します。", description: "分離したセル材をまとめて回収し、後工程でのシリコンと銀の回収につなげます。" },
] as const satisfies readonly Record<"short" | "title" | "lead" | "description", string>[] & { length: typeof processStages.length };

const chineseProcessStages = [
  { short: "進料", title: "模組進料", lead: "把棧板放入後啟動連續進料。", description: "每個棧板可放 {panelsPerPallet} 片以上的太陽能模組，自動連續進料讓處理量更穩定。" },
  { short: "辨識", title: "辨識與量測", lead: "處理前逐片辨識太陽能模組。", description: "AI 輔助辨識與量測，讓設備能設定參數、搬送模組並保留追溯資料。" },
  { short: "拆框", title: "拆除鋁框", lead: "回收乾淨且不摻雜玻璃的鋁框", description: "設備使用巧勁自動拆除鋁框並分開收集，供下游回收。" },
  { short: "背板分離", title: "背板分離", lead: "在常溫下分離背板。", description: "以機械方式分離背板，不需熱處理，即可單獨回收。" },
  { short: "電池分離", title: "電池層分離", lead: "把玻璃與電池層分開。", description: "逐層分離玻璃、封裝材料及電池層，降低材料混雜。" },
  { short: "電池回收", title: "回收電池材料", lead: "把高價值材料集中回收。", description: "集中收集分離出的電池材料，供下游回收矽及銀。" },
] as const;

const processStagesByLocale = {
  "en-US": processStages,
  "ja-JP": processStages.map(({ src }, index) => ({ src, ...japaneseProcessStages[index] })),
  "zh-TW": processStages.map(({ src }, index) => ({ src, ...chineseProcessStages[index] })),
};

const productStageTitles = [
  "Infeed", "Identification", "Frame removal", "Backsheet", "Cell separation", "Cell collection",
] as const;

const functions = [
  ["01 — PRE-PROCESSING", "Junction Box & Cable Removal", "Built in, or done beforehand.", "Choose integrated removal with Premium, or use standalone pre-processing with Economic and Basic.", "/images/pvc-function-01.webp"],
  ["02 — INFEED & INTELLIGENCE", "Intelligent Infeed & Identification", "Feed smarter. Track every panel.", "Automated feeding and optional identification streamline handling, capture processing data and support material traceability.", "/images/pvc-function-02.webp"],
  ["03 — AUTOMATED DISMANTLING", "Layer-by-Layer Separation", "Frame, backsheet, glass. Each on its own.", "Automated frame removal and controlled layer separation recover cleaner material streams with less cross-contamination.", "/images/pvc-function-03.webp"],
  ["04 — MATERIAL PREPARATION", "Material Preparation", "Ready to sell, ready to ship.", "Prepare recovered materials for recycling, refining and upcycling to reach more downstream buyers.", "/images/pvc-function-04.webp"],
] as const;

const outputs = [
  ["GLASS", ">{purity}% PURITY", "Clean low-iron glass with minimal contamination."],
  ["ALUMINUM FRAME", "GLASS-FREE", "Clean aluminum frames ready for downstream metal recycling."],
  ["CELL POWDER", "<{glass}% GLASS", "Concentrated silicon and silver for downstream refining."],
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
  ["Digital Traceability", false, false, true],
  ["Manual Intervention", "Higher", "Moderate", "Minimal"],
] as const;

type SpecVariant = EquipmentVariant;

const specificationVariants: Record<SpecVariant, { label: string; title: string; description: string; drawing: string }> = {
  economic: { label: "Economic", title: "Start lean.", description: "Core automated processing for intact crystalline-silicon modules.", drawing: "/images/pvc_specs_economic.png" },
  basic: { label: "Basic", title: "Complete separation.", description: "Full layer-by-layer separation with glass cleaning, for intact crystalline-silicon modules.", drawing: "/images/pvc_specs_basic.png" },
  premium: { label: "Premium", title: "Automated & traceable.", description: "Integrated identification, junction-box removal and digital traceability for a highly automated line.", drawing: "/images/pvc_specs_premium.png" },
  plus: { label: "PLUS", title: "Expanded feedstock capability.", description: "Integrated crushing and material separation for broken and glass-glass modules across Economic, Basic and Premium configurations.", drawing: "/images/pvc_specs_pluss.png" },
};

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

export function ProcessPlaylist({ active, sectionId = "process", titleId = "pvc-process-title", heading, locale = "en-US", productCopy = false, infeedPanelsPerPallet = defaultEquipmentQuantitative.claims.infeedPanelsPerPallet }: {
  active: boolean;
  sectionId?: string;
  titleId?: string;
  heading?: ReactNode;
  locale?: ProductLocale;
  productCopy?: boolean;
  infeedPanelsPerPallet?: number;
}) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const isChinese = locale === "zh-TW";
  const isJapanese = locale === "ja-JP";
  const stages = processStagesByLocale[locale];
  const useChineseProductCopy = isChinese && productCopy;
  const t = translate(locale);
  const stageTitle = (index: number) => t(productStageTitles[index]);
  const current = stages[stage];

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
      <h2 id={titleId}>{heading ?? (useChineseProductCopy ? <>{t("Layer by layer.")}<br />{t("Material by material.")}</> : isChinese ? <>逐層分離。<br />分類回收。</> : isJapanese ? <>層ごとに。<br />材料ごとに。</> : <>Layer by layer.<br />Material by material.</>)}</h2>
      <p>{useChineseProductCopy ? t("Separate materials at the source. Preserve their value for what comes next.") : isChinese ? "從源頭分離材料，保留材料價值供下游再利用。" : isJapanese ? "処理の初めから材料を分け、次の用途に向けてその価値を保ちます。" : "Separate materials at the source. Preserve their value for what comes next."}</p>
    </div>
    <div className="pvc2-process-footer">
      <div className="pvc2-process-description" aria-live="polite">
        <span>{String(stage + 1).padStart(2, "0")} / {String(processStages.length).padStart(2, "0")}</span>
        <h3>{useChineseProductCopy ? stageTitle(stage) : current.title}</h3>
        <strong>{useChineseProductCopy && stage === 0 ? t(processStages[0].lead) : current.lead}</strong>
        <p>{formatCopy(useChineseProductCopy && stage === 0 ? t(processStages[0].description) : current.description, { panelsPerPallet: infeedPanelsPerPallet.toLocaleString(locale) })}</p>
      </div>
      <div className="pvc2-process-progress" role="group" aria-label={useChineseProductCopy ? t("Process stages") : isChinese ? "處理步驟" : isJapanese ? "処理工程" : "Process stages"}>
        {stages.map((item, index) => <button key={item.src} type="button" aria-current={index === stage ? "step" : undefined} onClick={() => setStage(index)} aria-label={useChineseProductCopy ? t(`Play ${processStages[index].title}`, formatCopy("播放 {e.title}", { "e.title": stageTitle(index) })) : isChinese ? `播放${item.title}` : isJapanese ? `${item.title}を再生` : `Play ${item.title}`}><i style={{ width: index === stage ? `${progress}%` : "0%" }} /><span>{useChineseProductCopy ? stageTitle(index) : item.short}</span></button>)}
      </div>
    </div>
  </section>;
}

function ConfigurationValue({ value, premium = false, t }: { value: boolean | string; premium?: boolean; t: Translate }) {
  if (typeof value === "string") return <span role="cell">{t(value)}</span>;
  return <span role="cell" className={value ? `pvc2-config-check${premium ? " is-premium" : ""}` : "pvc2-config-empty"}
    aria-label={t(value ? "Included" : "Not included")}>{!value && "—"}</span>;
}

function Specifications({ locale, market, businessCaseHref, specificationFx, estimate, recyclingFee, equipmentConfigurations, marketDefaults, sitePowerOptions, inquiry, setInquiry, hasRecyclingPermit, purchaseOption, setPurchaseOption, mouReview, setMouReview }: {
  inquiry: boolean;
  setInquiry: (open: boolean) => void;
  hasRecyclingPermit: boolean;
  purchaseOption: EquipmentPurchaseOption;
  setPurchaseOption: (option: EquipmentPurchaseOption) => void;
  mouReview: EquipmentMouReview | null;
  setMouReview: (review: EquipmentMouReview | null) => void;
  equipmentConfigurations: EquipmentConfigurations;
  marketDefaults: EquipmentMarketDefaults;
  sitePowerOptions: SitePowerOptions;
  locale: ProductLocale;
  market: PublicSolutionMarket;
  businessCaseHref?: string;
  specificationFx?: number;
  estimate: ReturnType<typeof useCapacityEstimate>;
  recyclingFee: number | null;
}) {
  const t = translate(locale);
  const chinese = locale === "zh-TW";
  const japanese = locale === "ja-JP";
  const [variant, setVariant] = useState<SpecVariant>("basic");
  const [baseVariant, setBaseVariant] = useState<EquipmentBaseVariant>("basic");
  const [includePlus, setIncludePlus] = useState(false);
  const selected = specificationVariants[variant];
  const variants = Object.keys(specificationVariants) as SpecVariant[];
  const quote = inquiryTranslate(locale);
  const openQuote = useRef<HTMLButtonElement>(null);
  const returnToSpecs = useRef<HTMLButtonElement>(null);
  function selectSpecification(next: SpecVariant) {
    setVariant(next);
    if (next === "plus") setIncludePlus(true);
    else {
      setBaseVariant(next);
      if (!inquiry) setIncludePlus(false);
    }
  }
  function toggleInquiry() {
    setInquiry(!inquiry);
    setMouReview(null);
    requestAnimationFrame(() => {
      document.getElementById("specification")?.scrollIntoView({ behavior: "instant", block: "start" });
      (inquiry ? openQuote : returnToSpecs).current?.focus({ preventScroll: true });
    });
  }
  const formatSpecification = (value: string) => {
    const usdPerPanel = value.match(/^(\d+(?:\.\d+)?) USD\/panel$/);
    if (usdPerPanel && specificationFx) {
      const cost = formatCurrency(Number(usdPerPanel[1]) * specificationFx, {currency: "JPY", countryCode: "JP"});
      return chinese ? formatCopy("約{cost}／片", { cost }) : `約${cost}／枚`;
    }
    return t(value);
  };

  return <section id="specification" className={`pv-screen pvc2-specification${inquiry ? " is-inquiry" : ""}`} aria-labelledby={inquiry ? undefined : "specification-title"} aria-label={inquiry ? quote("Online inquiry") : undefined}>
    <div className="pvc2-spec-layout">
    <div className="pvc2-spec-main">
    {mouReview ? <EquipmentMouPreview key={mouReview.token?.id} review={mouReview} onEdit={() => {
      setMouReview(null);
      requestAnimationFrame(() => document.querySelector<HTMLElement>("#equipment-inquiry h2")?.focus());
    }} /> : <>
    <div className="pvc2-spec-top">
      {!inquiry && <span id="specification-title">{t("Specifications")}</span>}
      <div className="pvc2-spec-tabs" role="tablist" aria-label={t("PV Circulator configuration")}
        onKeyDown={event => {
          const index = variants.indexOf(variant);
          const next = event.key === "ArrowRight" ? (index + 1) % variants.length
            : event.key === "ArrowLeft" ? (index + variants.length - 1) % variants.length
            : event.key === "Home" ? 0 : event.key === "End" ? variants.length - 1 : -1;
          if (next < 0) return;
          event.preventDefault();
          selectSpecification(variants[next]);
          event.currentTarget.querySelectorAll("button")[next]?.focus();
        }}>
        {variants.map(key => <button key={key} id={`pvc2-spec-tab-${key}`} type="button" role="tab" tabIndex={variant === key ? 0 : -1}
          aria-selected={variant === key} aria-controls="pvc2-spec-detail" onClick={() => selectSpecification(key)}>{specificationVariants[key].label}</button>)}
      </div>
    </div>
    <div className="pvc2-spec-actions">
      <div className="pvc2-version" aria-label={t("PV Circulator model version")}>
        <button type="button" disabled aria-label={t("PV Circulator 2 unavailable")}>02</button>
        <button type="button" aria-current="true">03</button>
      </div>
      {inquiry ? <div className="pvc2-inquiry-actions">
        <button ref={returnToSpecs} type="button" className="pv-button" onClick={toggleInquiry}>{quote("Back to specifications")}</button>
        <a className="pv-button pvc2-quote-button pvc2-inquiry-jump" href="#equipment-inquiry">{quote("Online inquiry")} <Arrow /></a>
      </div> : <div className="pvc2-spec-ctas">
        {businessCaseHref && <a className="pv-button" href={businessCaseHref}>{t("Business case")}</a>}
        <button ref={openQuote} type="button" className="pv-button pvc2-quote-button" onClick={toggleInquiry}>{quote("Online inquiry")} <Arrow /></button>
      </div>}
    </div>
    <div id="pvc2-spec-detail" role="tabpanel" aria-labelledby={`pvc2-spec-tab-${variant}`} className="pvc2-spec-detail">
      <div className="pvc2-spec-hero">
        <div><span>{chinese ? formatCopy("{label} 配置", { label: selected.label }) : japanese ? `${selected.label} 構成` : `${selected.label} configuration`}</span><h2>{t(selected.title)}</h2><p>{t(selected.description)}</p></div>
        <figure><img key={selected.drawing} src={selected.drawing} alt={chinese ? (variant === "basic" ? t("Basic PV Circulator engineering drawing") : formatCopy("{u.label} PV Circulator 工程圖", { "u.label": selected.label })) : japanese ? `PV Circulator ${selected.label} の設計図` : `${selected.label} PV Circulator engineering drawing`} /></figure>
      </div>
      <div className="pvc2-specs">
        {equipmentSpecificationGroups.map((group, index) => {
          const spec = equipmentConfigurations[variant];
          const values = group.items.map(([label]) => [label, formatSpecification(spec.values[label])] as const);
          const rows = group.title === "Utilities & Installation" ? [...equipmentElectricalRows(spec.electrical, locale), ...values] : values;
          return <details key={group.title} open={!inquiry && index < 2}>
            <summary><span>{t(group.title)}</span><span aria-hidden="true">+</span></summary>
            <dl>{rows.map(([label, value]) => <div key={label}><dt>{t(label)}</dt><dd>{value}</dd></div>)}</dl>
          </details>;
        })}
      </div>
    </div>
    <p className="pv-note">{t("Published specifications are configuration- and site-dependent. Confirm feedstock, operating assumptions, utilities, compliance scope and final specifications during commercial and engineering review.")}{specificationFx ? chinese ? " 消耗品成本依日本營運資料的匯率換算。" : " 消耗品費は日本向け事業収支データの為替レートで換算した概算です。" : null}</p>
    </>}
    </div>
    {inquiry && <SpecificationInquiry
      configuration={baseVariant}
      hasRecyclingPermit={hasRecyclingPermit} purchaseOption={purchaseOption} setPurchaseOption={setPurchaseOption}
      configurations={variants.filter(value => value !== "plus").map(value => ({ value, label: specificationVariants[value].label }))}
      onConfigurationChange={selectSpecification}
      includePlus={includePlus}
      onPlusChange={value => { setIncludePlus(value); setVariant(value ? "plus" : baseVariant); }}
      performance={estimate.valid ? { monthlyAverage: estimate.monthlyAverage, dailyHours: estimate.dailyHours } : null}
      recyclingFee={recyclingFee} review={mouReview} setReview={setMouReview}
      locale={locale} market={market} defaults={marketDefaults} sitePowerOptions={sitePowerOptions}
    />}
    </div>
    <footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span><span>{t("PV Circulator technology · developed by TSGC")}</span><a className="pv-text-button" href="#pvcirculator">{t("Back to top")}</a></footer>
  </section>;
}

const silverStreams = [
  ["SHREDDING", "Shredding", "Mixed fragments"],
  ["HOT_KNIFE", "Thermal processing", "Cell laminate"],
  ["PVCIRCULATOR", "PV Circulator", "Cell powder"],
] as const;

function SilverGradeRange({ grades, locale, t }: { grades?: PVCirculatorSilverGrades; locale: ProductLocale; t: Translate }) {
  // Compare the concentrations shown in the table, rounded to three decimal places.
  const [shredding, thermal, circulator] = silverStreams.map(([code]) => {
    const grade = grades?.find(item => item.code === code)?.silverUpperPct;
    return grade == null ? 0 : Number(grade.toFixed(3));
  });
  if (shredding <= 0 || thermal <= 0 || circulator <= 0) return null;

  const ratios = [circulator / thermal, circulator / shredding];
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const range = `${format.format(Math.min(...ratios))}–${format.format(Math.max(...ratios))}×`;
  return <div className="pvc2-silver-grade-range">
    <strong>{range}</strong>
    <p>{t("PV Circulator’s theoretical silver concentration compared with thermal processing and shredding")}</p>
  </div>;
}

function SilverGradeComparison({ grades, locale, market, volumeQuery, t }: { volumeQuery: string; grades?: PVCirculatorSilverGrades; locale: ProductLocale; market: PublicSolutionMarket; t: Translate }) {
  return <div className="pvc2-silver-grades">
    <h3 id="pvc2-silver-grade-title">{t("Theoretical silver concentration")}</h3>
    {grades ? <>
      <table aria-labelledby="pvc2-silver-grade-title">
        <thead><tr><th scope="col">{t("Method")}</th><th scope="col">{t("Silver-bearing output")}</th><th scope="col">{t("Upper limit (wt.%)")}</th></tr></thead>
        <tbody>{silverStreams.map(([code, method, output]) => {
          const grade = grades.find(item => item.code === code)?.silverUpperPct;
          return <tr key={code}><th scope="row">{t(method)}</th><td>{t(output)}</td>
            <td>{grade == null ? "—" : new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(grade / 100)}</td></tr>;
        })}</tbody>
      </table>
      <p>{t("The model assumes all module silver enters the indicated output. The upper limit is the mass of silver divided by the total mass of that output.")}</p>
      <Link href={solutionHref(locale, market) + volumeQuery + "#value"}>{t("View silver assumptions in Our Solution")}</Link>
    </> : <p>{t("Silver concentration estimates are unavailable for this market.")}</p>}
  </div>;
}

export function PVCirculatorPage({ routes = [], reference, recovery, silverGrades, transportPricing, locale = "en-US", specificationFx, market = "US", equipmentConfigurations = defaultEquipmentConfigurations, equipmentClaims = defaultEquipmentQuantitative.claims, marketDefaults = defaultEquipmentQuantitative.markets[market], sitePowerOptions = defaultEquipmentQuantitative.sitePower }: { equipmentConfigurations?: EquipmentConfigurations; equipmentClaims?: EquipmentClaims; marketDefaults?: EquipmentMarketDefaults; sitePowerOptions?: SitePowerOptions; routes?: PVCirculatorProfitRoute[]; reference?: PVCirculatorReference; recovery?: PVCirculatorRecovery; silverGrades?: PVCirculatorSilverGrades; transportPricing?: PVCirculatorTransportPricing; locale?: ProductLocale; specificationFx?: number; market?: PublicSolutionMarket }) {
  const t = translate(locale);
  const rating = equipmentLineRating(equipmentConfigurations);
  const estimate = useCapacityEstimate(rating, marketDefaults);
  const baseVariants = ["economic", "basic", "premium"] as const;
  const configurationValues = baseVariants.map(variant => equipmentConfigurations[variant].values["Rated throughput"]) as [string, string, string];
  const shareThroughput = baseVariants.every(variant => equipmentLineRating(equipmentConfigurations, variant).panelsPerMinute === rating.panelsPerMinute);
  const rows = [...configurationRows.slice(0, 8), ["Rated Throughput", ...configurationValues] as const, ...configurationRows.slice(8)];
  const number = (value: number) => value.toLocaleString(locale, { maximumFractionDigits: 3 });
  const claimValues = {
    throughput: number(rating.panelsPerMinute),
    operators: number(rating.direct),
    panelsPerYear: number(equipmentClaims.annualPanels),
    recovery: number(equipmentClaims.recoveryPercent),
    purity: number(equipmentClaims.glassPurityPercent),
    glass: number(equipmentClaims.glassInCellPowderPercent),
    hours: number(equipmentClaims.relocationHours),
  };
  const [feeOverride, setFeeOverride] = useState<{ market: PublicSolutionMarket; value: string }>();
  const feeInput = feeOverride?.market === market ? feeOverride.value : String(reference?.processingFee ?? "");
  const enteredFee = feeInput.trim() === "" ? NaN : Number(feeInput);
  const feeRate = Number.isFinite(enteredFee) && enteredFee >= 0 ? enteredFee : null;
  const feePerPanel = reference && feeRate !== null
    ? feeRate * (reference.feeUnit.endsWith("/lb") ? reference.panelWeightLb : reference.panelWeightKg)
    : null;
  const annualFeeRevenue = estimate.valid && feePerPanel !== null ? estimate.netAnnual * feePerPanel : null;
  const materialRevenuePerPanel = recovery?.materials.reduce((sum, material) => sum + material.revenuePerPanel, 0);
  const revenueRatio = materialRevenuePerPanel !== undefined && feePerPanel !== null && feePerPanel > 0
    ? Math.round(materialRevenuePerPanel / feePerPanel * 100) / 100
    : null;
  const showRevenueComparison = estimate.valid && estimate.netAnnual > 0 && Boolean(recovery);
  const transferredVolume = useTransferredVolume();
  const monthlyVolume = transferredVolume ?? (estimate.valid ? estimate.monthlyAverage : 0);
  const volumeQuery = monthlyVolume > 0 ? "&panelsPerMonth=" + monthlyVolume : "";
  const businessCaseHref = marketCalculatorHref(locale, market) + volumeQuery;
  const [active, setActive] = useState<(typeof sections)[number][0]>("pvcirculator");
  const [inquiry, setInquiry] = useState(false);
  const [purchaseOption, setPurchaseOption] = useState<EquipmentPurchaseOption>("Standard sales");
  const [permitMarket, setPermitMarket] = useState<PublicSolutionMarket | null>(null);
  const hasRecyclingPermit = permitMarket === market && market !== "JP";
  const [mouReview, setMouReview] = useState<EquipmentMouReview | null>(null);
  const paneNavigationLocked = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("inquiry") === "1") setInquiry(true);
  }, [market]);
  useEffect(() => {
    document.documentElement.classList.add("pv-section-scroll");
    const elements = sections.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    let frame = 0;
    function updateActive() {
      frame = 0;
      const navigationEdge = document.querySelector(".pvc2-page > .pv-header")?.getBoundingClientRect().bottom ?? 0;
      const visible = elements.findLast(element => element.getBoundingClientRect().top <= navigationEdge + 1);
      if (visible) setActive(visible.id as (typeof sections)[number][0]);
    }
    function scheduleUpdate() {
      if (!frame) frame = requestAnimationFrame(updateActive);
    }
    updateActive();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      document.documentElement.classList.remove("pv-section-scroll");
    };
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

  const light = ["performance", "functions", "quality", "routes", "capability", "deployability", "configurations", "business-model", "specification"].includes(active);

  return <div className={`pv-review pvc2-page${light ? " pv-light-nav" : ""}`} data-active-section={active}>
    <a className="pv-skip" href="#pvcirculator">{t("Skip to PV Circulator")}</a>
    <PublicHeader locale={locale} languagePath="/pv-circulator/" languageQuery={`?market=${market}${volumeQuery}`} solutionMarket={market} assistantInlineLinks assistantTechnologyAnchor="#process" />
    <nav className="pv-dots" aria-label={t("PV Circulator sections")}>
      {sections.map(([id, label]) => (
        <a key={id} href={`#${id}`} aria-label={t(label)} aria-current={active === id ? "step" : undefined}>
          <i aria-hidden="true" /><span>{t(label)}</span>
        </a>
      ))}
    </nav>
    <main>
      <section id="pvcirculator" className="pv-screen pv-hero pvc2-hero" aria-labelledby="pvc-title">
        <LoopVideo src="/videos/pvc-operation.mp4" className="pvc2-cover-video" />
        <div className="pv-hero-shade" />
        <div className="pv-hero-copy"><h1 id="pvc-title">{t("Separate more.")}<br />{t("Preserve more value.")}</h1><p>{t("Turn end-of-life solar panels into clean, sellable material streams—automatically, at industrial scale, and without chemicals, heat or process water.")}</p></div>
      </section>

      <section id="performance" className="pv-screen pvc2-performance" aria-labelledby="performance-title">
        <div className="pvc2-performance-overview">
          <header className="pvc2-section-heading"><h2 id="performance-title">{t("Built for industrial")}<br />{t("PV recycling.")}</h2><p>{t("Every line is designed around one question: how much value can you recover per panel, at what operating cost?")}</p></header>
          <figure className="pvc2-machine"><img src="/images/pvc-machine.webp" alt={t("PV Circulator industrial solar panel recycling line")} /></figure>
          <div className="pvc2-card-row">{performance.map(([value, title, text]) => <article key={value}><strong>{formatCopy(t(value), claimValues)}</strong><h3>{t(title)}</h3><p>{formatCopy(t(text), claimValues)}</p></article>)}</div>
        </div>
        <CapacityEstimate estimate={estimate} rating={rating} shareThroughput={shareThroughput} plusThroughput={integratedEquipmentThroughput(equipmentConfigurations)} businessCaseHref={marketCalculatorHref(locale, market)} locale={locale} t={t}
          reference={reference} feeInput={feeInput} setFeeInput={value => setFeeOverride({ market, value })} annualFeeRevenue={annualFeeRevenue} />
      </section>

      <ProcessPlaylist active={active === "process"} locale={locale} productCopy infeedPanelsPerPallet={equipmentClaims.infeedPanelsPerPallet}
        heading={<>{t("Simple principle.")}<br />{t("Layer by layer.")}<br />{t("Material by material.")}</>} />

      <section id="functions" className="pv-screen pvc2-split pvc2-split-64" aria-labelledby="functions-title">
        <div className="pvc2-split-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "layer-by-layer", "process", true)}><div><h2 id="functions-title">{t("Configure the line.")}<br />{t("Fit your operation.")}</h2><p>{t("Start with the core line, then add what your operation needs: intelligent identification, integrated junction-box removal or material preparation for downstream buyers.")}</p><Link className="pv-button" href={`?market=${market}&inquiry=1#specification`}>{t("Request equipment information")}{' '}<Arrow /></Link></div></div>
        <div className="pvc2-split-scroll" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "layer-by-layer", "process")}>{functions.map(([number, title, lead, text, image]) => <article className="pvc2-function" key={number}><img src={image} alt="" /><div><span>{locale === "zh-TW" ? t(number) : number}</span><h3>{t(title)}</h3><strong>{t(lead)}</strong><p>{t(text)}</p></div></article>)}</div>
      </section>

      <section id="layer-by-layer" className="pv-screen pvc2-media-screen" aria-labelledby="layer-title">
        <LoopVideo src="/videos/pvc-layer-separation.mp4" className="pvc2-cover-video" />
        <div className="pvc2-media-shade" />
        <div className="pvc2-media-copy">
          <div className="pvc2-layer-intro">
            <h2 id="layer-title">{t("Don't crush")}<br />{t("value together.")}</h2>
            <p>{t("A PV module is built in layers: glass, encapsulant, cells and backsheet. Shred it, and they end up mixed together. Separate them, and each one stays clean enough for what comes next.")}</p>
          </div>
          <SilverGradeRange grades={silverGrades} locale={locale} t={t} />
          <SilverGradeComparison volumeQuery={volumeQuery} grades={silverGrades} locale={locale} market={market} t={t} />
        </div>
      </section>

      <section id="quality" className="pv-screen pvc2-quality" aria-labelledby="quality-title">
        <div className="pvc2-quality-estimate">
          <header className="pvc2-section-heading">
            <h2 id="quality-title">{t("What comes out")}<br />{t("matters.")}</h2>
            <p>{t("Recovery rate tells you how much comes back.")}<br />{" "}{t("Purity determines what the recovered material can become—and what it may be worth.")}</p>
            {showRevenueComparison && revenueRatio !== null && Number.isFinite(revenueRatio) && <div className="os-materials-demand">
              <strong>{revenueRatio.toLocaleString(locale, { maximumFractionDigits: 2 })}×</strong>
              <h3>{t("Material sales revenue relative to recycling fee revenue")}</h3>
              {revenueRatio > 1 && <p>{t("At the current fee, material sales generate more revenue than recycling fees.")}<br />{" "}{t("Lower recycling fees would make material sales even more important.")}</p>}
            </div>}
            {showRevenueComparison && feePerPanel === 0 && Boolean(materialRevenuePerPanel)
              && <p>{t("At a zero recycling fee, material sales are the only modeled revenue source.")}</p>}
          </header>
          <RecoveryEstimate recovery={recovery} reference={reference} annualPanels={estimate.valid ? estimate.netAnnual : null} locale={locale} t={t} />
        </div>
        <div className="pvc2-quality-materials">
          <h3>{t("Recovered material quality")}</h3>
          <div className="pvc2-material-grid">
            {outputs.map(([name, value, text]) => <article key={name}>
              <div><span>{t(name)}</span><strong>{formatCopy(t(value), claimValues)}</strong></div>
              <p>{t(text)}</p>
            </article>)}
          </div>
          <div className="pvc2-evidence-note">
            <h4>{t("Check your buyer’s specifications")}</h4>
            <p>{t("For a representative batch, request kilograms of each recovered stream per tonne of input, measured purity, key contaminants and residual waste. Include the panel mix and any buyer acceptance criteria in your inquiry.")}</p>
            <a className="pv-text-button" href={`?market=${market}&inquiry=1#specification`}>{t("Ask about samples or test reports")} <Arrow /></a>
          </div>
        </div>
      </section>

      <ProfitComparison volumeQuery={volumeQuery} routes={routes} reference={reference} feePerPanel={feePerPanel} feeRate={feeRate} market={market} locale={locale} businessCaseHref={businessCaseHref} t={t} />
      <section id="capability" className="pv-screen pvc2-split pvc2-split-64" aria-labelledby="capability-title">
        <div className="pvc2-split-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "deployability", "quality")}><div><h2 id="capability-title">{t("One platform.")}<br />{t("Intact, broken or glass-glass.")}</h2><p>{t("PV Circulator separates intact modules layer by layer. The PLUS module extends the system to broken and glass-glass feedstock through crushing and material separation.")}</p>
          <table className="pvc2-feedstock-table">
            <caption>{t("Feedstock and processing route")}</caption>
            <thead><tr><th scope="col">{t("Feedstock")}</th><th scope="col">{t("Processing route")}</th></tr></thead>
            <tbody>
              <tr><th scope="row">{t("Intact glass-backsheet modules")}</th><td>Economic / Basic / Premium</td></tr>
              <tr><th scope="row">{t("Glass-glass modules")}</th><td>PLUS</td></tr>
              <tr><th scope="row">{t("Broken modules")}</th><td>PLUS</td></tr>
            </tbody>
          </table>
          <p>{t("For mixed loads, share the proportions and sample models so we can check routing, sorting and preparation for your site.")}</p>
        </div></div>
        <div className="pvc2-split-scroll pvc2-photo-stack" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "deployability", "quality")}><article className="pvc2-image-card"><img src="/images/pvc-feedstock-intact.jpg" alt={t("Intact solar panels ready for processing")} /><div><span>{locale === "zh-TW" ? "PV Circulator" : "PV CIRCULATOR"}</span><h3>{t("Intact modules")}</h3><p>{t("Automated layer-by-layer separation for framed and frameless glass-backsheet panels.")}</p></div></article><article className="pvc2-image-card"><img src="/images/pvc-feedstock-broken.jpg" alt={t("Broken solar panel feedstock")} /><div><span>{t("PLUS MODULE")}</span><h3>{t("Broken & glass-glass")}</h3><p>{t("Integrated crushing and material separation expands feedstock compatibility.")}</p></div></article></div>
      </section>

      <section id="deployability" className="pv-screen pvc2-split pvc2-split-64 pvc2-deployability os-method-comparison" aria-labelledby="deployability-title">
        <div className="pvc2-split-copy" tabIndex={0} onWheel={event => navigateSplitPane(event, "configurations", "capability")}>
          <div>
            <h2 id="deployability-title">{t("Shorter hauls.")}<br />{t("More competitive recycling.")}</h2>
            <p>{t("Fixed-site shredding and thermal processing require hauling panels to the plant. PV Circulator can process panels on-site or near the source. Shorter hauls lower what owners pay for freight and make recycling more competitive.")}</p>
            <DistanceSensitivity annualPanels={estimate.valid ? estimate.netAnnual : null} reference={reference}
              pricing={transportPricing} market={market} locale={locale} t={t} />
          </div>
        </div>
        <div className="pvc2-split-scroll pvc2-photo-stack" tabIndex={0} onWheel={event => navigateSplitPane(event, "configurations", "capability")}>
          <article className="pvc2-image-card pvc2-onsite-card">
            <img src="/images/pvc-deploy-onsite.webp" alt={t("Illustrative modular PV recycling operation at a solar farm")} />
            <div>
              <span>{t("ON-SITE PROCESSING")}</span>
              <h3>{t("Bring recycling to")}<br />{t("the panels.")}</h3>
              <p>{t("Set up at large decommissioning projects and collection sites. Skip the long haul.")}</p>
              <details className="pv-details pvc2-deployment-features">
                <summary>{t("Deployment features")}</summary>
                <article><strong>{t("Modular")}</strong> · <span>{t("Install. Dismantle. Redeploy.")}</span><p>{t("Integrated processing modules enable efficient installation, dismantling and redeployment.")}</p></article>
                <article><strong>{formatCopy(t("{hours} Hours"), claimValues)}</strong> · <span>{t(equipmentClaims.relocationHours === 24 ? "Relocate in a day." : "Rapid relocation.")}</span><p>{t("Designed for rapid teardown and restart, subject to site readiness. Transport time excluded.")}</p></article>
                <article><strong>{t("Relocatable")}</strong> · <span>{t("Follow the feedstock.")}</span><p>{t("Move the line as panel volumes and collection locations change.")}</p></article>
              </details>
            </div>
          </article>
          <article className="pvc2-image-card"><img src="/images/pvc-deploy-nearsite.webp" alt={t("Illustrative regional PV recycling hub")} /><div><span>{t("NEAR-SITE PROCESSING")}</span><h3>{t("Build capacity close")}<br />{t("to the supply.")}</h3><p>{t("Run a regional hub for several collection points, and move it when volumes shift.")}</p></div></article>
        </div>
      </section>

      <section id="configurations" className="pv-screen pvc2-split pvc2-split-64" aria-labelledby="configurations-title">
        <div className="pvc2-split-scroll pvc2-config-table" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "business-model", "deployability")}><div className="pvc2-config-comparison" role="table" aria-label={t("Comparison of PV Circulator configurations")}><div className="pvc2-config-head" role="row"><span role="columnheader">{t("Functions")}</span>{[["Economic", "Start lean."], ["Basic", "Complete separation."], ["Premium", "Automated & traceable."]].map(([name, lead], index) => <span role="columnheader" className={index === 2 ? "is-premium" : ""} key={name}><strong>{name}</strong><small>{t(lead)}</small></span>)}</div>{rows.map(([label, economic, basic, premium]) => <div className="pvc2-config-row" role="row" key={label}><span role="rowheader">{t(label)}</span><ConfigurationValue t={t} value={economic} /><ConfigurationValue t={t} value={basic} /><ConfigurationValue t={t} value={premium} premium /></div>)}<div className="pvc2-config-plus"><strong>{t("PLUS — One module. Every configuration.")}</strong><p>{t("Available with Economic, Basic and Premium. Expand feedstock compatibility without changing your core PV Circulator configuration.")}</p>{["Coarse Crusher", "Fine Crusher", "Material Separation"].map((label) => <div className="pvc2-config-row" role="row" key={label}><span role="rowheader">{t(label)}</span><ConfigurationValue t={t} value /><ConfigurationValue t={t} value /><ConfigurationValue t={t} value premium /></div>)}<div className="pvc2-config-row pvc2-config-dust"><span>{t("Dust Control")}</span><span>{t("Enclosed extraction and dedicated collection")}</span></div></div></div></div>
        <div className="pvc2-split-copy pvc2-config-copy" tabIndex={0} onWheel={(event) => navigateSplitPane(event, "business-model", "deployability")}><div><h2 id="configurations-title">{t("Choose")}<br />{t("the right fit.")}</h2><strong>{t("Three configurations.")}<br />{t("One goal: maximum material value.")}</strong><p>{t("Choose Economic, Basic or Premium to match your automation needs and material recovery goals. Add PLUS to expand feedstock compatibility across intact, broken and glass-glass PV modules.")}</p><div className="pvc2-business-case"><strong>{t("Evaluate the economics of your configuration.")}</strong><p>{t("Explore processing costs, material recovery value and annual EBITDA based on your operating conditions.")}</p>
          <p>{t("Premium integrates junction-box removal. Economic and Basic require separate preparation for that step. Check power, floor loading and staffing in the specifications.")}</p><a className="pv-text-button" href={businessCaseHref}>{t("Calculate your business case")}{' '}<Arrow /></a></div></div></div>
      </section>

      <PVCirculatorBusinessModel market={market} t={t} hasRecyclingPermit={hasRecyclingPermit}
        onPermitChange={checked => {
          setPermitMarket(checked ? market : null);
          if (!checked && purchaseOption === "Trial-based PO (TBP)") {
            setPurchaseOption("Standard sales");
            setMouReview(null);
          }
        }}
        onPaneWheel={event => navigateSplitPane(event, "specification", "configurations")}
        onPurchase={option => {
          setPurchaseOption(option);
          setMouReview(null);
          setInquiry(true);
        }} />

      <Specifications inquiry={inquiry} setInquiry={setInquiry} hasRecyclingPermit={hasRecyclingPermit} purchaseOption={purchaseOption} setPurchaseOption={setPurchaseOption}
        mouReview={mouReview} setMouReview={setMouReview} locale={locale} market={market} businessCaseHref={businessCaseHref} specificationFx={specificationFx} estimate={estimate} recyclingFee={feeRate} marketDefaults={marketDefaults} sitePowerOptions={sitePowerOptions} equipmentConfigurations={equipmentConfigurations} />
    </main>
  </div>;
}
