"use client";

import { businessCaseHref, marketNames, localizedPublicPath, ourSolutionLocales, publicSolutionMarkets, solutionHref, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { rememberPublicPreference } from "../../lib/our-solution/public-preference";

const languageNames = { "en-US": "English", "ja-JP": "日本語", "zh-TW": "繁體中文" };

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AssistantBar } from "./site-utilities";
import "./review-home.css";

type HomeSection = "recycling" | "pricing" | "delivery" | "traceability";

const equipmentCopy = {
  "en-US": {
    solution: ["Our Solution", "See how owners pay less, recyclers earn more, and recovered materials stay in circulation.", "Follow the story from the coming decommissioning wave to PV Circulator, material upcycling and EasyCycle—and discover your role in the circular solar economy."],
    businesscase: ["Business Case", "Model the economics of a PV recycling line for your region: processing fee, material revenue, operating cost and annual EBITDA for PV Circulator, shredding and thermal-processing routes.", "Results are estimates based on published operating assumptions; you can request a follow-up after running your case."],
    circulator: ["PV Circulator", "Automated, layer-by-layer PV recycling for cleaner material streams, lower downstream processing and more value from each panel.", "Explore performance, output quality, feedstock, configurations and facility-planning specifications. Technology developed by TSGC."],
    upcycling: ["Upcycling", "Explore the next use of materials recovered from end-of-life solar panels.", "Material specifications, available applications and supporting evidence will be added after confirmation."],
    easycycle: ["EasyCycle", "EasyCycle brings your recycling records and environmental data together to support project closeout, reporting and sustainability communications."],
  },
  "ja-JP": {
    solution: ["ソリューション", "パネル所有者の負担を抑え、リサイクル事業者の収益を高めながら、回収材料を循環させる仕組みをご紹介します。", "今後増加する使用済みパネルへの対応から、PV Circulator、材料のアップサイクル、EasyCycle まで。太陽光パネルの資源循環にどう関われるかをご覧ください。"],
    businesscase: ["事業収支の試算", "地域の条件に合わせて太陽光パネルのリサイクル事業を試算できます。PV Circulator、破砕法、熱処理法の処理料金、材料売却収入、運営費、年間 EBITDA を比較できます。", "結果は公開されている運転条件に基づく試算です。試算後に個別相談をお申し込みいただけます。"],
    circulator: ["PV Circulator", "太陽光パネルを層ごとに自動で分離します。回収材料への異物混入を抑え、後工程の負担を減らし、パネル1枚当たりの回収価値を高めます。", "処理性能、回収物の品質、処理対象、設備構成、設置計画に必要な仕様をご確認ください。本技術は TSGC が開発しました。"],
    upcycling: ["アップサイクル", "使用済み太陽光パネルから回収した材料の新たな用途をご紹介します。", "材料の仕様、利用可能な用途、裏付け資料は確認後に掲載します。"],
    easycycle: ["EasyCycle", "EasyCycle は、リサイクル記録と環境データを一元管理し、プロジェクトの完了手続き、各種報告、サステナビリティに関する情報開示を支援します。"],
  },
  "zh-TW": {
    solution: ["解決方案", "降低面板所有者的負擔，提高回收業者收益，並讓回收材料持續循環。"],
    businesscase: ["營運試算", "依營運地區比較處理費、材料收入、營運成本及年度 EBITDA。"],
    circulator: ["PV Circulator", "逐層自動分離太陽能板，回收乾淨材料並減少後續處理。"],
    upcycling: ["材料再利用", "探索使用後太陽能板回收材料的新用途。"],
    easycycle: ["EasyCycle", "整合回收紀錄與環境資料，支援專案結案與永續揭露。"],
  },
};

function Mark() {
  return (
    <img
      className="pv-brand-mark"
      width="48"
      height="24"
      src="/images/pv-infinity.svg"
      alt=""
      aria-hidden="true"
    />
  );
}

