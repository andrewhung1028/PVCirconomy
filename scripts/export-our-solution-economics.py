from __future__ import annotations

import json
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.table import Table, TableStyleInfo


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "our-solution-economics-usd.json"
OUTPUT = ROOT / "exports" / "PV-Circonomy-Our-Solution-USD.xlsx"

YELLOW = "F5C400"
INK = "151719"
LIGHT = "F3F4F1"
MID = "D8D9D7"
WHITE = "FFFFFF"
thin = Side(style="thin", color=MID)


def style_sheet(ws, widths):
    ws.freeze_panes = "A2"
    ws.sheet_view.showGridLines = False
    for column, width in widths.items():
        ws.column_dimensions[column].width = width
    for cell in ws[1]:
        cell.fill = PatternFill("solid", fgColor=INK)
        cell.font = Font(color=WHITE, bold=True)
        cell.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 24


def add_table(ws, name):
    ref = f"A1:{ws.cell(ws.max_row, ws.max_column).coordinate}"
    table = Table(displayName=name, ref=ref)
    table.tableStyleInfo = TableStyleInfo(
        name="TableStyleMedium2",
        showFirstColumn=False,
        showLastColumn=False,
        showRowStripes=True,
        showColumnStripes=False,
    )
    ws.add_table(table)


def money_cells(ws, columns, start=2):
    for column in columns:
        for row in range(start, ws.max_row + 1):
            ws.cell(row, column).number_format = '$#,##0.00;[Red]-$#,##0.00'


data = json.loads(SOURCE.read_text(encoding="utf-8"))
solutions = {item["code"]: item for item in data["solutions"]}
codes = ["CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"]

wb = Workbook()
readme = wb.active
readme.title = "Instructions"
readme.append(["PV Circonomy · Our Solution USD data workbook", "Value"])
rows = [
    ("Purpose", "Single reviewable source for the Our Solution USD charts and tables."),
    ("Source", data["meta"]["sourceSite"]),
    ("Calculator data API", data["meta"]["calculatorDataApi"]),
    ("Calculation API", data["meta"]["calculationApi"]),
    ("Source system", data["meta"]["sourceSystem"]),
    ("Extracted", data["meta"]["extractedAt"]),
    ("Scenario", "California · 5,000 panels/month · 60,000 panels/year · 44.09 lb/panel · $0/lb processing fee"),
    ("Currency", "USD"),
    ("Editing", "Edit numeric cells only. Do not rename sheet names, field keys or solution codes."),
    ("Future admin import", "Upload this workbook, validate every field, preview the diff, then activate a version. Never overwrite live values without validation and version history."),
    ("Disclosure", data["meta"]["note"]),
]
for row in rows:
    readme.append(row)
style_sheet(readme, {"A": 24, "B": 110})
readme.freeze_panes = "A2"
for row in range(2, readme.max_row + 1):
    readme.cell(row, 1).font = Font(bold=True, color=INK)
    readme.cell(row, 2).alignment = Alignment(wrap_text=True, vertical="top")
    readme.cell(row, 1).border = readme.cell(row, 2).border = Border(bottom=thin)

scenario = wb.create_sheet("Scenario")
scenario.append(["field_key", "label", "value", "unit"])
scenario_rows = [
    ("region_code", "Region code", data["scenario"]["regionCode"], ""),
    ("region", "Region", data["scenario"]["region"], ""),
    ("panels_per_month", "Panels per month", data["scenario"]["panelsPerMonth"], "panels/month"),
    ("annual_panels", "Annual panels", data["scenario"]["annualPanels"], "panels/year"),
    ("panel_weight_lb", "Panel weight", data["scenario"]["panelWeightLb"], "lb/panel"),
    ("annual_input_metric_tons", "Annual input", data["scenario"]["annualInputMetricTons"], "metric tons/year"),
    ("processing_fee_usd_per_lb", "Base processing fee", data["scenario"]["processingFeeUsdPerLb"], "USD/lb"),
    ("operating_days_per_month", "Operating days", data["scenario"]["operatingDaysPerMonth"], "days/month"),
    ("operating_hours_per_day", "Operating hours", data["scenario"]["operatingHoursPerDay"], "hours/day"),
]
for row in scenario_rows:
    scenario.append(row)
style_sheet(scenario, {"A": 34, "B": 26, "C": 20, "D": 24})
add_table(scenario, "ScenarioData")

annual = wb.create_sheet("Annual Summary")
annual.append(["solution_code", "solution", "material_revenue_usd", "annual_opex_usd", "annual_ebitda_usd", "capex_usd", "recovery_rate", "residual_metric_tons"])
for code in codes:
    item = solutions[code]
    annual.append([code, item["label"], item["annualMaterialRevenue"], item["annualOpex"], item["annualEbitda"], item["capexUsd"], item["recoveryRate"], item["residualMetricTons"]])
