"use client";

import { useEffect, useRef, useState } from "react";
import type { EconomicsDiff, OurSolutionEconomics } from "../../lib/our-solution-data";
import type { Model } from "../../lib/our-solution/model";
import { AdminNavigation } from "./admin-navigation";
import "./pricing-admin.css";

type Session = { configured: boolean; user?: { email: string; role: string } };
type Snapshot = { version: string; createdAt: string; data: OurSolutionEconomics };
type History = { id: string; createdAt: string; actorEmail: string; note: string; active: boolean };
type State = { active: Snapshot; history: History[]; preview?:Model };
type Draft = { data: OurSolutionEconomics; diff: EconomicsDiff[]; expectedVersion: string; fileName: string; preview?:Model };

const powderLabels:Record<string,string>={silverT:"銀量 (t)",siliconT:"矽量 (t)",powderT:"電池粉總量 (t)",scenario1:"情境 1 收益 (USD/年)",scenario2Revenue:"情境 2 收益 (USD/年)",reagentCost:"試劑費用 (USD/年)",electroKwh:"電解耗電 (kWh/年)",electroCost:"電解電費 (USD/年)",scenario2Net:"情境 2 淨額 (USD/年)",silverPurity:"銀產品純度（標籤）",siliconPurity:"矽產品純度（標籤）"};
const reagentLabels:Record<string,string>={h2so4:"硫酸",h2o2:"過氧化氫",cu:"銅",al:"鋁",hno3:"硝酸"};

