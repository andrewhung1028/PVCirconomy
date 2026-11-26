import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { AdminNavigation } from "../../components/admin-navigation";
import { equipmentInquiryTranslate } from "../../../lib/equipment-mou-copy";
import { marketNames, type PublicSolutionMarket } from "../../../lib/our-solution/market";
import { staffSession } from "../../../server/auth/microsoft";
import { listInquirySubmissions, type InquirySubmission } from "../../../server/equipment-mou/submissions";
import "../../components/pricing-admin.css";
import "./inquiries.css";

const font = localFont({ src: "../../../public/fonts/Manrope-Variable.ttf", weight: "300 800", display: "swap" });
export const metadata = { title: "詢價管理 | PV Circonomy", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const path = "/admin/inquiries/";
const t = equipmentInquiryTranslate("zh-TW");
const submittedTime = new Intl.DateTimeFormat("zh-TW", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Taipei",
});
const fieldLabels: ReadonlyMap<string, string> = new Map(Object.entries({
  configuration: "設備配置", includePlus: "PLUS 模組", assessmentDate: "預計完成評估時間",
  stage: "專案階段", lineQuantity: "產線數量", startDate: "預計啟動生產時間", configurationRequirements: "客製化需求",
  targetCapacity: "目標處理量（片／月）", dailyHours: "每日運轉時數", panelTechnology: "模組技術", panelCondition: "模組狀態",
  materials: "回收物料", "materialPurity[Glass]": "玻璃最低純度（%）", "materialPurity[Silicon]": "矽最低純度（%）",
  "materialPurity[Silver]": "銀最低純度（%）", polymerOfftake: "EVA／背板去化", installationCountry: "安裝國家或地區",
  offtakeStreams: "回收物料去化", glassOfftakePrice: "玻璃去化價格",
  installationSite: "安裝城市或場址", installationEnvironment: "安裝環境", floorSpace: "可用樓地板面積",
  floorSpaceUnit: "面積單位", powerSupply: "場地供電", compressedAir: "壓縮空氣供應", siteNetwork: "場地網路連線",
  requirements: "安裝、試運轉或其他需求", company: "公司", companyAddress: "公司地址", jobTitle: "職稱",
  name: "姓名", email: "公司電子郵件", phone: "電話",
}));
const translatedFields = new Set([
  "includePlus", "stage", "panelTechnology", "panelCondition", "materials", "polymerOfftake", "offtakeStreams", "glassOfftakePrice",
  "installationEnvironment", "powerSupply", "compressedAir", "siteNetwork",
]);

function fieldValue(key: string, value: string) {
  if (key === "installationCountry" && Object.hasOwn(marketNames["zh-TW"], value)) {
    return marketNames["zh-TW"][value as PublicSolutionMarket];
  }
  if (key === "configuration" && ["economic", "basic", "premium"].includes(value)) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  if (key === "floorSpaceUnit") return value === "ft2" ? "ft²" : value === "m2" ? "m²" : value;
  return translatedFields.has(key) ? t(value) : value;
}

function InquiryRecord({ record }: { record: InquirySubmission }) {
  const entries = record.fields.filter(([, value]) => value !== "");
  const field = (key: string) => fieldValue(key, entries.find(([name]) => name === key)?.[1] ?? "");
  const date = new Date(record.submitted_at);
  return <article className="pa-order pa-inquiry">
    <div className="pa-order-heading">
      <h2>{field("company") || "未填公司名稱"}</h2>
      <span>#{record.id} · <time dateTime={date.toISOString()}>{submittedTime.format(date)}</time></span>
    </div>
    <p>{record.form_complete ? "填寫完整" : "未填完整"} · {field("installationCountry") || "—"} · {field("configuration") || "—"}</p>
    <details>
      <summary>查看填寫內容</summary>
      <dl className="pa-inquiry-fields">
        {entries.map(([key, value], index) => <div key={`${key}-${index}`}>
          <dt>{fieldLabels.get(key) ?? key}</dt><dd>{fieldValue(key, value)}</dd>
        </div>)}
      </dl>
    </details>
  </article>;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ before?: string | string[] }> }) {
  const staff = await staffSession();
  if (staff?.adminRole !== "admin") notFound();
  const { before } = await searchParams;
  const page = await listInquirySubmissions(before).catch(() => null);

  return <div className={font.className}>
    <main className="pa">
      <AdminNavigation active="inquiries" />
      <div className="pa-heading">
        <h1>詢價管理</h1>
        <p>查看客戶從設備詢價表單提交的資料。時間以台北時間顯示。</p>
      </div>
      {page === null ? <p role="alert">無法載入詢價紀錄，請重新整理。</p> : <>
        {page.records.length === 0 ? <p>{page.showLatest ? "沒有更早的詢價紀錄。" : "目前沒有詢價紀錄。"}</p> :
          <section aria-label="設備詢價紀錄">
            {page.records.map(record => <InquiryRecord key={record.id} record={record} />)}
          </section>}
        {(page.showLatest || page.older) && <nav className="pa-actions" aria-label="詢價分頁">
          {page.showLatest && <a className="pa-primary" href={path}>回到最新紀錄</a>}
          {page.older && <a className="pa-primary" href={`${path}?before=${page.older}`}>查看較早的紀錄</a>}
        </nav>}
      </>}
    </main>
  </div>;
}
