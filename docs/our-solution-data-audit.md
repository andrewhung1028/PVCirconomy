# Our Solution dynamic-data audit

The public `/solutions/` page uses the published **Our Solution** master workbook for its editable market, operating, technical and benchmark data. Calculated results are never copied into page components.

## Data now controlled by the workbook

| Page area | Workbook source |
| --- | --- |
| Wave: installed capacity, retirement volume, per-capita pressure | `Capacity History`, `Population`, `EU-27 Population`, Assumptions section 10 |
| Methods: footprint, energy, throughput, staff, product recovery, secondary treatment | Assumptions section 12 |
| Methods: operating cost | `Scenario` and Assumptions sections 1–7 |
| Impact: landfill residue and process CO2e | Assumptions sections 4–6 and section 12 grid factor |
| Materials: module shares and public demand/carbon claims | Assumptions sections 5 and 12 |
| Value: material mass and benchmark value | Assumptions sections 3, 5 and 6 |
| Economic: OPEX, revenue, EBITDA and sensitivities | `Scenario` and Assumptions sections 1–7 and 11 |
| Stakes numeric goals, Solution performance line, Scale launch years | Assumptions section 12 |

Assumptions section 12 uses stable field keys. The importer rejects missing keys, unknown keys, renamed labels or units, wrong value types, blank sources and formulas. Only Value and Source cells are highlighted for editing.

## Source documentation still needing stronger evidence

These are not hidden hard-coded values. They are explicit gaps or source-quality gaps in Assumptions section 12:

| Field | Current state | Needed |
| --- | --- | --- |
| IEA recovered-material demand claims (70%, 20%, 2040–2050) | Generic “IEA assessment” source | Publication title, edition, page/table and URL |
| Recycled-aluminium carbon claim (3%) | Internal reference label | External publication, year, page/table and URL |
| SGS product-recovery claim (99.3%) | “SGS verification” | SGS report/certificate identifier, date and test boundary |
| PV Circulator footprint, energy, throughput, staffing and secondary-treatment claims | Product-specification labels | Controlled specification document number, revision and approval date |
| Australia and Taiwan launch years | Commercialization-plan label | Plan owner, revision and approval date |

Presentation constants such as SVG dimensions, chart tick counts, animation timing and map-marker coordinates are UI settings, not business data, and remain in code. Legal effective dates, report names/page numbers and certification identifiers remain editorial citations in page copy; the values that those sources support are stored in the workbook.
