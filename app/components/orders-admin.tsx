"use client";
import type { PickupDetails } from "../../lib/pickup";
import type { QuoteLine } from "../../lib/batch-quote";
import type { PricingSnapshot } from "../../lib/pricing-rules";
import { useEffect, useState } from "react";
import { CommunicationSettings } from "./communication-settings";
import { AdminNavigation } from "./admin-navigation";
import { QuotationDocument } from "./quotation-document";
import "./pricing-admin.css";

type Order = {
  pickup_details?: PickupDetails;
  freight_breakdown?: { baseAmount?: number; services?: { label: string; amount: number | null }[]; pending?: string[] };
  id: string;
  status: string;
  delivery_method: string;
  created_at: string;
  contact: { name?: string; company?: string; email?: string; phone?: string };
  origin_address: Record<string, string> | null;
  bookings: { date: string; period: string; vehicle: string; count: number }[];
  processing_total: number | null;
  freight_total: number | null;
  quotation: { id: string; issued?: string; expires?: string; text: string };
  lines: QuoteLine[];
  pricing_snapshot: PricingSnapshot;
};
const statuses: Record<string, string> = { all: "全部", pending: "待確認", confirmed: "已確認", rejected: "已拒絕" };
const money = (value: number | null) => value === null ? "待確認" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const yesNo = (value: boolean) => value ? "是" : "否";

