"use client";

import Link from "next/link";
import { useState } from "react";
import { businessCaseHref, localizedPublicPath, type OurSolutionLocale, type PublicSolutionMarket } from "../../lib/our-solution/market";
import { PublicHeader } from "./public-header";
import { Arrow } from "./marketing";

type Copy = [string, string, string];

const topics: { id: string; title: Copy; articles: { question: Copy; answer: Copy; action?: Copy; destination?: "specs" | "inquiry" | "case" | "contact" | "recycling" }[] }[] = [
  {
    id: "equipment",
    title: ["Equipment and specifications", "設備與規格", "設備と仕様"],
    articles: [
      {
        question: ["How do I compare PV Circulator configurations?", "如何比較 PV Circulator 設備方案？", "PV Circulator の構成を比較するには？"],
        answer: ["Open Specifications and switch between Economic, Basic, Premium and PLUS to compare engineering drawings, performance and installation requirements.", "在規格區切換 Economic、Basic、Premium 與 PLUS，即可比較工程圖、效能與安裝條件。", "仕様欄で Economic、Basic、Premium、PLUS を切り替えると、設計図、性能、設置条件を比較できます。"],
        action: ["Compare specifications", "比較設備規格", "仕様を比較"], destination: "specs",
      },
      {
        question: ["Which modules does PLUS support?", "PLUS 支援哪些模組？", "PLUS はどのモジュールに対応しますか？"],
        answer: ["The PLUS module expands feedstock compatibility to broken and glass-glass modules. Include your module types and condition when requesting a quote.", "PLUS 可擴充處理破損模組與雙玻模組。詢價時請提供模組種類和狀態。", "PLUS は破損モジュールや両面ガラスモジュールへの対応を拡張します。見積もり依頼時に種類と状態をお知らせください。"],
      },
    ],
  },
  {
    id: "quotes",
    title: ["Quotes and project planning", "詢價與專案規劃", "見積もりと計画"],
    articles: [
      {
        question: ["How do I request an equipment quote?", "如何在線上詢價？", "設備の見積もりを依頼するには？"],
        answer: ["Select a configuration in Specifications and open Online inquiry. Include the number of lines, target capacity, material and purity requirements, and the planned installation site.", "在設備規格選擇方案，再開啟「線上詢價」。請填寫產線數量、目標處理量、物料與純度要求，以及預計安裝地點。", "仕様欄で構成を選び、オンライン見積もりを開きます。ライン数、目標処理量、材料と純度の要件、設置予定地を入力してください。"],
        action: ["Open online inquiry", "開啟線上詢價", "オンライン見積もりを開く"], destination: "inquiry",
      },
      {
        question: ["Where can I estimate operating costs?", "去哪裡試算營運成本？", "運営費はどこで試算できますか？"],
        answer: ["Use Business Case to estimate operating costs and material revenue under the assumptions for your selected market.", "使用「營運試算」，可依目前所選市場的參數估算營運成本與材料收入。", "事業収支の試算で、選択した市場の前提に基づき、運営費と材料売却収入を試算できます。"],
        action: ["Open Business Case", "開啟營運試算", "事業収支を試算"], destination: "case",
      },
    ],
  },
  {
    id: "installation",
    title: ["Installation and training", "安裝與培訓", "設置と研修"],
    articles: [
      {
        question: ["What should I prepare for installation planning?", "規劃安裝時需要準備什麼？", "設置計画には何が必要ですか？"],
        answer: ["Gather your facility layout, available floor area, power supply and representative panel specifications or samples. Add your training language and any commissioning needs to the inquiry.", "請準備廠房平面圖、可用面積、供電資料，以及代表性模組規格或樣品。詢價時也可填寫培訓語言與試運轉需求。", "施設レイアウト、設置可能面積、電源情報、代表的なモジュールの仕様書またはサンプルをご用意ください。研修の言語や試運転の要件も見積もり依頼に記載できます。"],
      },
    ],
  },
  {
    id: "service",
    title: ["Maintenance and parts", "維護與零件", "保守と部品"],
    articles: [
      {
        question: ["How do I ask about maintenance or spare parts?", "如何詢問設備維護或備品？", "保守や予備部品について相談するには？"],
        answer: ["Contact our team with your equipment configuration and a description of the issue or part you need. Include the model or serial number if available.", "請聯絡團隊並提供設備方案、問題描述或所需零件。如有型號或序號，也請一併提供。", "設備構成、症状または必要な部品を添えてお問い合わせください。型式や製造番号が分かる場合は併せてご記載ください。"],
        action: ["Contact us", "聯絡我們", "お問い合わせ"], destination: "contact",
      },
    ],
  },
  {
    id: "recycling",
    title: ["Recycling services", "回收服務", "リサイクルサービス"],
    articles: [
      {
        question: ["Where can I get a recycling estimate or ask about an order?", "如何試算回收費用或查詢訂單？", "回収費の試算や注文の問い合わせはどこからできますか？"],
        answer: ["Start with the recycling estimate. For questions about an existing recycling order, contact our team and include your order reference.", "可先使用回收費用試算。若要詢問既有回收訂單，請聯絡團隊並提供訂單編號。", "まず回収費を試算できます。既存の回収注文については、注文番号を添えてお問い合わせください。"],
        action: ["Get a recycling estimate", "試算回收費用", "回収費を試算"], destination: "recycling",
      },
    ],
  },
];

