import { defaultMouPolicy } from "./mou-policy";
import { equipmentMouArticles, mouWording } from "./equipment-mou-articles";
import { equipmentMouHasSalesAgent, equipmentOfftakeStreams, equipmentOfftakeTerms, type EquipmentMou, type EquipmentMouContact, type EquipmentMouInput, type EquipmentMouTerms } from "./equipment-mou";
import { isSitePowerOption } from "./equipment-quantitative";
import { marketNames, type OurSolutionLocale } from "./our-solution/market";
import translations from "./i18n/equipment-inquiry.json";

export function equipmentInquiryTranslate(locale: OurSolutionLocale) {
  const entries: Record<string, string[]> = translations;
  return (text: string) => (locale === "zh-TW" ? entries[text]?.[0] : locale === "ja-JP" ? entries[text]?.[1] : undefined) ?? text;
}

export function equipmentOfftakeLabel(value: string, t: (text: string) => string, legacyGlassPrice = false) {
  const stream = equipmentOfftakeStreams.find(option => option === value);
  return !stream || (stream === "Glass" && legacyGlassPrice)
    ? t(value)
    : `${t(stream)} · ${t(equipmentOfftakeTerms[stream])}`;
}

function priceFormatter(locale: OurSolutionLocale, currency: string) {
  return new Intl.NumberFormat(locale, { style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: currency === "JPY" ? 0 : 2 });
}

export function equipmentMouPriceRows(locale: OurSolutionLocale, mou: EquipmentMou, terms: EquipmentMouTerms): [string, string][] {
  if (equipmentMouHasSalesAgent(terms) || mou.msrpPerLine === null || mou.msrpTotal === null) return [];
  const t = equipmentInquiryTranslate(locale);
  const price = priceFormatter(locale, mou.currency);
  return [
    [t("MSRP per line"), price.format(mou.msrpPerLine)],
    [t("Total equipment MSRP"), price.format(mou.msrpTotal)],
  ];
}

