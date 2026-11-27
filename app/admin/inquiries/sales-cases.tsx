import { notFound, redirect } from "next/navigation";
import { equipmentCaseNumber } from "../../../lib/equipment-sales-case";
import { listSalesCases, linkSalesDocument, salesCaseId } from "../../../server/equipment-mou/cases";
import { staffSession } from "../../../server/auth/microsoft";

async function attachDocument(data: FormData) {
  "use server";
  if ((await staffSession())?.adminRole !== "admin") notFound();
  const id = salesCaseId(String(data.get("id") ?? ""));
  if (!id) notFound();
  const saved = await linkSalesDocument(id, String(data.get("reference") ?? "").trim(), String(data.get("kind")));
  redirect("/admin/inquiries/?case=" + id + (saved ? "" : "&conflict=1") + "#sales-cases");
}

export async function SalesCases({ query, conflict }: { query: string; conflict: boolean }) {
  const cases = await listSalesCases(query).catch(() => null);
  return <section id="sales-cases" aria-labelledby="sales-cases-title">
    <h2 id="sales-cases-title">已簽 MOU 的業務案件</h2>
    <form action="/admin/inquiries/#sales-cases">
      <label>案件編號 <input name="case" defaultValue={query} /></label> <button>搜尋案件</button>
      {query && <a href="/admin/inquiries/#sales-cases"> 查看最近案件</a>}
    </form>
    {conflict && <p role="alert">文件編號未儲存。請核對目前案件的報價與合約紀錄。</p>}
    {cases === null ? <p role="alert">無法載入業務案件。</p> : cases.length === 0 ? <p>沒有符合的已簽案件。</p> :
      cases.map(item => <article key={item.id} className="pa-order pa-inquiry">
        <h3>{item.company} · {equipmentCaseNumber(item.id)}</h3>
        <p>{item.email} · {item.market} · {item.market === "JP" ? "日本代理商標準採購" : item.purchase === "Trial-based PO (TBP)" ? "試用採購（TBP）" : "標準採購"}</p>
        <p>{item.contract_reference ? "已簽約" : item.quotation_reference ? "已出具正式報價" : "待正式報價"}</p>
        {item.quotation_reference && <p>正式報價編號　{item.quotation_reference}</p>}
        {item.contract_reference ? <p>已簽合約編號　{item.contract_reference}</p> : <form action={attachDocument}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="kind" value={item.quotation_reference ? "contract" : "quotation"} />
          <label>{item.quotation_reference ? "已簽合約編號" : "正式報價編號"} <input name="reference" maxLength={120} required /></label>
          {" "}<button>儲存文件編號</button>
        </form>}
      </article>)}
  </section>;
}
