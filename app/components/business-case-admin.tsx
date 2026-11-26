"use client";

import { useEffect, useRef, useState } from "react";
import type { DataDiff, BusinessCaseData } from "../../server/business-case/workbook";
import "./pricing-admin.css";

type Session = { configured: boolean; user?: { email: string; role: string } };
type Snapshot = { number: number; version: string; createdAt: string; data: BusinessCaseData };
type History = { number: number; id: string; createdAt: string; actorEmail: string; note: string; active: boolean };
type State = { active: Snapshot; history: History[] };
type Draft = { data: BusinessCaseData; diff: DataDiff[]; expectedVersion: string; fileName: string };

const sheetNames=['Operating Regions','Processing Solutions','OPEX Parameters','Currency Exchange','Materials','Solution Material Recovery','Payable'];
function DiffSheet({name,rows}:{name:string;rows:DataDiff[]}) {
  const [page,setPage]=useState(0);
  const pages=Math.max(1,Math.ceil(rows.length/50));
  return <details className="pa-diff-sheet"><summary>{name} · 新增 {rows.filter(r=>r.kind==='added').length} · 移除 {rows.filter(r=>r.kind==='removed').length} · 修改 {rows.filter(r=>r.kind==='changed').length}</summary>
    {rows.length ? <><div className="pa-table"><table><thead><tr><th>資料鍵 / 欄位</th><th>變更</th><th>目前值</th><th>新值</th></tr></thead><tbody>{rows.slice(page*50,(page+1)*50).map(row=><tr key={row.field}><th scope="row">{row.label}</th><td>{{added:'新增',removed:'移除',changed:'修改'}[row.kind]}</td><td>{row.before}</td><td>{row.after}</td></tr>)}</tbody></table></div><nav className="pa-actions" aria-label={`${name} 差異分頁`}><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>上一頁</button><span role="status">第 {page+1} / {pages} 頁 · 共 {rows.length} 筆</span><button disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>下一頁</button></nav></> : <p>沒有變更</p>}
  </details>;
}

