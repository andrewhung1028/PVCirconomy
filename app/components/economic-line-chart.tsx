"use client";

export type EconomicSeries = { label: string; values: number[]; className: string; pointLabels?: "above" | "hidden" | "last" };

export function EconomicLineChart({ title, subtitle, labels, series, highlightIndex, currentLabel = "Current fee", numberLocale, positions, ticks }: {
  title: string;
  subtitle: string;
  labels: string[];
  series: EconomicSeries[];
  highlightIndex?: number;
  currentLabel?: string;
  numberLocale?: string;
  positions?: number[];
  ticks?: { value: number; label: string }[];
}) {
  const values=series.flatMap(s=>s.values);
  let min=Math.min(0,...values),max=Math.max(0,...values);
  const padding=Math.max(1,(max-min)*0.15);min-=padding;max+=padding;
  const width = 600;
  const height = 210;
  const left = 44;
  const right = 44;
  const top = 28;
  const bottom = 32;
  const axisStart = ticks?.[0]?.value ?? positions?.[0] ?? 0;
  const axisEnd = ticks?.[ticks.length - 1]?.value ?? positions?.[positions.length - 1] ?? labels.length - 1;
  const axisX = (value: number) => left + (value - axisStart) * ((width - left - right) / (axisEnd - axisStart || 1));
  const x = (index: number) => axisX(positions?.[index] ?? index);
  const y = (value: number) => top + ((max - value) / (max - min)) * (height - top - bottom);
  return <figure className="os-economic-chart">
    <figcaption><strong>{title}</strong><span>{subtitle}</span></figcaption>
    <div className="os-economic-legend" aria-hidden="true">{series.map((item) => <span className={item.className} key={item.label}><i />{item.label}</span>)}</div>
    <div className="os-fee-plot" role="region" tabIndex={0} aria-label={title}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
      }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title}. ${series.map((item) => `${item.label}: ${item.values.map((value, index) => `${labels[index]}: ${value.toLocaleString(numberLocale)}`).join(", ")}`).join(". ")}`}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line key={ratio} x1={left} x2={width - right} y1={top + ratio * (height - top - bottom)} y2={top + ratio * (height - top - bottom)} className="os-economic-grid" />)}
        {highlightIndex!==undefined&&<g className="os-economic-current"><line x1={x(highlightIndex)} x2={x(highlightIndex)} y1={top-4} y2={height-bottom}/><text x={x(highlightIndex)} y="13" textAnchor="middle">{currentLabel}</text></g>}
        {series.map((item) => <g className={item.className} key={item.label}>
          <polyline points={item.values.map((value, index) => `${x(index)},${y(value)}`).join(" ")} />
          {item.values.map((value, index) => <g className={index===highlightIndex?"is-current-point":undefined} key={`${item.label}-${labels[index]}`}>
            <circle cx={x(index)} cy={y(value)} r={index===highlightIndex?5:3} />
            {item.pointLabels !== "hidden" && (item.pointLabels !== "last" || index === item.values.length - 1) && <text className={value < 0 ? "is-negative" : undefined} x={x(index)}
              y={y(value) + (item.pointLabels !== "above" && item.className === "is-shredding" ? 15 : -8)}
              textAnchor="middle">{value.toLocaleString(numberLocale)}</text>}
          </g>)}
        </g>)}
        {(ticks ?? labels.map((label, index) => ({ value: positions?.[index] ?? index, label }))).map(({ value, label }) =>
          <text className="os-economic-axis-label" x={axisX(value)} y={height - 8} textAnchor="middle" key={value}>{label}</text>)}
      </svg>
    </div>
  </figure>;
}

