'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import './marketing.css';
import { PublicHeader } from './public-header';
import { useSiteSettings } from './site-utilities';

import { equipmentInquiryNotesLimit, equipmentOfftakeStreams, equipmentOfftakeTerms, otherSitePowerSupply } from "../../lib/equipment-mou";
import { defaultSitePowerOptions, type EquipmentMarketDefaults, type SitePowerOptions } from "../../lib/equipment-quantitative";
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
      rootMargin: "-36px 0px 0px",
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

const unspecified = 'Not yet determined';


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
  ft2: "floorAreaFt2",
  m2: "floorAreaM2",
} as const;
type FloorAreaUnit = keyof typeof floorAreaSettings;

const catalogInquiryMaterials = products.map(({ name }) => name);

function CapacityInput({ name, label, value, onChange, t }: {
  name: "targetCapacity" | "dailyHours";
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  t: ReturnType<typeof inquiryTranslate>;
}) {
  const id = useId();
  const isCapacity = name === "targetCapacity";
  const min = isCapacity ? 0 : 0.25;
  const max = isCapacity ? 1e9 : 24;

  function adjust(direction: -1 | 1) {
    const current = value === "" ? 0 : Number(value);
    const next = isCapacity
      ? ((direction === 1 ? Math.floor(current / 500) : Math.ceil(current / 500)) + direction) * 500
      : current + direction;
    onChange(String(Math.max(min, Math.min(max, next))));
  }

  return <div className="pc-floor-area">
    <label htmlFor={id}>{label}</label>
    <div className="pc-capacity-controls">
      <input id={id} name={name} type="number" min={min} max={max} step={isCapacity ? 1 : "any"}
        value={value} onChange={event => onChange(event.currentTarget.value)}
        onKeyDown={event => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          adjust(event.key === "ArrowUp" ? 1 : -1);
        }} />
      <div className="pc-capacity-buttons">
        <button type="button" aria-label={t(isCapacity ? "Increase target capacity" : "Increase operating hours")} onClick={() => adjust(1)}>+</button>
        <button type="button" aria-label={t(isCapacity ? "Decrease target capacity" : "Decrease operating hours")} onClick={() => adjust(-1)}>−</button>
      </div>
    </div>
  </div>;
}