export function BusinessCaseAdmin() {
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
      const response = await fetch("/api/admin/business-case-data/", { cache: "no-store" });
      if (!response.ok) throw Error();
      setState(await response.json()); setStatus("");
    } catch { setStatus("無法讀取 Business Case 資料。請重試。尚未發布的檔案不會套用。"); }
  }

  useEffect(() => { void load(); }, []);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setDraft(null); setErrors([]); setStatus("正在驗證工作簿…");
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/admin/business-case-data/import/", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) { setErrors(result.details ?? ["工作簿驗證失敗。"]); setStatus("未建立草稿，網站資料沒有變更。"); return; }
      setDraft(result); setStatus(result.diff.length ? `驗證通過，共 ${result.diff.length} 筆資料變更。請核對後再發布。` : "驗證通過，但與目前版本沒有差異。");
    } catch { setErrors(["上傳失敗。請確認網路後重試。"]); setStatus("網站資料沒有變更。"); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function publish() {
    if (!draft || !draft.diff.length) return;
    setBusy(true); setErrors([]); setStatus("正在發布新版本…");
    try {
      const response = await fetch("/api/admin/business-case-data/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: draft.data, expectedVersion: draft.expectedVersion, note }) });
      const result = await response.json();
      if (response.status === 409) { setErrors(["另一位管理員已先發布新版本。請重新下載現行資料、套用修改後再上傳。"]); setStatus("未發布。草稿仍顯示在本頁。"); return; }
      if (!response.ok) { setErrors(result.details ?? ["發布失敗。請重試。"]); setStatus("目前網站版本沒有變更。"); return; }
      setState(result); setDraft(null); setNote(""); setStatus("新版本已發布，Business Case 網頁將使用這份資料。");
    } catch { setErrors(["發布失敗。請確認網路後重試。"]); setStatus("目前網站版本沒有變更。"); }
    finally { setBusy(false); }
  }

  async function restore(id:string){if(!state)return;setBusy(true);try{const response=await fetch('/api/admin/business-case-data/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({restoreVersion:id,expectedVersion:state.active.version,note:'Restore '+id})});if(!response.ok){setStatus(response.status===409?'版本衝突，請重新載入。':'還原失敗。');return;}setState(await response.json());setDraft(null);setStatus('已建立還原版本。');}finally{setBusy(false);}}

  return <section id="business-case-parameters" className="pa-parameter-section" aria-label="Business Case 主檔">
    <div className="pa-heading"><h2>Business Case 主檔</h2><p><strong>Business Case 主檔</strong>：以版本化 Excel 管理情境假設、年度損益、每片 OPEX、材料收益與敏感度。上傳只建立驗證草稿；按下發布後才會更新網站。Payable 僅儲存資料，不參與計算。</p></div>
    {session?.user?.role !== "staff" ? <section className="pa-login"><h2>Log in</h2><p>使用 pvcirconomy.com 或 tsgc.com.tw 的 Microsoft 公司帳號管理資料。</p>{session?.configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : session ? <p>Microsoft 登入尚未設定完成。</p> : null}<p role="status">{status}</p><button onClick={load}>重新檢查</button></section> : <>
      <div className="pa-meta"><span>{session.user.email}</span><span>{state ? `現行版本：v${state.active.number} · ${new Date(state.active.createdAt).toLocaleString("zh-TW")}` : "尚未讀取資料"}</span></div>
      <ol className="pa-data-steps" aria-label="資料更新流程"><li><strong>下載</strong><span>取得現行版本</span></li><li><strong>編輯</strong><span>依原欄位編輯資料</span></li><li><strong>驗證</strong><span>預覽新舊差異</span></li><li><strong>發布</strong><span>建立可回溯版本</span></li></ol>
      <div className="pa-economics-workspace">
        <section className="pa-downloads"><h2>1. 下載工作簿</h2><p>建議每次都從現行版本開始修改，避免欄位鍵或工作表版本不一致。</p><div className="pa-actions"><a className="pa-primary" href="/api/admin/business-case-data/export/">下載現行資料</a><a href="/api/admin/business-case-data/export/?template=1">下載種子範本</a></div></section>
        <section className="pa-upload"><h2>2. 上傳並驗證</h2><p>接受 `.xlsx`，上限 3 MB。公式、改名的欄位、缺少的工作表及不一致的合計都會被拒絕。</p><label className="pa-file-label" htmlFor="pa-business-case-file">選擇 Excel 檔案<input ref={fileRef} id="pa-business-case-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy || !state} onChange={(event) => void upload(event.target.files?.[0])} /></label></section>
      </div>
      {errors.length > 0 && <section className="pa-data-errors" role="alert"><h2>無法使用這份檔案</h2><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></section>}
      {draft && <section className="pa-diff"><div className="pa-diff-heading"><div><h2>3. 核對差異</h2><p>{draft.fileName} · {draft.diff.length ? `${draft.diff.length} 個變更` : "沒有變更"}</p></div><button disabled={busy} onClick={() => setDraft(null)}>取消草稿</button></div>{draft.diff.length > 0 ? <>{sheetNames.map(name=><DiffSheet key={draft.fileName+draft.expectedVersion+name} name={name} rows={draft.diff.filter(row=>row.sheet===name)} />)}<label className="pa-publish-note">版本備註（選填）<textarea rows={3} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="例如：更新 2027 California labor and silver assumptions" /></label><div className="pa-actions"><button className="pa-primary" disabled={busy} onClick={publish}>{busy ? "發布中…" : "4. 發布新版本"}</button></div></> : <p>這份工作簿與現行版本完全相同，不需要發布。</p>}</section>}
      <p className="pa-status" role="status">{status}</p>
      <section className="pa-history"><h2>版本紀錄</h2><p>每個版本都保留發布時間、操作帳號與備註。可下載任一舊版本核對，但更新時仍建議從現行版本開始。</p>{state?.history.map((item) => <div key={item.id}><span>v{item.number} · {new Date(item.createdAt).toLocaleString("zh-TW")} · {item.actorEmail}{item.active ? " · 使用中" : ""}{item.note && <span className="pa-version-note">備註：{item.note}</span>}</span><a href={`/api/admin/business-case-data/export/?version=${item.id}`}>下載此版本</a>{!item.active && <button disabled={busy} onClick={()=>void restore(item.id)}>還原此版本</button>}</div>)}</section>
    </>}
  </section>;
}
