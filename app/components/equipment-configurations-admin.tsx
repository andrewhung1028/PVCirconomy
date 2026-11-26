"use client";

import { useEffect, useRef, useState } from "react";
import {
  equipmentConfigurationLabels, equipmentElectricalFields, equipmentSpecificationGroups, equipmentVariants,
  type EquipmentSettings,
} from "../../lib/equipment-configurations";
import { equipmentPriceModules, equipmentUsdTotal } from "../../lib/equipment-module-pricing";
import { equipmentClaimFields, equipmentMarketFields, equipmentMouFields, equipmentPricingFields } from "../../lib/equipment-quantitative";
import { publicSolutionMarkets } from "../../lib/our-solution/market";
import specCopy from "../../lib/i18n/pv-circulator-zh.json";
import "./pricing-admin.css";

const endpoint = "/api/admin/equipment-configurations/";
const workbook = endpoint + "workbook/";
const labels: Record<string, string> = specCopy;
type Draft = Pick<EquipmentSettings, "configurations" | "modulePrices" | "quantitative"> & { expectedRevision: number };
type Session = { configured?: boolean; user?: { adminRole?: string } };

function equipmentChanges(before: EquipmentSettings, after: Draft) {
  const changes: { group: string; label: string; model: string; before: string; after: string }[] = [];
  function add(group: string, label: string, model: string, oldValue: string | number | null, newValue: string | number | null) {
    if (oldValue !== newValue) changes.push({ group, label, model, before: String(oldValue ?? "—"), after: String(newValue ?? "—") });
  }
  for (const variant of equipmentVariants) {
    const model = equipmentConfigurationLabels[variant];
    const current = before.configurations[variant];
    const next = after.configurations[variant];
    for (const { title, items } of equipmentSpecificationGroups)
      for (const [label] of items)
        add(labels[title] ?? title, labels[label] ?? label, model, current.values[label], next.values[label]);
    for (const { key, label } of equipmentElectricalFields)
      add("電氣參數", label, model, current.electrical[key], next.electrical[key]);
    for (const [key, label] of equipmentPriceModules)
      add("模組價格（萬美元）", label, model, before.modulePrices[key][variant], after.modulePrices[key][variant]);
  }
  for (const [key, label] of equipmentClaimFields)
    add("公開設備指標", label, "共用", before.quantitative.claims[key], after.quantitative.claims[key]);
  for (const market of publicSolutionMarkets)
    for (const [key, label] of equipmentMarketFields)
      add("產能及詢價預設", label, market, before.quantitative.markets[market][key], after.quantitative.markets[market][key]);
  for (const market of publicSolutionMarkets)
    add("場址供電", "三相供電選項", market, before.quantitative.sitePower[market].join(" / "), after.quantitative.sitePower[market].join(" / "));
  for (const [key, label] of equipmentPricingFields)
    add("價格換算設定", label, "共用", before.quantitative.pricing[key], after.quantitative.pricing[key]);
  for (const [key, label] of equipmentMouFields)
    add("MOU 規格", label, "共用", before.quantitative.mou[key], after.quantitative.mou[key]);
  return changes;
}

const errors: Record<string, string> = {
  file_too_large: "工作簿超過 1 MB。",
  xlsx_required: "請上傳 .xlsx 檔案。",
  invalid_workbook: "無法讀取工作簿。請從現行版本下載後再編輯。",
  version_conflict: "現行版本已更新。請重新載入並下載最新工作簿，再套用修改。",
};

