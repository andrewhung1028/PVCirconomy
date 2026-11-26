"use client";

import type { EquipmentMarketDefaults, SitePowerOptions } from "../../lib/equipment-quantitative";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { mouWording } from "../../lib/equipment-mou-articles";
import { EquipmentFields, inquiryTranslate, type EquipmentPerformance } from "./marketing";
import { equipmentMouPriceRows, inquiryText } from "../../lib/equipment-mou-copy";
import { defaultMouSalesAgents } from "../../lib/mou-policy";
import { equipmentInquiryMaterials, equipmentInquiryNotesLimit, equipmentMouSigningLocales, equipmentProjectStages, polymerOfftakeOptions, type EquipmentBaseVariant, type EquipmentMouInput, type EquipmentMouReview } from "../../lib/equipment-mou";
import { marketNames, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";

export function SpecificationInquiry({ configuration, configurations, onConfigurationChange, includePlus, onPlusChange, performance, recyclingFee, locale, market, review, setReview, defaults, sitePowerOptions }: {
  configuration: EquipmentBaseVariant;
  configurations: ReadonlyArray<{ value: EquipmentBaseVariant; label: string }>;
  onConfigurationChange: (value: EquipmentBaseVariant) => void;
  includePlus: boolean;
  onPlusChange: (value: boolean) => void;
  performance: EquipmentPerformance | null;
  defaults: EquipmentMarketDefaults;
  sitePowerOptions: SitePowerOptions;
  locale: OurSolutionLocale;
  market: PublicSolutionMarket;
  recyclingFee: number | null;
  review: EquipmentMouReview | null;
  setReview: (value: EquipmentMouReview | null) => void;
}) {
  const t = inquiryTranslate(locale);
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const [summary, setSummary] = useState<[string, string][]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [installationMarket, setInstallationMarket] = useState(market);
  const [salesAgentStatus, setSalesAgentStatus] = useState<{ market: PublicSolutionMarket; throughSalesAgent: boolean }>();
  const throughSalesAgent = salesAgentStatus?.market === installationMarket
    ? salesAgentStatus.throughSalesAgent
    : defaultMouSalesAgents(installationMarket).length > 0;

  useEffect(() => {
    const request = new AbortController();
    fetch(`/api/equipment-mou/?market=${installationMarket}`, { signal: request.signal })
      .then(async response => {
        if (!response.ok) return;
        const result = await response.json();
        if (!request.signal.aborted && typeof result.throughSalesAgent === "boolean") {
          setSalesAgentStatus({ market: installationMarket, throughSalesAgent: result.throughSalesAgent });
        }
      })
      .catch(() => {});
    return () => request.abort();
  }, [installationMarket]);

  async function preview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const submission = Array.from(data.entries());
    const complete = form.reportValidity();
    const value = (name: string) => String(data.get(name) ?? "").trim();
    const numeric = (name: string) => value(name) ? Number(value(name)) : null;
    const floorArea = numeric("floorSpace");
    const materialRequirements = equipmentInquiryMaterials.filter(material => data.getAll("materials").includes(material))
      .map(material => ({ material, minimumPurity: numeric(`materialPurity[${material}]`) }));
    const polymerOfftake = polymerOfftakeOptions.find(option => option === value("polymerOfftake"));
    const input: EquipmentMouInput = {
      configuration: includePlus ? "plus" : configuration, locale, pageMarket: market, recyclingFee,
      installationMarket: value("installationCountry") as PublicSolutionMarket,
      baseConfiguration: includePlus ? configuration : undefined,
      polymerOfftake,
      installationSite: value("installationSite") || undefined,
      sitePowerSupply: value("powerSupply") === "Not yet determined" ? undefined : value("powerSupply") || undefined,
      targetStart: value("startDate") || undefined,
      targetAssessment: value("assessmentDate") || undefined,
      projectStage: equipmentProjectStages.find(stage => stage === value("stage")),
      customization: value("configurationRequirements") || undefined,
      panelTechnology: (value("panelTechnology") || undefined) as EquipmentMouInput["panelTechnology"],
      panelCondition: (value("panelCondition") || undefined) as EquipmentMouInput["panelCondition"],
      materialRequirements,
      installationEnvironment: (value("installationEnvironment") || undefined) as EquipmentMouInput["installationEnvironment"],
      floorArea: floorArea === null ? undefined : { value: floorArea, unit: value("floorSpaceUnit") === "ft2" ? "ft2" : "m2" },
      compressedAir: (value("compressedAir") || undefined) as EquipmentMouInput["compressedAir"],
      siteNetwork: (value("siteNetwork") || undefined) as EquipmentMouInput["siteNetwork"],
      installationNotes: value("requirements") || undefined,
      lines: Number(value("lineQuantity")), panelsPerMonth: numeric("targetCapacity"), dailyHours: numeric("dailyHours"),
    };
    const contact = { name: value("name"), company: value("company"), jobTitle: value("jobTitle"), email: value("email"), address: value("companyAddress") || undefined, phone: value("phone") || undefined };
    const summary: [string, string][] = [];
    const labelFor = (name: string) => {
      const input = form.elements.namedItem(name);
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) return name;
      const label = input.labels?.[0];
      const visibleLabel = label ? Array.from(label.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent).join("").trim() : "";
      return (input.getAttribute("aria-label") ?? visibleLabel) || name;
    };
    for (const [name, raw] of data) {
      const value = String(raw).trim();
      if (!value || (value === "Not yet determined" && name !== "polymerOfftake") || ["floorSpaceUnit", "materials"].includes(name) || name.startsWith("materialPurity[")) continue;
      if (name === "configuration") summary.push([t("Equipment configuration"), configurations.find(option => option.value === value)?.label ?? value]);
      else if (name === "installationCountry") summary.push([labelFor(name), marketNames[locale][value as PublicSolutionMarket] ?? value]);
      else if (name === "powerSupply") summary.push([labelFor(name), (form.elements.namedItem(name) as HTMLSelectElement).selectedOptions[0]?.textContent ?? value]);
      else if (name === "floorSpace") summary.push([labelFor(name), `${value} ${data.get("floorSpaceUnit") === "ft2" ? "ft²" : "m²"}`]);
      else summary.push([labelFor(name), t(value)]);
    }
    const materials = data.getAll("materials");
    if (materials.length) summary.push([t("Recovered material requirements"), materials.map(material => {
      const purity = data.get(`materialPurity[${material}]`);
      return `${t(String(material))}${purity ? ` (≥${purity}%)` : ""}`;
    }).join(", ")]);
    setPending(true);
    setError(false);
    setRateLimited(false);
    try {
      const response = await fetch("/api/equipment-mou/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complete
          ? { action: "review", input, contact, submission }
          : { action: "record-incomplete", submission }),
      });
      if (response.status === 429) {
        setRateLimited(true);
        return;
      }
      if (!response.ok) throw new Error("inquiry_unavailable");
      if (!complete) return;
      const result = await response.json();
      if (!result.review) throw new Error("review_unavailable");
      setSummary(summary);
      setReview(result.review);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return <section className="pvc2-inquiry-pane" id="equipment-inquiry" aria-labelledby={id}>
    <h2 id={id} ref={heading} tabIndex={-1}>{t("Online inquiry")}</h2>
    <p className="pv-note">{t("Review your inquiry to preview a draft MOU.")}</p>
    <form className="pc-form" onSubmit={preview} noValidate hidden={Boolean(review)}>
      <fieldset className="pc-booking-fieldset">
        <legend>{t("Equipment configuration")}</legend>
        <div className="pc-form-pair">
          <label>{t("Configuration")}
            <select name="configuration" value={configuration}
              onChange={event => onConfigurationChange(event.currentTarget.value as EquipmentBaseVariant)}>
              {configurations.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>{t("PLUS module")}
            <select name="includePlus" value={includePlus ? "With" : "Without"}
              onChange={event => onPlusChange(event.currentTarget.value === "With")}>
              <option value="Without">{t("Without")}</option>
              <option value="With">{t("With")}</option>
            </select>
          </label>
          <label>{t("Target assessment completion")}<input type="month" name="assessmentDate" max="9999-12" /></label>
          <label>{t("Project stage")}<select name="stage" defaultValue="Not yet determined">{equipmentProjectStages.map(stage => <option key={stage} value={stage}>{t(stage)}</option>)}</select></label>
          <label>{t("Number of equipment lines")}<input type="number" name="lineQuantity" min="1" max="10000" step="1" defaultValue={defaults.lineQuantity} required /></label>
          <label>{t("Expected production start")}<input type="month" name="startDate" max="9999-12" /></label>
          <label className="pc-configuration-requirements">{t("Customization requirements")}<textarea name="configurationRequirements" rows={2} maxLength={equipmentInquiryNotesLimit} /></label>
        </div>
      </fieldset>
      <EquipmentFields locale={locale} market={market} specificationPerformance={performance} defaults={defaults} sitePowerOptions={sitePowerOptions} onInstallationMarketChange={setInstallationMarket} />
      <p id={`${id}-submission-note`} className="pv-note">{t("We record the details you submit to review inquiries and prevent abuse.")}</p>
      <button className="pv-button pvc2-quote-button" type="submit" aria-describedby={`${id}-submission-note`} disabled={pending}>{t(throughSalesAgent
        ? (pending ? "Preparing MOU…" : "Review inquiry")
        : (pending ? "Checking MSRP…" : "Check MSRP"))}</button>
      {rateLimited && <p role="alert">{t("Too many inquiry attempts. Please try again later.")}</p>}
      {error && <p role="alert">{t("The MOU preview could not be prepared. Please try again.")}</p>}
    </form>
    {review && <div className="pvc2-inquiry-review">
      <h3>{t("Review inquiry")}</h3>
      <dl>{[...summary, ...equipmentMouPriceRows(locale, review.mou, review.terms)].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <div id="equipment-mou-actions" />
    </div>}
  </section>;
}


export function EquipmentMouPreview({ review: initialReview, onEdit }: { review: EquipmentMouReview; onEdit: () => void }) {
  const [review, setSigningReview] = useState(initialReview);
  const t = inquiryTranslate(initialReview.input.locale);
  const w = mouWording(initialReview.input.locale);
  const content = inquiryText(review.input, review.mou, review.contact, review.terms);
  const signingLocale = equipmentMouSigningLocales[review.input.pageMarket];
  const needsSigningVersion = review.input.locale !== signingLocale;
  const signingInJapanese = signingLocale === "ja-JP";
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState<{ signedAt: string | null; mail: "accepted" | "pending" | "unavailable" }>();
  const [error, setError] = useState("");

  useEffect(() => {
    setActionsContainer(document.getElementById("equipment-mou-actions"));
  }, []);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, [review.input.locale]);

  async function openSigningVersion() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/equipment-mou/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", input: { ...review.input, locale: signingLocale }, contact: review.contact }),
      });
      const result = await response.json();
      if (!response.ok || result.review?.input.locale !== signingLocale) throw new Error("review_unavailable");
      setSigningReview(result.review);
    } catch {
      setError(t("The MOU preview could not be prepared. Please try again."));
    } finally {
      setPending(false);
    }
  }

  async function confirm() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/equipment-mou/", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", confirmed: true, review }),
      });
      const result = await response.json();
      if (response.ok && ((result.mail === "accepted" && typeof result.signedAt === "string")
        || ((result.mail === "pending" || result.mail === "unavailable") && result.signedAt === null))) setReceipt(result);
      else setError(t(result.error === "expired_review" ? "This preview expired. Edit the inquiry and review it again."
        : result.error === "too_many_requests" ? "Please try again in an hour."
        : "Signing is currently unavailable. Please try again later."));
    } catch {
      setError(t("Signing is currently unavailable. Please try again later."));
    } finally {
      setPending(false);
    }
  }

  return <article className="pvc2-mou-preview" id="equipment-mou-preview" aria-labelledby="equipment-mou-title" lang={review.input.locale}>
    <h2 id="equipment-mou-title" ref={heading} tabIndex={-1}>{content.title}</h2>
    <p>{content.description}</p>
    {content.articles.map(article => <section className="pvc2-mou-article" key={article.number} aria-labelledby={`equipment-mou-article-${article.number}`}>
      <h3 id={`equipment-mou-article-${article.number}`}>{article.title}</h3>
      {article.introduction && <p>{article.introduction}</p>}
      {article.table ? <table className="pvc2-mou-terms" aria-labelledby={`equipment-mou-article-${article.number}`}>
        <tbody>{article.table.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody>
      </table> : <ol className="pvc2-mou-items">
        {article.items.map((item, index) => <li key={index}>{item.map(text => <p key={text}>{text}</p>)}</li>)}
      </ol>}
      {article.note && <p className="pv-note">{article.note}</p>}
    </section>)}
    <div className="pvc2-mou-signature">
      <p>{receipt?.signedAt ? content.signingCompleted : content.signatureStatus}</p>
      {receipt?.signedAt && <p className="pv-note"><time dateTime={receipt.signedAt}>
        {new Date(receipt.signedAt).toLocaleString(review.input.locale)}
      </time> · {review.token?.id}</p>}
    </div>
    {actionsContainer && createPortal(<>
      {!receipt && <>
        <div className="pvc2-mou-signing-language">
          <p>{signingInJapanese
            ? w("This MOU will be signed in Japanese.", "會以日文版簽署。", "日本語版で署名します。")
            : w("This MOU will be signed in English.", "會以英文版簽署。", "英語版で署名します。")}</p>
          {needsSigningVersion && <button type="button" className="pv-button"
            disabled={pending} onClick={openSigningVersion}>{pending ? t("Preparing MOU…") : signingInJapanese
            ? w("View Japanese MOU", "查看日文版 MOU", "日本語版のMOUを表示")
            : w("View English MOU", "查看英文版 MOU", "英語版のMOUを表示")}</button>}
        </div>
        {!needsSigningVersion && review.token && <p className="pv-note">{w(
          "By confirming, you sign using the buyer details above. Signing is completed when the copy is accepted for dispatch to your work email.",
          "點擊確認即以買方資料簽署。副本受理寄送至您的工作信箱時，即完成雙方簽署。",
          "確認すると上記の購入者情報で署名します。勤務先メールアドレスへの送信が受理された時点で、双方の署名が完了します。",
        )}</p>}
        {!needsSigningVersion && !review.token && <p role="status">{t("Signing is currently unavailable. Please try again later.")}</p>}
      </>}
      <div className="pvc2-inquiry-review-actions">
        {!receipt && <button type="button" className="pv-button" disabled={pending} onClick={onEdit}>{t("Edit details")}</button>}
        {!receipt?.signedAt && <button type="button" className="pv-button pvc2-quote-button"
          onClick={confirm} disabled={pending || needsSigningVersion || !review.token}>{pending && !needsSigningVersion ? t("Processing MOU…") : receipt ? t("Retry email delivery")
          : w("Sign and send", "簽署並發送", "署名して送信")}</button>}
      </div>
      {error && <p role="alert">{error}</p>}
      {receipt && <p role="status">{t(receipt.mail === "accepted" ? "Email accepted for delivery." : receipt.mail === "pending"
        ? "The email is being processed." : "Email is currently unavailable. Please try again later.")}</p>}
    </>, actionsContainer)}
  </article>;
}
