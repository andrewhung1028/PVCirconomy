'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './marketing.css';
import { PublicHeader } from './public-header';
import { useSiteSettings } from './site-utilities';

import inquiryCopy from "../../lib/i18n/equipment-inquiry.json";
import { marketNames, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { products } from './marketing-data';
export function Shell({ children, overlayHeader = false, showMarketPicker = false }: { children: ReactNode; overlayHeader?: boolean; showMarketPicker?: boolean }) {
  const settings = useSiteSettings();
  const content = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    if (!overlayHeader) return;
    const hero = content.current?.querySelector(".pc-catalog-hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroInView(entry.isIntersecting), {
      rootMargin: "-80px 0px 0px",
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [overlayHeader]);
  return <div className={'pc-site pv-review pv-shell' + (overlayHeader ? ' pc-hero-header' : '') + (settings.assistantEnabled ? ' pc-has-assistant' : '')}>
    <a className="pc-skip" href="#pc-content">Skip to content</a>
    <PublicHeader showMarketPicker={showMarketPicker} solid={!overlayHeader || !heroInView} assistant={settings.assistantEnabled} />
    <main id="pc-content" ref={content}>{children}</main>
    <footer className="pc-footer"><div className="pc-footer-top"><Link href="/" className="pc-logo"><img src="/images/pv-circonomy-logo.svg" alt="PV Circonomy" /></Link><p>A new life for solar.<br />A better use of resources.</p><Link href="/discover#company">About PV Circonomy <Arrow /></Link></div><div className="pc-footer-bottom"><span>© {new Date().getFullYear()} PV Circonomy</span><span>English</span><Link href="/discover">About this preview</Link><Link href="/settings">System settings</Link></div></footer>
  </div>;
}
export function Arrow() { return <svg className="pc-arrow" width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 16 16 4M4 4h12v12" stroke="currentColor" strokeWidth="1.4" /></svg>; }
export function Action({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) { return <Link className={'pc-button' + (secondary ? ' pc-button-secondary' : '')} href={href}>{children}<Arrow /></Link>; }
export function Intro({ label, title, description }: { label: string; title: string; description: string }) { return <section className="pc-intro pc-wrap"><p className="pc-eyebrow">{label}</p><h1>{title}</h1><p className="pc-lead">{description}</p></section>; }
export function EndCTA({ label = 'THE NEXT STEP', title = 'Put circularity into motion.', href = '/recycling-estimate', action = 'Get a recycling estimate' }: { label?: string; title?: string; href?: string; action?: string } = {}) { return <section className="pc-end"><div className="pc-wrap"><p className="pc-eyebrow">{label}</p><h2>{title}</h2><Action href={href}>{action}</Action></div></section>; }
export function ProductGrid() { return <div className="pc-products">{products.map((p, i) => <article className="pc-product" key={p.name}><div className={'pc-material pc-material-' + i}><img src={'/images/material-' + p.name.toLowerCase() + '.svg'} alt={p.name + ' — illustrative recovered material'} loading="lazy" /><small>ILLUSTRATIVE MATERIAL CATEGORY</small></div><p className="pc-eyebrow">{p.tag}</p><h3>{p.name}</h3><p>{p.description}</p><Link className="pc-text-link" href={'/circular-products#' + p.name.toLowerCase()}>Explore material passport <Arrow /></Link><Link className="pc-text-link" href={'/shop?type=materials&material=' + p.name}>Request a quote <Arrow /></Link></article>)}</div>; }

const equipmentConfigurations = ['Premium', 'Basic', 'Economic'];
const unspecified = 'Not yet determined';

function EquipmentOverview({ configuration }: { configuration: string }) {
  return (
    <fieldset className="pc-booking-fieldset">
      <legend>Inquiry overview</legend>
      <div className="pc-form-pair">
        <label>Inquiry purpose (required)
          <select name="purpose" required defaultValue="">
            <option value="" disabled>Select a purpose</option>
            <option>Request a quote</option>
            <option>Discuss equipment and configuration</option>
          </select>
        </label>
        <fieldset className="pc-configuration-options">
          <legend>Equipment configuration</legend>
          <div className="pc-configuration-choices">
            {equipmentConfigurations.map(option => (
              <label className="pc-configuration-choice" key={option}>
                <input type="checkbox" name="configuration" value={option} defaultChecked={configuration === option} />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="pc-configuration-requirements">Configuration requirements
          <textarea name="configurationRequirements" rows={3} />
        </label>
        <label>Project stage
          <select name="stage" defaultValue={unspecified}>
            <option>{unspecified}</option>
            <option>Initial feasibility</option>
            <option>Planning a new facility</option>
            <option>Expanding an operation</option>
          </select>
        </label>
        <label>Target start date<input name="startDate" type="month" /></label>
        <label>Number of equipment lines<input name="lineQuantity" type="number" min="1" defaultValue={1} /></label>
        <label>Itemize installation and training in the quote?
          <select name="itemizeServices" defaultValue={unspecified}>
            <option>{unspecified}</option>
            <option>Yes, show each service separately</option>
            <option>No preference</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
}

type InquiryTranslate = (text: string) => string;
export function inquiryTranslate(locale: OurSolutionLocale): InquiryTranslate {
  const translations: Record<string, string[]> = inquiryCopy;
  return text => (locale === "zh-TW" ? translations[text]?.[0] : locale === "ja-JP" ? translations[text]?.[1] : undefined) ?? text;
}

function MaterialRecoveryRequirements({ t, materials }: { t: InquiryTranslate; materials: readonly string[] }) {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  return <fieldset className="pc-material-requirements">
    <legend>{t("Recovered material requirements")}</legend>
    <div className="pc-material-requirement-head" aria-hidden="true">
      <span>{t("Material")}</span>
      <span>{t("Minimum purity (%)")}</span>
    </div>
    {materials.map(name => {
      const selected = selectedMaterials.includes(name);
      return <div className="pc-material-requirement-row" key={name}>
        <label className="pc-material-choice">
          <input type="checkbox" name="materials" value={name} checked={selected}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setSelectedMaterials(current => checked ? [...current, name] : current.filter(material => material !== name));
            }}
          />
          {t(name)}
        </label>
        <input type="number" name={`materialPurity[${name}]`} min="0" max="100" step="any" inputMode="decimal"
          disabled={!selected} placeholder={t("Optional")} aria-label={`${t(name)} · ${t("Minimum purity (%)")}`}
        />
      </div>;
    })}
  </fieldset>;
}

export type EquipmentPerformance = { monthlyAverage: number; dailyHours: number };

const floorAreaSettings = {
  ft2: { initial: 10_000, step: 1_000 },
  m2: { initial: 1_000, step: 100 },
};
type FloorAreaUnit = keyof typeof floorAreaSettings;

const catalogInquiryMaterials = products.map(({ name }) => name);
const specificationInquiryMaterials = ["Glass", "Silicon", "Silver"];

// Nominal line-to-line voltages: https://www.worldstandards.eu/electricity/three-phase-electric-power/
const industrialPowerByMarket = {
  US: ["208 V · 60 Hz", "240 V · 60 Hz", "480 V · 60 Hz"],
  CA: ["208 V · 60 Hz", "240 V · 60 Hz", "480 V · 60 Hz", "600 V · 60 Hz"],
  AU: ["400 V · 50 Hz", "415 V · 50 Hz"],
  UK: ["400 V · 50 Hz"],
  EU: ["400 V · 50 Hz"],
  JP: ["200 V · 50 Hz", "200 V · 60 Hz"],
} satisfies Record<PublicSolutionMarket, readonly string[]>;

export function EquipmentFields({ locale = "en-US", market, specificationPerformance }: {
  locale?: OurSolutionLocale;
  market?: PublicSolutionMarket;
  specificationPerformance?: EquipmentPerformance | null;
} = {}) {
  const t = inquiryTranslate(locale);
  const fromSpecification = specificationPerformance !== undefined;
  const [capacityOverride, setCapacityOverride] = useState<string>();
  const [hoursOverride, setHoursOverride] = useState<string>();
  const [installationMarket, setInstallationMarket] = useState<PublicSolutionMarket | "">(market ?? "");
  const [floorAreaUnitOverride, setFloorAreaUnitOverride] = useState<FloorAreaUnit>();
  const marketFloorAreaUnit = market === "US" || market === "UK" ? "ft2" : "m2";
  const floorAreaUnit = fromSpecification ? floorAreaUnitOverride ?? marketFloorAreaUnit : "m2";
  const floorArea = floorAreaSettings[floorAreaUnit];
  const facilityAndPowerFields = <>
    <label>{t(fromSpecification ? "Facility layout availability" : "Project documents or samples available")}
      <select name="projectMaterials" defaultValue={unspecified}>
        <option value={unspecified}>{t(unspecified)}</option>
        <option value="Facility layout available">{t("Facility layout available")}</option>
        {!fromSpecification && <>
          <option value="Representative panel specifications or samples available">{t("Representative panel specifications or samples available")}</option>
          <option value="Both available">{t("Both available")}</option>
        </>}
        <option value="Still preparing">{t("Still preparing")}</option>
      </select>
    </label>
    <label>{t("Site power supply")}
      {fromSpecification ? <select key={installationMarket} name="powerSupply" defaultValue={unspecified}>
        <option value={unspecified}>{t(unspecified)}</option>
        {installationMarket && industrialPowerByMarket[installationMarket].map(supply => {
          const label = `${supply} · ${t("Three-phase")}`;
          return <option key={supply} value={label}>{label}</option>;
        })}
        <option value="Other site power supply">{t("Other site power supply")}</option>
      </select> : <input name="powerSupply" placeholder={t("Voltage, frequency, and phase")} />}
    </label>
  </>;

  return <>
    <fieldset className="pc-booking-fieldset">
      <legend>{t("Feedstock and capacity")}</legend>
      <div className="pc-form-pair">
        <label>{t("Target capacity (panels/month)")}
          <input name="targetCapacity" type="number" min={fromSpecification ? 0 : 500} step={fromSpecification ? 1 : 500}
            value={capacityOverride ?? (fromSpecification ? specificationPerformance?.monthlyAverage ?? "" : 3000)}
            onChange={event => setCapacityOverride(event.currentTarget.value)} />
        </label>
        <label>{t("Operating hours per day")}
          <input name="dailyHours" type="number" min={fromSpecification ? 0.25 : 1} max="24" step={fromSpecification ? 0.25 : 1}
            value={hoursOverride ?? (fromSpecification ? specificationPerformance?.dailyHours ?? "" : 8)}
            onChange={event => setHoursOverride(event.currentTarget.value)} />
        </label>
        <label>{t("Panel technology")}
          <select name="panelTechnology" defaultValue="Crystalline silicon">
            <option value={unspecified} disabled={fromSpecification}>{t(unspecified)}</option>
            <option value="Crystalline silicon">{t("Crystalline silicon")}</option>
            <option value="Thin-film" disabled={fromSpecification}>{t("Thin-film")}</option>
            <option value="Mixed or other" disabled={fromSpecification}>{t("Mixed or other")}</option>
          </select>
        </label>
        <label>{t("Panel condition")}
          <select name="panelCondition" defaultValue={unspecified}>
            <option value={unspecified}>{t(unspecified)}</option>
            <option value="Mostly intact">{t("Mostly intact")}</option>
            <option value="Mostly damaged">{t("Mostly damaged")}</option>
            <option value="Mixed">{t("Mixed")}</option>
          </select>
        </label>
      </div>
      <MaterialRecoveryRequirements t={t} materials={fromSpecification ? specificationInquiryMaterials : catalogInquiryMaterials} />
    </fieldset>
    <fieldset className="pc-booking-fieldset">
      <legend>{t("Installation and operation")}</legend>
      <div className="pc-form-pair">
        <label>{t("Installation country or region (required)")}
          <select name="installationCountry" required value={installationMarket}
            onChange={event => setInstallationMarket(event.currentTarget.value as PublicSolutionMarket)}>
            <option value="" disabled>{t("Select a country or region")}</option>
            {(["US", "AU", "EU", "UK", "CA", "JP"] as const).map(market => (
              <option key={market} value={market}>{marketNames[locale][market]}</option>
            ))}
          </select>
        </label>
        <label>{t("Installation city or site")}<input name="installationSite" /></label>
        <label>{t("Installation environment")}
          <select name="installationEnvironment" defaultValue={unspecified}>
            <option value={unspecified}>{t(unspecified)}</option>
            <option value="Indoor">{t("Indoor")}</option>
            <option value="Outdoor">{t("Outdoor")}</option>
          </select>
        </label>
        <div className="pc-floor-area">
          <label htmlFor="pc-equipment-floor-area">{t("Available floor area")}</label>
          <div className="pc-floor-area-controls">
            <input key={floorAreaUnit} id="pc-equipment-floor-area" name="floorSpace" type="number" min="0"
              step={fromSpecification ? floorArea.step : "any"} defaultValue={fromSpecification ? floorArea.initial : undefined}
              inputMode={fromSpecification ? "numeric" : "decimal"} />
            <select name="floorSpaceUnit" aria-label={t("Available floor area unit")}
              value={fromSpecification ? floorAreaUnit : undefined} defaultValue={fromSpecification ? undefined : "m2"}
              onChange={fromSpecification ? event => setFloorAreaUnitOverride(event.currentTarget.value as FloorAreaUnit) : undefined}>
              <option value="m2">m²</option>
              <option value="ft2">ft²</option>
            </select>
          </div>
        </div>
        <label>{t("Equipment interface language")}
          {fromSpecification ? <select name="interfaceLanguage" defaultValue="">
            <option value="" disabled>{t(unspecified)}</option>
            <option value="English">{t("English")}</option>
            <option value="Japanese">{t("Japanese")}</option>
          </select> : <input name="interfaceLanguage" />}
        </label>
        {!fromSpecification && <label>{t("Operator training language")}<input name="trainingLanguage" /></label>}
      </div>
      {fromSpecification ? <div className="pc-form-pair">{facilityAndPowerFields}</div> : facilityAndPowerFields}
      {fromSpecification && <div className="pc-form-pair">
        <label>{t("Compressed air supply")}
          <select name="compressedAir" defaultValue={unspecified}>
            {[unspecified, "Available", "Not available"].map(option =>
              <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
        <label>{t("Site network connection")}
          <select name="siteNetwork" defaultValue={unspecified}>
            {[unspecified, "Wired Ethernet", "Wi-Fi", "Wired Ethernet and Wi-Fi", "Not available"].map(option =>
              <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
      </div>}
      <label>{t("Installation, commissioning, or other project needs")}<textarea name="requirements" /></label>
    </fieldset>
    <fieldset className="pc-booking-fieldset">
      <legend>{t("Contact details")}</legend>
      <div className="pc-form-pair">
        <label>{t("Company (required)")}<input name="company" autoComplete="organization" required /></label>
        <label>{t("Job title")}<input name="jobTitle" autoComplete="organization-title" /></label>
        <label>{t("Your name (required)")}<input name="name" autoComplete="name" required /></label>
        <label>{t("Work email (required)")}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{t("Phone")}<input name="phone" type="tel" autoComplete="tel" /></label>
      </div>
    </fieldset>
  </>;
}

export function ShopForm({ type, requestedConfiguration, requestedMaterial }: {
  type: 'equipment' | 'materials';
  requestedConfiguration?: string;
  requestedMaterial?: string;
}) {
  const configuration = requestedConfiguration && equipmentConfigurations.includes(requestedConfiguration)
    ? requestedConfiguration
    : '';
  const initialMaterial = products.find(product => product.name === requestedMaterial)?.name ?? 'Glass';
  const [submitted, setSubmitted] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const previewControls = <>
    <button className="pc-button" type="submit">Preview inquiry</button>
    {submitted && <div className="pc-confirm" role="status"><strong>Inquiry preview complete.</strong><p>Your details passed local validation.</p></div>}
  </>;

  if (type === 'equipment') return <div className="pc-wrap pc-shop">
    <form className="pc-shop-grid" onSubmit={submit} onChange={() => setSubmitted(false)}>
      <div>
        <h1 className="pc-shop-title">Equipment inquiry</h1>
        <p>Share your feedstock, target capacity, and installation plans so we can understand what your operation needs.</p>
        <div className="pc-form pc-inquiry-overview"><EquipmentOverview configuration={configuration} /></div>
        <Link className="pc-text-link" href="/business-case">Open the business case calculator <Arrow /></Link>
      </div>
      <div className="pc-form">
        <EquipmentFields />
        {previewControls}
      </div>
    </form>
  </div>;

  return <div className="pc-wrap pc-shop">
    <Link className="pc-text-link pc-shop-back" href="/shop/">Back to Shop</Link>
    <div className="pc-shop-grid">
      <div>
        <h2>Source recovered materials</h2>
        <p>Share your specification, volume and delivery needs.</p>
        <div className="pc-demo-note"><p>Preview only. Your details stay on this page.</p></div>
      </div>
      <form className="pc-form" onSubmit={submit} onChange={() => setSubmitted(false)}>
        <label>Material
          <select name="material" defaultValue={initialMaterial}>
            {products.map(product => <option key={product.name}>{product.name}</option>)}
          </select>
        </label>
        <label>Required volume (metric tonnes)<input name="volume" type="number" min="0.01" step="0.01" required placeholder="e.g. 20" /></label>
        <label>Specification and application<textarea name="specification" required placeholder="Purity, particle size, intended use, documentation…" /></label>
        <div className="pc-form-pair">
          <label>Your name<input name="name" autoComplete="name" required /></label>
          <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
        </div>
        <label>Delivery location<input name="deliveryLocation" required placeholder="City, state / region, country" /></label>
        {previewControls}
      </form>
    </div>
  </div>;
}

export function MediaStory({ image, alt, label, title, description, children, layout = 'stacked', cards }: { image: string; alt: string; label: string; title: string; description: string; children?: ReactNode; layout?: 'stacked' | 'left' | 'right'; cards?: { title: string; body: string; symbol: string }[] }) {
  return <section className={'pc-editorial pc-editorial-' + layout}>
    <figure className="pc-editorial-figure"><img className="pc-editorial-image" src={'/images/' + image} alt={alt} loading="lazy" />{image.startsWith('solar-circularity') && <figcaption>Illustrative solar circularity imagery</figcaption>}</figure>
    <div className="pc-editorial-caption"><p className="pc-eyebrow">{label}</p><h2>{title}</h2><p>{description}</p>{children && <div className="pc-actions">{children}</div>}</div>
    {cards && <div className="pc-info-cards">{cards.map(card => <article key={card.title}><span aria-hidden="true">{card.symbol}</span><h3>{card.title}</h3><p>{card.body}</p></article>)}</div>}
  </section>;
}