export function EquipmentConfigurationsAdmin() {
  const [session, setSession] = useState<Session>();
  const [current, setCurrent] = useState<EquipmentSettings>();
  const [draft, setDraft] = useState<Draft>();
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const changes = current && draft ? equipmentChanges(current, draft) : [];

  async function load() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const authResponse = await fetch("/api/auth/session/");
      if (!authResponse.ok) throw Error();
      const auth: Session = await authResponse.json();
      setSession(auth);
      if (auth.user?.adminRole !== "admin") return;
      const response = await fetch(endpoint);
      if (!response.ok) throw Error();
      setCurrent(await response.json());
      setDraft(undefined);
      if (fileInput.current) fileInput.current.value = "";
    } catch {
      setError("無法載入設備參數。請重新載入。");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { void load(); }, []);

  async function upload(file: File | undefined) {
    if (!file || !current) return;
    setBusy(true);
    setError("");
    setMessage("");
    setDraft(undefined);
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch(workbook, { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) {
        setError(result.details || errors[result.error] || "無法驗證工作簿。");
        return;
      }
      if (result.expectedRevision !== current.revision) {
        setError(errors.version_conflict);
        return;
      }
      setDraft(result);
      setMessage("驗證通過，請核對變更。");
    } catch {
      setError("上傳失敗。請確認連線後重試。");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
      setBusy(false);
    }
  }

  async function publish() {
    if (!draft || !changes.length) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(errors[result.error] || "發布失敗。請稍後再試。");
        return;
      }
      setCurrent(result);
      setDraft(undefined);
      setMessage(`v${result.revision} 已發布。規格頁和新詢價已套用更新。`);
    } catch {
      setError("發布失敗。請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return <section className="pa-parameter-section" id="equipment-parameters" aria-labelledby="equipment-parameters-title">
    <div className="pa-heading">
      <h2 id="equipment-parameters-title">設備參數</h2>
      <p>管理 Economic、Basic、Premium 與 PLUS 的設備規格和模組價格。各市場建議售價由模組合計與匯率計算。</p>
    </div>
    {!session && busy && <p role="status">正在載入設備參數…</p>}
    {session && session.user?.adminRole !== "admin" && <section className="pa-login">
      <h2>{session.user ? "需要管理員權限" : "登入後台"}</h2>
      {!session.user && session.configured && <a className="pa-primary" href="/api/auth/microsoft/login/">使用 Microsoft 登入</a>}
    </section>}
    {current && <div className="pa-economics-workspace">
      <section className="pa-downloads">
        <h2>下載現行工作簿</h2>
        <p>{current.revision === 0 ? "初始版本" : `v${current.revision}`}
          {current.savedAt && ` · ${new Date(current.savedAt).toLocaleString("zh-TW")}`}</p>
        <p>工作簿包含設備規格、電氣參數、公開設備指標、各市場產能與詢價預設、MOU 規格，以及模組價格與換算。</p>
        <div className="pa-actions"><a className="pa-primary" href={workbook}>下載 Excel</a></div>
      </section>
      <section>
        <h2>上傳並驗證</h2>
        <p>在 Module Prices 工作表以萬美元編輯模組價格。MSRP 工作表會依下載時的匯率重算。</p>
        <label className="pa-file-label" htmlFor="equipment-workbook">選擇 .xlsx 工作簿</label>
        <input ref={fileInput} id="equipment-workbook" type="file" accept=".xlsx" disabled={busy}
          onChange={event => void upload(event.currentTarget.files?.[0])} />
      </section>
    </div>}
    {current && <details className="pa-diff-sheet">
      <summary>現行模組價格（萬美元）</summary>
      <div className="pa-table"><table>
        <thead><tr><th scope="col">模組</th>{equipmentVariants.map(variant =>
          <th key={variant} scope="col">{equipmentConfigurationLabels[variant]}</th>)}</tr></thead>
        <tbody>{equipmentPriceModules.map(([key, label]) => <tr key={key}>
          <th scope="row">{label}</th>{equipmentVariants.map(variant => <td key={variant}>{current.modulePrices[key][variant] ?? "—"}</td>)}
        </tr>)}</tbody>
        <tfoot><tr><th scope="row">美元合計</th>{equipmentVariants.map(variant =>
          <td key={variant}>{equipmentUsdTotal(current.modulePrices, variant).toLocaleString("en-US")}</td>)}</tr></tfoot>
      </table></div>
    </details>}
    {error && <div className="pa-data-errors" role="alert"><p>{error}</p>
      <button type="button" onClick={() => void load()} disabled={busy}>重新載入</button>
    </div>}
    {message && <p role="status">{message}</p>}
    {draft && <section className="pa-diff">
      <h2>發布前核對</h2>
      {changes.length ? <>
        <div className="pa-table pa-equipment-diff"><table>
          <thead><tr><th scope="col">參數</th><th scope="col">現行值</th><th scope="col">新值</th></tr></thead>
          <tbody>{changes.map(row => <tr key={`${row.group}/${row.label}/${row.model}`}>
            <th scope="row">{row.label}<small>{row.group} · {row.model}</small></th><td>{row.before}</td><td>{row.after}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="pa-actions">
          <button type="button" className="pa-primary" disabled={busy} onClick={() => void publish()}>發布設備參數</button>
          <button type="button" disabled={busy} onClick={() => { setDraft(undefined); setMessage(""); }}>取消草稿</button>
        </div>
      </> : <p>與現行版本相同，無需發布。</p>}
    </section>}
  </section>;
}
