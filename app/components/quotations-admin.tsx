"use client";
import { useEffect, useState } from "react";
import type { QuoteLine } from "../../lib/batch-quote";
import type { PricingSnapshot } from "../../lib/pricing-rules";
import { AdminNavigation } from "./admin-navigation";
import { QuotationDocument } from "./quotation-document";
import "./pricing-admin.css";

type Quotation = {
  id: string;
  document: { id: string; issued?: string; expires?: string; text: string };
  lines: QuoteLine[];
  pricing_snapshot: PricingSnapshot;
  processing_total: number | null;
  created_at: string;
  expires_at: string;
};
const statuses = { all: "全部", valid: "有效", expired: "已逾期" } as const;
const money = (value: number | null) =>
  value === null
    ? "待確認"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export function QuotationsAdmin() {
  const [user, setUser] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    fetch("/api/auth/session/", { cache: "no-store" })
      .then((response) => response.json())
      .then((session) => {
        setUser(session.user?.role === "staff");
        setConfigured(session.configured);
        setReady(true);
      })
      .catch(() => {
        setMessage("無法確認登入狀態，請重新整理。");
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBusy(true);
    setMessage("");
    fetch(
      "/api/admin/quotations/?" +
        new URLSearchParams({ q: search, status: filter, page: String(page) }),
      { cache: "no-store" },
    )
      .then(async (response) => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setQuotations(data.quotations);
          setTotal(data.total);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("無法載入報價，請重試。");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => { cancelled = true; };
  }, [user, filter, search, page, revision]);

  return (
    <main className="pa">
      <AdminNavigation active="quotations" />
      <div className="pa-heading">
        <h1>報價管理</h1>
        <p>只顯示尚未產生訂單的報價。客戶送出訂單後，該筆資料會改由「訂單管理」追蹤。</p>
      </div>
      {!ready ? <p>載入中…</p> : !user ? (
        <section className="pa-login">
          <h2>Log in</h2>
          {configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : <p>Microsoft 登入尚未設定完成。</p>}
        </section>
      ) : <>
        <form className="pa-order-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(query); setRevision((value) => value + 1); }}>
          <label>報價狀態<select value={filter} disabled={busy} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>搜尋報價<input value={query} maxLength={160} onChange={(event) => setQuery(event.target.value)} placeholder="報價編號或內部 ID" /></label>
          <button disabled={busy}>搜尋</button>
          <button type="button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>重新載入</button>
        </form>
        <p aria-live="polite">{busy ? "載入中…" : `共 ${total} 筆報價`}</p>
        {!busy && !quotations.length && !message && <p>沒有符合條件的報價。</p>}
        <section aria-label="報價列表" aria-busy={busy}>
          {quotations.map((quotation) => {
            const expired = new Date(quotation.expires_at).getTime() < Date.now();
            return <article className="pa-order" key={quotation.id}>
              <h2>{quotation.document.id}</h2>
              <p>內部 ID {quotation.id}<br />{expired ? "已逾期" : "有效"} · 建立 {new Date(quotation.created_at).toLocaleString("zh-TW")} · 到期 {new Date(quotation.expires_at).toLocaleString("zh-TW")}</p>
              <p>處理費 {money(quotation.processing_total)} · {quotation.lines.length} 個項目</p>
              <details><summary>查看表格報價單</summary><QuotationDocument document={quotation.document} lines={quotation.lines} pricing={quotation.pricing_snapshot} processingTotal={quotation.processing_total} /></details>
            </article>;
          })}
        </section>
        <div className="pa-actions">
          <button disabled={busy || page === 1} onClick={() => setPage((value) => value - 1)}>上一頁</button>
          <span>第 {page} / {Math.max(1, Math.ceil(total / 25))} 頁</span>
          <button disabled={busy || page * 25 >= total} onClick={() => setPage((value) => value + 1)}>下一頁</button>
        </div>
      </>}
      <p role="status">{message}</p>
    </main>
  );
}