export function SupportPage({ locale, market }: { locale: OurSolutionLocale; market: PublicSolutionMarket }) {
  const [search, setSearch] = useState("");
  const index = locale === "zh-TW" ? 1 : locale === "ja-JP" ? 2 : 0;
  const t = (copy: Copy) => copy[index];
  const product = `${localizedPublicPath(locale, "/pv-circulator/")}?market=${market}`;
  const links = { specs: `${product}#specification`, inquiry: `${product}&inquiry=1#specification`, case: businessCaseHref(locale, market), contact: `${product}&inquiry=1#specification`, recycling: "/?market=US#pricing" };
  const available = topics.filter(topic => market === "US" || topic.id !== "recycling");
  const terms = search.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean);
  const matches = available.map(topic => ({
    ...topic,
    articles: topic.articles.filter(article => {
      const text = [topic.title, article.question, article.answer, article.action].flatMap(copy => copy ?? []).join(" ").toLocaleLowerCase(locale);
      return terms.every(term => text.includes(term));
    }),
  })).filter(topic => topic.articles.length);
  const resultCount = matches.reduce((count, topic) => count + topic.articles.length, 0);

  return <div className="pc-site pv-review pv-shell pv-support-page" lang={locale}>
    <a className="pv-skip" href="#support-content">{t(["Skip to support content", "跳至支援內容", "サポート内容へ移動"])}</a>
    <PublicHeader locale={locale} solutionMarket={market} languagePath="/support/" solid />
    <main id="support-content">
      <section className="pv-support-hero" aria-labelledby="support-title">
        <div className="pc-wrap pv-support-hero-grid">
          <div>
            <h1 id="support-title">PV Circonomy Support</h1>
            <label className="pc-form pv-support-search">
              <span>{t(["Search support", "搜尋支援內容", "サポートを検索"])}</span>
              <input type="search" value={search} onChange={event => setSearch(event.currentTarget.value)} aria-controls="support-results"
                placeholder={t(["Try “PLUS”, “installation” or “quotes”", "例如：PLUS、安裝、詢價", "例：PLUS、設置、見積もり"])} />
            </label>
          </div>
          <img src="/images/pvc-machine.webp" alt="" width="1536" height="1014" />
        </div>
      </section>
      <div className="pc-wrap pv-support-body">
        {!terms.length && <nav className="pv-support-shortcuts" aria-label={t(["Quick links", "常用入口", "クイックリンク"])}>
          <Link href={links.specs}>{t(["Compare specifications", "比較設備規格", "仕様を比較"])}<Arrow /></Link>
          <Link href={links.inquiry}>{t(["Online inquiry", "線上詢價", "オンライン見積もり"])}<Arrow /></Link>
          <a href="#installation">{t(["Installation and training", "安裝與培訓", "設置と研修"])}<Arrow /></a>
          <a href="#service">{t(["Maintenance and parts", "維護與零件", "保守と部品"])}<Arrow /></a>
          {market === "US" && <a href="#recycling">{t(["Recycling services", "回收服務", "リサイクルサービス"])}<Arrow /></a>}
        </nav>}
        <section id="support-results" aria-labelledby="support-results-title">
          <h2 id="support-results-title">{terms.length ? t(["Search results", "搜尋結果", "検索結果"]) : t(["Browse by topic", "依主題瀏覽", "トピックから探す"])}</h2>
          {terms.length > 0 && <p role="status">{resultCount ? t([`${resultCount} results`, `找到 ${resultCount} 筆結果`, `${resultCount} 件`]) : t(["No results. Try a different search or contact us below.", "找不到符合的內容。請換個關鍵字，或使用下方的聯絡入口。", "該当する結果がありません。別のキーワードで検索するか、下記からお問い合わせください。"])}</p>}
          {matches.map(topic => <section className="pv-support-topic" key={topic.id} id={topic.id}>
            <h3>{t(topic.title)}</h3>
            <div>{topic.articles.map(article => <details className="pv-details" key={article.question[0]} open={terms.length ? true : undefined}>
              <summary>{t(article.question)}</summary>
              <p>{t(article.answer)}</p>
              {article.destination && article.action && <Link className="pc-text-link" href={links[article.destination]}>{t(article.action)}<Arrow /></Link>}
            </details>)}</div>
          </section>)}
        </section>
        <section className="pv-support-contact">
          <h2>{t(["Contact us", "聯絡我們", "お問い合わせ"])}</h2>
          <Link className="pv-button" href={links.contact}>{t(["Open equipment inquiry", "填寫設備詢價", "設備について問い合わせる"])}<Arrow /></Link>
        </section>
      </div>
    </main>
    <footer className="pv-footer"><span>© {new Date().getFullYear()} PV Circonomy</span></footer>
  </div>;
}
