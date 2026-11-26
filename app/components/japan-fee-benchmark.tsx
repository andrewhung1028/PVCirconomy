import type { CSSProperties } from "react";
import { japanFeeBenchmarkRows, type WebsiteData } from "../../lib/our-solution/public-data";

export function JapanFeeBenchmark({ data, locale }: { data: WebsiteData; locale: "ja-JP" | "en-US" | "zh-TW" }) {
  const chinese = locale === "zh-TW";
  const japanese = locale === "ja-JP";
  const labels = chinese
    ? ["中間處理與最終處置（中位數）", "回收處理（低值）", "回收處理（高值）"]
    : japanese
    ? ["中間処理＋最終処分（中央値）", "リサイクル処理（下限）", "リサイクル処理（上限）"]
    : ["Intermediate treatment + final disposal (median)", "Recycling treatment (low)", "Recycling treatment (high)"];
  const bars = Object.entries(japanFeeBenchmarkRows).map(([key, fallback], index) => ({
    label: labels[index],
    value: Number(data[key]?.value ?? fallback[0]),
    source: String(data[key]?.source ?? fallback[2]),
    className: ["is-landfill", "is-shredding", "is-thermal"][index],
  }));
  const max = Math.max(...bars.map(bar => bar.value)) * 1.16;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
  return <figure className="os-cost-benchmark">
    <figcaption>
      <strong>{chinese ? "日本的處置與回收成本" : japanese ? "日本の処分・リサイクル費用" : "Disposal and recycling costs in Japan"}</strong>
      <span>{chinese ? "日圓／kW · 日本環境省調查" : japanese ? "円／kW · 環境省調査" : "JPY/kW · Japan Ministry of the Environment survey"}</span>
    </figcaption>
    <div className="os-cost-plot" role="img" aria-label={bars.map(bar => `${bar.label} ${money.format(bar.value)}/kW`).join(japanese ? "、" : "; ")}>
      <div className="os-cost-columns" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        {bars.map(bar => <div className={`os-cost-column ${bar.className}`} style={{ "--bar": `${bar.value / max * 100}%` } as CSSProperties} key={bar.label}>
          <strong>{money.format(bar.value)}</strong><i aria-hidden="true" /><span>{bar.label}</span>
        </div>)}
      </div>
    </div>
    <small>
      {chinese
        ? "回收成本不含拆解、拆除與運輸。數值為環境省調查基準。來源："
        : japanese
        ? "リサイクル費用は解体・撤去と収集運搬を除きます。環境省の調査値であり、PV Circonomyの見積額ではありません。出典："
        : "Recycling costs exclude dismantling, removal and collection/transport. These are survey benchmarks. Source: "}
      {[...new Set(bars.map(bar => bar.source))].map((source, index) => (
        <span key={source}>{index > 0 && " · "}{/^https:\/\/www\.env\.go\.jp\/content\/\d+\.pdf$/.test(source)
          ? <a href={source}>{chinese ? "環境省文件" : japanese ? "環境省資料" : "MOE document"} {source.split("/").at(-1)?.replace(".pdf", "")}</a>
          : source}</span>
      ))}
    </small>
  </figure>;
}
