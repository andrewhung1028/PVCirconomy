"use client";

import { useEffect, useRef, useState } from "react";
import type { EconomicsDiff, OurSolutionEconomics } from "../../lib/our-solution-data";
import { AdminNavigation } from "./admin-navigation";
import "./pricing-admin.css";

type Session = { configured: boolean; user?: { email: string; role: string } };
type Market = "US" | "JP";
type Snapshot = { version: string; createdAt: string; data: OurSolutionEconomics };
type History = { id: string; createdAt: string; actorEmail: string; note: string; active: boolean };
type State = { market: Market; active: Snapshot; history: History[] };
type Draft = { market: Market; data: OurSolutionEconomics; diff: EconomicsDiff[]; expectedVersion: string; fileName: string };

export function EconomicsAdmin() {
  const [market, setMarket] = useState<Market>("US");
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("正在檢查登入狀態…");
  const [errors, setErrors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const marketRef = useRef<Market>(market);

  const marketName = market === "JP" ? "日本" : "US";

  async function load() {
    setStatus("載入中…"); setErrors([]);
    try {
      const auth = await fetch("/api/auth/session/", { cache: "no-store" });
      if (!auth.ok) throw Error();
      const nextSession = await auth.json() as Session;
      setSession(nextSession);
      if (nextSession.user?.role !== "staff") { setStatus(""); return; }
      const response = await fetch(`/api/admin/our-solution-data/?market=${market}`, { cache: "no-store" });
      if (!response.ok) throw Error();
      const result = await response.json() as State;
      if (result.market !== marketRef.current) return;
      setState(result); setStatus("");
    } catch { setStatus("無法讀取 Our Solution 資料。請重試。尚未發布的檔案不會套用。"); }
  }

  useEffect(() => {
    marketRef.current = market;
    setState(null); setDraft(null); setNote(""); setErrors([]);
    void load();
  }, [market]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setDraft(null); setErrors([]); setStatus("正在驗證工作簿…");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch(`/api/admin/our-solution-data/import/?market=${market}`, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) { setErrors(result.details ?? ["工作簿驗證失敗。"]); setStatus("未建立草稿，網站資料沒有變更。"); return; }
      if (result.market !== marketRef.current) return;
      setDraft(result); setStatus(result.diff.length ? `驗證通過，共 ${result.diff.length} 個欄位變更。請核對後再發布。` : "驗證通過，但與目前版本沒有差異。");
    } catch { setErrors(["上傳失敗。請確認網路後重試。"]); setStatus("網站資料沒有變更。"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function publish() {
    if (!draft || !draft.diff.length) return;
    setBusy(true); setErrors([]); setStatus("正在發布新版本…");
    try {
      const response = await fetch(`/api/admin/our-solution-data/?market=${market}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: draft.data, expectedVersion: draft.expectedVersion, note }) });
      const result = await response.json();
      if (response.status === 409) { setErrors(["另一位管理員已先發布新版本。請重新下載現行資料、套用修改後再上傳。"]); setStatus("未發布。草稿仍顯示在本頁。"); return; }
      if (!response.ok) { setErrors(result.details ?? ["發布失敗。請重試。"]); setStatus("目前網站版本沒有變更。"); return; }
      if (result.market !== marketRef.current) return;
      setState(result); setDraft(null); setNote(""); setStatus(market === "JP" ? "日本參數新版本已發布。公開日本頁面啟用前，這份資料只供後台準備與驗證。" : "新版本已發布，Our Solution 網頁將使用這份資料。");
    } catch { setErrors(["發布失敗。請確認網路後重試。"]); setStatus("目前網站版本沒有變更。"); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout/", { method: "POST" }); location.reload(); }

  return <main className="pa"><AdminNavigation active="system" action={session?.user?.role === "staff" ? <button onClick={logout}>登出</button> : undefined} />
    <div className="pa-heading"><h1>系統管理</h1><p><strong>Our Solution 參數</strong>：US 與日本使用各自獨立的版本化 Excel、驗證草稿與發布紀錄。數值參數和網站多語文案分開管理；上傳參數不會改動英／中／日文案。</p></div>
    {session?.user?.role !== "staff" ? <section className="pa-login"><h2>Log in</h2><p>使用 pvcirconomy.com 或 tsgc.com.tw 的 Microsoft 公司帳號管理資料。</p>{session?.configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : session ? <p>Microsoft 登入尚未設定完成。</p> : null}<p role="status">{status}</p><button onClick={load}>重新檢查</button></section> : <>
      <div className="pa-market-switch" role="group" aria-label="選擇 Our Solution 參數市場"><button type="button" aria-pressed={market === "US"} onClick={() => setMarket("US")}>US 參數</button><button type="button" aria-pressed={market === "JP"} onClick={() => setMarket("JP")}>日本參數</button></div>
      <div className="pa-meta"><span>{session.user.email}</span><span>{marketName} 資料集 · {state ? `現行版本：${new Date(state.active.createdAt).toLocaleString("zh-TW")}` : "尚未讀取資料"}</span></div>
      {market === "JP" && <p className="pa-market-note"><strong>日本資料集目前不連接公開頁面。</strong>計算沿用 US 模板，日本在地成本先換算成模型基準幣別；IEA lifetime 擬合與多語文案將分開接入。</p>}
      <ol className="pa-data-steps" aria-label="資料更新流程"><li><strong>下載</strong><span>取得現行版本</span></li><li><strong>編輯</strong><span>只改 Assumptions 黃色格</span></li><li><strong>驗證</strong><span>預覽新舊差異</span></li><li><strong>發布</strong><span>建立可回溯版本</span></li></ol>
      <div className="pa-economics-workspace">
        <section className="pa-downloads"><h2>1. 下載{marketName}工作簿</h2><p>建議每次都從目前選取市場的現行版本開始修改，避免欄位鍵或工作表版本不一致。</p><div className="pa-actions"><a className="pa-primary" href={`/api/admin/our-solution-data/export/?market=${market}`}>下載現行資料</a><a href={`/api/admin/our-solution-data/export/?market=${market}&template=1`}>下載參數範本</a></div></section>
        <section className="pa-upload"><h2>2. 上傳並驗證{marketName}參數</h2><p>接受 `.xlsx`，上限 3 MB。只修改 Assumptions 黃色參數格；Section 12 可修改 Value 與 Source。系統會對照目前選取的「{marketName}資料集」，不會寫入另一個市場。</p><label className="pa-file-label" htmlFor="pa-economics-file">選擇{marketName} Excel 檔案<input ref={fileRef} id="pa-economics-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy || !state} onChange={(event) => void upload(event.target.files?.[0])} /></label></section>
      </div>
      {errors.length > 0 && <section className="pa-data-errors" role="alert"><h2>無法使用這份檔案</h2><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></section>}
      {draft && <section className="pa-diff"><div className="pa-diff-heading"><div><h2>3. 核對差異</h2><p>{draft.fileName} · {draft.diff.length ? `${draft.diff.length} 個變更` : "沒有變更"}</p><p className="pa-market-confirmation"><strong>發布目標：{draft.market === "JP" ? "日本參數（JP）" : "US 參數（US）"}</strong><span>Workbook Scenario.region_code：<code>{draft.data.scenario.region_code}</code></span></p></div><button disabled={busy} onClick={() => setDraft(null)}>取消草稿</button></div>{draft.diff.length > 0 ? <><div className="pa-table"><table><thead><tr><th>欄位</th><th>目前值</th><th>新值</th></tr></thead><tbody>{draft.diff.map((row) => <tr key={row.field}><th scope="row">{row.label}<small>{row.field}</small></th><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody></table></div><label className="pa-publish-note">版本備註（選填）<textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：更新 2027 California labor and silver assumptions" /></label><div className="pa-actions"><button className="pa-primary" disabled={busy} onClick={publish}>{busy ? "發布中…" : "4. 發布新版本"}</button></div></> : <p>這份工作簿與現行版本完全相同，不需要發布。</p>}</section>}
      <p className="pa-status" role="status">{status}</p>
      <section className="pa-history"><h2>{marketName}版本紀錄</h2><p>每個市場分開保留發布時間、操作帳號與備註。可下載任一舊版本核對，但更新時仍建議從現行版本開始。</p>{state?.history.map((item) => <div key={item.id}><span>{new Date(item.createdAt).toLocaleString("zh-TW")} · {item.actorEmail}{item.active ? " · 使用中" : ""}{item.note && <span className="pa-version-note">備註：{item.note}</span>}</span><a href={`/api/admin/our-solution-data/export/?market=${market}&version=${item.id}`}>下載此版本</a></div>)}</section>
    </>}
  </main>;
}
