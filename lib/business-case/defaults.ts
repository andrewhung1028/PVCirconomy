import type { MasterData } from "./types";

export const businessCaseDefaultPanels = 5000;
export const businessCaseDefaultShiftsPerLine = 3;
export const defaultPanelsParameter = "DEFAULT_PANELS_PER_MONTH";
export const shiftsPerLineParameter = "SHIFTS_PER_LINE_LIMIT";

export function businessCaseOpexValue(rows: MasterData["opex"], parameter: string, countryCode: string) {
  const row = rows.find(row => row.active && row.countryCode === countryCode
    && [parameter, `${countryCode}-${parameter}`].includes(row.parameter.trim().toUpperCase()));
  return row?.value;
}

export function businessCasePositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}
