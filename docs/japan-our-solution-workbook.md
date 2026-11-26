# Japan Our Solution workbook format

The Japan workbook is a native JPY/metric parameter master. Values are not entered in USD or imperial units and are not converted by the public-page components.

## Scenario fields

| Field key | Value / unit | Required rule |
| --- | --- | --- |
| `region_code` | `JP` | Must match the selected JP import market. |
| `region` | `Japan` | Display label. |
| `panels_per_month` | panels/month | Positive number. |
| `panel_weight_kg` | kg/panel | JP uses this field; `panel_weight_lb` is rejected. |
| `operating_hours_per_day` | hours/day | Positive number. |
| `working_weeks_per_year` | weeks/year | Positive number. |
| `working_days_per_week` | days/week | Positive number. |
| `meta_currency` | `JPY` | ISO 4217 workbook currency. |
| `meta_locale` | `ja-JP` | Formatting locale. |
| `fx_local_per_usd` | JPY/USD | Positive reference FX used only where a USD source must be normalized into the JPY model. Native JPY inputs are not converted again. |

## Native JP units

| Parameter group | Required unit |
| --- | --- |
| Hourly wage | `JPY/hour` |
| Base rent and CAM | `JPY/sq.m./month` |
| Electricity | `JPY/kWh` |
| Landfill | `JPY/metric ton` |
| Recovery / processing fee | `JPY/kg` |
| Annual fixed OPEX | `JPY/year` |
| Packaging and consumables | `JPY/panel` |
| CAPEX | `JPY` |
| Material benchmarks | `JPY/metric ton`, `JPY/kg`, `JPY/troy oz`, or `N/A` |

The model calculates mass in kg and metric tonnes. Japanese rent is calculated from the equipment footprint in m² and the monthly rate, then annualized once. `坪` may be shown in the UI as a secondary display conversion only; it is not a workbook or engine unit.

## Import and compatibility rules

- Upload validation is label-based; moving rows does not remap values.
- JP preview and publish require `Scenario.region_code = JP`.
- US preview and publish reject JP workbooks.
- Product Value formulas are display-only and do not feed the model.
- The US workbook remains native `USD`, `USD/lb`, `USD/short ton`, `USD/sq.ft./year`, and `panel_weight_lb`.

Template: `exports/PV-Circonomy-Our-Solution-JP-Template.xlsx`.
