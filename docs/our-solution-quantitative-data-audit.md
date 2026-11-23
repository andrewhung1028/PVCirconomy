# Our Solution quantitative-data audit

Audited 2026-11-23. Scope: every public quantitative claim and calculated result rendered by `/solutions/`.

## Authoritative data paths

- `Scenario` supplies region, volume, panel weight and operating schedule.
- `Assumptions` sections 1–11 supply economic, material, process, recovery, refining, retirement and sensitivity inputs.
- `Assumptions` section 12 supplies 40 public benchmarks and targets used by the website, including Methods, Stakes, Materials, Impact, Value and Scale figures.
- `Capacity History`, `Population` and `EU-27 Population` supply all market, retirement-wave and per-capita series.
- Weekly effective metal prices are maintained by the metal-price backend and written into downloaded workbooks; the website does not keep a second hard-coded price.
- The Stakes cost comparison uses the pricing backend for transport and service pricing. It is intentionally not duplicated in the Our Solution workbook.

All operating costs, material values, recovery outputs, EBITDA, breakeven fees, retirement volumes, per-capita pressure, installed-capacity growth, environmental metrics and equipment demand are calculated from those inputs.

## Corrections made in this audit

- Replaced the duplicate staffing inputs with one workbook field per method: 5, 4 and 3 people per shift.
- Connected labor OPEX to those total-staff fields. Thermal processing previously displayed four people but calculated labor with five.
- Connected product-recovery values, the actual silver measurement and 50 MW/line-year equipment capacity to Assumptions section 12.
- Connected the circularity goal and the displayed Weibull factors to their active workbook values.
- Removed obsolete split-staff and `Operators per shift` rows from newly exported workbooks.

## Values that are not workbook business data

Chart dimensions, axis rounding, responsive breakpoints, animation durations and map coordinates remain code-only presentation settings. The 12/15/18/25-year buttons are the four named comparison cases supported by the retirement model and cited in the page; the selected default lifetime and both Weibull factors are workbook inputs. Certification identifiers and publication years are source labels, not editable metrics.

Regression coverage is in `tests/our-solution-quantitative-linkage.cjs` and the complete workbook round-trip/model parity suite.
