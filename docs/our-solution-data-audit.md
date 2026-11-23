# Our Solution dynamic-data audit

The public `/solutions/` page uses the published **Our Solution** master workbook. Calculated results are never copied into page components.

## Data now controlled by the workbook

| Page area | Workbook source |
| --- | --- |
| Wave: installed capacity, retirement volume, per-capita pressure | `Capacity History`, `Population`, `EU-27 Population`, Assumptions section 10 |
| Methods: footprint, energy, throughput, staff, product recovery, secondary treatment | `Website Data` |
| Methods: operating cost | `Scenario` and Assumptions sections 1–7 |
| Impact: landfill residue and process CO2e | Assumptions sections 4–6 and `Website Data` grid factor |
| Materials: module shares and public demand/carbon claims | Assumptions section 5 and `Website Data` |
| Value: material mass and benchmark value | Assumptions sections 3, 5 and 6 |
| Economic: OPEX, revenue, EBITDA and sensitivities | `Scenario` and Assumptions sections 1–7 and 11 |
| Stakes numeric goals, Solution performance line, Scale launch years | `Website Data` |

`Website Data` uses stable `field_key` values. The importer rejects missing keys, unknown keys, renamed labels or units, wrong value types, blank sources and formulas. Only `value` and `source` cells are highlighted for editing.

## Data still unavailable or needing stronger evidence

These are not hidden hard-coded values. They are explicit gaps or source-quality gaps in `Website Data`:

| Field | Current state | Needed |
| --- | --- | --- |
| Thermal-processing energy per panel | `—` | Comparable public kWh/panel value and citation |
| Thermal-processing staff per shift | `—` | Comparable staffing basis and citation |
| Thermal-processing secondary treatment per MW | `—` | Comparable t/MW value and citation |
| IEA recovered-material demand claims (70%, 20%, 2040–2050) | Generic “IEA assessment” source | Publication title, edition, page/table and URL |
| Recycled-aluminium carbon claim (3%) | Internal reference label | External publication, year, page/table and URL |
| SGS product-recovery claim (99.3%) | “SGS verification” | SGS report/certificate identifier, date and test boundary |
| PV Circulator footprint, energy, throughput, staffing and secondary-treatment claims | Product-specification labels | Controlled specification document number, revision and approval date |
| Australia and Taiwan launch years | Commercialization-plan label | Plan owner, revision and approval date |

Presentation constants such as SVG dimensions, chart tick counts, animation timing and map-marker coordinates are UI settings, not business data, and remain in code.