function Arrow() {
  return (
    <svg width="20" height="16" viewBox="0 0 24 20" fill="none" aria-hidden="true">
      <path d="M1 10h21M14 2l8 8-8 8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function HeaderIcon({ kind }: { kind: "support" | "region" | "account" }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    {kind === "support" && <><path d="M9.5 9a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5" /><path d="M12 16.5h.01" /></>}
    {kind === "region" && <><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3.5 9h17m-17 6h17" /></>}
    {kind === "account" && <><circle cx="12" cy="9" r="2.8" /><path d="M6.7 19c.6-2.8 2.4-4.3 5.3-4.3s4.7 1.5 5.3 4.3" /></>}
  </svg>;
}

export function PublicHeader({
  solid = false,
  onHomeJump,
  assistant = true,
  assistantInlineLinks = false,
  assistantTechnologyAnchor = "#technology",
  locale = "en-US",
  solutionMarket,
  languagePath,
  languageQuery = "",
  disableRecycling = false,
}: {
  solid?: boolean;
  onHomeJump?: (section: HomeSection) => void;
  assistant?: boolean;
  assistantInlineLinks?: boolean;
  assistantTechnologyAnchor?: string;
  locale?: OurSolutionLocale;
  solutionMarket?: PublicSolutionMarket;
  languageHref?: string;
  languagePath?: `/${string}`;
  languageQuery?: string;
  disableRecycling?: boolean;
  showMarketPicker?: boolean;
  marketPath?: "/solutions/" | "/business-case/";
}) {
  const isJapanese = locale === "ja-JP";
  const isChinese = locale === "zh-TW";
  const label = (english: string, japanese: string, chinese: string) => isChinese ? chinese : isJapanese ? japanese : english;
  const recyclingLabel = label("Recycling", "リサイクル", "回收");
  const shopLabel = label("Shop", "ショップ", "商店");
  const shopUnavailable = label("Coming soon", "準備中", "準備中");
  const recyclingUnavailable = label("Unavailable in this market", "この市場ではご利用いただけません", "此市場尚未提供回收服務");
  const recyclingDisabled = (solutionMarket ?? (isJapanese ? "JP" : "US")) !== "US" || disableRecycling;
  const monthlyVolume = new URLSearchParams(languageQuery).get("panelsPerMonth");
  const volumeQuery = monthlyVolume && /^\d+$/.test(monthlyVolume) ? "&panelsPerMonth=" + monthlyVolume : "";
  const solutionLink = solutionMarket ? solutionHref(locale, solutionMarket) + volumeQuery : localizedPublicPath(locale, "/solutions/");
  const homeHref = isJapanese || isChinese ? solutionLink : "/";
  const productPrefix = locale === "zh-TW" ? "/zh" : isJapanese ? "/ja" : "";
  const currentMarket = solutionMarket ?? (isJapanese ? "JP" : "US");
  const supportHref = `${localizedPublicPath(locale, "/support/")}?market=${currentMarket}`;
  const selectionHref = (language: OurSolutionLocale, market: PublicSolutionMarket) => {
    if (!languagePath) return solutionHref(language, market);
    const params = new URLSearchParams(languageQuery);
    if (market !== currentMarket) params.delete("region");
    params.set("market", market);
    return `${localizedPublicPath(language, languagePath)}?${params}`;
  };
  const [region, setRegion] = useState(false);
  const [account, setAccount] = useState<{ email: string; name: string; role: string } | null>(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [accountStatus, setAccountStatus] = useState("");
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<"equipment" | "company" | null>(null);
  const [equipmentTopic, setEquipmentTopic] = useState<keyof typeof equipmentCopy["en-US"]>("circulator");
  const [equipmentTitle, ...equipmentParagraphs] = isChinese && languagePath === "/pv-circulator/" && equipmentTopic === "businesscase"
    ? ["營運試算", "依營運地區比較回收費、材料收入、營運成本及年度 EBITDA。"]
    : equipmentCopy[locale][equipmentTopic];
  const [companyTopic, setCompanyTopic] = useState<"about" | "mission" | "approach">("about");
  const header = useRef<HTMLElement>(null);
  const accountButton = useRef<HTMLButtonElement>(null);
  const panelOpener = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    fetch("/api/auth/session/", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setAccount(data.user);
        setGoogleReady(Boolean(data.googleConfigured));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) {
        setMenu(false);
        setRegion(false);
        setPanel(null);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  function closeAll() {
    setRegion(false);
    setMenu(false);
    setPanel(null);
  }

  function goHome(section: HomeSection) {
    closeAll();
    if (onHomeJump) onHomeJump(section);
  }

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout/", { method: "POST" });
      if (!response.ok) throw new Error();
      location.reload();
    } catch {
      setAccountStatus(label("Sign out could not be completed. Please retry.", "ログアウトできませんでした。もう一度お試しください。", "登出未完成，請再試一次。"));
    }
  }

  return (
    <header
      ref={header}
      className={`pv-header${solid ? " pv-header-solid" : ""}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeAll();
          (panelOpener.current || accountButton.current)?.focus();
        }
      }}
    >
      <Link
        href={homeHref}
        className="pv-brand"
        aria-label={label("PV Circonomy home", "PV Circonomy 日本語サイト", "PV Circonomy 繁體中文")}
        onClick={(event) => {
          if (!onHomeJump) return;
          event.preventDefault();
          goHome("recycling");
        }}
      >
        <Mark />
        <span>PV Circonomy</span>
      </Link>

      <div className="pv-header-right">
        <nav className="pv-topnav" aria-label={label("Company navigation", "サイトナビゲーション", "網站導覽")}>
          {recyclingDisabled ? (
            <button type="button" className="pv-nav-disabled" disabled title={recyclingUnavailable}>
              {recyclingLabel}
            </button>
          ) : <Link
            href={homeHref}
            onClick={(event) => {
              if (!onHomeJump) return;
              event.preventDefault();
              goHome("recycling");
            }}
          >
            {recyclingLabel}
          </Link>}
          <button
            type="button"
            aria-expanded={panel === "equipment"}
            aria-controls="pv-company-panel"
            onClick={(event) => {
              panelOpener.current = event.currentTarget;
              setMenu(false);
              setRegion(false);
              setPanel((value) => (value === "equipment" ? null : "equipment"));
            }}
          >
            PV Circulator
          </button>
          <button
            type="button"
            className="pv-nav-disabled"
            disabled
            aria-disabled="true"
            title={label("Coming soon", "準備中", "準備中")}
          >
            {label("Company", "会社情報", "公司資訊")}
          </button>
          <button type="button" className="pv-nav-disabled" disabled title={shopUnavailable}>{shopLabel}</button>
        </nav>
        <div className="pv-header-tools">
        {assistant && <AssistantBar inlineLinks={assistantInlineLinks} technologyAnchor={assistantTechnologyAnchor} onOpen={closeAll} actionLabel={label("AI assistant", "AI アシスタント", "AI 助手")} />}
        <Link className="pv-icon-button" href={supportHref} title={label("Support", "サポート", "支援中心")} aria-label={label("Support", "サポート", "支援中心")} onClick={closeAll}>
          <HeaderIcon kind="support" />
        </Link>
        <button type="button" className="pv-icon-button" title={label("Language and market", "言語と市場", "語言與市場")}
          aria-label={label("Language and market", "言語と市場", "語言與市場")} aria-controls="pv-region-panel" aria-expanded={region}
          onClick={event => {
            panelOpener.current = event.currentTarget;
            setMenu(false);
            setPanel(null);
            setRegion(value => !value);
          }}>
          <HeaderIcon kind="region" />
        </button>
        <button
          ref={accountButton}
          className="pv-menu pv-icon-button"
          title={label("Account", "アカウント", "帳戶")}
          type="button"
          aria-expanded={menu}
          aria-controls="pv-account-menu"
          onClick={(event) => {
            panelOpener.current = event.currentTarget;
            setPanel(null);
            setRegion(false);
            setMenu((value) => !value);
          }}
        >
          <HeaderIcon kind="account" />
          <span className="pv-icon-label">
            {menu ? label("Close account menu", "アカウントを閉じる", "關閉帳戶選單") : label("Open account menu", "アカウントを開く", "開啟帳戶選單")}
            <span className="pv-mobile-nav-label">{label(" and navigation", "・サイトナビゲーション", "與網站導覽")}</span>
          </span>
        </button>
        </div>
      </div>

      {region && <div id="pv-region-panel" className="pv-header-panel pv-region-panel">
        <nav aria-label={label("Language", "言語", "語言")}>
          <h2>{label("Language", "言語", "語言")}</h2>
          {ourSolutionLocales.map(language => <Link key={language}
            href={selectionHref(language, currentMarket)} hrefLang={language}
            aria-current={language === locale ? "true" : undefined} onClick={() => { rememberPublicPreference(language, currentMarket); closeAll(); }}>{languageNames[language]}</Link>)}
        </nav>
        <nav aria-label={label("Market", "市場", "市場")}>
          <h2>{label("Market", "市場", "市場")}</h2>
          {publicSolutionMarkets.map(market => <Link key={market}
            href={selectionHref(locale, market)}
            aria-current={market === currentMarket ? "true" : undefined} onClick={() => { rememberPublicPreference(locale, market); closeAll(); }}>{marketNames[locale][market]}</Link>)}
        </nav>
      </div>}

      {panel && (
        <div id="pv-company-panel" className={`pv-header-panel${panel === "equipment" ? " is-equipment" : ""}`}>
          <button
            className="pv-panel-close"
            type="button"
            aria-label={label("Close company information", "情報パネルを閉じる", "關閉資訊面板")}
            onClick={() => {
              setPanel(null);
              panelOpener.current?.focus();
            }}
          >
            {label("Close", "閉じる", "關閉")}
          </button>
          {panel === "equipment" ? (
            <>
              <nav className="pv-company-topics" aria-label={label("PV Circulator information", "PV Circulator の関連情報", "PV Circulator 相關資訊")}>
                {([
                  ["solution", solutionLink],
                  ["businesscase", solutionMarket ? businessCaseHref(locale, solutionMarket) + volumeQuery : `${productPrefix}/business-case/`],
                  ["circulator", `${productPrefix}/pv-circulator/${solutionMarket ? `?market=${solutionMarket}${volumeQuery}` : ""}`],
                  ["upcycling", `${productPrefix}/material-upcycling/`],
                  ["easycycle", `${productPrefix}/easycycle/`],
                ] as const).map(([id, href]) => (
                  <Link
                    key={id}
                    href={href}
                    data-preview-active={equipmentTopic === id}
                    onMouseEnter={() => setEquipmentTopic(id)}
                    onFocus={() => setEquipmentTopic(id)}
                    onClick={closeAll}
                  >
                    {equipmentCopy[locale][id][0]}
                  </Link>
                ))}
              </nav>
              <div className="pv-company-content" aria-live="polite">
                <h2>{equipmentTitle}</h2>
                {equipmentParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </>
          ) : (
            <>
              <nav className="pv-company-topics" aria-label="Company information">
                {([
                  ["about", "About us", "/about-us/"],
                  ["mission", "Mission", "/mission/"],
                  ["approach", "Our approach", "/our-approach/"],
                ] as const).map(([id, label, href]) => (
                  <Link
                    key={id}
                    href={href}
                    data-preview-active={companyTopic === id}
                    onMouseEnter={() => setCompanyTopic(id)}
                    onFocus={() => setCompanyTopic(id)}
                    onClick={closeAll}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="pv-company-content" aria-live="polite">
                <h2>{({ about: "About us", mission: "Mission", approach: "Our approach" })[companyTopic]}</h2>
                {companyTopic === "about" ? (
                  <>
                    <p>PV Circonomy provides US solar panel recycling services using PV Circulator, developed by its parent company TSGC.</p>
                    <p>PV Circonomy also serves as a sales channel for PV Circulator equipment.</p>
                  </>
                ) : companyTopic === "mission" ? (
                  <p>Make end-of-life solar panel recycling easier to understand, with clear processing estimates, delivery terms and visibility into the recycling journey.</p>
                ) : (
                  <p>Start with the panel model, quantity and condition. Separate processing from transport costs, agree receiving conditions and document the batch through its recycling journey.</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {menu && (
        <div id="pv-account-menu" className="pv-header-panel pv-account-panel">
          <div className="pv-mobile-company">
            {recyclingDisabled ? (
              <button type="button" className="pv-nav-disabled" disabled>
                {recyclingLabel} <small>{recyclingUnavailable}</small>
              </button>
            ) : (
              <Link href={homeHref} onClick={() => goHome("recycling")}>{recyclingLabel}</Link>
            )}
            <button type="button" onClick={() => {
              setMenu(false);
              setPanel("equipment");
              requestAnimationFrame(() => header.current?.querySelector<HTMLAnchorElement>("#pv-company-panel .pv-company-topics a")?.focus());
            }}>PV Circulator</button>
            <button type="button" className="pv-nav-disabled" disabled aria-disabled="true">{label("Company", "会社情報", "公司資訊")} <small>{label("Coming soon", "準備中", "準備中")}</small></button>
            <button type="button" className="pv-nav-disabled" disabled>{shopLabel} <small>{shopUnavailable}</small></button>
          </div>
          <h2>{label("Account", "アカウント", "帳戶")}</h2>
          {account ? (
            <>
              <p>{account.name}<br />{account.email}</p>
              {account.role === "staff" && <Link className="pv-button" href="/admin/orders/">{label("Company dashboard", "管理画面", "管理後台")} <Arrow /></Link>}
              <button className="pv-text-button" type="button" onClick={logout}>{label("Sign out", "ログアウト", "登出")}</button>
            </>
          ) : (
            <>
              <p>{label("Log in or sign up to use your details for quotations and delivery.", "お見積もりや配送に登録情報を使用するには、ログインまたは新規登録してください。", "登入或註冊後，可在報價與配送時使用已保存的資料。")}</p>
              {googleReady ? (
                <a className="pv-button" href="/api/auth/google/login/">{label("Continue with Google", "Google で続行", "使用 Google 繼續")} <Arrow /></a>
              ) : (
                <>
                  <button className="pv-button" type="button" disabled>{label("Continue with Google", "Google で続行", "使用 Google 繼續")}</button>
                  <p className="pv-note">{label("Google sign-up will be available once setup is complete. You can still get a quotation without an account.", "設定が完了すると Google で登録できるようになります。お見積もりはアカウントなしでもご利用いただけます。", "Google 註冊功能準備中。目前可直接試算報價。")}</p>
                </>
              )}
              <p className="pv-note">{label("New here? Your first Google sign-in creates your account.", "初めて Google でログインすると、アカウントが作成されます。", "首次以 Google 登入時會自動建立帳戶。")}</p>
              <a className="pv-text-button" href="/api/auth/microsoft/login/">{label("Log in with Microsoft", "Microsoft でログイン", "使用 Microsoft 登入")}</a>
            </>
          )}
          {accountStatus && <p role="status">{accountStatus}</p>}
        </div>
      )}
    </header>
  );
}