export function EconomicsAdmin() {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [status, setStatus] = useState("正在檢查登入狀態…");
  const [errors, setErrors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setStatus("載入中…"); setErrors([]);
    try {
      const auth = await fetch("/api/auth/session/", { cache: "no-store" });
      if (!auth.ok) throw Error();
      const nextSession = await auth.json() as Session;
      setSession(nextSession);
      if (nextSession.user?.role !== "staff") { setStatus(""); return; }
      const response = await fetch("/api/admin/our-solution-data/", { cache: "no-store" });
      if (!response.ok) throw Error();
      setState(await response.json()); setStatus("");
    } catch { setStatus("無法讀取 Our Solution 資料。請重試。尚未發布的檔案不會套用。"); }
  }

  useEffect(() => { void load(); }, []);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setDraft(null); setErrors([]); setStatus("正在驗證工作簿…");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/our-solution-data/import/", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) { setErrors(result.details ?? ["工作簿驗證失敗。"]); setStatus("未建立草稿，網站資料沒有變更。"); return; }
      setDraft(result); setStatus(result.diff.length ? `驗證通過，共 ${result.diff.length} 個欄位變更。請核對後再發布。` : "驗證通過，但與目前版本沒有差異。");
    } catch { setErrors(["上傳失敗。請確認網路後重試。"]); setStatus("網站資料沒有變更。"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function publish() {
    if (!draft || !draft.diff.length) return;
    setBusy(true); setErrors([]); setStatus("正在發布新版本…");
    try {
      const response = await fetch("/api/admin/our-solution-data/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: draft.data, expectedVersion: draft.expectedVersion, note }) });
      const result = await response.json();
      if (response.status === 409) { setErrors(["另一位管理員已先發布新版本。請重新下載現行資料、套用修改後再上傳。"]); setStatus("未發布。草稿仍顯示在本頁。"); return; }
      if (!response.ok) { setErrors(result.details ?? ["發布失敗。請重試。"]); setStatus("目前網站版本沒有變更。"); return; }
      setState(result); setDraft(null); setNote(""); setStatus("新版本已發布，Our Solution 網頁將使用這份資料。");
    } catch { setErrors(["發布失敗。請確認網路後重試。"]); setStatus("目前網站版本沒有變更。"); }
    finally { setBusy(false); }
  }

  async function logout() { await fetch("/api/auth/logout/", { method: "POST" }); location.reload(); }

  return <main className="pa"><AdminNavigation active="system" action={session?.user?.role === "staff" ? <button onClick={logout}>登出</button> : undefined} />
    <div className="pa-heading"><h1>系統管理</h1><p><strong>Our Solution USD 數據</strong>：以版本化 Excel 管理情境假設、年度損益、每片 OPEX、材料收益、敏感度與網站公開基準。上傳只建立驗證草稿；按下發布後才會更新網站。未來其他全站系統設定也會集中在此管理。</p></div>
    {session?.user?.role !== "staff" ? <section className="pa-login"><h2>Log in</h2><p>使用 pvcirconomy.com 或 tsgc.com.tw 的 Microsoft 公司帳號管理資料。</p>{session?.configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : session ? <p>Microsoft 登入尚未設定完成。</p> : null}<p role="status">{status}</p><button onClick={load}>重新檢查</button></section> : <>
      <div className="pa-meta"><span>{session.user.email}</span><span>{state ? `現行版本：${new Date(state.active.createdAt).toLocaleString("zh-TW")}` : "尚未讀取資料"}</span></div>
      <ol className="pa-data-steps" aria-label="資料更新流程"><li><strong>下載</strong><span>取得現行版本</span></li><li><strong>編輯</strong><span>只改黃色 Value／Source</span></li><li><strong>驗證</strong><span>預覽新舊差異</span></li><li><strong>發布</strong><span>建立可回溯版本</span></li></ol>
      <div className="pa-economics-workspace">
        <section className="pa-downloads"><h2>1. 下載工作簿</h2><p>建議每次都從現行版本開始修改，避免欄位鍵或工作表版本不一致。</p><div className="pa-actions"><a className="pa-primary" href="/api/admin/our-solution-data/export/">下載現行資料</a><a href="/api/admin/our-solution-data/export/?template=1">下載參數範本</a></div></section>
        <section className="pa-upload"><h2>2. 上傳並驗證</h2><p>接受 `.xlsx`，上限 3 MB。只修改黃色參數格；Website Data 可修改 Value 與 Source。Product Value 與 Section 8 指定公式可保留；其餘公式、缺少的欄位及無效參數會被拒絕。</p><label className="pa-file-label" htmlFor="pa-economics-file">選擇 Excel 檔案<input ref={fileRef} id="pa-economics-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy || !state} onChange={(event) => void upload(event.target.files?.[0])} /></label></section>
      </div>
      {errors.length > 0 && <section className="pa-data-errors" role="alert"><h2>無法使用這份檔案</h2><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></section>}
      {draft && <section className="pa-diff"><div className="pa-diff-heading"><div><h2>3. 核對差異</h2><p>{draft.fileName} · {draft.diff.length ? `${draft.diff.length} 個變更` : "沒有變更"}</p></div><button disabled={busy} onClick={() => setDraft(null)}>取消草稿</button></div>{draft.diff.length > 0 ? <><div className="pa-table"><table><thead><tr><th>欄位</th><th>目前值</th><th>新值</th></tr></thead><tbody>{draft.diff.map((row) => <tr key={row.field}><th scope="row">{row.label}<small>{row.field}</small></th><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody></table></div><label className="pa-publish-note">版本備註（選填）<textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：更新 2027 California labor and silver assumptions" /></label><div className="pa-actions"><button className="pa-primary" disabled={busy} onClick={publish}>{busy ? "發布中…" : "4. 發布新版本"}</button></div></> : <p>這份工作簿與現行版本完全相同，不需要發布。</p>}</section>}
      {(draft?.preview ?? state?.preview) && <section className="pa-diff"><h2>計算預覽（有效金屬價格）</h2><div className="pa-table"><table><thead><tr><th>方案</th><th>年度 EBITDA</th><th>回收率</th><th>損益兩平 USD/lb</th></tr></thead><tbody>{Object.values((draft?.preview ?? state?.preview)!.solutions).map(s=><tr key={s.code}><th>{s.label}</th><td>{s.ebitda.toFixed(2)}</td><td>{(s.recoveryRate*100).toFixed(4)}%</td><td>{s.breakevenFeePerLb.toFixed(6)}</td></tr>)}</tbody></table></div><h3>電池粉情境</h3><dl>{Object.entries((draft?.preview ?? state?.preview)!.cellPowder).filter(([,v])=>typeof v==='number').map(([k,v])=><div key={k}><dt>{powderLabels[k] ?? k}</dt><dd>{Number(v).toFixed(4)}</dd></div>)}</dl><h3>試劑用量（純物質 t/年）</h3><dl>{Object.entries((draft?.preview ?? state?.preview)!.cellPowder.reagentsT).map(([k,v])=><div key={k}><dt>{reagentLabels[k]}</dt><dd>{v.toFixed(6)}</dd></div>)}</dl></section>}
      <p className="pa-status" role="status">{status}</p>
      <section className="pa-history"><h2>版本紀錄</h2><p>每個版本都保留發布時間、操作帳號與備註。可下載任一舊版本核對，但更新時仍建議從現行版本開始。</p>{state?.history.map((item) => <div key={item.id}><span>{new Date(item.createdAt).toLocaleString("zh-TW")} · {item.actorEmail}{item.active ? " · 使用中" : ""}{item.note && <span className="pa-version-note">備註：{item.note}</span>}</span><a href={`/api/admin/our-solution-data/export/?version=${item.id}`}>下載此版本</a></div>)}</section>
    </>}
  </main>;
}
