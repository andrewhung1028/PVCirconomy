"use client";

import { useEffect, useRef, useState } from "react";
import type { EconomicsDiff, OurSolutionEconomics } from "../../lib/our-solution-data";
import type { SharedParameters } from "../../lib/our-solution/shared";
import { ourSolutionParameterMarkets, type OurSolutionParameterMarket } from "../../lib/our-solution/market";
import { AdminNavigation } from "./admin-navigation";
import "./pricing-admin.css";

type Session = { configured: boolean; user?: { email: string; role: string } };
type Market = OurSolutionParameterMarket;
type Scope = Market | "shared";
const scopeQuery = (scope: Scope) => scope === "shared" ? "scope=shared" : `market=${scope}`;
const markets = Object.keys(ourSolutionParameterMarkets) as Market[];
type Snapshot = { version: string; createdAt: string; data: OurSolutionEconomics | SharedParameters };
type History = { id: string; createdAt: string; actorEmail: string; note: string; active: boolean };
type State = { market: Scope; active: Snapshot | null; history: History[] };
type Draft = { market: Scope; data: OurSolutionEconomics | SharedParameters; diff: EconomicsDiff[]; expectedVersion: string | null; fileName: string };

const rowsPerPage = 50;

function ParameterDiff({ rows }: { rows: EconomicsDiff[] }) {
  const [page, setPage] = useState(0);
  const start = page * rowsPerPage;
  return <>
    {rows.length > rowsPerPage && <div className="pa-parameter-pagination" role="group" aria-label="差異分頁">
      <span aria-live="polite">第 {start + 1}–{Math.min(start + rowsPerPage, rows.length)} 筆，共 {rows.length} 筆</span>
      <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)}>上一頁</button>
      <button type="button" disabled={start + rowsPerPage >= rows.length} onClick={() => setPage(page + 1)}>下一頁</button>
    </div>}
    <div className="pa-table pa-parameter-diff-table">
      <table aria-label="工作簿變更">
        <thead><tr><th scope="col">欄位</th><th scope="col">目前值</th><th scope="col">新值</th></tr></thead>
        <tbody>{rows.slice(start, start + rowsPerPage).map(row => <tr key={row.field}>
          <th scope="row">{row.label}{row.label !== row.field && <small>{row.field}</small>}</th>
          <td>{row.before}</td><td>{row.after}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </>;
}

export function EconomicsAdmin() {
  const [market, setMarket] = useState<Scope>("US");
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("正在檢查登入狀態…");
  const [loadFailed, setLoadFailed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const marketRef = useRef<Scope>(market);

  const isShared = market === "shared";
  const marketName = isShared ? "全球共用" : ourSolutionParameterMarkets[market].label;
  const currency = isShared ? undefined : ourSolutionParameterMarkets[market].currency;
  const query = scopeQuery(market);

  async function load(signal?: AbortSignal) {
    setStatus("載入中…"); setErrors([]); setLoadFailed(false);
    try {
      const auth = await fetch("/api/auth/session/", { cache: "no-store", signal });
      if (!auth.ok) throw Error();
      const nextSession = await auth.json() as Session;
      if (signal?.aborted || market !== marketRef.current) return;
      setSession(nextSession);
      if (nextSession.user?.role !== "staff") { setStatus(""); return; }
      const response = await fetch(`/api/admin/our-solution-data/?${query}`, { cache: "no-store", signal });
      if (!response.ok) throw Error();
      const result = await response.json() as State;
      if (result.market !== marketRef.current) return;
      setState(result); setStatus("");
    } catch {
      if (signal?.aborted || market !== marketRef.current) return;
      setLoadFailed(true);
      setStatus("無法載入市場參數。");
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setState(null); setDraft(null); setNote(""); setErrors([]);
    void load(controller.signal);
    return () => controller.abort();
  }, [market]);

  function selectMarket(target: Scope) {
    if (marketRef.current === target) return;
    marketRef.current = target;
    setState(null); setDraft(null); setErrors([]); setStatus("載入中…"); setLoadFailed(false);
    setMarket(target);
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setDraft(null); setErrors([]); setStatus("正在驗證工作簿…");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/admin/our-solution-data/import/?${query}`, { method: "POST", body: form });
      const result = await response.json();
      if (market !== marketRef.current) return;
      if (!response.ok) { setErrors(result.details ?? ["工作簿驗證失敗。"]); setStatus("未建立草稿，網站資料沒有變更。"); return; }
      if (result.market !== marketRef.current) return;
      setDraft(result); setStatus(result.diff.length ? `驗證通過，共 ${result.diff.length} 個欄位變更。請核對後再發布。` : "驗證通過，但與目前版本沒有差異。");
    } catch { if (market === marketRef.current) { setErrors(["上傳失敗。請確認網路後重試。"]); setStatus(""); } }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function publish() {
    if (!draft || !draft.diff.length || draft.market !== marketRef.current) return;
    setBusy(true); setErrors([]); setStatus("正在發布新版本…");
    try {
      const response = await fetch(`/api/admin/our-solution-data/?${scopeQuery(draft.market)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: draft.data, expectedVersion: draft.expectedVersion, note }) });
      const result = await response.json();
      if (draft.market !== marketRef.current) return;
      if (response.status === 409) { setErrors(["另一位管理員已先發布新版本。請下載現行資料，套用修改後再上傳。"]); setStatus("未發布。草稿仍顯示在本頁。"); return; }
      if (!response.ok) { setErrors(result.details ?? ["發布失敗。請重試。"]); setStatus("目前網站版本沒有變更。"); return; }
      if (result.market !== marketRef.current) return;
      setState(result); setDraft(null); setNote(""); setStatus(`${marketName}參數新版本已發布。`);
    } catch { if (draft.market === marketRef.current) { setErrors(["發布失敗。請確認網路後重試。"]); setStatus(""); } }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout/", { method: "POST" }); location.reload(); }

  return <main className="pa pa-system-economics"><AdminNavigation active="system" action={session?.user?.role === "staff" ? (
    <div className="pa-header-session"><span>{session.user.email}</span><button onClick={logout}>登出</button></div>
  ) : undefined} />
    <div className="pa-heading pa-economics-heading">
      <div className="pa-system-title">
        <h1>系統管理</h1>
        {session?.user?.role === "staff" && <a href="#business-case-master">前往 Business Case 主檔</a>}
      </div>
      <p className="pa-economics-summary">
        <span><strong>Our Solution / PV Circulator 參數</strong>　管理全球共用資料及各市場參數版本。</span>
        {session?.user?.role === "staff" && <span className="pa-economics-version" aria-live="polite">{marketName} 資料集 · {state?.active
          ? `現行版本：${new Date(state.active.createdAt).toLocaleString("zh-TW")}`
          : state ? "尚未發布" : "尚未讀取資料"}</span>}
      </p>
    </div>
    {session?.user?.role !== "staff" ? <section className="pa-login"><h2>Log in</h2><p>使用 pvcirconomy.com 或 tsgc.com.tw 的 Microsoft 公司帳號管理資料。</p>{session?.configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : session ? <p>Microsoft 登入尚未設定完成。</p> : null}<p role="status">{status}</p><button onClick={() => void load()}>重新檢查</button></section> : <>
      <div className="pa-market-switch" role="group" aria-label="選擇參數資料集">
        <button type="button" aria-pressed={isShared} onClick={() => selectMarket("shared")}>全球共用參數</button>
        {markets.map(key => <button key={key} type="button" aria-pressed={market === key} onClick={() => selectMarket(key)}>{ourSolutionParameterMarkets[key].label}參數</button>)}
      </div>
      <div className="pa-economics-workspace">
        <section className="pa-downloads">
          <h2>1. 下載{marketName}工作簿</h2>
          <p>{isShared ? "容量歷史、人口、EU-27 人口和固定換算常數由各市場共用。" : state && !state.active ? `下載${marketName}（${currency}）範本，填妥黃色欄位後上傳。` : "更新時請從現行版本開始修改。"}</p>
          <div className="pa-actions">
            {state?.active && <a className="pa-primary" href={`/api/admin/our-solution-data/export/?${query}`}>下載現行資料</a>}
            {!isShared && <a className={state && !state.active ? "pa-primary" : undefined} href={`/api/admin/our-solution-data/export/?${query}&template=1`}>下載參數範本</a>}
          </div>
        </section>
        <section className="pa-upload">
          <h2>2. 上傳並驗證{marketName}參數</h2>
          <p id="our-solution-file-instructions">{isShared
            ? "限 3 MB 內的 .xlsx。請更新數值並保留工作表、年份、欄名及單位。"
            : "限 3 MB 內的 .xlsx。Transport 工作表填寫本市場費率、車廂內長寬、載重與棧板尺寸。區段 12 限修改數值和來源。"}</p>
          <label className="pa-file-label" htmlFor="pa-economics-file">選擇{marketName} Excel 檔案</label>
          <input ref={fileRef} id="pa-economics-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-describedby="our-solution-file-instructions" disabled={busy || !state} onChange={(event) => void upload(event.target.files?.[0])} />
          {status && !draft && <p className="pa-parameter-feedback" role="status">{status}</p>}
          {loadFailed && <button type="button" onClick={() => void load()}>重新載入{marketName}參數</button>}
          {!draft && errors.length > 0 && <ul className="pa-parameter-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
          {draft && <a className="pa-parameter-review-link" href="#our-solution-diff">查看差異（{draft.diff.length}）</a>}
        </section>
      </div>

      {draft && <section id="our-solution-diff" className="pa-diff" aria-labelledby="our-solution-diff-title">
        <div className="pa-diff-heading">
          <div><h2 id="our-solution-diff-title">3. 核對差異</h2><p>{draft.fileName} · {draft.diff.length ? `${draft.diff.length} 個變更` : "沒有變更"}</p></div>
          <button type="button" disabled={busy} onClick={() => { setDraft(null); setErrors([]); setStatus(""); }}>取消草稿</button>
        </div>
        <p className="pa-market-confirmation">
          <strong>發布目標：{draft.market === "shared" ? "全球共用參數" : `${ourSolutionParameterMarkets[draft.market].label}參數（${draft.market}）`}</strong>
          {"scenario" in draft.data && <>
            <span>Workbook Scenario.region_code：<code>{draft.data.scenario.region_code}</code></span>
            <span>幣別：{draft.data.meta?.currency ?? currency}</span>
          </>}
        </p>
        {draft.diff.length > 0 ? <>
          <ParameterDiff rows={draft.diff} />
          <label className="pa-publish-note">版本備註（選填）
            <textarea rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：更新租金與電價來源" />
          </label>
          <div className="pa-actions"><button className="pa-primary" disabled={busy} onClick={publish}>{busy ? "發布中…" : "4. 發布新版本"}</button></div>
          {status && <p className="pa-parameter-feedback" role="status">{status}</p>}
          {errors.length > 0 && <ul className="pa-parameter-errors" role="alert">{errors.map(error => <li key={error}>{error}</li>)}</ul>}
        </> : <p className="pa-parameter-feedback">這份工作簿與現行版本完全相同，不需要發布。</p>}
      </section>}

      <section className="pa-history">
        <h2>{marketName}版本紀錄</h2>
        {state?.history.length === 0 && <p>發布第一個版本後，可在這裡下載及核對紀錄。</p>}
        {state?.history.map(item => <div key={item.id}>
          <span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("zh-TW")}</time> · {item.actorEmail}{item.active && <strong className="pa-version-active">使用中</strong>}{item.note && <span className="pa-version-note">備註：{item.note}</span>}</span>
          <a href={`/api/admin/our-solution-data/export/?${query}&version=${item.id}`}>下載此版本</a>
        </div>)}
      </section>
    </>}
  </main>;
}
