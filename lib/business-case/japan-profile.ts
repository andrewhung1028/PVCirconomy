import { pricePerTonne } from '../our-solution/model';
import { localPerUSD, parameter, scenarioPanelWeightKg, type Parameters } from '../our-solution/parameters';
import { websiteDataFromAssumptions, websiteNumber } from '../our-solution/public-data';
import type { MasterData } from './types';
import { SQ_FT_PER_SQ_M } from './units';

export const JAPAN_BUSINESS_CASE_SOURCE = 'Japan Our Solution parameters';

const routes = [
  ['CONVENTIONAL', 'Shredding', 'shredding'],
  ['HOT_KNIFE', 'Thermal processing', 'thermal'],
  ['PVCIRCULATOR', 'PV Circulator', 'circulator'],
] as const;

const materials = [
  ['GLASS', 'Glass'],
  ['ALUMINUM', 'Aluminium'],
  ['COPPER', 'Copper'],
  ['EVA', 'EVA'],
  ['BACKSHEET', 'Backsheet'],
  ['SILICON', 'Silicon'],
  ['SILVER', 'Silver'],
  ['JUNCTION_BOX', 'Junction box'],
] as const;

export function japanBusinessCaseProfile(workbook: Parameters) {
  if (workbook.scenario.region_code !== 'JP' || workbook.meta.currency !== 'JPY') {
    throw Error('Japan Business Case requires a JP workbook in JPY');
  }
  const fx = localPerUSD(workbook);
  if (!(fx > 0) || workbook.meta.localPerUSD == null) throw Error('Japan Business Case requires JPY per USD');
  const scenario = workbook.scenario;
  const n = (section: number, name: string, index = 0) => parameter(workbook, section, name, index);
  const unit = (section: number, name: string) => String(workbook.assumptions[section][name][1]);
  const website = websiteDataFromAssumptions(workbook.assumptions);
  const opex = (parameter: string, value: number, unit: string) => ({
    countryCode: 'JP', parameter, value, unit, currency: 'JPY', active: true,
  });

  const data: MasterData = {
    source: JAPAN_BUSINESS_CASE_SOURCE,
    regions: [{
      code: 'JP', region: 'Japan', country: 'Japan', countryCode: 'JP', currency: 'JPY',
      feeUnit: unit(11, 'Recovery fee'), defaultFee: n(11, 'Recovery fee'),
      hourlyWage: n(1, 'Hourly wage'), wageUnit: unit(1, 'Hourly wage'),
      baseRent: n(1, 'Base rent'), cam: n(1, 'CAM'), rentUnit: unit(1, 'Base rent'),
      electricityPrice: n(1, 'Electricity price'), electricityUnit: unit(1, 'Electricity price'),
      landfillCost: n(1, 'Landfill cost'), landfillUnit: unit(1, 'Landfill cost'),
      active: true, sortOrder: 9000,
    }],
    fx: [{ currency: 'JPY', localPerUSD: fx, effectiveDate: workbook.meta.extractedAt.slice(0, 10), active: true }],
    solutions: routes.map(([code, name, method], index) => ({
      code, name, provider: code === 'PVCIRCULATOR' ? 'PV Circonomy' : '', technologyType: name,
      // The shared engine takes USD equipment amounts, then applies the region FX.
      capexUSD: n(4, 'Capex per line', index) / fx,
      consumablesUSDPerPanel: n(4, 'Consumables', index) / fx,
      capacity: n(4, 'Capacity', index),
      operators: websiteNumber(website, `methods.${method}.total_staff_per_shift`),
      spaceSqFt: n(4, 'Equipment space per line', index) * SQ_FT_PER_SQ_M,
      kwhPerPanel: n(4, 'Electricity', index),
      maintenanceRate: n(4, 'Maintenance', index), active: true, sortOrder: index,
    })),
    opex: [
      opex('OPERATING_DAYS_MONTH', scenario.working_weeks_per_year * scenario.working_days_per_week / 12, 'days/month'),
      opex('OPERATING_HOURS_DAY', scenario.operating_hours_per_day, 'hours/day'),
      opex('PANEL_WEIGHT_KG', scenarioPanelWeightKg(workbook), 'kg'),
      opex('LABOR_BURDEN_PCT', n(2, 'Labor burden'), '%'),
      opex('WORKERS_COMP_PCT', n(2, "Workers' compensation"), '%'),
      opex('HANDLING_ANNUAL', n(2, 'Forklift / handling'), 'JPY/year'),
      opex('PACKAGING_PANEL', n(2, 'Packaging'), 'JPY/panel'),
      opex('INSURANCE_ANNUAL', n(2, 'Insurance and compliance'), 'JPY/year'),
      opex('ADMIN_ANNUAL', n(2, 'Facility utilities / admin'), 'JPY/year'),
    ],
    materials: materials.map(([code, name], index) => ({
      code, name, category: '',
      composition: n(5, name),
      benchmarkPrice: pricePerTonne(n(5, name, 1), String(workbook.assumptions[5][name][2]), workbook),
      currency: 'JPY', priceUnit: 'JPY/metric ton', active: true, sortOrder: index,
    })),
    recovery: routes.flatMap(([solutionCode], index) => materials.map(([materialCode, name]) => ({
      solutionCode, materialCode,
      recoveryRate: n(6, name, index * 3),
      realization: n(6, name, index * 3 + 1),
      saleable: n(6, name, index * 3 + 2) !== 0,
      recoveredTreatment: '', unrecoveredTreatment: '', active: true,
    }))),
  };
  return { data, defaultPanels: Number(scenario.panels_per_month.toFixed(2)) };
}