function PickupTable({ details }: { details: PickupDetails }) {
  const rows = [
    ["Panels removed", yesNo(details.removed)],
    ["Properly packed", yesNo(details.properlyPacked)],
    ["Palletized", yesNo(details.palletized)],
    ["Wrapped / strapped", `${yesNo(details.wrapped)} / ${yesNo(details.strapped)}`],
    ["Packing / carrying help", `${yesNo(details.packingHelp)} / ${yesNo(details.carryingHelp)}`],
    ["Forklift / dock", `${yesNo(details.forklift)} / ${yesNo(details.dock)}`],
    ["Liftgate", yesNo(details.liftgate)],
    ["Residential / limited access", `${yesNo(details.residential)} / ${yesNo(details.limitedAccess)}`],
    ["Appointment required", yesNo(details.appointment)],
    ["Pallets", details.palletCount ?? "—"],
    ["Pallet dimensions", details.lengthIn && details.widthIn && details.heightIn ? `${details.lengthIn} × ${details.widthIn} × ${details.heightIn} in` : "—"],
    ["Gross weight", details.grossWeightLb ? `${details.grossWeightLb.toLocaleString()} lb` : "—"],
    ["Labor", details.workers && details.laborHours ? `${details.workers} workers × ${details.laborHours} hours` : "—"],
    ["Notes", details.notes || "—"],
  ];
  return <div className="pa-document-table-wrap"><table className="pa-key-table"><tbody>{rows.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table></div>;
}

export function OrdersAdmin() {
  const [canEdit,setCanEdit]=useState(false);
  const [user, setUser] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
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
      .then((session) => { setUser(session.user?.role === "staff"); setCanEdit(session.user?.adminRole === "admin"); setConfigured(session.configured); setReady(true); })
      .catch(() => { setMessage("無法確認登入狀態，請重新整理。"); setReady(true); });
  }, []);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setBusy(true);
    setMessage("");
    fetch("/api/admin/orders/?" + new URLSearchParams({ q: search, status: filter, page: String(page) }), { cache: "no-store" })
      .then(async (response) => { if (!response.ok) throw Error(); return response.json(); })
      .then((data) => { if (!cancelled) { setOrders(data.orders); setTotal(data.total); } })
      .catch(() => { if (!cancelled) setMessage("無法載入訂單，請重試。"); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  }, [user, filter, search, page, revision]);

  async function review(id: string, status: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/orders/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (response.status === 409) { setMessage("此訂單已由其他同事處理，請重新載入。"); return; }
      if (!response.ok) throw Error();
      setRevision((value) => value + 1);
    } catch { setMessage("操作失敗，請重試。"); }
    finally { setBusy(false); }
  }

  return <main className="pa">
    <AdminNavigation active="orders" />
    <div className="pa-heading"><h1>訂單管理</h1><p>查看回收訂單申請、交付時段與客戶資料。待確認訂單已占用容量；確認後保留，拒絕後釋放。</p></div>
    {!ready ? <p>載入中…</p> : !user ? <section className="pa-login"><h2>Log in</h2>{configured ? <a className="pa-primary" href="/api/auth/microsoft/login/">Log in with Microsoft</a> : <p>Microsoft 公司登入尚未設定完成。</p>}</section> : <>
      {canEdit && <CommunicationSettings />}
      <form className="pa-order-filters" onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(query); setRevision((value) => value + 1); }}>
        <label>訂單狀態<select value={filter} disabled={busy} onChange={(event) => { setFilter(event.target.value); setPage(1); }}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>搜尋訂單<input value={query} maxLength={160} onChange={(event) => setQuery(event.target.value)} placeholder="訂單編號、報價編號、姓名、公司或 Email" /></label>
        <button disabled={busy}>搜尋</button><button type="button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>重新載入</button>
      </form>
      <p aria-live="polite">{busy ? "載入中…" : `共 ${total} 筆訂單`}</p>
      {!busy && !orders.length && !message && <p>沒有符合條件的訂單。</p>}
      <section aria-label="訂單列表" aria-busy={busy}>
        {orders.map((order) => <article className="pa-order" key={order.id}>
          <div className="pa-order-heading"><div><h2>{order.quotation.id}</h2><p>訂單 {order.id}</p></div><strong>{statuses[order.status]} · {order.delivery_method === "pickup" ? "Pickup" : "自行交付"}</strong></div>
          <dl className="pa-order-summary">
            <div><dt>客戶</dt><dd><strong>{order.contact.name || "—"}</strong>{order.contact.company && <><br />{order.contact.company}</>}<br />{order.contact.email || "—"}{order.contact.phone && <><br />{order.contact.phone}</>}</dd></div>
            <div><dt>費用</dt><dd>處理費 <strong>{money(order.processing_total)}</strong><br />運費 <strong>{order.delivery_method === "self" ? "自行安排" : money(order.freight_total)}</strong></dd></div>
            <div><dt>取貨地址</dt><dd>{order.origin_address ? Object.values(order.origin_address).filter(Boolean).join(", ") : "不適用"}</dd></div>
          </dl>
          <div className="pa-document-table-wrap"><table className="pa-booking-table"><thead><tr><th>日期</th><th>時段</th><th>車型</th><th>數量</th></tr></thead><tbody>{order.bookings.map((booking, index) => <tr key={index}><td>{booking.date}</td><td>{booking.period === "am" ? "上午" : "下午"}</td><td>{booking.vehicle}</td><td>{booking.count}</td></tr>)}</tbody></table></div>
          {order.pickup_details && <details><summary>取貨包裝與搬運資料</summary><PickupTable details={order.pickup_details} /></details>}
          {order.freight_breakdown && <details><summary>運費與附加服務明細</summary><div className="pa-document-table-wrap"><table className="pa-key-table"><tbody><tr><th scope="row">基本運費</th><td>{money(order.freight_breakdown.baseAmount ?? null)}</td></tr>{order.freight_breakdown.services?.map((item) => <tr key={item.label}><th scope="row">{item.label}</th><td>{money(item.amount)}</td></tr>)}</tbody></table></div>{order.freight_breakdown.pending?.length ? <div className="pa-pending"><strong>待確認</strong><ul>{order.freight_breakdown.pending.map((item) => <li key={item}>{item}</li>)}</ul></div> : null}</details>}
          <details><summary>查看表格報價單</summary><QuotationDocument document={order.quotation} lines={order.lines} pricing={order.pricing_snapshot} processingTotal={order.processing_total} contact={{ name: order.contact.name || "—", email: order.contact.email || "—", company: order.contact.company, phone: order.contact.phone }} /></details>
          {canEdit && order.status === "pending" && <div className="pa-actions"><button className="pa-primary" disabled={busy} onClick={() => review(order.id, "confirmed")}>確認訂單</button><button disabled={busy} onClick={() => review(order.id, "rejected")}>拒絕並釋放容量</button></div>}
        </article>)}
      </section>
      <div className="pa-actions"><button disabled={busy || page === 1} onClick={() => setPage((value) => value - 1)}>上一頁</button><span>第 {page} / {Math.max(1, Math.ceil(total / 25))} 頁</span><button disabled={busy || page * 25 >= total} onClick={() => setPage((value) => value + 1)}>下一頁</button></div>
    </>}
    <p role="status">{message}</p>
  </main>;
}