export function inquiryText(input: EquipmentMouInput, mou: EquipmentMou, contact: EquipmentMouContact, terms: EquipmentMouTerms) {
  const policy = terms.policy ?? defaultMouPolicy;
  const throughSalesAgent = equipmentMouHasSalesAgent(terms);
  const t = equipmentInquiryTranslate(input.locale);
  const w = mouWording(input.locale);
  const number = new Intl.NumberFormat(input.locale, { maximumFractionDigits: 2 });
  const money = priceFormatter(input.locale, mou.currency);
  const names = { economic: "Economic", basic: "Basic", premium: "Premium", plus: "PLUS" };
  const configuration = input.configuration === "plus" && input.baseConfiguration
    ? `${names[input.baseConfiguration]} + PLUS` : names[input.configuration];
  const unavailable = t("Pending confirmation");
  const option = (value: string | undefined) => value ? t(value) : "—";
  const materials = input.materialRequirements?.map(({ material, minimumPurity }) =>
    minimumPurity === null ? t(material) : `${t(material)} (≥${minimumPurity}%)`).join(", ");
  const sitePower = isSitePowerOption(input.sitePowerSupply)
    ? `${input.sitePowerSupply} · ${t("Three-phase")}` : option(input.sitePowerSupply);
  const rows: [string, string][] = [
    [t("Equipment configuration"), configuration],
    [t("PLUS module"), t(input.configuration === "plus" ? "Add PLUS" : "Without PLUS")],
    [t("Target assessment completion"), input.targetAssessment || "—"],
    [t("Project stage"), t(input.projectStage ?? "Not yet determined")],
    [t("Number of equipment lines"), number.format(input.lines)],
    [t("Expected production start"), input.targetStart || "—"],
    [t("Target capacity (panels/month)"), input.panelsPerMonth === null ? "—" : number.format(input.panelsPerMonth)],
    [t("Operating hours per day"), input.dailyHours === null ? "—" : number.format(input.dailyHours)],
    [t("Panel technology"), option(input.panelTechnology)],
    [t("Panel condition"), option(input.panelCondition)],
    ...(input.offtakeStreams === undefined ? [
      [t("Recovered material requirements"), materials || "—"],
      [t("EVA and backsheet offtake"), option(input.polymerOfftake)],
    ] satisfies [string, string][] : []),
    [t("Installation market"), marketNames[input.locale][input.installationMarket]],
    [t("Installation city or site"), input.installationSite || "—"],
    ...(input.installationPostalCode ? [[t("Installation postal code"), input.installationPostalCode] as [string, string]] : []),
    [t("Installation environment"), option(input.installationEnvironment)],
    [t("Available floor area"), input.floorArea
      ? `${number.format(input.floorArea.value)} ${input.floorArea.unit === "ft2" ? "ft²" : "m²"}` : "—"],
    ...(input.interfaceLanguage ? [[t("Equipment interface language"), option(input.interfaceLanguage)] as [string, string]] : []),
    [t("Site power supply"), sitePower],
    ...(input.compressedAir ? [[t("Compressed air supply"), option(input.compressedAir)] as [string, string]] : []),
    ...(input.siteNetwork ? [[t("Site network connection"), t(input.siteNetwork)] as [string, string]] : []),
    ...(input.installationNotes ? [[t("Installation, commissioning, or other project needs"), input.installationNotes] as [string, string]] : []),
    ...(input.offtakeStreams ? [[t("Recycled material offtake"), input.offtakeStreams.map(stream => equipmentOfftakeLabel(stream, t, Boolean(input.glassOfftakePrice))).join(", ") || "—"] as [string, string]] : []),
    ...(input.glassOfftakePrice ? [[t("Glass offtake pricing"), t(input.glassOfftakePrice)] as [string, string]] : []),
    [t("Customization requirements"), input.customization || "—"],
  ];
  rows.push(
    ...equipmentMouPriceRows(input.locale, mou, terms),
    [w("Budget estimate validity", "概估報價有效期限", "概算見積の有効期間"),
      w(`Up to ${policy.validityDays} days from completion of signing, subject to Article 7. A formal quotation states its own validity.`,
        `自完成簽署起最長 ${policy.validityDays} 日，依第 7 條終止。正式報價以其所載有效期限為準。`,
        `署名完了日から最長${policy.validityDays}日。第7条に従い終了します。正式見積書の有効期限は当該見積書に明記します。`)],
  );
  if (!throughSalesAgent && mou.msrpTotal === null && mou.investment !== null)
    rows.push([t("Modeled equipment investment"), money.format(mou.investment)]);
  rows.push([t("Estimated annual EBITDA"), mou.annualEbitda === null ? "—" : money.format(mou.annualEbitda)]);
  const payback = mou.paybackYears !== null
    ? t("{value} years").replace("{value}", number.format(mou.paybackYears))
    : mou.annualEbitda !== null && mou.annualEbitda <= 0 ? t("Not reached under these assumptions") : unavailable;
  if (!throughSalesAgent) rows.push([t("Estimated simple payback"), payback]);
  const manufacturer = w("TSGC Technologies Inc.", "鴻躉股份有限公司", "鴻躉股份有限公司（TSGC Technologies Inc.）");
  const agentLabel = w("Sales agent", "銷售代理商", "販売代理店");
  const seller = [
    w("Party A · Seller", "甲方｜賣方", "甲｜売主側"),
    `${w("Equipment manufacturer", "設備製造商", "設備製造元")}　${manufacturer}`,
    `${w("Equipment seller", "設備銷售商", "設備販売会社")}　${terms.seller}`,
  ];
  if (terms.agent) {
    const { company, address, representative, title, email } = terms.agent;
    seller.push(
      `${agentLabel}　${[company, representative, title, address, email].filter(Boolean).join(" · ")}`,
      w("The sales agent coordinates local communication and quotations. The formal quotation and purchase contract will identify the contracting seller.",
        "銷售代理負責在地聯繫及報價。交易相對人以正式報價及採購合約所載為準。",
        "販売代理店は現地での連絡と見積もりを担当します。正式見積書と購入契約書に取引当事者を明記します。"),
    );
  } else if (terms.agentCandidates.length) {
    const candidates = terms.agentCandidates.join(w(" or ", " 或 ", " または "));
    seller.push(`${agentLabel}　${candidates}${w(" (designation pending)", "（待確認）", "（選定未確定）")}`);
  }
  const buyer = [
    w("Party B · Prospective buyer", "乙方｜買方", "乙｜購入検討者"),
    ...([
      [w("Company", "公司", "会社名"), contact.company],
      [t("Buyer company address"), contact.address || "—"],
      [t("Job title"), contact.jobTitle || "—"],
      [w("Name", "姓名", "氏名"), contact.name],
      [w("Work email", "公司電子郵件", "勤務先メールアドレス"), contact.email],
      [t("Phone"), contact.phone || "—"],
    ] satisfies [string, string][]).map(([label, value]) => `${label}　${value}`),
  ];
  const basis = mou.capacityExceeded ? t("Target throughput exceeds the capacity of the selected number of lines under the market operating assumptions.")
    : t("Simple payback divides the equipment investment by positive annual EBITDA, based on the market’s Our Solution reference operating profile.");
  return {
    title: t("Memorandum of understanding"),
    description: w("PV Circulator equipment procurement assessment", "PV Circulator 設備採購評估", "PV Circulator 設備導入評価"),
    articles: equipmentMouArticles(input, terms).map(article => {
      switch (article.number) {
        case 1: return { ...article, items: [seller, buyer] };
        case 4: return { ...article, table: [...(article.table ?? []), ...rows], note: basis };
        case 9: return { ...article, items: [...article.items, [`${t("Buyer signatory")}　${contact.name} · ${contact.company}`]] };
        default: return article;
      }
    }),
    signatureStatus: t("Awaiting signature"),
    signingCompleted: w("Both parties have signed this MOU.", "甲乙雙方已完成簽署。", "甲乙双方の署名が完了しました。"),
    dispatchStatus: w("Dispatch of this copy completes signing by both parties.", "本副本寄出即完成甲乙雙方簽署。", "本写しの送信をもって甲乙双方の署名が完了します。"),
    buyerConfirmationLabel: w("Buyer confirmed", "乙方確認時間", "乙の署名確認日時"),
  };
}
