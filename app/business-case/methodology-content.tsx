import { PublicHeader } from '../components/public-header';
import japaneseCopy from '../../lib/i18n/business-case-methodology-ja.json';
import chineseCopy from '../../lib/i18n/business-case-methodology-zh.json';
import { localizedPublicPath, publicSolutionMarkets, type OurSolutionLocale } from '../../lib/our-solution/market';

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="methodologyTableWrap">
    <table className="methodologyTable">
      <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export function BusinessCaseMethodology({ locale = 'en-US', region, market, panelsPerMonth }: { locale?: OurSolutionLocale; region?: string; market?: string; panelsPerMonth?: string }) {
  const copy: Record<string, string> = locale === 'zh-TW' ? chineseCopy : locale === 'ja-JP' ? japaneseCopy : {};
  const t = (english: string) => copy[english] ?? english;
  const params = new URLSearchParams();
  const selectedMarket = publicSolutionMarkets.find(item => item === market);
  if (selectedMarket) params.set('market', selectedMarket);
  if (typeof region === 'string' && /^[A-Z0-9-]+$/.test(region)) params.set('region', region);
  if (typeof panelsPerMonth === 'string' && /^\d+$/.test(panelsPerMonth)) params.set('panelsPerMonth', panelsPerMonth);
  const selector = params.size ? '?' + params : '';
  const path = localizedPublicPath(locale, '/business-case/');
  return (
    <div className="bc-calculator bc-methodology"><div className="pv-review pv-light-nav">
      <PublicHeader locale={locale} solid solutionMarket={selectedMarket} languagePath="/business-case/methodology/" languageQuery={selector} disableRecycling={region === 'JP' || region?.startsWith('AU-')} />
      <main className="methodologyPage">
      <div className="methodologyShell">
        <section className="methodologyHero">
          <a className="pv-text-button" href={path + selector}>{t("← BACK TO CALCULATOR")}</a>
          <p className="methodologyEyebrow">{t("CALCULATION METHODOLOGY")}</p>
          <h1>{t("Understand the")}<br />{t("numbers behind")}<br />{t("the business case.")}</h1>
          <p className="methodologyLead">{t("A transparent overview of how the calculator estimates PV recycling revenues, operating costs, capacity requirements and investment payback. Both processing approaches are evaluated using the same input volume and recycling fee.")}</p>
        </section>

        <section className="methodologySection" id="basis">
          <p className="methodologySectionLabel">{t("01 / Calculation basis")}</p>
          <div className="methodologyContent">
            <h2>{t("Start with your operating conditions.")}</h2>
            <p>{t("The model annualizes a monthly processing scenario and applies regional cost assumptions. User inputs and maintained assumptions are treated separately.")}</p>
            <p>{t("Regional money inputs must use the region’s local currency, and results are shown in that currency; USD global assumptions use the master FX table.")}</p>
            <Table headers={[t("Input / assumption"), t("How it is used"), t("Source")]} rows={[
              [t("Operating region"), t("Selects local wage, rent, electricity, disposal and currency assumptions."), t("User selection / regional data")],
              [t("Panels per month"), t("Determines annual feedstock volume and capacity demand."), t("User input")],
              [t("Processing / tipping fee"), t("Applied equally to both approaches using the region’s fee unit."), t("User input")],
              [t("Panel weight"), t("Converts panel counts into processed weight."), t("Model assumption")],
              [t("Operating days per month"), t("Determines available processing days in the selected country."), t("Country OPEX parameters")],
              [t("Processing solution"), t("Determines hourly capacity, staffing, equipment investment and other operating inputs."), t("Processing solutions")],
            ]} />
            <div className="methodologyFormula">{t("Annual panels = Panels per month × 12")}</div>
            <p className="methodologyNote">{t("The calculator uses the currently maintained assumptions when a calculation is requested. Regional values and material prices may change over time.")}</p>
          </div>
        </section>

        <section className="methodologySection" id="capacity">
          <p className="methodologySectionLabel">{t("02 / Capacity & shifts")}</p>
          <div className="methodologyContent">
            <h2>{t("Operating volume drives shifts and equipment.")}</h2>
            <div className="methodologyFormula">{t("Processing hours per day = Monthly panels ÷ (Operating days per month × Panels per hour per line)")}</div>
            <div className="methodologyFormula">{t("Capacity per shift per month = Panels per hour per line × Standard hours per shift × Operating days per month")}</div>
            <div className="methodologyFormula">{t("Required shifts = Round up (Monthly panels ÷ Capacity per shift per month)")}</div>
            <div className="methodologyFormula">{t("Equipment lines = Round up (Required shifts ÷ 3)")}</div>
            <p>{t("The model budgets complete shifts rather than fractional shifts. Each line is modeled for a maximum of three complete shifts per day. Shift and equipment counts are calculated independently for each processing solution.")}</p>
            <p>{t("Labor-related costs follow the required number of shifts. Equipment investment, facility space and maintenance follow the required number of lines. This creates step changes in operating expenses as volume increases.")}</p>
            <p className="methodologyNote">{t("Processing hours are nominal theoretical hours based on rated hourly capacity. Actual loading, unloading, downtime, staffing patterns and operating conditions may reduce effective throughput. A 24-hour daily limit is a modeling boundary, not a guarantee of continuous production.")}</p>
          </div>
        </section>

        <section className="methodologySection" id="revenue">
          <p className="methodologySectionLabel">{t("03 / Revenue")}</p>
          <div className="methodologyContent">
            <h2>{t("Recycling fees plus recovered material value.")}</h2>
            <div className="methodologyFormula">{t("Processing revenue = Annual panels × Panel weight (in the fee unit) × Recycling fee")}</div>
            <div className="methodologyFormula">{t("Material revenue = Σ (Input material mass × Recovery rate × Benchmark price × Realization factor), adjusted for price units")}</div>
            <div className="methodologyFormula">{t("Total revenue = Processing revenue + Material revenue")}</div>
            <p>{t("Material revenue is estimated by material type using the assumed panel composition, solution-specific recovery performance, saleability, benchmark prices and realization factors. Unsaleable materials and materials without sufficient recovery assumptions do not contribute modeled sales revenue.")}</p>
            <p>{locale === "zh-TW" ? "設備收益以 Basic／Premium 為基準。接線盒、鋁框與玻璃回收率為 100%，其餘材料依原損失比例校準，整體重量回收率為 99.3%。Economic 詢價另依背板 0%、EVA 50%、其餘材料 100% 計算。"
              : locale === "ja-JP" ? "設備の収益試算は Basic／Premium が基準です。接続箱、アルミ枠、ガラスは 100% 回収し、他の材料の損失を元の損失率に比例して補正し、重量回収率を 99.3% とします。Economic の問い合わせではバックシート 0%、EVA 50%、その他の材料 100% で計算します。"
              : "The calculator uses Basic / Premium recovery. Junction boxes, aluminum frames and glass are fully recovered. Other material losses are scaled proportionally to reach 99.3% by input weight. Economic inquiries use 0% backsheet, 50% EVA and 100% recovery of the remaining materials."}</p>
            <p>{t("Where a benchmark is expressed per pound, recovered metric tonnes are converted to pounds before valuation. Currency conversion is applied where relevant.")}</p>
            <p className="methodologyNote">{t("Material values are modeled realizations, not committed purchase prices or guaranteed sale proceeds.")}</p>
          </div>
        </section>

        <section className="methodologySection" id="opex">
          <p className="methodologySectionLabel">{t("04 / Operating expenses")}</p>
          <div className="methodologyContent">
            <h2>{t("Costs follow the way the operation scales.")}</h2>
            <Table headers={[t("Cost group"), t("Calculation basis")]} rows={[
              [t("Labor"), t("Total staff per shift × local hourly wage × hours per shift × operating days × 12 × required shifts.")],
              [t("Labor burden / workers’ compensation"), t("Percentages applied to modeled direct labor.")],
              [t("Facility / rent / CAM"), t("Required space per line × regional rent and CAM assumptions × equipment lines.")],
              [t("Electricity"), t("Annual panels × energy consumption per panel × regional electricity price.")],
              [t("Consumables"), t("Annual panels × consumables cost per panel.")],
              [t("Maintenance"), t("Equipment CAPEX per line × annual maintenance rate × equipment lines.")],
              [t("Handling / packaging / insurance / admin"), t("Country-level annual or per-panel assumptions, as applicable.")],
              [t("Secondary treatment"), t("Unrecovered residual mass × applicable regional disposal cost.")],
            ]} />
            <div className="methodologyFormula">{t("Annual OPEX = Sum of all modeled operating expense categories")}</div>
            <p className="methodologyNote">{t("Some annual overheads are held at the country-level annual assumption rather than automatically multiplied by the number of equipment lines. The calculator is an indicative operating model, not a site-specific engineering estimate.")}</p>
          </div>
        </section>

        <section className="methodologySection" id="returns">
          <p className="methodologySectionLabel">{t("05 / Financial metrics")}</p>
          <div className="methodologyContent">
            <h2>{t("Compare annual operating economics.")}</h2>
            <div className="methodologyFormula">{t("Annual EBITDA = Total annual revenue − Annual OPEX")}</div>
            <div className="methodologyFormula">{t("PV EBITDA advantage = PV Circulator EBITDA − Comparison solution EBITDA")}</div>
            <div className="methodologyFormula">{t("Total equipment CAPEX = Equipment CAPEX per line × Required equipment lines")}</div>
            <div className="methodologyFormula">{t("Simple payback (years) = Total equipment CAPEX ÷ Annual EBITDA, when EBITDA is positive")}</div>
            <p>{t("Both solutions are assessed at the same panel volume and recycling fee. The comparison illustrates the estimated operating advantage under each solution’s own capacity, recovery and cost assumptions.")}</p>
            <p className="methodologyNote">{t("Simple payback is a simplified indicator based on EBITDA, not a discounted cash-flow or free-cash-flow calculation. It excludes items such as financing, income taxes, depreciation, working capital, and other project-specific investment or startup costs unless expressly included in the underlying model.")}</p>
          </div>
        </section>

        <section className="methodologySection" id="limitations">
          <p className="methodologySectionLabel">{t("06 / Assumptions & limitations")}</p>
          <div className="methodologyContent">
            <h2>{t("An initial assessment, not a financial guarantee.")}</h2>
            <p>{t("This calculator provides an indicative economic assessment based on user inputs, regional operating assumptions and modeled material recovery performance. Actual results may vary with feedstock composition, equipment utilization, labor practices, material prices, operating conditions and local regulations.")}</p>
            <p>{t("Results are estimates and do not constitute a guarantee of throughput, material sales revenue, profitability or investment returns. Confirm project-specific assumptions, regulatory requirements and equipment specifications before making an investment decision.")}</p>
          </div>
        </section>
      </div>
      <footer className="methodologyFooter"><div className="methodologyShell methodologyFooterInner"><span>{t("© PV Circonomy · Business Case Calculator")}</span><a className="methodologyBack" href={path + selector}>{t("RETURN TO CALCULATOR ↗")}</a></div></footer>
    </main></div></div>
  );
}
