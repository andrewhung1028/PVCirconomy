import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculation Methodology | PV Circonomy Business Case Calculator',
  description: 'How the PV recycling business case estimates processing capacity, material revenue, operating expenses, EBITDA, and simple payback.',
};

const Table = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <div className="methodologyTableWrap">
    <table className="methodologyTable">
      <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

export default function MethodologyPage() {
  return (
    <main className="methodologyPage">
      <header className="methodologyTop">
        <div className="methodologyShell methodologyTopInner">
          <a className="methodologyBrand" href="/PVCirconomy/" aria-label="PV Circonomy"><img src="/PVCirconomy/images/pv-circonomy-logo.svg" alt="PV Circonomy" /></a>
          <a className="methodologyBack" href="/PVCirconomy/business-case">← BACK TO CALCULATOR</a>
        </div>
      </header>

      <div className="methodologyShell">
        <section className="methodologyHero">
          <p className="methodologyEyebrow">CALCULATION METHODOLOGY</p>
          <h1>Understand the<br />numbers behind<br />the business case.</h1>
          <p className="methodologyLead">A transparent overview of how the calculator estimates PV recycling revenues, operating costs, capacity requirements and investment payback. Both processing approaches are evaluated using the same input volume and processing fee.</p>
        </section>

        <section className="methodologySection" id="basis">
          <p className="methodologySectionLabel">01 / Calculation basis</p>
          <div className="methodologyContent">
            <h2>Start with your operating conditions.</h2>
            <p>The model annualizes a monthly processing scenario and applies regional cost assumptions. User inputs and maintained assumptions are treated separately.</p>
            <Table headers={['Input / assumption', 'How it is used', 'Source']} rows={[
              ['Operating region', 'Selects local wage, rent, electricity, disposal and currency assumptions.', 'User selection / regional data'],
              ['Panels per month', 'Determines annual feedstock volume and capacity demand.', 'User input'],
              ['Processing / tipping fee', 'Applied equally to both approaches using the region’s fee unit.', 'User input'],
              ['Panel weight', 'Converts panel counts into processed weight.', 'Model assumption'],
              ['Operating days per month', 'Determines available processing days in the selected country.', 'Country OPEX parameters'],
              ['Processing solution', 'Determines hourly capacity, staffing, equipment investment and other operating inputs.', 'Processing solutions'],
            ]} />
            <div className="methodologyFormula">Annual panels = Panels per month × 12</div>
            <p className="methodologyNote">The calculator uses the currently maintained assumptions when a calculation is requested. Regional values and material prices may change over time.</p>
          </div>
        </section>

        <section className="methodologySection" id="capacity">
          <p className="methodologySectionLabel">02 / Capacity &amp; shifts</p>
          <div className="methodologyContent">
            <h2>Operating volume drives shifts and equipment.</h2>
            <div className="methodologyFormula">Processing hours per day = Monthly panels ÷ (Operating days per month × Panels per hour per line)</div>
            <div className="methodologyFormula">Capacity per shift per month = Panels per hour per line × Standard hours per shift × Operating days per month</div>
            <div className="methodologyFormula">Required shifts = Round up (Monthly panels ÷ Capacity per shift per month)</div>
            <div className="methodologyFormula">Equipment lines = Round up (Required shifts ÷ 3)</div>
            <p>The model budgets complete shifts rather than fractional shifts. Each line is modeled for a maximum of three complete shifts per day. Shift and equipment counts are calculated independently for each processing solution.</p>
            <p>Labor-related costs follow the required number of shifts. Equipment investment, facility space and maintenance follow the required number of lines. This creates step changes in operating expenses as volume increases.</p>
            <p className="methodologyNote">Processing hours are nominal theoretical hours based on rated hourly capacity. Actual loading, unloading, downtime, staffing patterns and operating conditions may reduce effective throughput. A 24-hour daily limit is a modeling boundary, not a guarantee of continuous production.</p>
          </div>
        </section>

        <section className="methodologySection" id="revenue">
          <p className="methodologySectionLabel">03 / Revenue</p>
          <div className="methodologyContent">
            <h2>Processing fees plus recovered material value.</h2>
            <div className="methodologyFormula">Processing revenue = Annual panels × Panel weight (in the fee unit) × Processing fee</div>
            <div className="methodologyFormula">Material revenue = Σ (Input material mass × Recovery rate × Benchmark price × Realization factor), adjusted for price units</div>
            <div className="methodologyFormula">Total revenue = Processing revenue + Material revenue</div>
            <p>Material revenue is estimated by material type using the assumed panel composition, solution-specific recovery performance, saleability, benchmark prices and realization factors. Unsaleable materials and materials without sufficient recovery assumptions do not contribute modeled sales revenue.</p>
            <p>Where a benchmark is expressed per pound, recovered metric tonnes are converted to pounds before valuation. Currency conversion is applied where relevant.</p>
            <p className="methodologyNote">Material values are modeled realizations, not committed purchase prices or guaranteed sale proceeds.</p>
          </div>
        </section>

        <section className="methodologySection" id="opex">
          <p className="methodologySectionLabel">04 / Operating expenses</p>
          <div className="methodologyContent">
            <h2>Costs follow the way the operation scales.</h2>
            <Table headers={['Cost group', 'Calculation basis']} rows={[
              ['Direct labor', 'Operators per shift × local hourly wage × hours per shift × operating days × 12 × required shifts.'],
              ['Labor burden / workers’ compensation', 'Percentages applied to modeled direct labor.'],
              ['Facility / rent / CAM', 'Required space per line × regional rent and CAM assumptions × equipment lines.'],
              ['Electricity', 'Annual panels × energy consumption per panel × regional electricity price.'],
              ['Consumables', 'Annual panels × consumables cost per panel.'],
              ['Maintenance', 'Equipment CAPEX per line × annual maintenance rate × equipment lines.'],
              ['Handling / packaging / insurance / admin', 'Country-level annual or per-panel assumptions, as applicable.'],
              ['Secondary treatment', 'Unrecovered residual mass × applicable regional disposal cost.'],
            ]} />
            <div className="methodologyFormula">Annual OPEX = Sum of all modeled operating expense categories</div>
            <p className="methodologyNote">Some annual overheads are held at the country-level annual assumption rather than automatically multiplied by the number of equipment lines. The calculator is an indicative operating model, not a site-specific engineering estimate.</p>
          </div>
        </section>

        <section className="methodologySection" id="returns">
          <p className="methodologySectionLabel">05 / Financial metrics</p>
          <div className="methodologyContent">
            <h2>Compare annual operating economics.</h2>
            <div className="methodologyFormula">Annual EBITDA = Total annual revenue − Annual OPEX</div>
            <div className="methodologyFormula">PV EBITDA advantage = PV Circulator EBITDA − Comparison solution EBITDA</div>
            <div className="methodologyFormula">Total equipment CAPEX = Equipment CAPEX per line × Required equipment lines</div>
            <div className="methodologyFormula">Simple payback (years) = Total equipment CAPEX ÷ Annual EBITDA, when EBITDA is positive</div>
            <p>Both solutions are assessed at the same panel volume and processing fee. The comparison illustrates the estimated operating advantage under each solution’s own capacity, recovery and cost assumptions.</p>
            <p className="methodologyNote">Simple payback is a simplified indicator based on EBITDA, not a discounted cash-flow or free-cash-flow calculation. It excludes items such as financing, income taxes, depreciation, working capital, and other project-specific investment or startup costs unless expressly included in the underlying model.</p>
          </div>
        </section>

        <section className="methodologySection" id="limitations">
          <p className="methodologySectionLabel">06 / Assumptions &amp; limitations</p>
          <div className="methodologyContent">
            <h2>An initial assessment, not a financial guarantee.</h2>
            <p>This calculator provides an indicative economic assessment based on user inputs, regional operating assumptions and modeled material recovery performance. Actual results may vary with feedstock composition, equipment utilization, labor practices, material prices, operating conditions and local regulations.</p>
            <p>Results are estimates and do not constitute a guarantee of throughput, material sales revenue, profitability or investment returns. Confirm project-specific assumptions, regulatory requirements and equipment specifications before making an investment decision.</p>
          </div>
        </section>
      </div>
      <footer className="methodologyFooter"><div className="methodologyShell methodologyFooterInner"><span>© PV Circonomy · Business Case Calculator</span><a className="methodologyBack" href="/PVCirconomy/business-case">RETURN TO CALCULATOR ↗</a></div></footer>
    </main>
  );
}