style_sheet(annual, {"A": 22, "B": 22, "C": 24, "D": 22, "E": 24, "F": 18, "G": 18, "H": 24})
money_cells(annual, [3, 4, 5, 6])
for row in range(2, annual.max_row + 1):
    annual.cell(row, 7).number_format = "0.00%"
add_table(annual, "AnnualSummary")

website = wb.create_sheet("Website Values")
website.append(["field_key", "label", "unit", "CONVENTIONAL", "HOT_KNIFE", "PVCIRCULATOR"])
website_fields = [
    ("opex_per_panel_electricity", "Electricity", "USD/panel", lambda x: x["opexPerPanel"]["electricity"]),
    ("opex_per_panel_labor", "Labor + burden", "USD/panel", lambda x: x["opexPerPanel"]["laborAndBurden"]),
    ("opex_per_panel_facility", "Facility / rent", "USD/panel", lambda x: x["opexPerPanel"]["facility"]),
    ("opex_per_panel_other", "Other operating costs", "USD/panel", lambda x: x["opexPerPanel"]["other"]),
    ("opex_per_panel_total", "Total operating cost", "USD/panel", lambda x: x["opexPerPanel"]["total"]),
    ("material_revenue_silver", "Material revenue — silver", "USD/year", lambda x: x["materialRevenue"]["silver"]),
    ("material_revenue_al_cu", "Material revenue — Al, Cu", "USD/year", lambda x: x["materialRevenue"]["aluminumAndCopper"]),
    ("material_revenue_other", "Other recovered materials", "USD/year", lambda x: x["materialRevenue"]["other"]),
    ("material_revenue_total", "Total material revenue", "USD/year", lambda x: x["annualMaterialRevenue"]),
    ("annual_opex", "Operating cost", "USD/year", lambda x: x["annualOpex"]),
    ("annual_ebitda", "Annual EBITDA", "USD/year", lambda x: x["annualEbitda"]),
]
for key, label, unit, getter in website_fields:
    website.append([key, label, unit, *[getter(solutions[code]) for code in codes]])
style_sheet(website, {"A": 34, "B": 32, "C": 18, "D": 20, "E": 20, "F": 20})
money_cells(website, [4, 5, 6])
for row in range(2, website.max_row + 1):
    for column in range(4, 7):
        website.cell(row, column).fill = PatternFill("solid", fgColor="FFF4C2")
add_table(website, "WebsiteValues")

materials = wb.create_sheet("Material Revenue")
materials.append(["solution_code", "solution", "silver_usd_year", "aluminum_copper_usd_year", "other_usd_year", "total_usd_year"])
for code in codes:
    item = solutions[code]
    materials.append([code, item["label"], item["materialRevenue"]["silver"], item["materialRevenue"]["aluminumAndCopper"], item["materialRevenue"]["other"], item["annualMaterialRevenue"]])
style_sheet(materials, {"A": 22, "B": 22, "C": 22, "D": 30, "E": 22, "F": 22})
money_cells(materials, [3, 4, 5, 6])
add_table(materials, "MaterialRevenue")

fee = wb.create_sheet("Fee Sensitivity")
fee.append(["processing_fee_usd_lb", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"])
for index, value in enumerate(data["feeSensitivity"]["feeUsdPerLb"]):
    fee.append([value, *[data["feeSensitivity"]["annualEbitdaUsdThousands"][code][index] for code in codes]])
style_sheet(fee, {"A": 28, "B": 38, "C": 38, "D": 40})
for row in range(2, fee.max_row + 1):
    fee.cell(row, 1).number_format = '$0.00'
    for column in range(2, 5):
        fee.cell(row, column).number_format = '$#,##0.0;[Red]-$#,##0.0'
add_table(fee, "FeeSensitivity")

silver = wb.create_sheet("Silver Sensitivity")
silver.append(["silver_price_change_percent", "CONVENTIONAL_ebitda_usd_thousands", "HOT_KNIFE_ebitda_usd_thousands", "PVCIRCULATOR_ebitda_usd_thousands"])
for index, value in enumerate(data["silverSensitivity"]["changePercent"]):
    silver.append([value / 100, *[data["silverSensitivity"]["annualEbitdaUsdThousands"][code][index] for code in codes]])
style_sheet(silver, {"A": 30, "B": 38, "C": 38, "D": 40})
for row in range(2, silver.max_row + 1):
    silver.cell(row, 1).number_format = '0%'
    for column in range(2, 5):
        silver.cell(row, column).number_format = '$#,##0.0;[Red]-$#,##0.0'
add_table(silver, "SilverSensitivity")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUTPUT)
print(OUTPUT)