export function EquipmentFields({ locale = "en-US", market, specificationPerformance, defaults, sitePowerOptions = defaultSitePowerOptions, onInstallationMarketChange }: {
  locale?: OurSolutionLocale;
  market?: PublicSolutionMarket;
  specificationPerformance?: EquipmentPerformance | null;
  defaults?: EquipmentMarketDefaults;
  sitePowerOptions?: SitePowerOptions;
  onInstallationMarketChange?: (market: PublicSolutionMarket) => void;
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
  const powerSupplyField = <label>{t("Site power supply")}
    {fromSpecification ? <select key={installationMarket} name="powerSupply" defaultValue={unspecified}>
      <option value={unspecified}>{t(unspecified)}</option>
      {installationMarket && sitePowerOptions[installationMarket].map(supply => {
        const label = `${supply} · ${t("Three-phase")}`;
        return <option key={supply} value={supply}>{label}</option>;
      })}
      <option value={otherSitePowerSupply}>{t(otherSitePowerSupply)}</option>
    </select> : <input name="powerSupply" placeholder={t("Voltage, frequency, and phase")} />}
  </label>;

  return <>
    <fieldset className="pc-booking-fieldset">
      <legend>{t(fromSpecification ? "Processing capacity" : "Feedstock and capacity")}</legend>
      <div className="pc-form-pair">
        {fromSpecification ? <>
          <CapacityInput name="targetCapacity" label={t("Target capacity (panels/month)")}
            value={capacityOverride ?? specificationPerformance?.monthlyAverage ?? ""} onChange={setCapacityOverride} t={t} />
          <CapacityInput name="dailyHours" label={t("Operating hours per day")}
            value={hoursOverride ?? specificationPerformance?.dailyHours ?? ""} onChange={setHoursOverride} t={t} />
        </> : <>
          <label>{t("Target capacity (panels/month)")}<input name="targetCapacity" type="number" min="500" step="500" /></label>
          <label>{t("Operating hours per day")}<input name="dailyHours" type="number" min="1" max="24" step="1" /></label>
        </>}
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
      {!fromSpecification && <MaterialRecoveryRequirements t={t} materials={catalogInquiryMaterials} />}
    </fieldset>
    <fieldset className="pc-booking-fieldset">
      <legend>{t("Installation and operation")}</legend>
      <div className="pc-form-pair">
        <label>{t(fromSpecification ? "Country / region" : "Installation country or region (required)")}
          <select name="installationCountry" required value={installationMarket}
            onChange={event => {
              const selected = event.currentTarget.value as PublicSolutionMarket;
              setInstallationMarket(selected);
              onInstallationMarketChange?.(selected);
            }}>
            <option value="" disabled>{t("Select a country or region")}</option>
            {(["US", "AU", "EU", "UK", "CA", "JP"] as const).map(market => (
              <option key={market} value={market}>{marketNames[locale][market]}</option>
            ))}
          </select>
        </label>
        <label>{t(fromSpecification ? "City" : "Installation city or site")}
          <input name="installationSite" maxLength={fromSpecification ? 240 : undefined}
            autoComplete={fromSpecification ? "section-installation address-level2" : undefined} />
        </label>
        {fromSpecification && <label>{t("Postal code")}
          <input name="installationPostalCode" autoComplete="section-installation postal-code" maxLength={16}
            autoCapitalize="characters" spellCheck={false} />
        </label>}
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
              step="any" defaultValue={fromSpecification ? defaults?.[floorArea] : undefined}
              inputMode={fromSpecification ? "numeric" : "decimal"} />
            <select name="floorSpaceUnit" aria-label={t("Available floor area unit")}
              value={fromSpecification ? floorAreaUnit : undefined} defaultValue={fromSpecification ? undefined : "m2"}
              onChange={fromSpecification ? event => setFloorAreaUnitOverride(event.currentTarget.value as FloorAreaUnit) : undefined}>
              <option value="m2">m²</option>
              <option value="ft2">ft²</option>
            </select>
          </div>
        </div>
        {!fromSpecification && <label>{t("Equipment interface language")}<input name="interfaceLanguage" /></label>}
        {fromSpecification ? powerSupplyField : <label>{t("Operator training language")}<input name="trainingLanguage" /></label>}
      </div>
      {!fromSpecification && <>
        <label>{t("Project documents or samples available")}
          <select name="projectMaterials" defaultValue={unspecified}>
            {[unspecified, "Facility layout available", "Representative panel specifications or samples available", "Both available", "Still preparing"].map(option =>
              <option key={option} value={option}>{t(option)}</option>)}
          </select>
        </label>
        {powerSupplyField}
      </>}
      {!fromSpecification && <label>{t("Installation, commissioning, or other project needs")}<textarea name="requirements" /></label>}
    </fieldset>
    {fromSpecification && <fieldset className="pc-booking-fieldset" aria-describedby="equipment-polymer-offtake-note">
      <legend>{t("Recycled material offtake")}</legend>
      <div className="pc-offtake-options">
        <div className="pc-offtake-head" aria-hidden="true">
          <span>{t("Apply")}</span>
          <span>{t("Material")}</span>
        </div>
        {equipmentOfftakeStreams.filter(stream => stream !== "Glass" || installationMarket === "US").map(stream => (
          <label key={stream} className="pc-material-choice pc-offtake-row">
            <input name="offtakeStreams" type="checkbox" value={stream} />
            <span>{t(stream)}</span>
            <span className="pc-offtake-term">{t(equipmentOfftakeTerms[stream])}</span>
          </label>
        ))}
      </div>
      <p className="pv-note" id="equipment-polymer-offtake-note">{t("We accept only materials produced by PV Circulator. We will confirm offtake availability for your site during the project review.")}</p>
    </fieldset>}
    <fieldset className="pc-booking-fieldset">
      <legend>{t("Contact details")}</legend>
      <div className="pc-form-pair">
        <label>{t("Company (required)")}<input name="company" autoComplete="organization" required /></label>
        {fromSpecification && <label>{t("Buyer company address")}<input name="companyAddress" autoComplete="street-address" maxLength={240} /></label>}
        <label>{t("Job title")}<input name="jobTitle" autoComplete="organization-title" /></label>
        <label>{t("Your name (required)")}<input name="name" autoComplete="name" required /></label>
        <label>{t("Work email (required)")}<input name="email" type="email" autoComplete="email" required /></label>
        <label>{t("Phone")}<input name="phone" type="tel" autoComplete="tel" maxLength={fromSpecification ? 80 : undefined} /></label>
        {fromSpecification && <label className="pc-configuration-requirements">{t("Customization requirements")}
          <textarea name="configurationRequirements" rows={2} maxLength={equipmentInquiryNotesLimit} />
        </label>}
      </div>
    </fieldset>
  </>;
}

export function ShopForm({ requestedMaterial }: { requestedMaterial?: string }) {
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
